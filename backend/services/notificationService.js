const { prisma } = require("../config/postgres");
const eventBus = require("./eventBus");
const pushService = require("./pushService");
const emailService = require("./emailService");
const { compileTemplate } = require("./emailTemplates");

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
  pushService
    .sendPushNotification(userId, {
      title: type,
      body: message,
      icon: link,
    })
    .catch((err) => console.error("Failed to send push notification:", err));

  return notification;
};

// ---------------------------------------------------------------------------
// Preferred helper: respects the user's preferences for all channels
// before creating and broadcasting the notification.
//
// SECURITY NOTE:
// userId here must ALWAYS be the ID of the user who triggered the event,
// taken from their authenticated session (req.user.id).
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

  console.log(`[NotificationService] Authenticated User: ${userId}`);

  // Always re-fetch the user from the database to get their current email.
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { id: true, email: true, name: true },
  });

  if (user && user.email) {
    console.log(`[NotificationService] User Email: ${user.email}`);
  } else {
    console.warn(
      `[NotificationService] User Email Missing: User ${userId} has no email address`
    );
  }

  const categoryName = category ? category.toLowerCase() : "general";
  console.log(
    `[NotificationService] Notification Category: ${categoryName}`
  );

  let inAppEnabled = true;
  let pushEnabled = true;
  let emailEnabled = true;

  if (category) {
    // Try org-scoped pref first, then fall back to user-only pref.
    const prefs = await prisma.notificationPreference.findMany({
      where: {
        userId: Number(userId),
        category: category.toLowerCase(),
        OR: orgId
          ? [{ orgId: Number(orgId) }, { orgId: null }]
          : [{ orgId: null }],
      },
      orderBy: { orgId: "desc" },
    });

    console.log(
      `[NotificationService] Preference Read: ${prefs.length} record(s) found for category "${categoryName}"`
    );

    const inAppPref = prefs.find((p) => p.channel === "in_app");
    if (inAppPref && inAppPref.enabled === false) inAppEnabled = false;

    const pushPref = prefs.find((p) => p.channel === "push");
    if (pushPref && pushPref.enabled === false) pushEnabled = false;

    const emailPref = prefs.find((p) => p.channel === "email");
    if (emailPref && emailPref.enabled === false) emailEnabled = false;
  } else {
    console.log(
      `[NotificationService] Preference Read: Default preferences (enabled)`
    );
  }

  console.log(`[NotificationService] Email Enabled: ${emailEnabled}`);

  const title = category
    ? category.charAt(0).toUpperCase() +
      category.slice(1) +
      " Notification"
    : "New Notification";

  // 1. IN-APP NOTIFICATION
  let notification = null;

  if (inAppEnabled) {
    notification = await prisma.notification.create({
      data: {
        userId: Number(userId),
        type,
        message,
        link,
        metadata,
      },
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
    pushService
      .sendPushNotification(userId, {
        title,
        body: message,
        icon: link,
      })
      .catch((err) =>
        console.error("Failed to send push notification:", err)
      );
  }

  // 3. EMAIL NOTIFICATION
  if (!emailEnabled) {
    console.log(
      `[NotificationService] Email Disabled for user ${userId} and category "${categoryName}"`
    );
  } else if (!user || !user.email) {
    console.warn(
      `[NotificationService] User Email Missing for user ${userId}. Skipping email.`
    );
  } else if (process.env.EMAIL_USER && user.email === process.env.EMAIL_USER) {
    // Safety guard: EMAIL_USER is the outbound sender, not a recipient.
    console.warn(
      `[NotificationService] Blocked: email recipient matches EMAIL_USER (sender). Skipping.`
    );
  } else {
    try {
      console.log(
        `[NotificationService] Generating Template for type "${type}"`
      );

      const { subject, html, text } = compileTemplate(
        type,
        message,
        link,
        metadata
      );

      console.log(
        `[NotificationService] Sending Email to user ${userId} <${user.email}>`
      );

      const success = await emailService.send({
        to: user.email,
        subject,
        html,
        text,
      });

      if (success) {
        console.log(
          `[NotificationService] Email Sent Successfully to user ${userId} <${user.email}>`
        );
      } else {
        console.error(
          `[NotificationService] Email Failure for user ${userId} <${user.email}>`
        );
      }
    } catch (err) {
      console.error(
        `[NotificationService] Email Setup Failure for user ${userId}:`,
        err
      );

      // Continue the remaining notification pipeline even when email fails.
    }
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

const deleteNotification = async (id, userId) => {
  return prisma.notification.deleteMany({
    where: { id: Number(id), userId: Number(userId) },
  });
};

const deleteAllNotifications = async (userId) => {
  return prisma.notification.deleteMany({
    where: { userId: Number(userId) },
  });
};

module.exports = {
  createNotification,
  dispatchNotification,
  notify: dispatchNotification,
  createInAppNotification: dispatchNotification,
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification,
  deleteAllNotifications,
};
