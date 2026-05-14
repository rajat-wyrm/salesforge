const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const slugify = require("../utils/slugify");

const VALID_TYPES = ["text", "number", "select", "multiselect", "date", "checkbox", "url", "email", "phone", "textarea"];
const VALID_ENTITIES = ["lead", "deal", "contact", "company"];

const list = asyncHandler(async (req, res) => {
  const { entity } = req.query;
  const where = { orgId: req.orgId };
  if (entity) where.entity = entity;
  const items = await prisma.customField.findMany({ where, orderBy: { position: "asc" } });
  return response.success(res, items);
});

const create = asyncHandler(async (req, res) => {
  const { entity, name, label, type, options, required, position } = req.body;
  if (!VALID_ENTITIES.includes(entity)) throw new AppError(`entity must be one of: ${VALID_ENTITIES.join(", ")}.`, 400);
  if (!name || !label || !type) throw new AppError("name, label, and type are required.", 400);
  if (!VALID_TYPES.includes(type)) throw new AppError(`type must be one of: ${VALID_TYPES.join(", ")}.`, 400);
  const slug = slugify(name);
  const field = await prisma.customField.create({
    data: { orgId: req.orgId, entity, name, slug, label, type, options: options || null, required: !!required, position: position || 0 },
  });
  return response.created(res, field);
});

const update = asyncHandler(async (req, res) => {
  const data = {};
  ["label", "type", "options", "required", "position"].forEach((k) => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  const result = await prisma.customField.updateMany({ where: { id: Number(req.params.id), orgId: req.orgId }, data });
  if (result.count === 0) throw new AppError("Field not found.", 404);
  return response.success(res, { message: "Field updated." });
});

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.customField.deleteMany({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (result.count === 0) throw new AppError("Field not found.", 404);
  return response.success(res, { message: "Field deleted." });
});

module.exports = { list, create, update, remove, VALID_TYPES, VALID_ENTITIES };
