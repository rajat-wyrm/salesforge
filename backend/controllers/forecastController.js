const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");

const VALID_CATEGORIES = ["commit", "best_case", "pipeline", "omitted"];

const list = asyncHandler(async (req, res) => {
  const { period } = req.query;
  const where = { orgId: req.orgId };
  if (period) where.period = period;
  const items = await prisma.forecast.findMany({ where, orderBy: { period: "desc" } });
  return response.success(res, items);
});

const current = asyncHandler(async (req, res) => {
  const now = new Date();
  const period = `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
  const [deals, allOrgs, saved] = await Promise.all([
    prisma.deal.findMany({ where: { orgId: req.orgId, status: "ACTIVE" } }),
    prisma.deal.groupBy({ by: ["stageId"], where: { orgId: req.orgId, status: "ACTIVE" }, _sum: { amount: true } }),
    prisma.forecast.findMany({ where: { orgId: req.orgId, period }, orderBy: { category: "asc" } }),
  ]);

  // Compute forecast by category
  const open = deals.filter((d) => !d.stageRef?.isWon && !d.stageRef?.isLost);
  const commit = open.filter((d) => (d.probability || 0) >= 75).reduce((s, d) => s + d.amount, 0);
  const bestCase = open.filter((d) => (d.probability || 0) >= 50).reduce((s, d) => s + d.amount, 0);
  const pipeline = open.reduce((s, d) => s + d.amount, 0);

  return response.success(res, {
    period,
    open: { count: open.length, amount: pipeline },
    commit: { amount: commit },
    bestCase: { amount: bestCase },
    pipeline: { amount: pipeline },
    saved,
  });
});

const create = asyncHandler(async (req, res) => {
  const { name, period, category = "commit", amount, deals, notes } = req.body;
  if (!name || !period) throw new AppError("name and period are required.", 400);
  if (!VALID_CATEGORIES.includes(category)) throw new AppError(`category must be one of: ${VALID_CATEGORIES.join(", ")}.`, 400);
  const f = await prisma.forecast.create({
    data: { orgId: req.orgId, userId: req.user.id, name, period, category, amount: Number(amount) || 0, deals: deals || null, notes: notes || null },
  });
  return response.created(res, f);
});

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.forecast.deleteMany({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (result.count === 0) throw new AppError("Forecast not found.", 404);
  return response.success(res, { message: "Forecast deleted." });
});

module.exports = { list, current, create, remove, VALID_CATEGORIES };
