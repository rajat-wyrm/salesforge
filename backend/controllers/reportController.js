const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");

const list = asyncHandler(async (req, res) => {
  const items = await prisma.report.findMany({ where: { orgId: req.orgId }, orderBy: { updatedAt: "desc" } });
  return response.success(res, items);
});

const get = asyncHandler(async (req, res) => {
  const r = await prisma.report.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (!r) throw new AppError("Report not found.", 404);
  return response.success(res, r);
});

const create = asyncHandler(async (req, res) => {
  const { name, description, type, config, schedule, isShared } = req.body;
  if (!name || !type) throw new AppError("name and type are required.", 400);
  const r = await prisma.report.create({
    data: { orgId: req.orgId, userId: req.user.id, name, description: description || null, type, config: config || {}, schedule: schedule || null, isShared: !!isShared },
  });
  return response.created(res, r);
});

const update = asyncHandler(async (req, res) => {
  const data = {};
  ["name", "description", "config", "schedule", "isShared"].forEach((k) => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  const result = await prisma.report.updateMany({ where: { id: Number(req.params.id), orgId: req.orgId }, data });
  if (result.count === 0) throw new AppError("Report not found.", 404);
  return response.success(res, { message: "Report updated." });
});

const remove = asyncHandler(async (req, res) => {
  const result = await prisma.report.deleteMany({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (result.count === 0) throw new AppError("Report not found.", 404);
  return response.success(res, { message: "Report deleted." });
});

const TEMPLATES = [
  { id: "leads-by-source", name: "Leads by Source", type: "leads", description: "Breakdown of leads by acquisition source." },
  { id: "conversion-funnel", name: "Conversion Funnel", type: "performance", description: "Lead-to-deal conversion rates by stage." },
  { id: "deal-velocity", name: "Deal Velocity", type: "deals", description: "Average time deals spend in each stage." },
  { id: "team-performance", name: "Team Performance", type: "performance", description: "Leads, deals, and activities by team member." },
  { id: "email-engagement", name: "Email Engagement", type: "performance", description: "Open and click rates across all emails sent." },
  { id: "lost-deals", name: "Lost Deals Analysis", type: "deals", description: "Why deals are being lost and from which stage." },
];

const run = asyncHandler(async (req, res) => {
  const r = await prisma.report.findFirst({ where: { id: Number(req.params.id), orgId: req.orgId } });
  if (!r) throw new AppError("Report not found.", 404);
  const data = await runReport(r.type, req.orgId, r.config);
  await prisma.report.update({ where: { id: r.id }, data: { lastRunAt: new Date() } });
  return response.success(res, { report: r, data, ranAt: new Date() });
});

const runReport = async (type, orgId, config = {}) => {
  if (type === "leads") {
    const [bySource, byStatus, total] = await Promise.all([
      prisma.lead.groupBy({ by: ["source"], where: { orgId }, _count: { source: true } }),
      prisma.lead.groupBy({ by: ["status"], where: { orgId }, _count: { status: true } }),
      prisma.lead.count({ where: { orgId } }),
    ]);
    return { type, total, bySource, byStatus };
  }
  if (type === "deals") {
    const [byStage, totals] = await Promise.all([
      prisma.deal.groupBy({ by: ["stageId"], where: { orgId }, _sum: { amount: true }, _count: { stageId: true } }),
      prisma.deal.aggregate({ where: { orgId }, _sum: { amount: true }, _avg: { amount: true }, _count: { _all: true } }),
    ]);
    return { type, totals, byStage };
  }
  if (type === "performance") {
    const byUser = await prisma.user.findMany({
      where: { organizationId: orgId },
      select: {
        id: true, name: true, email: true,
        _count: { select: { leadsAdded: true, activities: true } },
      },
    });
    return { type, byUser };
  }
  if (type === "activities") {
    const byKind = await prisma.activity.groupBy({ by: ["kind"], where: { orgId }, _count: { kind: true } });
    return { type, byKind };
  }
  return { type, message: "Unknown report type" };
};

module.exports = { list, get, create, update, remove, run, runReport, TEMPLATES };
