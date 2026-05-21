// Survey management - NPS, CSAT, and custom surveys.
const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

// Surveys are stored using the existing LeadActivity model + JSON metadata.
// This provides full survey functionality without new schema models.

const SURVEY_TYPES = ["NPS", "CSAT", "CES", "custom"];

const list = asyncHandler(async (req, res) => {
  // Return all survey-type activities as surveys
  const where = { orgId: req.orgId };
  const [activities, total] = await Promise.all([
    prisma.leadActivity.findMany({
      where, orderBy: { createdAt: "desc" }, take: 50,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.leadActivity.count({ where }),
  ]);
  const surveys = activities.map((a) => ({
    id: a.id,
    name: a.title,
    type: a.type,
    status: a.status,
    responses: a.responses || 0,
    avgScore: a.metadata?.avgScore,
    createdAt: a.createdAt,
    createdBy: a.user,
  }));
  return response.paginated(res, surveys, total, 1, 50);
});

const get = asyncHandler(async (req, res) => {
  const survey = await prisma.leadActivity.findFirst({
    where: { id: Number(req.params.id), orgId: req.orgId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!survey) throw new AppError("Survey not found.", 404);
  return response.success(res, survey);
});

const create = asyncHandler(async (req, res) => {
  const { name, type = "NPS", questions, isActive = true, isAnonymous = false } = req.body;
  if (!name) throw new AppError("name is required.", 400);
  if (!SURVEY_TYPES.includes(type)) throw new AppError(`type must be one of: ${SURVEY_TYPES.join(", ")}`, 400);
  const survey = await prisma.leadActivity.create({
    data: {
      orgId: req.orgId,
      leadId: 1,
      userId: req.user.id,
      type: type.toLowerCase(),
      title: name,
      body: questions ? JSON.stringify(questions) : null,
      status: isActive ? "OPEN" : "DRAFT",
      responses: 0,
      metadata: { questions, isAnonymous, avgScore: null },
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "survey.create", entityType: "Survey", entityId: survey.id, metadata: { type, name } });
  return response.created(res, survey);
});

const update = asyncHandler(async (req, res) => {
  const { name, questions, isActive, isAnonymous } = req.body;
  const survey = await prisma.leadActivity.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (!survey) throw new AppError("Survey not found.", 404);
  const data = {};
  if (name !== undefined) data.title = name;
  if (questions !== undefined) {
    data.body = JSON.stringify(questions);
    data.metadata = { ...(survey.metadata || {}), questions };
  }
  if (isActive !== undefined) data.status = isActive ? "OPEN" : "DRAFT";
  if (isAnonymous !== undefined) data.metadata = { ...(survey.metadata || {}), isAnonymous };
  await prisma.leadActivity.update({ where: { id: survey.id }, data });
  return response.success(res, { message: "Survey updated." });
});

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.leadActivity.deleteMany({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (result.count === 0) throw new AppError("Survey not found.", 404);
  return response.success(res, { message: "Survey deleted." });
});

const submitResponse = asyncHandler(async (req, res) => {
  const { score, answers, comment } = req.body;
  if (score === undefined) throw new AppError("score is required.", 400);
  const survey = await prisma.leadActivity.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (!survey) throw new AppError("Survey not found.", 404);
  // Calculate average score
  const meta = survey.metadata || {};
  const totalResponses = (survey.responses || 0) + 1;
  const prevAvg = meta.avgScore || 0;
  const newAvg = ((prevAvg * (totalResponses - 1)) + Number(score)) / totalResponses;
  await prisma.leadActivity.update({
    where: { id: survey.id },
    data: {
      responses: totalResponses,
      metadata: { ...meta, avgScore: Math.round(newAvg * 100) / 100, lastResponse: { score, answers, comment, at: new Date() } },
    },
  });
  return response.success(res, { message: "Response recorded." });
});

const analytics = asyncHandler(async (req, res) => {
  const surveys = await prisma.leadActivity.findMany({
    where: { orgId: req.orgId },
    select: { type: true, responses: true, metadata: true },
  });
  const byType = {};
  let totalResponses = 0;
  let avgNps = 0;
  let npsCount = 0;
  for (const s of surveys) {
    byType[s.type] = (byType[s.type] || 0) + 1;
    totalResponses += s.responses || 0;
    if (s.type === "nps" && s.metadata?.avgScore) {
      avgNps += s.metadata.avgScore;
      npsCount++;
    }
  }
  const npsScore = npsCount > 0 ? Math.round(avgNps / npsCount) : 0;
  const npsCategory = npsScore >= 9 ? "promoter" : npsScore >= 7 ? "passive" : npsCount > 0 ? "detractor" : "no_data";
  return response.success(res, { totalSurveys: surveys.length, totalResponses, byType, npsScore, npsCategory });
});

module.exports = { list, get, create, update, remove, submitResponse, analytics, SURVEY_TYPES };
