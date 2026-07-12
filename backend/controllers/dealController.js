const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");
const { publish } = require("../services/webhookService");
const { recordActivity } = require("../services/leadActivityService");

const DEFAULT_STAGES = [
  { name: "Lead", color: "gray", position: 0, probability: 10 },
  { name: "Qualified", color: "blue", position: 1, probability: 25 },
  { name: "Proposal", color: "amber", position: 2, probability: 50 },
  { name: "Negotiation", color: "purple", position: 3, probability: 75 },
  { name: "Won", color: "emerald", position: 4, probability: 100, isWon: true },
  { name: "Lost", color: "red", position: 5, probability: 0, isLost: true },
];

const ensureDefaultStages = async (orgId) => {
  const existing = await prisma.pipelineStage.findMany({ where: { orgId } });
  if (existing.length) return existing;
  return prisma.pipelineStage.createMany({
    data: DEFAULT_STAGES.map((s) => ({ ...s, orgId })),
  });
};

const listStages = asyncHandler(async (req, res) => {
  await ensureDefaultStages(req.orgId);
  const stages = await prisma.pipelineStage.findMany({
    where: { orgId: req.orgId },
    orderBy: { position: "asc" },
    include: { _count: { select: { deals: true } } },
  });
  return response.success(res, stages);
});

const createStage = asyncHandler(async (req, res) => {
  const { name, color = "gray", probability = 50 } = req.body;
  if (!name) throw new AppError("Stage name is required.", 400);
  const last = await prisma.pipelineStage.findFirst({ where: { orgId: req.orgId }, orderBy: { position: "desc" } });
  const stage = await prisma.pipelineStage.create({
    data: { name, color, probability, orgId: req.orgId, position: (last?.position || 0) + 1 },
  });
  return response.created(res, stage);
});

const updateStage = asyncHandler(async (req, res) => {
  const data = {};
  ["name", "color", "probability", "position", "isWon", "isLost"].forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  const stage = await prisma.pipelineStage.updateMany({ where: { id: Number(req.params.id), orgId: req.orgId }, data });
  if (stage.count === 0) throw new AppError("Stage not found.", 404);
  return response.success(res, { message: "Stage updated." });
});

const reorderStages = asyncHandler(async (req, res) => {
  const { order } = req.body; // array of stage IDs in desired order
  if (!Array.isArray(order)) throw new AppError("order must be an array of stage IDs.", 400);
  await prisma.$transaction(order.map((id, idx) => prisma.pipelineStage.updateMany({
    where: { id: Number(id), orgId: req.orgId }, data: { position: idx },
  })));
  return response.success(res, { message: "Stages reordered." });
});

//FIX 2: Asli Safe-Delete logic implemented
const deleteStage = asyncHandler(async (req, res) => {
  const dealsCount = await prisma.deal.count({
    where: { stageId: Number(req.params.id), orgId: req.orgId }
  });
  
  if (dealsCount > 0) {
    throw new AppError(`Cannot delete stage. It currently has ${dealsCount} active deals.`, 400);
  }

  const result = await prisma.pipelineStage.deleteMany({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (result.count === 0) throw new AppError("Stage not found.", 404);
  return response.success(res, { message: "Stage deleted safely." });
});

const listDeals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, stage, status, search, sortBy = "position", order = "asc" } = req.query;
  const where = { orgId: req.orgId };
  if (stage) where.stageId = Number(stage);
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { amount: { not: null } },
    ];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [deals, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      include: { stageRef: true, startups: { include: { org: true } }, investors: { include: { org: true } } },
      orderBy: { [sortBy]: order },
      skip,
      take: Number(limit),
    }),
    prisma.deal.count({ where }),
  ]);
  return response.paginated(res, deals, total, page, limit);
});

const getDeal = asyncHandler(async (req, res) => {
  const deal = await prisma.deal.findFirst({
    where: { id: Number(req.params.id), orgId: req.orgId },
    include: { stageRef: true, startups: { include: { org: true } }, investors: { include: { org: true } } },
  });
  if (!deal) throw new AppError("Deal not found.", 404);
  return response.success(res, deal);
});

