const crypto = require("crypto");
const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { incrementUsage } = require("../services/usageService");

const VALID_EVENTS = [
  "LEAD_CREATED",
  "LEAD_UPDATED",
  "LEAD_DELETED",
  "LEAD_STATUS_CHANGED",
  "DEAL_CREATED",
  "DEAL_UPDATED",
  "ORGANIZATION_CREATED",
  "USER_INVITED",
  "USER_JOINED",
  "PAYMENT_SUCCEEDED",
  "PAYMENT_FAILED",
  "SUBSCRIPTION_UPDATED",
  "SEARCH_COMPLETED",
  "INTEGRATION_SYNCED",
];

const list = asyncHandler(async (req, res) => {
  const items = await prisma.webhook.findMany({
    where: { orgId: req.orgId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      url: true,
      events: true,
      active: true,
      lastTriggered: true,
      failureCount: true,
      createdAt: true,
    },
  });
  return response.success(res, items);
});

const create = asyncHandler(async (req, res) => {
  const { name, url, events = [] } = req.body;
  if (!name || !url) throw new AppError("Name and URL are required.", 400);
  if (!Array.isArray(events) || events.length === 0) throw new AppError("At least one event is required.", 400);
  const invalid = events.filter((e) => !VALID_EVENTS.includes(e));
  if (invalid.length) throw new AppError(`Unknown events: ${invalid.join(", ")}`, 400);

  const webhook = await prisma.webhook.create({
    data: {
      name,
      url,
      events: events.join(","),
      secret: crypto.randomBytes(24).toString("hex"),
      orgId: req.orgId,
      userId: req.user.id,
    },
  });
  await incrementUsage({ userId: req.user.id, orgId: req.orgId, resource: "webhooks" });
  // Secret is returned once so the client can verify signatures.
  return response.created(res, webhook);
});

const update = asyncHandler(async (req, res) => {
  const { name, url, events, active } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (url !== undefined) data.url = url;
  if (events !== undefined) {
    if (!Array.isArray(events)) throw new AppError("Events must be an array.", 400);
    data.events = events.join(",");
  }
  if (active !== undefined) data.active = !!active;
  const webhook = await prisma.webhook.updateMany({
    where: { id: Number(req.params.id), orgId: req.orgId },
    data,
  });
  if (webhook.count === 0) throw new AppError("Webhook not found.", 404);
  return response.success(res, { message: "Webhook updated." });
});

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.webhook.deleteMany({
    where: { id: Number(req.params.id), orgId: req.orgId },
  });
  if (result.count === 0) throw new AppError("Webhook not found.", 404);
  return response.success(res, { message: "Webhook deleted." });
});

const listDeliveries = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where = { webhook: { orgId: req.orgId } };
  const [items, total] = await Promise.all([
    prisma.webhookDelivery.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.webhookDelivery.count({ where }),
  ]);
  return response.paginated(res, items, total, page, limit);
});

const rotateSecret = asyncHandler(async (req, res) => {
  const secret = crypto.randomBytes(24).toString("hex");
  const result = await prisma.webhook.updateMany({
    where: { id: Number(req.params.id), orgId: req.orgId },
    data: { secret },
  });
  if (result.count === 0) throw new AppError("Webhook not found.", 404);
  return response.success(res, { secret });
});

const test = asyncHandler(async (req, res) => {
  const webhook = await prisma.webhook.findFirst({
    where: { id: Number(req.params.id), orgId: req.orgId },
  });
  if (!webhook) throw new AppError("Webhook not found.", 404);
  const { deliverOnce } = require("../services/webhookService");
  const event = "INTEGRATION_SYNCED";
  const payload = { message: "Test event from SalesForge", at: new Date().toISOString() };
  const result = await deliverOnce(webhook, event, payload);
  return response.success(res, { ok: result.ok, status: result.status, error: result.error, durationMs: result.durationMs });
});

module.exports = { list, create, update, remove, listDeliveries, rotateSecret, test, VALID_EVENTS };
