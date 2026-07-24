const { prisma } = require("../config/postgres");
const { AppError } = require("../middleware/errorHandler");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");

const list = asyncHandler(async (req, res) => {
  const prefs = await prisma.notificationPreference.findMany({
    where: {
      userId: req.user.id,
      OR: [{ orgId: req.orgId || null }, { orgId: null }],
    },
  });
  // Backfill defaults if none.
  const defaults = ["lead", "deal", "billing", "team", "system"];
  const channels = ["in_app", "email", "push"];
  const out = [];
  for (const category of defaults) {
    for (const channel of channels) {
      // Prefer org-scoped pref; fall back to user-only; then default to enabled.
      const existing =
        prefs.find((p) => p.category === category && p.channel === channel && p.orgId === (req.orgId || null)) ||
        prefs.find((p) => p.category === category && p.channel === channel && p.orgId === null);
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
    const effectiveOrgId = req.orgId || null;
    if (effectiveOrgId) {
      // Org-scoped upsert
      await prisma.notificationPreference.upsert({
        where: {
          userId_orgId_channel_category: {
            userId: req.user.id,
            orgId: effectiveOrgId,
            channel: p.channel,
            category: p.category,
          },
        },
        create: { userId: req.user.id, orgId: effectiveOrgId, channel: p.channel, category: p.category, enabled: !!p.enabled },
        update: { enabled: !!p.enabled },
      });
    } else {
      // User-only (no org) — findFirst + upsert workaround since null breaks unique key
      const existing = await prisma.notificationPreference.findFirst({
        where: { userId: req.user.id, orgId: null, channel: p.channel, category: p.category },
      });
      if (existing) {
        await prisma.notificationPreference.update({
          where: { id: existing.id },
          data: { enabled: !!p.enabled },
        });
      } else {
        await prisma.notificationPreference.create({
          data: { userId: req.user.id, orgId: null, channel: p.channel, category: p.category, enabled: !!p.enabled },
        });
      }
    }
  }
  return response.success(res, { message: "Preferences saved." });
});

// ---------------------------------------------------------------------------
// PATCH single preference toggle.
// Body: { category, channel, enabled }
// Always scoped to req.user.id — never reads userId from the request body.
// ---------------------------------------------------------------------------
const patchOne = asyncHandler(async (req, res) => {
  const { category, channel, enabled } = req.body;
  if (!category || !channel || enabled === undefined) {
    throw new AppError("category, channel, and enabled are required.", 400);
  }

  const effectiveOrgId = req.orgId || null;

  if (effectiveOrgId) {
    await prisma.notificationPreference.upsert({
      where: {
        userId_orgId_channel_category: {
          userId: req.user.id,
          orgId: effectiveOrgId,
          channel: channel.toLowerCase(),
          category: category.toLowerCase(),
        },
      },
      create: {
        userId: req.user.id,
        orgId: effectiveOrgId,
        channel: channel.toLowerCase(),
        category: category.toLowerCase(),
        enabled: !!enabled,
      },
      update: { enabled: !!enabled },
    });
  } else {
    // User-only (no org) — findFirst + upsert workaround since null breaks unique key
    const existing = await prisma.notificationPreference.findFirst({
      where: { userId: req.user.id, orgId: null, channel: channel.toLowerCase(), category: category.toLowerCase() },
    });
    if (existing) {
      await prisma.notificationPreference.update({
        where: { id: existing.id },
        data: { enabled: !!enabled },
      });
    } else {
      await prisma.notificationPreference.create({
        data: { userId: req.user.id, orgId: null, channel: channel.toLowerCase(), category: category.toLowerCase(), enabled: !!enabled },
      });
    }
  }

  return response.success(res, { message: "Preference updated.", category, channel, enabled: !!enabled });
});

module.exports = { list, update, patchOne };
