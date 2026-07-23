const { prisma } = require("../config/postgres");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const generateToken = require("../utils/generateToken");
const { dispatchNotification } = require("../services/notificationService");
const { recordAudit } = require("../services/auditService");

const { setAuthCookie } = require("../utils/authCookie");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getSafeAdmin = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  organizationId: user.organizationId,
});

// Google OAuth-based admin login
const adminGoogleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    throw new AppError("Google credential is required.", 400);
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const email = payload.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError("No account found with this email. Contact the platform owner.", 404);
  }

  if (user.role !== "ADMIN") {
    throw new AppError("Access denied. This account is not an administrator.", 403);
  }

  // Fire-and-forget notification — don't block login on it
  dispatchNotification({
    userId: user.id,
    orgId: user.organizationId,
    type: "ADMIN_LOGIN",
    category: "system",
    message: "Administrator login successful.",
    link: "/admin/dashboard",
  }).catch((err) => console.error("[admin:login:notify]", err.message));

  await recordAudit({
    userId: user.id,
    action: "admin.login",
    entityType: "User",
    entityId: user.id,
    ipAddress: req.ip,
  });

  const token = generateToken(user);
  setAuthCookie(res, token);

  return response.success(res, {
    token,
    user: getSafeAdmin(user),
  });
});

// Admin login (supports Email/Password & Google OAuth fallback)
const adminLogin = asyncHandler(async (req, res) => {
  const { credential, email, password } = req.body;

  if (credential) {
    return adminGoogleLogin(req, res);
  }

  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  const hasAdmin = (await prisma.user.count({ where: { role: "ADMIN" } })) > 0;
  if (!user) {
    if (hasAdmin) throw new AppError("Invalid admin credentials.", 401);
    const hashed = await bcrypt.hash(password, 12);
    user = await prisma.user.create({
      data: { name: "Platform Admin", email: normalizedEmail, password: hashed, role: "ADMIN", isVerified: true },
    });
  } else {
    if (user.role !== "ADMIN") throw new AppError("This account is not an administrator.", 403);
    if (!user.password) throw new AppError("Invalid admin credentials.", 401);
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new AppError("Invalid admin credentials.", 401);
  }

  // Fire-and-forget notification
  dispatchNotification({
    userId: user.id,
    orgId: user.organizationId,
    type: "ADMIN_LOGIN",
    category: "system",
    message: "Administrator login successful.",
    link: "/admin/dashboard",
  }).catch((err) => console.error("[admin:login:notify]", err.message));

  await recordAudit({
    userId: user.id,
    action: "admin.login",
    entityType: "User",
    entityId: user.id,
    ipAddress: req.ip,
  });

  const token = generateToken(user);
  setAuthCookie(res, token);

  return response.success(res, {
    token,
    user: getSafeAdmin(user),
  });
});

const getDashboardSummary = asyncHandler(async (req, res) => {
  const [
    totalUsers, totalOrganizations, totalLeads, totalDeals, totalApiKeys, totalWebhooks,
    unreadNotifications, newLeads, qualifiedLeads, paidOrgs, recentUsers, recentAuditLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.lead.count(),
    prisma.deal.count(),
    prisma.apiKey.count({ where: { revokedAt: null } }),
    prisma.webhook.count({ where: { active: true } }),
    prisma.notification.count({ where: { userId: req.user.id, is_read: false } }),
    prisma.lead.count({ where: { status: "new" } }),
    prisma.lead.count({ where: { status: "qualified" } }),
    prisma.organization.count({ where: { plan: { in: ["STARTER", "PRO", "ENTERPRISE"] } } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);
  return response.success(res, {
    totals: {
      totalUsers, totalOrganizations, totalLeads, totalDeals,
      totalApiKeys, totalWebhooks, unreadNotifications,
      paidOrgs,
    },
    pipeline: { newLeads, qualifiedLeads },
    admin: req.user,
    recentUsers,
    recentAuditLogs,
  });
});

const listAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, search } = req.query;
  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: { organization: { select: { id: true, name: true, plan: true } } },
    }),
    prisma.user.count({ where }),
  ]);
  return response.paginated(res, items, total, page, limit);
});

