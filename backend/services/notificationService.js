const { prisma } = require("../config/postgres");
const eventBus = require("./eventBus");
const { sendPushNotification } = require("./pushService");
const { send } = require("./emailService");
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
  await sendPushNotification(userId, { title: type, body: message, icon: link });

  return notification;
};

// ---------------------------------------------------------------------------
// Preferred helper: respects the user's preferences for all channels
// before creating and broadcasting the notification.
//
// SECURITY NOTE:
// userId here must ALWAYS be the ID of the user who triggered the event,
// taken from their authenticated session (req.user.id) — never a different
// user's ID, never from req.body, never hardcoded, never from an
// environment variable. The caller is responsible for passing the correct
// userId from the authentication middleware.
//
// The recipient EMAIL is ALWAYS fetched fresh from the database using the
// passed userId — never taken from the request body, never cached from an
// earlier request. EMAIL_USER / EMAIL_PASS env vars are ONLY the sending
// account's SMTP login credentials and must never be used as a recipient.
//
// @param {object} opts
//   - userId    {number}  – the authenticated user who triggered the event
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

  console.log(`[NotificationService] Authenticated User: ${userId}`);

  // -------------------------------------------------------------------------
  // SECURITY: Always re-fetch the user from the database to get their current
  // email address. Never trust an email from the request payload or a cache.
  // -------------------------------------------------------------------------
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { id: true, email: true, name: true },
  });

  if (user && user.email) {
    console.log(`[NotificationService] User Email: ${user.email}`);
  } else {
    console.warn(`[NotificationService] User Email Missing: User ${userId} has no email address`);
  }

  const categoryName = category ? category.toLowerCase() : "general";
  console.log(`[NotificationService] Notification Category: ${categoryName}`);

  let inAppEnabled = true;
  let pushEnabled = true;
  let emailEnabled = true;

  if (category) {
    // Try org-scoped pref first, then fall back to user-only pref (null orgId) for system events.
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

    console.log(`[NotificationService] Preference Read: ${prefs.length} record(s) found for category "${categoryName}"`);

    // Check in_app preference
    const inAppPref = prefs.find(p => p.channel === "in_app");
    if (inAppPref && inAppPref.enabled === false) inAppEnabled = false;

    // Check push preference
    const pushPref = prefs.find(p => p.channel === "push");
    if (pushPref && pushPref.enabled === false) pushEnabled = false;

    // Check email preference
    const emailPref = prefs.find(p => p.channel === "email");
    if (emailPref && emailPref.enabled === false) emailEnabled = false;
  } else {
    console.log(`[NotificationService] Preference Read: Default preferences (enabled)`);
  }

  console.log(`[NotificationService] Email Enabled: ${emailEnabled}`);

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
  // -------------------------------------------------------------------------
  // TODO: BullMQ — When you add Redis (REDIS_URL), replace the inline email
  // send below with:
  //   const { emailQueue } = require("../queues/emailQueue");
  //   await emailQueue.add("send-notification-email", {
  //     userId,       // worker will re-fetch user.email from DB
  //     category: categoryName,
  //     type,
  //     message,
  //     link,
  //     metadata,
  //   });
  // Then create a separate workers/emailWorker.js process that consumes the
  // queue and sends emails via Nodemailer. Deploy it as a Render Background
  // Worker with the same env vars as the web service.
  // -------------------------------------------------------------------------
  if (!emailEnabled) {
    console.log(`[NotificationService] Email Disabled for user ${userId} and category "${categoryName}"`);
  } else if (!user || !user.email) {
    console.warn(`[NotificationService] User Email Missing for user ${userId}. Skipping email.`);
  } else {
    try {
      console.log(`[NotificationService] Generating Template for type "${type}"`);
      const { subject, html, text } = compileTemplate(type, message, link, metadata);

      // SECURITY: 'to' is ALWAYS user.email (fetched fresh from DB above).
      // EMAIL_USER is ONLY the sender account — never the recipient.
      console.log(`[NotificationService] Sending Email to ${user.email}`);
      const success = await send({
        to: user.email,
        subject,
        html,
        text,
      });

      if (success) {
        console.log(`[NotificationService] Email Sent Successfully to ${user.email}`);
      } else {
        console.error(`[NotificationService] SMTP Failure for ${user.email}`);
      }
    } catch (err) {
      console.error(`[NotificationService] SMTP Failure for ${user ? user.email : userId}:`, err);
      // Continue the remaining notification pipeline even when SMTP/email flow fails.
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

module.exports = {
  createNotification,
  dispatchNotification,
  notify: dispatchNotification,
  createInAppNotification: dispatchNotification, // Alias for backward compatibility just in case
  markAllNotificationsRead,
  markNotificationRead,
};
