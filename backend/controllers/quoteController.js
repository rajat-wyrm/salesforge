const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

const VALID_STATUSES = ["DRAFT", "SENT", "VIEWED", "ACCEPTED", "REJECTED", "EXPIRED", "REVISED"];

const generateNumber = async (orgId) => {
  const count = await prisma.quote.count({ where: { orgId } });
  const year = new Date().getFullYear();
  return `Q-${year}-${String(count + 1).padStart(4, "0")}`;
};

const recalcTotals = (quote, items) => {
  let subtotal = 0;
  for (const item of items) {
    subtotal += item.total;
  }
  const total = subtotal + (quote.tax || 0) - (quote.discount || 0);
  return { subtotal: Math.round(subtotal * 100) / 100, total: Math.round(total * 100) / 100 };
};

const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, status, dealId, search } = req.query;
  const where = { orgId: req.orgId };
  if (status) where.status = status;
  if (dealId) where.dealId = Number(dealId);
  if (search) where.title = { contains: search, mode: "insensitive" };
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    prisma.quote.findMany({
      where, orderBy: { createdAt: "desc" }, skip, take: Number(limit),
      include: { items: true, createdBy: { select: { id: true, name: true } } },
    }),
    prisma.quote.count({ where }),
  ]);
  return response.paginated(res, items, total, page, limit);
});

const get = asyncHandler(async (req, res) => {
  const quote = await prisma.quote.findFirst({
    where: { id: Number(req.params.id), orgId: req.orgId },
    include: {
      items: { orderBy: { position: "asc" }, include: { product: { select: { id: true, name: true, sku: true } } } },
      createdBy: { select: { id: true, name: true, email: true } },
      events: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!quote) throw new AppError("Quote not found.", 404);
  return response.success(res, quote);
});

const create = asyncHandler(async (req, res) => {
  const { title, description, dealId, items = [], tax = 0, discount = 0, currency = "USD", validUntil, notes, terms } = req.body;
  if (!title) throw new AppError("title is required.", 400);

  const number = await generateNumber(req.orgId);
  const processedItems = items.map((item, idx) => ({
    name: item.name,
    description: item.description || null,
    productId: item.productId ? Number(item.productId) : null,
    quantity: Number(item.quantity) || 1,
    unitPrice: Number(item.unitPrice) || 0,
    discount: Number(item.discount) || 0,
    total: Math.max(0, (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0) - (Number(item.discount) || 0)),
    position: idx,
  }));

  const subtotal = processedItems.reduce((s, i) => s + i.total, 0);
  const total = Math.round((subtotal + Number(tax) - Number(discount)) * 100) / 100;

  const quote = await prisma.quote.create({
    data: {
      orgId: req.orgId,
      dealId: dealId ? Number(dealId) : null,
      number, title,
      description: description || null,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Number(tax) || 0,
      discount: Number(discount) || 0,
      total,
      currency,
      validUntil: validUntil ? new Date(validUntil) : null,
      notes: notes || null,
      terms: terms || null,
      status: "DRAFT",
      createdById: req.user.id,
      items: { create: processedItems },
    },
    include: { items: true },
  });
  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "quote.create", entityType: "Quote", entityId: quote.id, metadata: { number, total } });
  return response.created(res, quote);
});

const update = asyncHandler(async (req, res) => {
  const quote = await prisma.quote.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (!quote) throw new AppError("Quote not found.", 404);
  const data = {};
  ["title", "description", "tax", "discount", "currency", "validUntil", "notes", "terms"].forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  if (data.validUntil) data.validUntil = new Date(data.validUntil);
  if (req.body.items) {
    await prisma.quoteItem.deleteMany({ where: { quoteId: quote.id } });
    const processedItems = req.body.items.map((item, idx) => ({
      quoteId: quote.id,
      name: item.name,
      description: item.description || null,
      productId: item.productId ? Number(item.productId) : null,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      discount: Number(item.discount) || 0,
      total: Math.max(0, (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0) - (Number(item.discount) || 0)),
      position: idx,
    }));
    await prisma.quoteItem.createMany({ data: processedItems });
  }
  const items = await prisma.quoteItem.findMany({ where: { quoteId: quote.id } });
  const totals = recalcTotals(quote, items);
  data.subtotal = totals.subtotal;
  data.total = totals.total;
  const updated = await prisma.quote.update({ where: { id: quote.id }, data, include: { items: true } });
  return response.success(res, updated);
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) throw new AppError(`status must be one of: ${VALID_STATUSES.join(", ")}`, 400);
  const now = new Date();
  const data = { status };
  if (status === "SENT") data.sentAt = now;
  if (status === "VIEWED") data.viewedAt = now;
  if (status === "ACCEPTED") data.acceptedAt = now;
  if (status === "REJECTED") data.rejectedAt = now;
  const result = await prisma.quote.updateMany({ where: { id: Number(req.params.id), orgId: req.orgId }, data });
  if (result.count === 0) throw new AppError("Quote not found.", 404);
  await prisma.quoteEvent.create({
    data: { quoteId: Number(req.params.id), type: status, actor: req.user.email, metadata: req.body.metadata || null },
  });
  return response.success(res, { message: `Quote ${status.toLowerCase()}.` });
});

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.quote.deleteMany({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (result.count === 0) throw new AppError("Quote not found.", 404);
  return response.success(res, { message: "Quote deleted." });
});

const metrics = asyncHandler(async (req, res) => {
  const [total, draft, sent, accepted, rejected, totalValue, acceptedValue] = await Promise.all([
    prisma.quote.count({ where: { orgId: req.orgId } }),
    prisma.quote.count({ where: { orgId: req.orgId, status: "DRAFT" } }),
    prisma.quote.count({ where: { orgId: req.orgId, status: { in: ["SENT", "VIEWED"] } } }),
    prisma.quote.count({ where: { orgId: req.orgId, status: "ACCEPTED" } }),
    prisma.quote.count({ where: { orgId: req.orgId, status: "REJECTED" } }),
    prisma.quote.aggregate({ where: { orgId: req.orgId }, _sum: { total: true } }),
    prisma.quote.aggregate({ where: { orgId: req.orgId, status: "ACCEPTED" }, _sum: { total: true } }),
  ]);
  const winRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
  return response.success(res, {
    total, draft, sent, accepted, rejected,
    totalValue: totalValue._sum.total || 0,
    acceptedValue: acceptedValue._sum.total || 0,
    winRate,
  });
});

module.exports = { list, get, create, update, updateStatus, remove, metrics, VALID_STATUSES };
