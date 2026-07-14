const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

const VALID_OUTCOMES = ["WON", "LOST", "POSTPONED", "CANCELLED"];
const VALID_LOSS_REASONS = ["PRICE", "COMPETITOR", "NO_BUDGET", "NO_DECISION", "TIMING", "NO_RESPONSE", "FEATURES", "RELATIONSHIP", "OTHER"];

const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, outcome, lossReason, from, to } = req.query;
  const where = { orgId: req.orgId };
  if (outcome) where.outcome = outcome;
  if (lossReason) where.lossReason = lossReason;
  if (from || to) {
    where.closedAt = {};
    if (from) where.closedAt.gte = new Date(from);
    if (to) where.closedAt.lte = new Date(to);
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    prisma.winLossRecord.findMany({
      where, orderBy: { closedAt: "desc" }, skip, take: Number(limit),
      include: { recordedBy: { select: { id: true, name: true } } },
    }),
    prisma.winLossRecord.count({ where }),
  ]);
  return response.paginated(res, items, total, page, limit);
});

const get = asyncHandler(async (req, res) => {
  const record = await prisma.winLossRecord.findFirst({
    where: { id: Number(req.params.id), orgId: req.orgId },
    include: { recordedBy: { select: { id: true, name: true, email: true } } },
  });
  if (!record) throw new AppError("Record not found.", 404);
  return response.success(res, record);
});

const create = asyncHandler(async (req, res) => {
  const { dealId, outcome, lossReason, competitor, amount, closedAt, cycleDays, notes, lessons } = req.body;
  if (!VALID_OUTCOMES.includes(outcome)) throw new AppError(`outcome must be one of: ${VALID_OUTCOMES.join(", ")}`, 400);
  if (lossReason && !VALID_LOSS_REASONS.includes(lossReason)) throw new AppError(`lossReason must be one of: ${VALID_LOSS_REASONS.join(", ")}`, 400);
  const data = {
    orgId: req.orgId,
    dealId: dealId ? Number(dealId) : null,
    outcome, lossReason: lossReason || null,
    competitor: competitor || null,
    amount: Number(amount) || 0,
    closedAt: closedAt ? new Date(closedAt) : new Date(),
    cycleDays: cycleDays ? Number(cycleDays) : null,
    notes: notes || null,
    lessons: lessons || null,
    recordedById: req.user.id,
  };
  if (dealId) {
    const existing = await prisma.winLossRecord.findUnique({ where: { dealId: Number(dealId) } });
    if (existing) throw new AppError("A win/loss record already exists for this deal.", 409);
  }
  const record = await prisma.winLossRecord.create({ data });
  if (dealId) {
    await prisma.deal.updateMany({
      where: { id: Number(dealId) },
      data: { status: outcome === "WON" ? "COMPLETED" : outcome === "LOST" ? "INACTIVE" : "ACTIVE" },
    }).catch(() => {});
  }
  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "winloss.create", entityType: "WinLossRecord", entityId: record.id, metadata: { outcome, amount } });
  return response.created(res, record);
});

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.winLossRecord.deleteMany({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (result.count === 0) throw new AppError("Record not found.", 404);
  return response.success(res, { message: "Record deleted." });
});

const analytics = asyncHandler(async (req, res) => {
  const orgId = req.orgId;

  const byOutcome = await prisma.winLossRecord.groupBy({
    by: ["outcome"],
    where: { orgId },
    _count: { outcome: true },
    _sum: { amount: true },
  });

  const byLossReason = await prisma.winLossRecord.groupBy({
    by: ["lossReason"],
    where: { orgId, outcome: "LOST" },
    _count: { lossReason: true },
  });

  const byMonth = await prisma.$queryRaw`SELECT TO_CHAR("closedAt", 'YYYY-MM') as month, outcome, COUNT(*)::int as count, SUM(amount)::float as total FROM "win_loss_records" WHERE "orgId" = ${orgId} GROUP BY month, outcome ORDER BY month DESC LIMIT 24`;

  const totalWon = await prisma.winLossRecord.count({ where: { orgId, outcome: "WON" } });
  const totalLost = await prisma.winLossRecord.count({ where: { orgId, outcome: "LOST" } });
  const totalAmount = await prisma.winLossRecord.aggregate({
    where: { orgId },
    _sum: { amount: true },
    _avg: { amount: true },
  });

  const total = totalWon + totalLost;
  const winRate = total > 0 ? Math.round((totalWon / total) * 100) : 0;
  const avgDealSize = totalAmount._avg.amount || 0;

  return response.success(res, {
    byOutcome: byOutcome.map((b) => ({ outcome: b.outcome, count: b._count.outcome, total: b._sum.amount || 0 })),
    byLossReason: byLossReason.map((b) => ({ lossReason: b.lossReason, count: b._count.lossReason })).filter((x) => x.lossReason),
    byMonth,
    totalWon,
    totalLost,
    total,
    winRate,
    avgDealSize,
  });
});

module.exports = { list, get, create, remove, analytics, VALID_OUTCOMES, VALID_LOSS_REASONS };
