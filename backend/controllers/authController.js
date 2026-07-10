const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

const { prisma } = require("../config/postgres");
const { createNotification } = require("../services/notificationService");
const generateToken = require("../utils/generateToken");
const { sendResetEmail, sendVerificationEmail, sendEmail } = require("../utils/sendEmail");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { AppError } = require("../middleware/errorHandler");
const sessionService = require("../services/sessionService");
const { checkLock, recordFailedLogin, resetFailedLogins } = require("../middleware/security");
const { recordAudit } = require("../services/auditService");
const { incrementUsage } = require("../services/usageService");
const slugify = require("../utils/slugify");
const eventBus = require("../services/eventBus");
const inviteService = require("../services/inviteService");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const SAFE_USER_KEYS = [
  "id", "name", "email", "role", "mobile", "isVerified", "isMobileVerified",
  "createdAt", "organizationId", "twoFactorEnabled",
];

const getSafeUser = (user) => {
  const out = {};
  for (const key of SAFE_USER_KEYS) {
    if (user[key] !== undefined) out[key] = user[key];
  }
  return out;
};

const buildResetUrl = (token) => {
  const origin = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  return `${origin}/reset-password?token=${token}`;
};

const buildOrgContext = (userId, orgId, role) => ({ userId, orgId, role, at: new Date().toISOString() });

const publishAuthEvent = (user, event) => {
  if (!user?.organizationId) return;
  eventBus.publish(`org:${user.organizationId}`, { event, payload: { userId: user.id }, at: new Date().toISOString() });
};

const acceptPendingInviteForUser = async (userId, email) => {
  const invites = await prisma.teamInvite.findMany({
    where: { email: email.toLowerCase(), acceptedAt: null, expiresAt: { gt: new Date() } },
  });
  for (const inv of invites) {
    try {
      await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { organizationId: inv.orgId, role: inv.role } }),
        prisma.orgMembership.upsert({
          where: { userId_orgId: { userId, orgId: inv.orgId } },
          create: { userId, orgId: inv.orgId, role: inv.role },
          update: { role: inv.role },
        }),
        prisma.teamInvite.update({ where: { id: inv.id }, data: { acceptedAt: new Date() } }),
      ]);
      eventBus.publish(`org:${inv.orgId}`, {
        event: "USER_JOINED",
        payload: { userId, email },
        at: new Date().toISOString(),
      });
    } catch (e) {
      // Continue - one bad invite shouldn't block auth.
    }
  }
};

const register = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const password = await bcrypt.hash(req.body.password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.isVerified) {
    throw new AppError("An account with this email already exists.", 409);
  }

  // Determine org placement: prefer explicit invite token, else create personal workspace.
  let orgId = null;
  let role = "OWNER";
  if (req.body.inviteToken) {
    const invite = await inviteService.getInvite(req.body.inviteToken);
    if (invite.email.toLowerCase() !== email) {
      throw new AppError("This invite was sent to a different email address.", 403);
    }
    orgId = invite.orgId;
    role = invite.role;
  }

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: req.body.name.trim(),
          email,
          password,
          role,
          organizationId: orgId ?? existing.organizationId,
          mobile: req.body.mobile || null,
          isVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
      })
    : await prisma.user.create({
        data: {
          name: req.body.name.trim(),
          email,
          password,
          role,
          organizationId: orgId,
          mobile: req.body.mobile || null,
          isVerified: true,
        },
      });

  if (orgId) {
    await prisma.orgMembership.upsert({
      where: { userId_orgId: { userId: user.id, orgId } },
      create: { userId: user.id, orgId, role },
      update: { role },
    });
    await prisma.teamInvite.updateMany({
      where: { email, orgId, acceptedAt: null },
      data: { acceptedAt: new Date() },
    });
  } else {
    // Create personal workspace so the user can start using the product immediately.
    const slug = `${slugify(req.body.name)}-${user.id}`;
    const org = await prisma.organization.create({
      data: {
        name: `${req.body.name.trim()}'s workspace`,
        slug,
        region: "Global",
        type: "Startup",
        contactName: req.body.name.trim(),
        contactEmail: email,
        plan: "FREE",
        status: "TRIALING",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.user.update({ where: { id: user.id }, data: { organizationId: org.id, role: "OWNER" } });
    await prisma.orgMembership.create({
      data: { userId: user.id, orgId: org.id, role: "OWNER" },
    });
  }

  // Auto-accept any other pending invites matching this email.
  await acceptPendingInviteForUser(user.id, user.email);

  if (user.organizationId) {
    await prisma.subscription.upsert({
      where: { orgId: user.organizationId },
      create: {
        orgId: user.organizationId,
        userId: user.id,
        plan: "FREE",
        status: "TRIALING",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      update: {},
    });
  }

  await createNotification({
    userId: user.id,
    type: "WELCOME",
    message: "Your account is ready to use.",
    link: "/app/dashboard",
  });

  await recordAudit({
    userId: user.id,
    orgId: user.organizationId,
    action: "user.register",
    entityType: "User",
    entityId: user.id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  publishAuthEvent(user, "USER_JOINED");

  return response.created(res, {
    token: generateToken(user),
    user: getSafeUser(user),
  }, { registered: true });
});

const login = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }
  await checkLock(user);
  const passwordMatches = await bcrypt.compare(req.body.password, user.password);
  if (!passwordMatches) {
    await recordFailedLogin(user.id);
    throw new AppError("Invalid email or password.", 401);
  }
  await resetFailedLogins(user.id);

  const session = await sessionService.createSession({
    userId: user.id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });
  await createNotification({
    userId: user.id,
    type: "LOGIN",
    message: "You signed in successfully.",
    link: "/app/dashboard",
  });
  await recordAudit({
    userId: user.id,
    orgId: user.organizationId,
    action: "user.login",
    entityType: "User",
    entityId: user.id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });
  return response.success(res, {
    token: generateToken(user),
    sessionToken: session.token,
    user: getSafeUser(user),
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  // Always return the same message to avoid account enumeration.
  if (!user) {
    return response.success(res, { message: "If that email exists, a reset link has been sent." });
  }
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: tokenHash,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  await sendResetEmail(user.email, buildResetUrl(rawToken));
  return response.success(res, { message: "If that email exists, a reset link has been sent." });
});

const resetPassword = asyncHandler(async (req, res) => {
  const tokenHash = crypto.createHash("sha256").update(req.body.token).digest("hex");
  const user = await prisma.user.findFirst({
    where: { passwordResetToken: tokenHash, passwordResetExpires: { gt: new Date() } },
  });
  if (!user) throw new AppError("The reset token is invalid or has expired.", 400);
  const password = await bcrypt.hash(req.body.password, 12);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { password, passwordResetToken: null, passwordResetExpires: null, isVerified: true },
  });
  // Invalidate all existing sessions on password change.
  await prisma.session.deleteMany({ where: { userId: updated.id } });
  await createNotification({
    userId: updated.id,
    type: "PASSWORD_RESET",
    message: "Your password was changed successfully.",
    link: "/app/settings",
  });
  await recordAudit({
    userId: updated.id,
    orgId: updated.organizationId,
    action: "user.password_reset",
    entityType: "User",
    entityId: updated.id,
    ipAddress: req.ip,
  });
  return response.success(res, { token: generateToken(updated), user: getSafeUser(updated) });
});

const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      organization: {
        select: { id: true, name: true, slug: true, plan: true, status: true, logo: true },
      },
    },
  });
  if (!user) throw new AppError("User not found.", 404);
  return response.success(res, { user: getSafeUser(user), organization: user.organization });
});

