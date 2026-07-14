const { prisma } = require("../config/postgres");
const bcrypt = require("bcryptjs");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const generateToken = require("../utils/generateToken");
const { createNotification } = require("../services/notificationService");
const { recordAudit } = require("../services/auditService");
const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getSafeAdmin = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  organizationId: user.organizationId,
});

const adminLogin = asyncHandler(async (req, res) => {
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

  let user = await prisma.user.findUnique({ where: { email } });
  const hasAdmin = (await prisma.user.count({ where: { role: "ADMIN" } })) > 0;

  if (!user) {
    if (hasAdmin) throw new AppError("Invalid admin credentials.", 401);
    
    // First admin setup via Google Login
    const randomPassword = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
    user = await prisma.user.create({
      data: { 
        name: payload.name || "Platform Admin", 
        email, 
        password: randomPassword, 
        role: "ADMIN", 
        isVerified: true,
      },
    });
  } else {
    if (user.role !== "ADMIN") throw new AppError("This account is not an administrator.", 403);
  }

  await createNotification({
    userId: user.id,
    type: "ADMIN_LOGIN",
    message: "Administrator login successful.",
    link: "/admin/dashboard",
  });
  await recordAudit({
    userId: user.id,
    action: "admin.login",
    entityType: "User",
    entityId: user.id,
    ipAddress: req.ip,
  });

  return response.success(res, { token: generateToken(user), user: getSafeAdmin(user) });
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

module.exports = {
  adminLogin,
  getDashboardSummary,
  listAllUsers,
  updateUser,
  getPlatformStats,
};
