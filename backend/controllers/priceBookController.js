const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

const list = asyncHandler(async (req, res) => {
  const items = await prisma.priceBook.findMany({
    where: { orgId: req.orgId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { entries: true } } },
  });
  return response.success(res, items);
});

const get = asyncHandler(async (req, res) => {
  const pb = await prisma.priceBook.findFirst({
    where: { id: Number(req.params.id), orgId: req.orgId },
    include: { entries: { include: { product: true } } },
  });
  if (!pb) throw new AppError("Price book not found.", 404);
  return response.success(res, pb);
});

const create = asyncHandler(async (req, res) => {
  const { name, currency, isDefault } = req.body;
  if (!name) throw new AppError("name is required.", 400);
  if (isDefault) await prisma.priceBook.updateMany({ where: { orgId: req.orgId }, data: { isDefault: false } });
  const pb = await prisma.priceBook.create({
    data: { orgId: req.orgId, name, currency: currency || "USD", isDefault: !!isDefault },
  });
  return response.created(res, pb);
});

const addEntry = asyncHandler(async (req, res) => {
  const { productId, unitPrice, minQuantity = 1 } = req.body;
  if (!productId || unitPrice === undefined) throw new AppError("productId and unitPrice are required.", 400);
  const entry = await prisma.priceBookEntry.upsert({
    where: { priceBookId_productId: { priceBookId: Number(req.params.id), productId: Number(productId) } },
    create: { priceBookId: Number(req.params.id), productId: Number(productId), unitPrice: Number(unitPrice), minQuantity: Number(minQuantity) },
    update: { unitPrice: Number(unitPrice), minQuantity: Number(minQuantity) },
  });
  return response.success(res, entry);
});

const removeEntry = asyncHandler(async (req, res) => {
  await prisma.priceBookEntry.deleteMany({
    where: { priceBookId: Number(req.params.id), productId: Number(req.params.productId) },
  });
  return response.success(res, { message: "Entry removed." });
});

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.priceBook.deleteMany({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (result.count === 0) throw new AppError("Price book not found.", 404);
  return response.success(res, { message: "Price book deleted." });
});

module.exports = { list, get, create, addEntry, removeEntry, remove };
