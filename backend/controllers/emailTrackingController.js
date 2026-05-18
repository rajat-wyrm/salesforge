const crypto = require("crypto");
const { prisma } = require("../config/postgres");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { recordAudit } = require("../services/auditService");

// 1x1 transparent GIF for email open tracking
const TRANSPARENT_GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

const trackOpen = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  await prisma.emailEvent.create({
    data: {
      type: "OPENED",
      recipient: req.query.to || "unknown",
      messageId,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    },
  }).catch(() => {});
  res.set({
    "Content-Type": "image/gif",
    "Content-Length": TRANSPARENT_GIF.length,
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
  });
  res.send(TRANSPARENT_GIF);
});

const trackClick = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { url, label } = req.query;
  await prisma.emailEvent.create({
    data: {
      type: "CLICKED",
      recipient: req.query.to || "unknown",
      messageId,
      link: url,
      linkLabel: label,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    },
  }).catch(() => {});
  if (url) return res.redirect(url);
  return response.success(res, { tracked: true });
});

const logEvent = asyncHandler(async (req, res) => {
  const { type, recipient, subject, messageId, metadata } = req.body;
  const event = await prisma.emailEvent.create({
    data: {
      orgId: req.orgId,
      type: type || "SENT",
      recipient, subject: subject || null,
      messageId: messageId || null,
      metadata: metadata || null,
    },
  });
  return response.created(res, event);
});

const listEvents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, type, recipient } = req.query;
  const where = { orgId: req.orgId };
  if (type) where.type = type;
  if (recipient) where.recipient = { contains: recipient, mode: "insensitive" };
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    prisma.emailEvent.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: Number(limit) }),
    prisma.emailEvent.count({ where }),
  ]);
  return response.paginated(res, items, total, page, limit);
});

const analytics = asyncHandler(async (req, res) => {
  const [byType, topRecipients, totalSent, totalOpened, totalClicked] = await Promise.all([
    prisma.emailEvent.groupBy({ by: ["type"], where: { orgId: req.orgId }, _count: { type: true } }),
    prisma.$queryRaw`SELECT recipient, COUNT(*)::int as total, SUM(CASE WHEN type = 'OPENED' THEN 1 ELSE 0 END)::int as opens FROM "email_events" WHERE "orgId" = ${req.orgId} AND recipient != 'unknown' GROUP BY recipient ORDER BY total DESC LIMIT 20`,
    prisma.emailEvent.count({ where: { orgId: req.orgId, type: "SENT" } }),
    prisma.emailEvent.count({ where: { orgId: req.orgId, type: "OPENED" } }),
    prisma.emailEvent.count({ where: { orgId: req.orgId, type: "CLICKED" } }),
  ]);
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const clickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;
  return response.success(res, {
    byType: byType.map((b) => ({ type: b.type, count: b._count.type })),
    topRecipients,
    totalSent, totalOpened, totalClicked, openRate, clickRate,
  });
});

// Generate tracking URLs for an email campaign
const generateTracking = (orgId, messageId, recipientEmail, links = []) => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const apiUrl = process.env.API_URL || "http://localhost:3000";
  const openUrl = `${apiUrl}/api/email-tracking/open/${messageId}?to=${encodeURIComponent(recipientEmail)}`;
  const trackedLinks = links.map((link) => ({
    label: link.label || link.url,
    url: `${apiUrl}/api/email-tracking/click/${messageId}?url=${encodeURIComponent(link.url)}&to=${encodeURIComponent(recipientEmail)}&label=${encodeURIComponent(link.label || "")}`,
  }));
  return { openUrl, trackedLinks };
};

module.exports = { trackOpen, trackClick, logEvent, listEvents, analytics, generateTracking };
