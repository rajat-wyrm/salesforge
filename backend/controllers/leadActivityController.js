const { prisma } = require("../config/postgres");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { diffLead, summarizeChanges, recordActivity } = require("../services/leadActivityService");

const ensureLeadInOrg = async (leadId, orgId) => {
  const lead = await prisma.lead.findFirst({ where: { id: Number(leadId), orgId } });
  if (!lead) return null;
  return lead;
};

const list = asyncHandler(async (req, res) => {
  const lead = await ensureLeadInOrg(req.params.leadId, req.orgId);
  if (!lead) return response.error(res, "Lead not found.", 404);
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    prisma.leadActivity.findMany({
      where: { leadId: lead.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.leadActivity.count({ where: { leadId: lead.id } }),
  ]);
  return response.paginated(res, items, total, page, limit);
});

const recordStatusChange = async (leadId, userId, orgId, from, to) => {
  await recordActivity({
    leadId,
    userId,
    orgId,
    type: "STATUS_CHANGED",
    title: `Status changed: ${from} → ${to}`,
    metadata: { from, to },
  });
};

const recordAssignment = async (leadId, userId, orgId, assigneeName) => {
  await recordActivity({
    leadId,
    userId,
    orgId,
    type: "ASSIGNED",
    title: `Assigned to ${assigneeName}`,
  });
};

const recordScoreChange = async (leadId, userId, orgId, before, after) => {
  await recordActivity({
    leadId,
    userId,
    orgId,
    type: "SCORE_CHANGED",
    title: `Score: ${before} → ${after}`,
    metadata: { before, after },
  });
};

module.exports = { list, recordStatusChange, recordAssignment, recordScoreChange, diffLead, summarizeChanges };
