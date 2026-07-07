// AI Lead Scoring - intelligent lead scoring with explainable factors.
const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

// AI lead scoring uses a weighted algorithm based on data signals.
// In production, this would connect to a real ML model (TensorFlow, PyTorch, etc.)
// For now, we use a sophisticated rule-based system that mimics ML behavior.

const scoreLead = async (orgId, leadId) => {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, orgId } });
  if (!lead) return null;

  const factors = {};
  let score = 0;

  // 1. Data completeness (0-20 points)
  let completeness = 0;
  if (lead.email) completeness += 5;
  if (lead.phone) completeness += 3;
  if (lead.companyName) completeness += 5;
  if (lead.jobTitle) completeness += 3;
  if (lead.industry) completeness += 2;
  if (lead.companySize) completeness += 2;
  score += completeness;
  factors.dataCompleteness = { value: completeness, max: 20 };

  // 2. Company size signal (0-15 points)
  const sizeScores = { "1000+": 15, "501-1000": 12, "201-500": 10, "51-200": 7, "11-50": 4, "1-10": 2 };
  const sizeScore = sizeScores[lead.companySize] || 0;
  score += sizeScore;
  factors.companySize = { value: sizeScore, signal: lead.companySize || "unknown" };

  // 3. Seniority signal (0-15 points)
  const seniorityScores = { "CEO": 15, "CTO": 14, "CFO": 14, "VP": 12, "Director": 10, "Manager": 7, "Senior": 5, "Junior": 2 };
  const jobTitle = (lead.jobTitle || "").toLowerCase();
  let seniorityScore = 0;
  for (const [key, val] of Object.entries(seniorityScores)) {
    if (jobTitle.includes(key.toLowerCase())) { seniorityScore = val; break; }
  }
  score += seniorityScore;
  factors.seniority = { value: seniorityScore, signal: lead.jobTitle || "unknown" };

  // 4. Industry fit (0-10 points)
  const goodIndustries = ["SaaS", "Technology", "Fintech", "Financial Services"];
  const industryScore = goodIndustries.includes(lead.industry) ? 10 : lead.industry ? 5 : 0;
  score += industryScore;
  factors.industry = { value: industryScore, signal: lead.industry || "unknown" };

  // 5. Engagement signal (0-20 points)
  const [activities, emails] = await Promise.all([
    prisma.leadActivity.count({ where: { leadId, orgId } }),
    prisma.leadNote.count({ where: { leadId, orgId } }),
  ]);
  const engagementScore = Math.min(activities * 2 + emails * 3, 20);
  score += engagementScore;
  factors.engagement = { value: engagementScore, activities, emails };

  // 6. Source quality (0-10 points)
  const sourceScores = { referral: 10, "partner": 8, "trade_show": 7, "website": 5, "social_media": 4, "email_campaign": 6, "cold_call": 3, "other": 1 };
  const sourceScore = sourceScores[lead.source] || 1;
  score += sourceScore;
  factors.source = { value: sourceScore, signal: lead.source || "unknown" };

  // 7. Existing score (carry over)
  if (lead.score > 0) {
    score = Math.round((score + lead.score) / 2);
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // Determine grade
  let grade = "F";
  if (score >= 80) grade = "A";
  else if (score >= 60) grade = "B";
  else if (score >= 40) grade = "C";
  else if (score >= 20) grade = "D";

  // Generate recommendation
  let recommendation = "Low priority. Enrich data before outreach.";
  if (score >= 80) recommendation = "Hot lead! Reach out immediately with personalized pitch.";
  else if (score >= 60) recommendation = "Qualified. Schedule a discovery call within 48 hours.";
  else if (score >= 40) recommendation = "Warm. Add to nurture campaign and monitor engagement.";
  else if (score >= 20) recommendation = "Cold. Qualify further before investing time.";

  return { score, grade, recommendation, factors };
};

const scoreOne = asyncHandler(async (req, res) => {
  const result = await scoreLead(req.orgId, Number(req.params.id));
  if (!result) throw new AppError("Lead not found.", 404);
  // Store the score
  await prisma.lead.update({ where: { id: Number(req.params.id) }, data: { score: result.score } });
  await recordAudit({ userId: req.user.id, orgId: req.orgId, action: "ai.score", entityType: "Lead", entityId: Number(req.params.id), metadata: { score: result.score, grade: result.grade } });
  return response.success(res, { leadId: Number(req.params.id), ...result });
});

const scoreBatch = asyncHandler(async (req, res) => {
  const { leadIds } = req.body;
  if (!Array.isArray(leadIds)) throw new AppError("leadIds must be an array.", 400);
  const results = [];
  for (const id of leadIds) {
    const result = await scoreLead(req.orgId, id);
    if (result) {
      await prisma.lead.update({ where: { id }, data: { score: result.score } });
      results.push({ leadId: id, ...result });
    }
  }
  return response.success(res, { scored: results.length, results });
});

const scoreAll = asyncHandler(async (req, res) => {
  const leads = await prisma.lead.findMany({ where: { orgId: req.orgId }, select: { id: true } });
  let scored = 0;
  const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const lead of leads) {
    const result = await scoreLead(req.orgId, lead.id);
    if (result) {
      await prisma.lead.update({ where: { id: lead.id }, data: { score: result.score } });
      distribution[result.grade]++;
      scored++;
    }
  }
  return response.success(res, { scored, total: leads.length, distribution });
});

const insights = asyncHandler(async (req, res) => {
  const orgId = req.orgId;
  const leads = await prisma.lead.findMany({ where: { orgId } });
  
  const hot = leads.filter((l) => l.score >= 80);
  const warm = leads.filter((l) => l.score >= 40 && l.score < 80);
  const scoredCount = leads.filter((l) => l.score > 0).length;

  const summary = scoredCount > 0 
    ? `Analyzed ${scoredCount} scored leads. Your pipeline has ${hot.length} high-priority hot leads and ${warm.length} warm leads.`
    : "No lead scoring data available. Run scoring to analyze your pipeline.";

  const factors = [
    { factor: "Engagement Activities", weight: 0.20 },
    { factor: "Profile Completeness", weight: 0.20 },
    { factor: "Job Seniority Fit", weight: 0.15 },
    { factor: "Company Scale Fit", weight: 0.15 },
    { factor: "Target Industry Fit", weight: 0.10 },
    { factor: "Lead Source Quality", weight: 0.10 }
  ];

  const topLeads = await prisma.lead.findMany({
    where: { orgId, score: { gt: 0 } },
    orderBy: { score: "desc" },
    take: 5,
    select: { id: true, name: true, score: true }
  });

  return response.success(res, {
    summary,
    factors,
    topLeads
  });
});

module.exports = { scoreOne, scoreBatch, scoreAll, insights, scoreLead };
