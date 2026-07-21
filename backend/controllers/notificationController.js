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

module.exports = { listNotifications, readNotification, readAllNotifications, broadcast };
