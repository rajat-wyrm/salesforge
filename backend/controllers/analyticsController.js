const { prisma } = require("../config/postgres");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { AppError } = require("../middleware/errorHandler");
const { createNotification } = require("../services/notificationService");
const { recordAudit } = require("../services/auditService");
const { publish } = require("../services/webhookService");

const buildInsights = (metrics, recent = {}) => {
  const insights = [];
  const { leads, searches, notifications } = metrics;
  const { totalLeads = 0, qualified = 0 } = leads || {};

  if (totalLeads > 0 && qualified / totalLeads >= 0.35) {
    insights.push({
      type: "positive",
      title: "Strong qualified-lead ratio",
      body: `${Math.round((qualified / totalLeads) * 100)}% of your leads are qualified. Consider focusing on closing them.`,
    });
  }
  if ((searches?.total || 0) === 0) {
    insights.push({
      type: "warning",
      title: "Search tools are idle",
      body: "Try the email, domain, and social search tools to discover new leads.",
    });
  }
  if ((notifications?.unread || 0) > 5) {
    insights.push({
      type: "info",
      title: "Pending notifications",
      body: "You have unread notifications that may need attention.",
    });
  }
  if (recent?.newLeads7d === 0) {
    insights.push({
      type: "warning",
      title: "No new leads this week",
      body: "It's been 7 days since a new lead was added. Run a discovery campaign.",
    });
  }
  if (insights.length === 0) {
    insights.push({
      type: "info",
      title: "All metrics look healthy",
      body: "Keep up the consistent lead flow and search activity.",
    });
  }
  return insights;
};

const getGlobalAnalytics = asyncHandler(async (req, res) => {
  const orgId = req.orgId;
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [
    totalLeads, totalMembers, totalOrganizations, totalDeals, unreadNotifications,
    newLeads, qualifiedLeads, convertedLeads, lostLeads,
    leadsByStatus, leadsBySource, emailSearches, domainSearches, socialSearches,
    newLeads7d, recentLeads,
  ] = await Promise.all([
    prisma.lead.count({ where: { orgId } }),
    prisma.user.count({ where: { organizationId: orgId } }),
    1, // single-tenant
    prisma.deal.count(),
    prisma.notification.count({ where: { userId: req.user.id, is_read: false } }),
    prisma.lead.count({ where: { orgId, status: "new" } }),
    prisma.lead.count({ where: { orgId, status: "qualified" } }),
    prisma.lead.count({ where: { orgId, status: "converted" } }),
    prisma.lead.count({ where: { orgId, status: "lost" } }),
    prisma.lead.groupBy({ by: ["status"], where: { orgId }, _count: { status: true } }),
    prisma.lead.groupBy({ by: ["source"], where: { orgId }, _count: { source: true } }),
    prisma.emailSearch.count({ where: { orgId } }),
    prisma.domainSearch.count({ where: { orgId } }),
    prisma.analyticsEvent.count({ where: { orgId, type: "SOCIAL_SEARCH" } }),
    prisma.lead.count({ where: { orgId, createdAt: { gte: since } } }),
    prisma.lead.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, status: true, score: true, createdAt: true },
    }),
  ]);

  return response.success(res, {
    totals: {
      leads: totalLeads,
      members: totalMembers,
      organizations: totalOrganizations,
      deals: totalDeals,
      unreadNotifications,
    },
    pipeline: { new: newLeads, qualified: qualifiedLeads, converted: convertedLeads, lost: lostLeads },
    leads: {
      byStatus: leadsByStatus.map((b) => ({ status: b.status, count: b._count.status })),
      bySource: leadsBySource.map((b) => ({ source: b.source, count: b._count.source })),
    },
    searches: {
      email: emailSearches,
      domain: domainSearches,
      social: socialSearches,
      total: emailSearches + domainSearches + socialSearches,
    },
    trends: { newLeads7d },
    recentLeads,
  });
});

const getMyAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const orgId = req.orgId;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [myLeads, qualifiedLeads, myNotifications, myUnread, mySearches, myRecent] = await Promise.all([
    prisma.lead.count({ where: { orgId, addedById: userId } }),
    prisma.lead.count({ where: { orgId, addedById: userId, status: "qualified" } }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, is_read: false } }),
    prisma.analyticsEvent.count({ where: { orgId, userId } }),
    prisma.lead.findMany({
      where: { orgId, addedById: userId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);
  return response.success(res, {
    leads: { total: myLeads, qualified: qualifiedLeads },
    notifications: { total: myNotifications, unread: myUnread },
    searches: { total: mySearches },
    recentLeads: myRecent,
  });
});

const getAIAnalytics = asyncHandler(async (req, res) => {
  const orgId = req.orgId;
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [total, qualified, searchTotal, unread, myLeads, newLeads7d] = await Promise.all([
    prisma.lead.count({ where: { orgId } }),
    prisma.lead.count({ where: { orgId, status: "qualified" } }),
    prisma.analyticsEvent.count({ where: { orgId } }),
    prisma.notification.count({ where: { userId: req.user.id, is_read: false } }),
    prisma.lead.count({ where: { orgId, addedById: req.user.id } }),
    prisma.lead.count({ where: { orgId, createdAt: { gte: since } } }),
  ]);
  const insights = buildInsights(
    {
      leads: { total, qualified },
      searches: { total: searchTotal },
      notifications: { unread },
    },
    { newLeads7d },
  );
  return response.success(res, { insights, metrics: { total, qualified, searchTotal, unread, myLeads, newLeads7d } });
});

const getFunnel = asyncHandler(async (req, res) => {
  const orgId = req.orgId;
  const stages = ["new", "contacted", "qualified", "in_progress", "converted", "closed", "lost"];
  const counts = await Promise.all(
    stages.map((status) => prisma.lead.count({ where: { orgId, status } })),
  );
  return response.success(res, { stages, counts });
});

const getTimeSeries = asyncHandler(async (req, res) => {
  const orgId = req.orgId;
  const days = Math.min(Math.max(Number(req.query.days || 30), 1), 180);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const leads = await prisma.lead.findMany({
    where: { orgId, createdAt: { gte: since } },
    select: { createdAt: true, status: true, source: true },
  });
  const buckets = new Map();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { date: key, total: 0, qualified: 0, converted: 0 });
  }
  for (const lead of leads) {
    const key = lead.createdAt.toISOString().slice(0, 10);
    const b = buckets.get(key);
    if (!b) continue;
    b.total += 1;
    if (lead.status === "qualified") b.qualified += 1;
    if (lead.status === "converted") b.converted += 1;
  }
  return response.success(res, Array.from(buckets.values()));
});

module.exports = { getGlobalAnalytics, getMyAnalytics, getAIAnalytics, getFunnel, getTimeSeries };
