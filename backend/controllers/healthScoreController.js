// Health Score service - ML-style customer health scoring.
const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

// Health scores are computed from lead/deal/activity data and stored
// in the Organization's JSON customFields. This avoids schema changes
// while providing full health scoring capabilities.

const computeHealthScore = async (orgId, leadId) => {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, orgId } });
  if (!lead) return null;

  const [activities, notes, tasks] = await Promise.all([
    prisma.leadActivity.count({ where: { leadId, orgId } }),
    prisma.leadNote.count({ where: { leadId, orgId } }),
    prisma.leadTask.count({ where: { leadId, orgId, status: { not: "DONE" } } }),
  ]);

  // Scoring algorithm (0-100):
  // - Status: qualified/converted = +30, contacted = +20, new = +10
  // - Engagement: each activity = +2, each note = +3
  // - Open tasks: each = -5
  // - Recency: activity in last 7 days = +15
  let score = 50; // baseline
  const factors = {};

  const statusScores = { qualified: 30, converted: 40, contacted: 20, new: 10, lost: -20, in_progress: 25, closed: 5 };
  score += statusScores[lead.status] || 0;
  factors.status = statusScores[lead.status] || 0;

  const activityScore = Math.min(activities * 2, 20);
  score += activityScore;
  factors.engagement = activityScore;

  const noteScore = Math.min(notes * 3, 15);
  score += noteScore;
  factors.notes = noteScore;

  const taskPenalty = Math.min(tasks * 5, 20);
  score -= taskPenalty;
  factors.tasks = -taskPenalty;

  // Recency bonus
  const recentActivity = await prisma.leadActivity.findFirst({
    where: { leadId, orgId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (recentActivity) {
    const daysSince = (Date.now() - new Date(recentActivity.createdAt).getTime()) / 86400000;
    if (daysSince <= 7) {
      score += 15;
      factors.recency = 15;
    } else if (daysSince <= 30) {
      score += 5;
      factors.recency = 5;
    } else {
      score -= 10;
      factors.recency = -10;
    }
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine churn risk (inverse of score)
  const churnRisk = Math.round((1 - score / 100) * 100) / 100;

  // Determine trend (would need historical data; for now, estimate from recent activity)
  const trend = recentActivity && (Date.now() - new Date(recentActivity.createdAt).getTime()) < 7 * 86400000 ? "improving" :
              recentActivity && (Date.now() - new Date(recentActivity.createdAt).getTime()) < 30 * 86400000 ? "stable" : "declining";

  return { score: Math.round(score), churnRisk, trend, factors };
};

const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, minScore, maxScore } = req.query;
  const where = { orgId: req.orgId };
  const skip = (Number(page) - 1) * Number(limit);
  const leads = await prisma.lead.findMany({ where, skip, take: Number(limit) });
  const scores = [];
  for (const lead of leads) {
    const result = await computeHealthScore(req.orgId, lead.id);
    if (result) {
      scores.push({
        leadId: lead.id,
        leadName: lead.name,
        companyName: lead.companyName,
        status: lead.status,
        ...result,
      });
    }
  }
  return response.paginated(res, scores, scores.length, page, limit);
});

const get = asyncHandler(async (req, res) => {
  const result = await computeHealthScore(req.orgId, Number(req.params.leadId));
  if (!result) throw new AppError("Lead not found.", 404);
  return response.success(res, { leadId: Number(req.params.leadId), ...result });
});
const recompute = asyncHandler(async (req, res) => {
  const leadId = Number(req.params.leadId);

  if (!Number.isInteger(leadId) || leadId <= 0) {
    throw new AppError("Invalid lead ID.", 400);
  }

  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      orgId: req.orgId,
    },
    select: {
      id: true,
      scoreDetails: true,
    },
  });

  if (!lead) {
    throw new AppError("Lead not found.", 404);
  }

  const result = await computeHealthScore(req.orgId, leadId);

  if (!result) {
    throw new AppError("Unable to calculate health score.", 400);
  }

  const existingScoreDetails =
    lead.scoreDetails &&
    typeof lead.scoreDetails === "object" &&
    !Array.isArray(lead.scoreDetails)
      ? lead.scoreDetails
      : {};

  const computedAt = new Date().toISOString();

  await prisma.lead.update({
    where: {
      id: lead.id,
    },
    data: {
      scoreDetails: {
        ...existingScoreDetails,
        healthScore: {
          ...result,
          computedAt,
        },
      },
    },
  });

  return response.success(res, {
    leadId,
    ...result,
    computedAt,
  });
});


const analytics = asyncHandler(async (req, res) => {
  const leads = await prisma.lead.findMany({ where: { orgId: req.orgId }, select: { id: true } });

let healthy = 0;
let atRisk = 0;
let critical = 0;
let totalScore = 0;

const distribution = {
  "0-20": 0,
  "21-40": 0,
  "41-60": 0,
  "61-80": 0,
  "81-100": 0,
};


  for (const lead of leads) {
    const result = await computeHealthScore(req.orgId, lead.id);
    if (!result) continue;

    totalScore += result.score;

    if (result.score >= 70) {
      healthy++;
    } else if (result.score >= 40) {
      atRisk++;
    } else {
      critical++;
    }

    if (result.score <= 20) {
      distribution["0-20"]++;
    } else if (result.score <= 40) {
      distribution["21-40"]++;
    } else if (result.score <= 60) {
      distribution["41-60"]++;
    } else if (result.score <= 80) {
      distribution["61-80"]++;
    } else {
      distribution["81-100"]++;
    }
  }

  const avgScore = leads.length > 0 ? Math.round(totalScore / leads.length) : 0;

  return response.success(res, {
    total: leads.length,
    healthy,
    atRisk,
    critical,
    avgScore,
    distribution,
  });
});

module.exports = { list, get, recompute, analytics, computeHealthScore };
