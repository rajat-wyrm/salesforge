const crypto = require("crypto");
const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const eventBus = require("./eventBus");

const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 30);

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const createSession = async ({ userId, ipAddress = null, userAgent = null }) => {
  const raw = crypto.randomBytes(40).toString("hex");
  const token = `sess_${raw}`;
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      ipAddress,
      userAgent,
      expiresAt,
    },
  });
  return { token, expiresAt };
};

const revokeSession = async (userId, sessionId) => {
  const result = await prisma.session.deleteMany({
    where: { id: Number(sessionId), userId },
  });
  return result.count > 0;
};

const listSessions = async (userId) => {
  return prisma.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { lastActiveAt: "desc" },
  });
};

const touchSession = async (token) => {
  if (!token) return;
  await prisma.session.updateMany({
    where: { tokenHash: hashToken(token) },
    data: { lastActiveAt: new Date() },
  });
};

const SESSIONS_KEY = "user.sessions";

const publishSessionChange = (userId, type, data) => {
  eventBus.publish(`${SESSIONS_KEY}:${userId}`, { type, data, at: new Date().toISOString() });
};

module.exports = {
  SESSION_TTL_DAYS,
  hashToken,
  createSession,
  revokeSession,
  listSessions,
  touchSession,
  publishSessionChange,
  AppError,
};
