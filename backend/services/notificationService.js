const { prisma } = require("../config/postgres");

const createNotification = async ({
  userId,
  type,
  message,
  link = null,
  metadata = {},
}) => {
  // Some flows call this opportunistically; returning null keeps those paths simple when there is no recipient.
  if (!userId) {
    return null;
  }

  return prisma.notification.create({
    data: {
      userId,
      type,
      message,
      link,
      metadata,
    },
  });
};

const markNotificationRead = async (id, userId) => {
  // Read before write so a user can only mark their own notifications as read.
  const notification = await prisma.notification.findFirst({
    where: {
      id: Number(id),
      userId: Number(userId),
    },
  });

  if (!notification) {
    return null;
  }

  return prisma.notification.update({
    where: {
      id: notification.id,
    },
    data: {
      is_read: true,
    },
  });
};

const markAllNotificationsRead = async (userId) => {
  return prisma.notification.updateMany({
    where: {
      userId: Number(userId),
      is_read: false,
    },
    data: {
      is_read: true,
    },
  });
};

module.exports = {
  createNotification,
  markAllNotificationsRead,
  markNotificationRead,
};
