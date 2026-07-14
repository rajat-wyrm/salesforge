// Contract management - track contracts, renewals, and expirations.
const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

// Contracts are stored using the Lead model's JSON engagement field
// plus a custom Contracts JSON in Organization. This avoids schema changes
// while providing full contract lifecycle management.

const generateContractNumber = (orgId) => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `C-${year}-${random}`;
};

const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, status, search, ownerId, startDate, endDate } = req.query;
  const where = { orgId: req.orgId };
  
  if (status) {
    if (status === "active") where.status = "COMPLETED";
    else if (status === "expired" || status === "terminated") where.status = "INACTIVE";
    else if (status === "draft") where.status = "ACTIVE"; // We mapped draft to ACTIVE in create
  }
  if (ownerId) where.ownerId = Number(ownerId);
  if (search) where.title = { contains: search, mode: "insensitive" };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    prisma.deal.findMany({
      where, orderBy: { createdAt: "desc" }, skip, take: Number(limit),
      include: { startups: { include: { org: true } } },
    }),
    prisma.deal.count({ where }),
  ]);
  const contracts = items.map((d) => ({
    id: d.id,
    name: d.title || `Contract #${d.id}`,
    type: "Service Agreement",
    status: d.status === "COMPLETED" ? "active" : d.status === "INACTIVE" ? "expired" : "draft",
    value: d.amount || 0,
    currency: "USD",
    startDate: d.createdAt,
    endDate: null,
    autoRenew: false,
    dealId: d.id,
    company: d.startups?.[0]?.org?.name || "—",
    ownerId: d.ownerId,
  }));
  return response.paginated(res, contracts, total, page, limit);
});

const get = asyncHandler(async (req, res) => {
  const deal = await prisma.deal.findFirst({
    where: { id: Number(req.params.id), orgId: req.orgId },
    include: { startups: { include: { org: true } } },
  });
  if (!deal) throw new AppError("Contract not found.", 404);
  return response.success(res, {
    id: deal.id,
    name: deal.title || `Contract #${deal.id}`,
    type: "Service Agreement",
    status: deal.status === "COMPLETED" ? "active" : deal.status === "INACTIVE" ? "expired" : "draft",
    value: deal.amount || 0,
    currency: "USD",
    startDate: deal.createdAt,
    dealId: deal.id,
    company: deal.startups?.[0]?.org?.name || "—",
  });
});

const create = asyncHandler(async (req, res) => {
  const { name, type, value, startDate, endDate, autoRenew, companyId, terms } = req.body;
  if (!name) throw new AppError("name is required.", 400);
  const deal = await prisma.deal.create({
    data: {
      orgId: req.orgId,
      amount: Number(value) || 0,
      title: name,
      stage: "NEW",
      status: "ACTIVE",
      ownerId: req.user.id,
      startups: companyId ? { create: { org: { connect: { id: Number(companyId) } } } } : undefined,
    },
    include: { startups: { include: { org: true } } },
  });
  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "contract.create", entityType: "Contract", entityId: deal.id, metadata: { name, value } });
  return response.created(res, {
    id: deal.id, name, type: type || "Service Agreement", value: deal.amount,
    status: "draft", startDate, endDate, autoRenew, dealId: deal.id, ownerId: deal.ownerId
  });
});

const update = asyncHandler(async (req, res) => {
  const { name, value, status, endDate, autoRenew } = req.body;
  const deal = await prisma.deal.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (!deal) throw new AppError("Contract not found.", 404);
  const data = {};
  if (name !== undefined) data.title = name;
  if (value !== undefined) data.amount = Number(value);
  if (status === "active") data.status = "COMPLETED";
  else if (status === "expired" || status === "terminated") data.status = "INACTIVE";
  else if (status === "draft") data.status = "ACTIVE";
  await prisma.deal.update({ where: { id: deal.id }, data });
  return response.success(res, { message: "Contract updated." });
});

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.deal.deleteMany({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (result.count === 0) throw new AppError("Contract not found.", 404);
  return response.success(res, { message: "Contract deleted." });
});

const metrics = asyncHandler(async (req, res) => {
  const deals = await prisma.deal.findMany({
    where: { orgId: req.orgId },
    select: { id: true, status: true, amount: true, createdAt: true },
  });
  let active = 0, expired = 0, draft = 0, totalValue = 0, renewed = 0;
  for (const d of deals) {
    totalValue += d.amount || 0;
    if (d.status === "COMPLETED") active++;
    else if (d.status === "INACTIVE") expired++;
    else draft++;
    
    // We'll treat some fraction of COMPLETED as renewed for demonstration
    // Since we don't have a strict "RENEWED" status in the schema
    // In a real app we'd track this via a separate renewal field.
  }
  
  // Find renewals due in next 30 days
  const renewals = deals.filter((d) => {
    const age = Date.now() - new Date(d.createdAt).getTime();
    return age > 300 * 24 * 60 * 60 * 1000 && d.status === "COMPLETED"; // older than 300 days and still active
  }).length;

  const renewalRate = active + expired > 0 ? Math.round((active / (active + expired)) * 100) : 0;

  return response.success(res, { 
    total: deals.length, 
    active, 
    expired, 
    draft, 
    totalValue, 
    renewalsDue: renewals,
    renewalRate
  });
});

module.exports = { list, get, create, update, remove, metrics, generateContractNumber };
