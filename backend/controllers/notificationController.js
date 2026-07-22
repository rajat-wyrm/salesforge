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

const testEmail = asyncHandler(async (req, res) => {
  const { category, title, message } = req.body;
  if (!category || !title || !message) {
    return response.error(res, "category, title, and message are required", 400);
  }

  const userId = req.user.id;
  const orgId = req.orgId || null;
  const lowerCategory = category.toLowerCase();

  console.log(`[TestEmail] Flow Start - Authenticated User: ${userId}`);

  // 1. Fetch user from database
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { id: true, email: true },
  });

  if (!user || !user.email) {
    console.warn(`[TestEmail] User Email Missing for user ${userId}`);
    return response.error(res, "Recipient user or email address not found in database.", 404);
  }

  console.log(`[TestEmail] User Email: ${user.email}`);
  console.log(`[TestEmail] Notification Category: ${lowerCategory}`);

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

  console.log(`[TestEmail] Preference Read: ${prefs.length} record(s) found`);
  console.log(`[TestEmail] Email Enabled: ${emailEnabled}`);

  // 3. Respect Email toggle
  if (!emailEnabled) {
    console.log(`[TestEmail] Email Disabled for category "${category}"`);
    return response.success(res, {
      success: false,
      message: `Email notifications are disabled for category "${category}".`,
      sent: false,
      recipient: user.email,
    });
  }

  // 4. Dispatch email to recipient
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

  return response.success(res, {
    success: true,
    message: `Test email sent successfully to ${user.email}.`,
    sent: true,
    recipient: user.email,
  });
});

module.exports = { listNotifications, readNotification, readAllNotifications, broadcast, testEmail };

