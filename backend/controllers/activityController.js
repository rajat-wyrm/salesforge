const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");
const { publish } = require("../services/webhookService");

const VALID_KINDS = ["CALL", "MEETING", "TASK", "EMAIL_SENT", "EMAIL_RECEIVED", "NOTE", "LINKEDIN", "WHATSAPP", "SMS"];
const VALID_STATUS = ["SCHEDULED", "COMPLETED", "CANCELED", "OVERDUE", "IN_PROGRESS"];
const VALID_ENTITIES = ["LEAD", "DEAL", "CONTACT", "COMPANY", "ORGANIZATION"];

const VALID_SORT = { dueAt: "dueAt", createdAt: "createdAt", startedAt: "startedAt", completedAt: "completedAt" };

const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 25, kind, status, entityType, entityId, from, to, sortBy = "dueAt", order = "asc" } = req.query;
  const where = { orgId: req.orgId };
  if (kind) where.kind = kind;
  if (status) where.status = status;
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = Number(entityId);
  if (from || to) {
    where.dueAt = {};
    if (from) where.dueAt.gte = new Date(from);
    if (to) where.dueAt.lte = new Date(to);
  }
  const skip = (Number(page) - 1) * Number(limit);
  const sortField = VALID_SORT[sortBy] || "dueAt";
  const [items, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: { [sortField]: order },
      skip,
      take: Number(limit),
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.activity.count({ where }),
  ]);
  return response.paginated(res, items, total, page, limit);
});

const get = asyncHandler(async (req, res) => {
  const activity = await prisma.activity.findFirst({
    where: { id: Number(req.params.id), orgId: req.orgId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!activity) throw new AppError("Activity not found.", 404);
  return response.success(res, activity);
});

const create = asyncHandler(async (req, res) => {
  const { kind, status = "SCHEDULED", entityType, entityId, title, description, dueAt, startedAt, duration } = req.body;
  if (!kind || !VALID_KINDS.includes(kind)) throw new AppError(`kind must be one of: ${VALID_KINDS.join(", ")}.`, 400);
  if (!entityType || !VALID_ENTITIES.includes(entityType)) throw new AppError(`entityType must be one of: ${VALID_ENTITIES.join(", ")}.`, 400);
  if (!entityId) throw new AppError("entityId is required.", 400);
  if (!title) throw new AppError("title is required.", 400);
  const activity = await prisma.activity.create({
    data: {
      orgId: req.orgId,
      userId: req.user.id,
      kind,
      status,
      entityType,
      entityId: Number(entityId),
      title,
      description: description || null,
      dueAt: dueAt ? new Date(dueAt) : null,
      startedAt: startedAt ? new Date(startedAt) : null,
      duration: duration || null,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "activity.create", entityType: "Activity", entityId: activity.id, metadata: { kind, title } });
  return response.created(res, activity);
});

const update = asyncHandler(async (req, res) => {
  const data = {};
  ["title", "description", "outcome", "status", "duration"].forEach((k) => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  if (req.body.dueAt !== undefined) data.dueAt = req.body.dueAt ? new Date(req.body.dueAt) : null;
  if (req.body.startedAt !== undefined) data.startedAt = req.body.startedAt ? new Date(req.body.startedAt) : null;
  if (req.body.status === "COMPLETED") data.completedAt = new Date();
  const result = await prisma.activity.updateMany({ where: { id: Number(req.params.id), orgId: req.orgId }, data });
  if (result.count === 0) throw new AppError("Activity not found.", 404);
  return response.success(res, { message: "Activity updated." });
});

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.activity.deleteMany({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (result.count === 0) throw new AppError("Activity not found.", 404);
  return response.success(res, { message: "Activity deleted." });
});

const complete = asyncHandler(async (req, res) => {
  const { outcome } = req.body;
  const result = await prisma.activity.updateMany({
    where: { id: Number(req.params.id), orgId: req.orgId },
    data: { status: "COMPLETED", completedAt: new Date(), outcome: outcome || null },
  });
  if (result.count === 0) throw new AppError("Activity found.", 404);
  return response.success(res, { message: "Activity completed." });
});

const today = asyncHandler(async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const items = await prisma.activity.findMany({
    where: {
      orgId: req.orgId,
      userId: req.user.id,
      OR: [
        { dueAt: { gte: start, lte: end } },
        { status: "OVERDUE" },
      ],
    },
    orderBy: { dueAt: "asc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return response.success(res, items);
});

const upcoming = asyncHandler(async (req, res) => {
  const items = await prisma.activity.findMany({
    where: { orgId: req.orgId, userId: req.user.id, status: "SCHEDULED", dueAt: { gte: new Date() } },
    orderBy: { dueAt: "asc" },
    take: 10,
  });
  return response.success(res, items);
});

const overdue = asyncHandler(async (req, res) => {
  const items = await prisma.activity.findMany({
    where: { orgId: req.orgId, userId: req.user.id, status: { in: ["SCHEDULED", "IN_PROGRESS", "OVERDUE"] }, dueAt: { lt: new Date() } },
    orderBy: { dueAt: "asc" },
  });
  return response.success(res, items);
});

module.exports = { list, get, create, update, remove, complete, today, upcoming, overdue, VALID_KINDS, VALID_STATUS, VALID_ENTITIES };
