const { prisma } = require("../config/postgres");
const eventBus = require("./eventBus");

// ---------------------------------------------------------------------------
// Primitive: creates a notification row without any preference check.
// Use this only for system-level or admin-broadcast notifications where
// you intentionally bypass user preferences.
// ---------------------------------------------------------------------------
const createNotification = async ({
  userId,
  type,
  message,
  link = null,
  metadata = {},
}) => {
  if (!userId) return null;

  const notification = await prisma.notification.create({
    data: { userId, type, message, link, metadata },
  });

  // Fire SSE event so the NotificationBell updates in real time.
  eventBus.publish(`user:${userId}`, {
    event: "notification.new",
    payload: { id: notification.id, type, message },
    at: new Date().toISOString(),
  });

  return notification;
};

// ---------------------------------------------------------------------------
// Preferred helper: respects the user's in_app preference for a given
// category before creating and broadcasting the notification.
//
// @param {object} opts
//   - userId    {number}  – recipient
//   - orgId     {number}  – used to look up org-scoped preference
//   - type      {string}  – notification type enum (e.g. "LEAD_CREATED")
//   - category  {string}  – preference category: lead|deal|billing|team|system
//   - message   {string}
//   - link      {string|null}
//   - metadata  {object}
// ---------------------------------------------------------------------------
const createInAppNotification = async ({
  userId,
  orgId,
  type,
  category,
  message,
  link = null,
  metadata = {},
}) => {
  if (!userId) return null;

  // Look up the user's in_app preference for this category.
  // If a row exists with enabled=false the user has turned it off.
  // If no row exists we treat it as enabled (default: true).
  if (category) {
    // Try org-scoped pref first, then fall back to user-only pref (null orgId) for system events.
    const pref = await prisma.notificationPreference.findFirst({
      where: {
        userId: Number(userId),
        channel: "in_app",
        category,
        OR: orgId
          ? [{ orgId: Number(orgId) }, { orgId: null }]
          : [{ orgId: null }],
      },
      // Prefer org-scoped row if both exist
      orderBy: { orgId: "desc" },
    });

    // Explicit opt-out — skip the notification entirely.
    if (pref && pref.enabled === false) return null;
  }

  const notification = await prisma.notification.create({
    data: { userId: Number(userId), type, message, link, metadata },
  });

  // Publish SSE event so the bell badge updates immediately.
  eventBus.publish(`user:${userId}`, {
    event: "notification.new",
    payload: { id: notification.id, type, message, category },
    at: new Date().toISOString(),
  });

  return notification;
};

const markNotificationRead = async (id, userId) => {
  const notification = await prisma.notification.findFirst({
    where: { id: Number(id), userId: Number(userId) },
  });
  if (!notification) return null;
  return prisma.notification.update({
    where: { id: notification.id },
    data: { is_read: true },
  });
};

const markAllNotificationsRead = async (userId) => {
  return prisma.notification.updateMany({
    where: { userId: Number(userId), is_read: false },
    data: { is_read: true },
  });
};

module.exports = {
  createNotification,
  createInAppNotification,
  markAllNotificationsRead,
  markNotificationRead,
};
