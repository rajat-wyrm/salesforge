// Campaign management - marketing automation and email campaigns.
const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

// Campaigns are stored using the existing models with JSON metadata.
// This provides full campaign management without new schema.

const CAMPAIGN_STATUSES = ["draft", "scheduled", "running", "paused", "completed", "cancelled"];
const CAMPAIGN_TYPES = ["email", "sms", "social", "webhook", "multi_channel"];

const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, status, type } = req.query;
  const where = { orgId: req.orgId };
  if (status) where.status = status;
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    prisma.workflow.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: Number(limit) }),
    prisma.workflow.count({ where }),
  ]);
  return response.paginated(res, items, total, page, limit);
});

const get = asyncHandler(async (req, res) => {
  const campaign = await prisma.workflow.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (!campaign) throw new AppError("Campaign not found.", 404);
  return response.success(res, campaign);
});

const create = asyncHandler(async (req, res) => {
  const { name, description, type = "email", status = "draft", segment, content, schedule, budget } = req.body;
  if (!name) throw new AppError("name is required.", 400);
  const campaign = await prisma.workflow.create({
    data: {
      orgId: req.orgId,
      userId: req.user.id,
      name, description: description || null,
      trigger: type.toUpperCase(),
      conditions: segment || null,
      actions: content || [{ type: "SEND_EMAIL" }],
      active: status === "running",
    },
  });
  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "campaign.create", entityType: "Campaign", entityId: campaign.id, metadata: { name, type, status } });
  return response.created(res, campaign);
});

const update = asyncHandler(async (req, res) => {
  const { name, description, status, segment, content, budget } = req.body;
  const campaign = await prisma.workflow.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (!campaign) throw new AppError("Campaign not found.", 404);
  const data = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (status !== undefined) data.active = status === "running";
  if (segment !== undefined) data.conditions = segment;
  if (content !== undefined) data.actions = content;
  await prisma.workflow.update({ where: { id: campaign.id }, data });
  return response.success(res, { message: "Campaign updated." });
});

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.workflow.deleteMany({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (result.count === 0) throw new AppError("Campaign not found.", 404);
  return response.success(res, { message: "Campaign deleted." });
});

const launch = asyncHandler(async (req, res) => {
  const campaign = await prisma.workflow.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (!campaign) throw new AppError("Campaign not found.", 404);
  await prisma.workflow.update({
    where: { id: campaign.id },
    data: { active: true, runCount: { increment: 1 }, lastRunAt: new Date() },
  });
  return response.success(res, { message: "Campaign launched." });
});

const pause = asyncHandler(async (req, res) => {
  const campaign = await prisma.workflow.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (!campaign) throw new AppError("Campaign not found.", 404);
  await prisma.workflow.update({ where: { id: campaign.id }, data: { active: false } });
  return response.success(res, { message: "Campaign paused." });
});

const metrics = asyncHandler(async (req, res) => {
  const campaigns = await prisma.workflow.findMany({
    where: { orgId: req.orgId },
    select: { id: true, active: true, runCount: true, lastRunAt: true, trigger: true },
  });
  let running = 0, paused = 0, total = campaigns.length, totalRuns = 0;
  for (const c of campaigns) {
    if (c.active) running++; else paused++;
    totalRuns += c.runCount || 0;
  }
  return response.success(res, { total, running, paused, totalRuns });
});

module.exports = { list, get, create, update, remove, launch, pause, metrics, CAMPAIGN_STATUSES, CAMPAIGN_TYPES };
