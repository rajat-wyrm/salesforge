// Quota service - sales targets and tracking.
// Quotas are stored on the User model's customFields JSON column to avoid
// requiring a new schema model. Each user can have a per-period quota with
// target, actual, type, stretch, and bonus fields.
const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

// Safely parse customFields — Prisma may return a JSON string or object
const parseCustomFields = (cf) => {
  if (!cf) return {};
  if (typeof cf === "string") {
    try { return JSON.parse(cf); } catch { return {}; }
  }
  return cf;
};

const getCurrentPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
};

const getMonthPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const userWhere = (req, extra = {}) => ({ organizationId: req.orgId, ...extra });

const list = asyncHandler(async (req, res) => {
  const { userId, period = getCurrentPeriod() } = req.query;
  const where = userWhere(req);
  if (userId) where.id = Number(userId);
  const users = await prisma.user.findMany({
    where, take: 50, select: { id: true, name: true, email: true, role: true, customFields: true },
  });
  const quotas = users.map((u) => {
    const cf = parseCustomFields(u.customFields);
    const q = cf.quotas?.[period] || { target: 0, actual: 0 };
    return {
      id: u.id,
      userId: u.id,
      user: { id: u.id, name: u.name, email: u.email, role: u.role },
      period, target: q.target, actual: q.actual,
      progress: q.target > 0 ? Math.round((q.actual / q.target) * 100) : 0,
      type: q.type || "revenue",
    };
  });
  return response.success(res, quotas);
});

const get = asyncHandler(async (req, res) => {
  const user = await prisma.user.findFirst({
    where: { id: Number(req.params.id), organizationId: req.orgId },
  });
  if (!user) throw new AppError("User not found.", 404);
  const cf = parseCustomFields(user.customFields);
  const q = cf.quotas?.[req.query.period || getCurrentPeriod()] || { target: 0, actual: 0 };
  return response.success(res, {
    id: user.id,
    userId: user.id,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    period: req.query.period || getCurrentPeriod(),
    target: q.target, actual: q.actual,
    progress: q.target > 0 ? Math.round((q.actual / q.target) * 100) : 0,
  });
});

const create = asyncHandler(async (req, res) => {
  const { period = getCurrentPeriod(), target, type = "revenue", stretch, bonus } = req.body;
  // Default to the logged-in user's ID when userId is not provided or empty
  const userId = req.body.userId ? Number(req.body.userId) : req.user.id;
  if (target === undefined) throw new AppError("target is required.", 400);

  const user = await prisma.user.findFirst({ where: { id: userId, organizationId: req.orgId } });
  if (!user) throw new AppError("User not found in your organization.", 404);

  const cf = parseCustomFields(user.customFields);
  const quotas = cf.quotas || {};
  quotas[period] = { target: Number(target), actual: quotas[period]?.actual || 0, type, stretch, bonus };

  await prisma.user.update({
    where: { id: user.id },
    data: { customFields: { ...cf, quotas } },
  });
  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "quota.create", entityType: "Quota", entityId: user.id, metadata: { period, target } });
  return response.created(res, { userId: user.id, period, target, actual: 0, type });
});

const update = asyncHandler(async (req, res) => {
  const { period = getCurrentPeriod(), target, actual, type, stretch, bonus } = req.body;
  const user = await prisma.user.findFirst({ where: { id: Number(req.params.id), organizationId: req.orgId } });
  if (!user) throw new AppError("User not found.", 404);

  const cf = parseCustomFields(user.customFields);
  const quotas = cf.quotas || {};
  quotas[period] = {
    target: target !== undefined ? Number(target) : quotas[period]?.target || 0,
    actual: actual !== undefined ? Number(actual) : quotas[period]?.actual || 0,
    type: type || quotas[period]?.type || "revenue",
    stretch: stretch !== undefined ? Number(stretch) : quotas[period]?.stretch,
    bonus: bonus !== undefined ? Number(bonus) : quotas[period]?.bonus,
  };
  await prisma.user.update({
    where: { id: user.id },
    data: { customFields: { ...cf, quotas } },
  });
  return response.success(res, { message: "Quota updated." });
});

const remove = asyncHandler(async (req, res) => {
  const user = await prisma.user.findFirst({ where: { id: Number(req.params.id), organizationId: req.orgId } });
  if (!user) throw new AppError("User not found.", 404);
  const cf = parseCustomFields(user.customFields);
  const quotas = cf.quotas || {};
  delete quotas[req.query.period || getCurrentPeriod()];
  await prisma.user.update({
    where: { id: user.id },
    data: { customFields: { ...cf, quotas } },
  });
  return response.success(res, { message: "Quota removed." });
});

const metrics = asyncHandler(async (req, res) => {
  const period = req.query.period || getCurrentPeriod();
  const users = await prisma.user.findMany({
    where: userWhere(req),
    select: { id: true, name: true, customFields: true, role: true },
  });
  let totalTarget = 0;
  let totalActual = 0;
  const breakdown = [];
  for (const u of users) {
    const q = parseCustomFields(u.customFields).quotas?.[period];
    if (q) {
      totalTarget += q.target || 0;
      totalActual += q.actual || 0;
      breakdown.push({
        userId: u.id, name: u.name, role: u.role,
        target: q.target, actual: q.actual,
        progress: q.target > 0 ? Math.round((q.actual / q.target) * 100) : 0,
      });
    }
  }
  return response.success(res, {
    period, totalTarget, totalActual,
    progress: totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0,
    breakdown,
  });
});

module.exports = { list, get, create, update, remove, metrics, getCurrentPeriod, getMonthPeriod };
