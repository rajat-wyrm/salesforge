const { prisma } = require("../config/postgres");
const { AppError } = require("./errorHandler");

// Reusable middleware that requires a user to have 2FA enabled OR a recent 2FA step-up.
// Currently used for sensitive actions (billing, security changes).
const require2FA = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required." });
  }
  if (!req.user.twoFactorEnabled) {
    return res.status(403).json({
      success: false,
      code: "2FA_REQUIRED",
      message: "Two-factor authentication must be enabled for this action.",
    });
  }
  next();
};

// Account lockout after too many failed logins.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

const isLocked = (user) =>
  user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now();

const recordFailedLogin = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const attempts = (user.failedLoginAttempts || 0) + 1;
  const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null;
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: attempts, lockedUntil },
  });
  if (lockedUntil) {
    throw new AppError("Account locked due to repeated failed attempts. Try again in 15 minutes.", 423);
  }
};

const resetFailedLogins = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
};

const checkLock = async (user) => {
  if (isLocked(user)) {
    const remaining = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 1000);
    throw new AppError(
      `Account locked. Try again in ${Math.ceil(remaining / 60)} minutes.`,
      423,
    );
  }
};

module.exports = { require2FA, isLocked, recordFailedLogin, resetFailedLogins, checkLock, MAX_FAILED_ATTEMPTS };
