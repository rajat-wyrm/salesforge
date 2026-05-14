const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

const list = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const where = { OR: [{ orgId: req.orgId, isShared: true }, { userId: req.user.id }] };
  if (category) where.category = category;
  if (search) {
    where.AND = { OR: [{ name: { contains: search, mode: "insensitive" } }, { subject: { contains: search, mode: "insensitive" } }] };
  }
  const items = await prisma.emailTemplate.findMany({ where, orderBy: { updatedAt: "desc" } });
  return response.success(res, items);
});

const get = asyncHandler(async (req, res) => {
  const t = await prisma.emailTemplate.findFirst({ where: { id: Number(req.params.id), OR: [{ orgId: req.orgId, isShared: true }, { userId: req.user.id }] } });
  if (!t) throw new AppError("Template not found.", 404);
  return response.success(res, t);
});

const create = asyncHandler(async (req, res) => {
  const { name, subject, body, category, variables, isShared } = req.body;
  if (!name || !subject || !body) throw new AppError("name, subject, and body are required.", 400);
  const t = await prisma.emailTemplate.create({
    data: {
      orgId: req.orgId,
      userId: req.user.id,
      name,
      subject,
      body,
      category: category || null,
      variables: variables || null,
      isShared: !!isShared,
    },
  });
  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "template.create", entityType: "EmailTemplate", entityId: t.id });
  return response.created(res, t);
});

const update = asyncHandler(async (req, res) => {
  const data = {};
  ["name", "subject", "body", "category", "variables", "isShared"].forEach((k) => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  const result = await prisma.emailTemplate.updateMany({ where: { id: Number(req.params.id), userId: req.user.id }, data });
  if (result.count === 0) throw new AppError("Template not found or you cannot edit it.", 404);
  return response.success(res, { message: "Template updated." });
});

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.emailTemplate.deleteMany({ where: { id: Number(req.params.id), userId: req.user.id } });
  if (result.count === 0) throw new AppError("Template not found or you cannot delete it.", 404);
  return response.success(res, { message: "Template deleted." });
});

const render = (template, vars = {}) => {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`{{\\s*${k}\\s*}}`, "g"), v || "");
  }
  return out;
};

const use = asyncHandler(async (req, res) => {
  const t = await prisma.emailTemplate.findFirst({ where: { id: Number(req.params.id), OR: [{ orgId: req.orgId, isShared: true }, { userId: req.user.id }] } });
  if (!t) throw new AppError("Template not found.", 404);
  const { variables = {} } = req.body;
  const subject = render(t.subject, variables);
  const body = render(t.body, variables);
  await prisma.emailTemplate.update({ where: { id: t.id }, data: { useCount: { increment: 1 } } });
  return response.success(res, { subject, body });
});

const categories = asyncHandler(async (req, res) => {
  const cats = await prisma.emailTemplate.groupBy({ by: ["category"], where: { orgId: req.orgId }, _count: { category: true } });
  return response.success(res, cats.map((c) => ({ category: c.category, count: c._count.category })));
});

module.exports = { list, get, create, update, remove, use, categories };