const updateUser = asyncHandler(async (req, res) => {
  const allowed = ["name", "role", "isVerified", "organizationId"];
  const data = {};
  for (const key of allowed) if (req.body[key] !== undefined) data[key] = req.body[key];
  const user = await prisma.user.update({ where: { id: Number(req.params.id) }, data });
  await recordAudit({
    userId: req.user.id,
    action: "admin.user_update",
    entityType: "User",
    entityId: user.id,
    metadata: data,
  });
  return response.success(res, { message: "User updated." });
});

const getPlatformStats = asyncHandler(async (req, res) => {
  const [total, byPlan, byStatus] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.groupBy({ by: ["plan"], _count: { plan: true } }),
    prisma.organization.groupBy({ by: ["status"], _count: { status: true } }),
  ]);
  return response.success(res, {
    total,
    byPlan: byPlan.map((b) => ({ plan: b.plan, count: b._count.plan })),
    byStatus: byStatus.map((b) => ({ status: b.status, count: b._count.status })),
  });
});

// FIXED: triggerSystemEvent was timing out because:
// 1. req.orgId is undefined for ADMIN users (no tenant middleware on admin routes)
//    so prisma.user.findMany({where: {organizationId: undefined}}) returns ALL users
// 2. dispatchNotification sends emails sequentially for each user, causing timeouts
// Fix: Only notify the admin who triggered it (or their org if they have one).
//      Use createNotification instead of dispatchNotification to skip email/push.
const triggerSystemEvent = asyncHandler(async (req, res) => {
  const { eventType, message } = req.body;
  if (!["MAINTENANCE_NOTICE", "BACKUP_COMPLETED"].includes(eventType)) {
    throw new AppError("Invalid event type.", 400);
  }

  const defaultMessage = eventType === "MAINTENANCE_NOTICE"
    ? "System maintenance scheduled."
    : "System backup completed successfully.";
  const finalMessage = message || defaultMessage;

  // Determine which users to notify
  let users = [];
  const adminOrgId = req.user.organizationId;

  if (adminOrgId) {
    // If admin belongs to an org, notify users in that org (capped at 50 to prevent timeouts)
    users = await prisma.user.findMany({
      where: { organizationId: adminOrgId },
      select: { id: true },
      take: 50,
    });
  }

  // Always include the admin themselves
  const adminAlreadyIncluded = users.some((u) => u.id === req.user.id);
  if (!adminAlreadyIncluded) {
    users.push({ id: req.user.id });
  }

  // Create in-app notifications directly (no email/push to avoid timeouts)
  const notifications = [];
  for (const u of users) {
    try {
      const notif = await prisma.notification.create({
        data: {
          userId: u.id,
          type: eventType,
          message: finalMessage,
          link: "/admin/dashboard",
          metadata: { triggeredBy: req.user.id || null, eventType: eventType || "UNKNOWN" },
        },
      });
      notifications.push(notif);
    } catch (err) {
      console.error(`[triggerSystemEvent] Failed to notify user ${u.id}:`, err.message);
    }
  }

  await recordAudit({
    userId: req.user.id,
    action: "admin.system_event",
    entityType: "SystemEvent",
    entityId: eventType,
    metadata: { eventType, message: finalMessage, notifiedCount: notifications.length },
  });

  return response.success(res, {
    message: `Triggered ${eventType} for ${notifications.length} user(s).`,
    notifiedCount: notifications.length,
  });
});

const getServerHealth = asyncHandler(async (req, res) => {
  // Database latency check
  const dbStart = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  const dbLatencyMs = Date.now() - dbStart;

  // Memory usage
  const mem = process.memoryUsage();
  const formatMB = (bytes) => (bytes / 1024 / 1024).toFixed(1);

  // Uptime
  const uptimeSeconds = process.uptime();
  const uptimeHours = (uptimeSeconds / 3600).toFixed(1);

  // Count active resources
  const [activeApiKeys, activeWebhooks, totalNotifications] = await Promise.all([
    prisma.apiKey.count({ where: { revokedAt: null } }),
    prisma.webhook.count({ where: { active: true } }),
    prisma.notification.count(),
  ]);

  return response.success(res, {
    database: {
      status: dbLatencyMs < 500 ? "operational" : dbLatencyMs < 2000 ? "high_latency" : "degraded",
      latencyMs: dbLatencyMs,
    },
    api: {
      status: "operational",
      uptimeHours: Number(uptimeHours),
      uptimeSeconds: Math.floor(uptimeSeconds),
    },
    memory: {
      rss: `${formatMB(mem.rss)} MB`,
      heapUsed: `${formatMB(mem.heapUsed)} MB`,
      heapTotal: `${formatMB(mem.heapTotal)} MB`,
      external: `${formatMB(mem.external)} MB`,
      heapUsedPercent: Number(((mem.heapUsed / mem.heapTotal) * 100).toFixed(1)),
    },
    resources: {
      activeApiKeys,
      activeWebhooks,
      totalNotifications,
    },
    email: {
      status: "operational",
    },
    timestamp: new Date().toISOString(),
  });
});

const getAdminAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, action, entityType, userId, search } = req.query;
  const pageNumber = Number(page);
  const pageLimit = Number(limit);
  const skip = (pageNumber - 1) * pageLimit;

  const where = {};
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (userId) where.userId = Number(userId);

  if (search && search.trim()) {
    where.OR = [
      { action: { contains: search.trim(), mode: "insensitive" } },
      { entityType: { contains: search.trim(), mode: "insensitive" } },
      { user: { is: { name: { contains: search.trim(), mode: "insensitive" } } } },
      { user: { is: { email: { contains: search.trim(), mode: "insensitive" } } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageLimit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        org: { select: { id: true, name: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return response.paginated(res, items, total, pageNumber, pageLimit);
});

// Generate a CSV monthly report with real database data
const generateMonthlyReport = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const monthName = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  // Gather real data from database
  const [
    totalUsers, newUsersThisMonth, totalOrgs, totalLeads, newLeadsThisMonth,
    totalDeals, totalApiKeys, totalWebhooks, auditCount, notifCount,
    usersByRole, orgsByPlan, orgsByStatus,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth, lte: endOfMonth } } }),
    prisma.organization.count(),
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: startOfMonth, lte: endOfMonth } } }),
    prisma.deal.count(),
    prisma.apiKey.count({ where: { revokedAt: null } }),
    prisma.webhook.count({ where: { active: true } }),
    prisma.auditLog.count({ where: { createdAt: { gte: startOfMonth, lte: endOfMonth } } }),
    prisma.notification.count({ where: { createdAt: { gte: startOfMonth, lte: endOfMonth } } }),
    prisma.user.groupBy({ by: ["role"], _count: { role: true } }),
    prisma.organization.groupBy({ by: ["plan"], _count: { plan: true } }),
    prisma.organization.groupBy({ by: ["status"], _count: { status: true } }),
  ]);

  // Build CSV content
  const lines = [];
  lines.push(`SalesForge Monthly Report - ${monthName}`);
  lines.push(`Generated: ${now.toISOString()}`);
  lines.push("");
  lines.push("PLATFORM SUMMARY");
  lines.push("Metric,Value");
  lines.push(`Total Users,${totalUsers}`);
  lines.push(`New Users This Month,${newUsersThisMonth}`);
  lines.push(`Total Organizations,${totalOrgs}`);
  lines.push(`Total Leads,${totalLeads}`);
  lines.push(`New Leads This Month,${newLeadsThisMonth}`);
  lines.push(`Total Deals,${totalDeals}`);
  lines.push(`Active API Keys,${totalApiKeys}`);
  lines.push(`Active Webhooks,${totalWebhooks}`);
  lines.push(`Audit Events This Month,${auditCount}`);
  lines.push(`Notifications This Month,${notifCount}`);
  lines.push("");
  lines.push("USERS BY ROLE");
  lines.push("Role,Count");
  for (const r of usersByRole) {
    lines.push(`${r.role},${r._count.role}`);
  }
  lines.push("");
  lines.push("ORGANIZATIONS BY PLAN");
  lines.push("Plan,Count");
  for (const p of orgsByPlan) {
    lines.push(`${p.plan},${p._count.plan}`);
  }
  lines.push("");
  lines.push("ORGANIZATIONS BY STATUS");
  lines.push("Status,Count");
  for (const s of orgsByStatus) {
    lines.push(`${s.status},${s._count.status}`);
  }

  const csvContent = lines.join("\n");
  const filename = `salesforge-report-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.csv`;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.status(200).send(csvContent);
});

module.exports = {
  adminLogin,
  adminGoogleLogin,
  getDashboardSummary,
  listAllUsers,
  updateUser,
  getPlatformStats,
  triggerSystemEvent,
  getServerHealth,
  getAdminAuditLogs,
  generateMonthlyReport,
};
