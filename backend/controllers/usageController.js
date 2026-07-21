const { prisma } = require("../config/postgres");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { currentPeriod } = require("../utils/planLimits");
const { getPlan } = require("../utils/planLimits");

const summary = asyncHandler(async (req, res) => {
  const period = currentPeriod();
  const org = await prisma.organization.findUnique({ where: { id: req.orgId } });
  const plan = org?.plan || "FREE";
  const [counts, usageRecords] = await Promise.all([
    Promise.all([
      prisma.lead.count({ where: { orgId: req.orgId } }),
      prisma.user.count({ where: { organizationId: req.orgId } }),
      prisma.tag.count({ where: { orgId: req.orgId } }),
      prisma.apiKey.count({ where: { orgId: req.orgId, revokedAt: null } }),
      prisma.webhook.count({ where: { orgId: req.orgId } }),
      prisma.savedSearch.count({ where: { orgId: req.orgId } }),
    ]),
    prisma.usageRecord.findMany({ where: { orgId: req.orgId, period } }),
  ]);
  const limits = getPlan(plan);
  const usage = {};
  for (const resource of Object.keys(limits)) {
    // Sum every matching record for this resource (across all org members),
    // instead of .find() which only grabbed the first user's count.
    const used = usageRecords
      .filter((r) => r.resource === resource)
      .reduce((sum, r) => sum + r.count, 0);
    usage[resource] = { used, limit: limits[resource] };
  }
  return response.success(res, {
    period,
    plan,
    counts: {
      leads: counts[0],
      members: counts[1],
      tags: counts[2],
      apiKeys: counts[3],
      webhooks: counts[4],
      savedSearches: counts[5],
    },
    usage,
  });
});

const history = asyncHandler(async (req, res) => {
  const { resource, period } = req.query;
  const where = { orgId: req.orgId };
  if (resource) where.resource = resource;
  if (period) where.period = period;
  const items = await prisma.usageRecord.findMany({
    where,
    orderBy: [{ period: "desc" }, { resource: "asc" }],
    take: 200,
  });
  return response.success(res, items);
});

module.exports = { summary, history };
