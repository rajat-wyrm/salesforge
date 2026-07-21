const { prisma } = require("../config/postgres");
const eventBus = require("./eventBus");
const { sendPushNotification } = require("./pushService");
const { sendNotificationEmail } = require("./emailService");

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

  // Also send a push notification since this bypasses preferences
  await sendPushNotification(userId, { title: type, body: message, icon: link });

  return notification;
};

// ---------------------------------------------------------------------------
// Preferred helper: respects the user's preferences for all channels
// before creating and broadcasting the notification.
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
const dispatchNotification = async ({
  userId,
  orgId,
  type,
  category,
  message,
  link = null,
  metadata = {},
}) => {
  if (!userId) return null;

  let inAppEnabled = true;
  let pushEnabled = true;
  let emailEnabled = true;

  if (category) {
    // Try org-scoped pref first, then fall back to user-only pref (null orgId) for system events.
    const prefs = await prisma.notificationPreference.findMany({
      where: {
        userId: Number(userId),
        category,
        OR: orgId
          ? [{ orgId: Number(orgId) }, { orgId: null }]
          : [{ orgId: null }],
      },
      orderBy: { orgId: "desc" },
    });

    // Check in_app preference
    const inAppPref = prefs.find(p => p.channel === "in_app");
    if (inAppPref && inAppPref.enabled === false) inAppEnabled = false;

    // Check push preference
    const pushPref = prefs.find(p => p.channel === "push");
    if (pushPref && pushPref.enabled === false) pushEnabled = false;

    // Check email preference
    const emailPref = prefs.find(p => p.channel === "email");
    if (emailPref && emailPref.enabled === false) emailEnabled = false;
  }

  // Generate a friendly title
  const title = category 
    ? category.charAt(0).toUpperCase() + category.slice(1) + " Notification"
    : "New Notification";

  // 1. IN-APP NOTIFICATION
  let notification = null;
  if (inAppEnabled) {
    notification = await prisma.notification.create({
      data: { userId: Number(userId), type, message, link, metadata },
    });

    // Publish SSE event so the bell badge updates immediately.
    eventBus.publish(`user:${userId}`, {
      event: "notification.new",
      payload: { id: notification.id, type, message, category },
      at: new Date().toISOString(),
    });
  }

  // 2. PUSH NOTIFICATION
  if (pushEnabled) {
    // Fire-and-forget push notification
    sendPushNotification(userId, { 
      title, 
      body: message, 
      icon: link 
    }).catch(err => console.error("Failed to send push notification:", err));
  }

  // 3. EMAIL NOTIFICATION
  if (emailEnabled) {
    // Look up user's email address
    prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { email: true }
    }).then(user => {
      if (user && user.email) {
        sendNotificationEmail(user.email, title, `${message}\n\nView details: ${link ? (process.env.FRONTEND_URL || 'http://localhost:5173') + link : 'Login to app'}`)
          .catch(err => console.error("Failed to send email notification:", err));
      }
    }).catch(err => console.error("Failed to lookup user for email notification:", err));
  }

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
  dispatchNotification,
  createInAppNotification: dispatchNotification, // Alias for backward compatibility just in case
  markAllNotificationsRead,
  markNotificationRead,
};
