const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");

const recordActivity = async ({ leadId, userId, orgId, type, title, body = null, metadata = null }) => {
  if (!leadId || !userId || !type) return null;
  return prisma.leadActivity.create({
    data: {
      leadId,
      userId,
      orgId: orgId || null,
      type,
      title,
      body,
      metadata: metadata || undefined,
    },
  });
};

const listActivity = async (leadId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.leadActivity.findMany({
      where: { leadId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.leadActivity.count({ where: { leadId } }),
  ]);
  return { items, total };
};

const diffLead = (before, after) => {
  const changes = [];
  const skip = new Set(["updatedAt", "createdAt", "score", "scoreDetails"]);
  for (const key of Object.keys(after || {})) {
    if (skip.has(key)) continue;
    const a = before?.[key];
    const b = after?.[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      changes.push({ field: key, from: a ?? null, to: b ?? null });
    }
  }
  return changes;
};

const summarizeChanges = (changes) =>
  changes
    .slice(0, 3)
    .map((c) => `${c.field}: ${c.from ?? "—"} → ${c.to ?? "—"}`)
    .join("; ");

module.exports = { recordActivity, listActivity, diffLead, summarizeChanges, AppError };