const createDeal = asyncHandler(async (req, res) => {
  const { title, amount, stageId, probability = 50, expectedCloseAt, source, startupIds = [], investorIds = [] } = req.body;
  if (!title) throw new AppError("Deal title is required.", 400);
  if (amount === undefined) throw new AppError("Deal amount is required.", 400);

  let resolvedStageId = stageId;
  if (!resolvedStageId) {
    const firstStage = await prisma.pipelineStage.findFirst({ where: { orgId: req.orgId }, orderBy: { position: "asc" } });
    if (!firstStage) {
      await ensureDefaultStages(req.orgId);
      const fs = await prisma.pipelineStage.findFirst({ where: { orgId: req.orgId }, orderBy: { position: "asc" } });
      resolvedStageId = fs.id;
    } else {
      resolvedStageId = firstStage.id;
    }
  }

  const lastPos = await prisma.deal.findFirst({ where: { orgId: req.orgId, stageId: resolvedStageId }, orderBy: { position: "desc" } });
  
  //  FIX 3: Asli Type-Checking implement ki gayi
  const validStartupIds = Array.isArray(startupIds) ? startupIds : [];
  const validInvestorIds = Array.isArray(investorIds) ? investorIds : [];

  const deal = await prisma.deal.create({
    data: {
      orgId: req.orgId,
      title,
      amount: Number(amount),
      stage: "NEW",
      status: "ACTIVE",
      stageId: resolvedStageId,
      position: (lastPos?.position || 0) + 1,
      probability: Number(probability),
      expectedCloseAt: expectedCloseAt ? new Date(expectedCloseAt) : null,
      source: source || null,
      ownerId: req.user.id,
      startups: { create: validStartupIds.map((id) => ({ org: { connect: { id: Number(id) } } })) },
      investors: { create: validInvestorIds.map((id) => ({ org: { connect: { id: Number(id) } } })) },
    },
    include: { stageRef: true, startups: { include: { org: true } }, investors: { include: { org: true } } },
  });
  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "deal.create", entityType: "Deal", entityId: deal.id, metadata: { amount, title } });
  await publish({ orgId: req.orgId, event: "DEAL_CREATED", payload: { dealId: deal.id, title, amount } });
  return response.created(res, deal);
});

const updateDeal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deal = await prisma.deal.findFirst({ where: { id: Number(id), orgId: req.orgId } });
  if (!deal) throw new AppError("Deal not found.", 404);

  const data = {};
  ["title", "amount", "probability", "expectedCloseAt", "source", "status"].forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  if (req.body.amount !== undefined) data.amount = Number(req.body.amount);
  if (req.body.expectedCloseAt !== undefined) data.expectedCloseAt = req.body.expectedCloseAt ? new Date(req.body.expectedCloseAt) : null;

  // Handle stage move (Kanban)
  if (req.body.stageId !== undefined) {
    const newStage = await prisma.pipelineStage.findFirst({ where: { id: Number(req.body.stageId), orgId: req.orgId } });
    if (!newStage) throw new AppError("Stage not found.", 400);
    data.stageId = newStage.id;
    data.stage = newStage.isWon ? "CLOSED" : newStage.isLost ? "CANCELLED" : deal.stage;
    if (newStage.isWon) { data.status = "COMPLETED"; data.closedAt = new Date(); }
    if (newStage.isLost) { data.status = "INACTIVE"; data.closedAt = new Date(); }
    if (newStage.probability) data.probability = newStage.probability;
    // Reorder: put at end of new column
    const lastPos = await prisma.deal.findFirst({ where: { orgId: req.orgId, stageId: newStage.id, NOT: { id: deal.id } }, orderBy: { position: "desc" } });
    data.position = (lastPos?.position || 0) + 1;
  }
  if (req.body.position !== undefined) data.position = Number(req.body.position);

  const updated = await prisma.deal.update({ where: { id: deal.id }, data, include: { stageRef: true } });
  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "deal.update", entityType: "Deal", entityId: deal.id, metadata: data });
  await publish({ orgId: req.orgId, event: "DEAL_UPDATED", payload: { dealId: deal.id } });
  return response.success(res, updated);
});

