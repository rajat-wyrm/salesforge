const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { incrementUsage } = require("../services/usageService");

const list = asyncHandler(async (req, res) => {
  const { resource } = req.query;
  const where = { userId: req.user.id };
  if (resource) where.resource = resource;
  if (req.orgId) where.orgId = req.orgId;
  const items = await prisma.savedSearch.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return response.success(res, items);
});

const create = asyncHandler(async (req, res) => {
  const { name, resource, filters, isShared } = req.body;
  if (!name || !resource) throw new AppError("Name and resource are required.", 400);
  const saved = await prisma.savedSearch.create({
    data: {
      name,
      resource,
      filters: filters || {},
      isShared: !!isShared,
      userId: req.user.id,
      orgId: req.orgId,
    },
  });
  await incrementUsage({ userId: req.user.id, orgId: req.orgId, resource: "savedSearches" });
  return response.created(res, saved);
});

const update = asyncHandler(async (req, res) => {
  const { name, filters, isShared } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (filters !== undefined) data.filters = filters;
  if (isShared !== undefined) data.isShared = !!isShared;
  const result = await prisma.savedSearch.updateMany({
    where: { id: Number(req.params.id), userId: req.user.id, orgId: req.orgId },
    data,
  });
  if (result.count === 0) throw new AppError("Saved search not found.", 404);
  return response.success(res, { message: "Saved search updated." });
});

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.savedSearch.deleteMany({
    where: { id: Number(req.params.id), userId: req.user.id, orgId: req.orgId },
  });
  if (result.count === 0) throw new AppError("Saved search not found.", 404);
  return response.success(res, { message: "Saved search removed." });
});

module.exports = { list, create, update, remove };
