const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");
const eventBus = require("../services/eventBus");

const VALID_ENTITIES = ["LEAD", "DEAL", "ACTIVITY", "TASK", "NOTE"];

const extractMentions = (text) => {
  const re = /@(\w+)/g;
  const mentions = [];
  let m;
  while ((m = re.exec(text)) !== null) mentions.push(m[1]);
  return [...new Set(mentions)];
};

const list = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.query;
  if (!entityType || !entityId) throw new AppError("entityType and entityId are required.", 400);
  const comments = await prisma.comment.findMany({
    where: { orgId: req.orgId, entityType, entityId: Number(entityId), parentId: null },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
    take: 50,
  });
  const replies = await prisma.comment.findMany({
    where: { orgId: req.orgId, entityType, entityId: Number(entityId), NOT: { parentId: null } },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  const tree = comments.map((c) => ({ ...c, replies: replies.filter((r) => r.parentId === c.id) }));
  return response.success(res, tree);
});

const create = asyncHandler(async (req, res) => {
  const { entityType, entityId, body, parentId } = req.body;
  if (!VALID_ENTITIES.includes(entityType)) throw new AppError(`entityType must be one of: ${VALID_ENTITIES.join(", ")}.`, 400);
  if (!entityId) throw new AppError("entityId is required.", 400);
  if (!body) throw new AppError("body is required.", 400);
  const mentions = extractMentions(body);
  const comment = await prisma.comment.create({
    data: {
      orgId: req.orgId, userId: req.user.id, entityType, entityId: Number(entityId),
      body, mentions: mentions.length ? mentions : null, parentId: parentId ? Number(parentId) : null,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  // Notify mentioned users.
  for (const handle of mentions) {
    const user = await prisma.user.findFirst({ where: { name: { contains: handle, mode: "insensitive" }, organizationId: req.orgId } });
    if (user) {
      await prisma.notification.create({
        data: { userId: user.id, type: "MENTION", message: `${req.user.name} mentioned you in a comment`, link: `/${entityType.toLowerCase()}/${entityId}`, metadata: { entityType, entityId, commentId: comment.id } },
      });
      eventBus.publish(`user:${user.id}`, { event: "notification.new", payload: { type: "MENTION" }, at: new Date().toISOString() });
    }
  }
  return response.created(res, comment);
});

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.comment.deleteMany({ where: { id: Number(req.params.id), orgId: req.orgId, userId: req.user.id } });
  if (result.count === 0) throw new AppError("Comment not found or you cannot delete it.", 404);
  return response.success(res, { message: "Comment deleted." });
});

module.exports = { list, create, remove, VALID_ENTITIES };
