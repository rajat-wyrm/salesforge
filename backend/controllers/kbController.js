// Knowledge Base - self-service articles and documentation.
// KB articles are stored as Playbook records with category="kb" and
// the article body in the first step's content. Views/helpful counters
// live in the Playbook's description metadata blob.
const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

const META_KEY = "kbMeta";

const readMeta = (article) => {
  const m = article?.description || "";
  try {
    const parsed = JSON.parse(m);
    if (parsed && typeof parsed === "object" && parsed[META_KEY]) return parsed[META_KEY];
  } catch (_) { /* not JSON, ignore */ }
  return { views: 0, helpful: 0, unhelpful: 0 };
};

const decorate = (article) => {
  if (!article) return article;
  const meta = readMeta(article);
  const firstStep = article.steps?.[0];
  return {
    ...article,
    title: article.name,
    body: firstStep?.content || "",
    views: meta.views || 0,
    helpful: meta.helpful || 0,
    unhelpful: meta.unhelpful || 0,
  };
};

const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, category } = req.query;
  const where = { orgId: req.orgId, category: category || "kb" };
  if (search) where.name = { contains: search, mode: "insensitive" };
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    prisma.playbook.findMany({ where, orderBy: { updatedAt: "desc" }, skip, take: Number(limit), include: { steps: true } }),
    prisma.playbook.count({ where }),
  ]);
  return response.paginated(res, items.map(decorate), total, page, limit);
});

const get = asyncHandler(async (req, res) => {
  const article = await prisma.playbook.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId }, include: { steps: true } });
  if (!article) throw new AppError("Article not found.", 404);
  const meta = readMeta(article);
  meta.views = (meta.views || 0) + 1;
  await prisma.playbook.update({
    where: { id: article.id },
    data: { description: JSON.stringify({ [META_KEY]: meta }) },
  });
  return response.success(res, decorate(article));
});

const create = asyncHandler(async (req, res) => {
  const { title, body, category = "kb", tags, isPublished = true } = req.body;
  if (!title) throw new AppError("title is required.", 400);
  if (!body) throw new AppError("body is required.", 400);
  const article = await prisma.playbook.create({
    data: {
      orgId: req.orgId,
      name: title,
      description: JSON.stringify({ [META_KEY]: { views: 0, helpful: 0, unhelpful: 0 } }),
      category,
      tags,
      isPublished,
      createdById: req.user.id,
      steps: { create: [{ title: "Content", content: body, type: "text", position: 0 }] },
    },
    include: { steps: true },
  });
  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "kb.create", entityType: "KBArticle", entityId: article.id, metadata: { title } });
  return response.created(res, decorate(article));
});

const update = asyncHandler(async (req, res) => {
  const { title, body, category, tags, isPublished } = req.body;
  const article = await prisma.playbook.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (!article) throw new AppError("Article not found.", 404);
  const data = {};
  if (title !== undefined) data.name = title;
  if (category !== undefined) data.category = category;
  if (tags !== undefined) data.tags = tags;
  if (isPublished !== undefined) data.isPublished = isPublished;
  if (body !== undefined) {
    await prisma.playbookStep.deleteMany({ where: { playbookId: article.id } });
    await prisma.playbookStep.create({
      data: { playbookId: article.id, title: "Content", content: body, type: "text", position: 0 },
    });
  }
  if (Object.keys(data).length) await prisma.playbook.update({ where: { id: article.id }, data });
  return response.success(res, { message: "Article updated." });
});

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.playbook.deleteMany({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (result.count === 0) throw new AppError("Article not found.", 404);
  return response.success(res, { message: "Article deleted." });
});

const vote = asyncHandler(async (req, res) => {
  const { helpful } = req.body;
  const article = await prisma.playbook.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (!article) throw new AppError("Article not found.", 404);
  const meta = readMeta(article);
  if (helpful) meta.helpful = (meta.helpful || 0) + 1;
  else meta.unhelpful = (meta.unhelpful || 0) + 1;
  await prisma.playbook.update({
    where: { id: article.id },
    data: { description: JSON.stringify({ [META_KEY]: meta }) },
  });
  return response.success(res, { message: "Vote recorded." });
});

const metrics = asyncHandler(async (req, res) => {
  const articles = await prisma.playbook.findMany({
    where: { orgId: req.orgId, category: "kb" },
    select: { id: true, isPublished: true, description: true },
  });
  const byCategory = { kb: 0 };
  let published = 0;
  let totalViews = 0;
  let totalHelpful = 0;
  for (const a of articles) {
    byCategory.kb += 1;
    if (a.isPublished) published++;
    const meta = readMeta({ description: a.description });
    totalViews += meta.views || 0;
    totalHelpful += meta.helpful || 0;
  }
  return response.success(res, { total: articles.length, published, byCategory, totalViews, totalHelpful });
});

module.exports = { list, get, create, update, remove, vote, metrics };
