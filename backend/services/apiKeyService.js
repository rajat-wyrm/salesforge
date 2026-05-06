const crypto = require("crypto");
const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");

const generateApiKey = () => {
  const raw = `fk_${crypto.randomBytes(24).toString("hex")}`;
  return { raw, hash: crypto.createHash("sha256").update(raw).digest("hex"), prefix: raw.slice(0, 11) };
};

const listApiKeys = async (orgId) => {
  return prisma.apiKey.findMany({
    where: { orgId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
  });
};

const createApiKey = async ({ name, userId, orgId, scopes = "read,write", expiresAt = null }) => {
  const { raw, hash, prefix } = generateApiKey();
  const key = await prisma.apiKey.create({
    data: {
      name,
      keyHash: hash,
      keyPrefix: prefix,
      userId,
      orgId: orgId || null,
      scopes,
      expiresAt,
    },
  });
  // The raw key is only returned once at creation; only the hash is stored.
  return { ...key, key: raw };
};

const revokeApiKey = async (orgId, id) => {
  const result = await prisma.apiKey.updateMany({
    where: { id: Number(id), orgId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (result.count === 0) {
    throw new AppError("API key not found.", 404);
  }
  return true;
};

const verifyApiKey = async (raw) => {
  if (!raw) return null;
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const key = await prisma.apiKey.findUnique({ where: { keyHash: hash } });
  if (!key || key.revokedAt) return null;
  if (key.expiresAt && key.expiresAt < new Date()) return null;
  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });
  return key;
};

module.exports = { generateApiKey, listApiKeys, createApiKey, revokeApiKey, verifyApiKey };