const moveDeal = asyncHandler(async (req, res) => {
  const { stageId, position } = req.body;
  const deal = await prisma.deal.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (!deal) throw new AppError("Deal not found.", 404);
  const stage = await prisma.pipelineStage.findFirst({ where: { id: Number(stageId), orgId: req.orgId } });
  if (!stage) throw new AppError("Stage not found.", 400);
  const updated = await prisma.deal.update({
    where: { id: deal.id },
    data: {
      stageId: stage.id,
      stage: stage.isWon ? "CLOSED" : stage.isLost ? "CANCELLED" : "NEW",
      status: stage.isWon ? "COMPLETED" : stage.isLost ? "INACTIVE" : "ACTIVE",
      closedAt: stage.isWon || stage.isLost ? new Date() : null,
      probability: stage.probability,
      position: position !== undefined ? Number(position) : 0,
    },
    include: { stageRef: true },
  });
  await publish({ orgId: req.orgId, event: "DEAL_STAGE_CHANGED", payload: { dealId: deal.id, stage: stage.name } });
  return response.success(res, updated);
});

const deleteDeal = asyncHandler(async (req, res) => {
  const deal = await prisma.deal.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (!deal) throw new AppError("Deal not found.", 404);
  await prisma.deal.delete({ where: { id: deal.id } });
  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "deal.delete", entityType: "Deal", entityId: deal.id });
  return response.success(res, { message: "Deal deleted." });
});

// FIX 1: kanbanView crash fix (investors include kiya)
const kanbanView = asyncHandler(async (req, res) => {
  await ensureDefaultStages(req.orgId);
  const stages = await prisma.pipelineStage.findMany({
    where: { orgId: req.orgId },
    orderBy: { position: "asc" },
  });
  const deals = await prisma.deal.findMany({
    where: { orgId: req.orgId, status: "ACTIVE" },
    orderBy: { position: "asc" },
    include: { 
      startups: { include: { org: true } },
      investors: { include: { org: true } } // Yahan fault tha, ise add kar diya
    },
  });
  const byStage = stages.map((s) => ({
    ...s,
    deals: deals.filter((d) => d.stageId === s.id),
  }));
  return response.success(res, byStage);
});

const metrics = asyncHandler(async (req, res) => {
  const orgId = req.orgId;
  const [total, won, lost, open, sumAmount, wonAmount, lostAmount] = await Promise.all([
    prisma.deal.count({ where: { orgId } }),
    prisma.deal.count({ where: { orgId, status: "COMPLETED" } }),
    prisma.deal.count({ where: { orgId, status: "INACTIVE" } }),
    prisma.deal.count({ where: { orgId, status: "ACTIVE" } }),
    prisma.deal.aggregate({ where: { orgId, status: "ACTIVE" }, _sum: { amount: true } }),
    prisma.deal.aggregate({ where: { orgId, status: "COMPLETED" }, _sum: { amount: true } }),
    prisma.deal.aggregate({ where: { orgId, status: "INACTIVE" }, _sum: { amount: true } }),
  ]);
  const wonRate = total > 0 ? Math.round((won / total) * 100) : 0;
  const weightedPipeline = (sumAmount._sum.amount || 0) * 0.5; // rough weighted estimate
  return response.success(res, {
    total, won, lost, open,
    pipelineValue: sumAmount._sum.amount || 0,
    wonValue: wonAmount._sum.amount || 0,
    lostValue: lostAmount._sum.amount || 0,
    wonRate,
    weightedPipeline,
  });
});

module.exports = { listStages, createStage, updateStage, reorderStages, deleteStage, listDeals, getDeal, createDeal, updateDeal, moveDeal, deleteDeal, kanbanView, metrics, ensureDefaultStages };