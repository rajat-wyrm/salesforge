const { prisma } = require("../config/postgres");
const asyncHandler = require("../utils/asyncHandler");
const response = require("../utils/response");
const { createNotification, markNotificationRead, markAllNotificationsRead } = require("../services/notificationService");
const eventBus = require("../services/eventBus");

const listNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const where = { userId: req.user.id };
  if (unreadOnly === "true") where.is_read = false;
  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.user.id, is_read: false } }),
  ]);
  return response.success(res, { data: items, summary: { unreadCount }, meta: { pagination: { total, page: Number(page), limit: Number(limit), pages: Math.max(1, Math.ceil(total / Number(limit))) } } });
});

const readNotification = asyncHandler(async (req, res) => {
  const notification = await markNotificationRead(req.params.id, req.user.id);
  if (!notification) return response.error(res, "Notification not found.", 404);
  return response.success(res, notification);
});

const readAllNotifications = asyncHandler(async (req, res) => {
  const result = await markAllNotificationsRead(req.user.id);
  eventBus.publish(`user:${req.user.id}`, { event: "notifications.read_all", payload: {}, at: new Date().toISOString() });
  return response.success(res, { message: "All notifications marked as read.", updatedCount: result.count });
});

const broadcast = asyncHandler(async (req, res) => {
  // Admin/owner can send a notification to themselves or other org members.
  // createNotification already publishes `notification.new` via SSE for each recipient.
  const { userIds = [req.user.id], type = "INFO", message, link = null, metadata = {} } = req.body;
  if (!message) return response.error(res, "message is required", 400);
  await Promise.all(
    userIds.map((id) =>
      createNotification({ userId: Number(id), type, message, link, metadata }),
    ),
  );
  return response.success(res, { sent: userIds.length });
});

// ---------------------------------------------------------------------------
// [DEV ONLY] Test email notification endpoint.
// Verifies the full notification pipeline for a given category:
//   (a) toggle OFF → zero emails sent
//   (b) toggle ON  → exactly one email sent to req.user.id's registered email
//   (c) recipient is always the authenticated user, never anyone else
//
// Usage: POST /api/notifications/test-email
// Body:  { category: "lead", title: "Test", message: "Hello" }
// ---------------------------------------------------------------------------
const testEmail = asyncHandler(async (req, res) => {
  const { category, title, message } = req.body;
  if (!category || !title || !message) {
    return response.error(res, "category, title, and message are required", 400);
  }

  const userId = req.user.id;
  const orgId = req.orgId || null;
  const lowerCategory = category.toLowerCase();

  const diagnostics = {
    authenticatedUserId: userId,
    category: lowerCategory,
    steps: [],
  };

  // 1. Fetch user from database — NEVER trust request body for email
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { id: true, email: true, name: true },
  });

  if (!user || !user.email) {
    diagnostics.steps.push("FAIL: User or email not found in database");
    return response.error(res, "Recipient user or email address not found in database.", 404);
  }

  diagnostics.recipientEmail = user.email;
  diagnostics.steps.push(`User fetched from DB: ${user.email}`);

  // 2. Read notification preferences
  const prefs = await prisma.notificationPreference.findMany({
    where: {
      userId: Number(userId),
      category: lowerCategory,
      OR: orgId
        ? [{ orgId: Number(orgId) }, { orgId: null }]
        : [{ orgId: null }],
    },
    orderBy: { orgId: "desc" },
  });

  const emailPref = prefs.find(p => p.channel === "email");
  const emailEnabled = !emailPref || emailPref.enabled !== false;

  diagnostics.preferencesFound = prefs.length;
  diagnostics.emailPreferenceRow = emailPref || "none (defaults to enabled)";
  diagnostics.emailEnabled = emailEnabled;
  diagnostics.steps.push(`Preferences: ${prefs.length} row(s), email=${emailEnabled}`);

  // 3. Respect Email toggle
  if (!emailEnabled) {
    diagnostics.steps.push("SKIPPED: Email toggle is OFF for this category");
    diagnostics.emailSent = false;
    return response.success(res, {
      message: `Email notifications are disabled for category "${category}".`,
      sent: false,
      diagnostics,
    });
  }

  // 4. Dispatch via the full notification pipeline
  diagnostics.steps.push("Dispatching via notificationService.dispatchNotification()...");

  const { dispatchNotification } = require("../services/notificationService");
  await dispatchNotification({
    userId,
    orgId,
    type: "SYSTEM_ALERT",
    category: lowerCategory,
    message: `${title}: ${message}`,
    link: "/app",
    metadata: { title },
  });

  diagnostics.steps.push(`Email dispatched to ${user.email}`);
  diagnostics.emailSent = true;

  return response.success(res, {
    message: `[DEV ONLY] Test email sent successfully to ${user.email}.`,
    sent: true,
    recipient: user.email,
    diagnostics,
  });
});

module.exports = { listNotifications, readNotification, readAllNotifications, broadcast, testEmail };