const ensureOtpUser = async (email) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  const placeholder = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 12);
  return prisma.user.create({
    data: {
      name: "Pending User",
      email,
      password: placeholder,
      role: "INVESTOR",
      isVerified: false,
    },
  });
};

const sendOtp = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const user = await ensureOtpUser(email);
  if (user.emailOtpLastSentAt && Date.now() - new Date(user.emailOtpLastSentAt).getTime() < 60 * 1000) {
    throw new AppError("Please wait before requesting another OTP.", 429);
  }
  const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
  const tokenHash = crypto.createHash("sha256").update(otp).digest("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: tokenHash,
      emailVerificationExpires: new Date(Date.now() + 5 * 60 * 1000),
      emailOtpLastSentAt: new Date(),
    },
  });
  const result = await sendVerificationEmail(email, otp);
  return response.success(res, {
    preview: result.skipped,
    devOtp: process.env.NODE_ENV === "production" ? undefined : otp,
  });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const tokenHash = crypto.createHash("sha256").update(req.body.otp).digest("hex");
  const user = await prisma.user.findFirst({
    where: { email, emailVerificationToken: tokenHash, emailVerificationExpires: { gt: new Date() } },
  });
  if (!user) throw new AppError("The OTP is invalid or has expired.", 400);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, emailVerificationToken: null, emailVerificationExpires: null },
  });
  const isPending = updated.name === "Pending User";
  return response.success(res, {
    token: isPending ? undefined : generateToken(updated),
    user: isPending ? undefined : getSafeUser(updated),
    pending: isPending,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError("Current and new password are required.", 400);
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) throw new AppError("Current password is incorrect.", 401);
  const password = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password } });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await recordAudit({
    userId: user.id,
    orgId: user.organizationId,
    action: "user.password_change",
    entityType: "User",
    entityId: user.id,
    ipAddress: req.ip,
  });
  return response.success(res, { message: "Password updated. Please sign in again." });
});

const logout = asyncHandler(async (req, res) => {
  if (req.sessionToken) {
    await prisma.session.deleteMany({ where: { tokenHash: sessionService.hashToken(req.sessionToken) } });
  }
  return response.success(res, { message: "Signed out." });
});

const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!password || !(await bcrypt.compare(password, user.password))) {
    throw new AppError("Password is incorrect.", 401);
  }
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.apiKey.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);
  return response.success(res, { message: "Account deleted." });
});

const googleLogin = asyncHandler(async (req, res) => {
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

  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const randomPassword = await bcrypt.hash(
      crypto.randomBytes(32).toString("hex"),
      12
    );

    const org = await prisma.organization.create({
      data: {
        name: `${payload.name}'s Workspace`,
        slug: `${slugify(payload.name)}-${Date.now()}`,
        region: "Global",
        type: "Startup",
        contactName: payload.name,
        contactEmail: email,
        plan: "FREE",
        status: "TRIALING",
        trialEndsAt: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ),
      },
    });

    user = await prisma.user.create({
      data: {
        name: payload.name,
        email,
        password: randomPassword,
        role: "OWNER",
        organizationId: org.id,
        isVerified: true,
        googleId: payload.sub,
        avatar: payload.picture,
        provider: "GOOGLE",
      },
    });

    await prisma.orgMembership.create({
      data: {
        userId: user.id,
        orgId: org.id,
        role: "OWNER",
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: payload.sub,
        avatar: payload.picture,
        provider: "GOOGLE",
      },
    });
  }

  const session = await sessionService.createSession({
    userId: user.id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  return response.success(res, {
    token: generateToken(user),
    sessionToken: session.token,
    user: getSafeUser(user),
  });
});

module.exports = {
  register,
  login,
  googleLogin,
  logout,
  forgotPassword,
  resetPassword,
  me,
  changePassword,
  deleteAccount,
  sendOtp,
  verifyOtp,
  getSafeUser,
  buildOrgContext,
};