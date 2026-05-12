const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");

const list = asyncHandler(async (req, res) => {
  const prefs = await prisma.notificationPreference.findMany({
    where: { userId: req.user.id, orgId: req.orgId },
  });
  // Backfill defaults if none.
  const defaults = ["lead", "deal", "billing", "team", "system"];
  const channels = ["in_app", "email", "push"];
  const out = [];
  for (const category of defaults) {
    for (const channel of channels) {
      const existing = prefs.find((p) => p.category === category && p.channel === channel);
      out.push(existing || { channel, category, enabled: true, isDefault: true });
    }
  }
  return response.success(res, out);
});

const update = asyncHandler(async (req, res) => {
  const { preferences } = req.body;
  if (!Array.isArray(preferences)) throw new AppError("preferences must be an array.", 400);
  for (const p of preferences) {
    if (!p.channel || !p.category) continue;
    await prisma.notificationPreference.upsert({
      where: {
        userId_orgId_channel_category: {
          userId: req.user.id,
          orgId: req.orgId,
          channel: p.channel,
          category: p.category,
        },
      },
      create: { userId: req.user.id, orgId: req.orgId, channel: p.channel, category: p.category, enabled: !!p.enabled },
      update: { enabled: !!p.enabled },
    });
  }
  return response.success(res, { message: "Preferences saved." });
});

module.exports = { list, update };
