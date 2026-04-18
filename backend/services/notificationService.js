const prisma = require('../config/database');

class NotificationService {
  async createNotification(notificationData) {
    const {
      user_id,
      type,
      subject,
      message,
    } = notificationData;

    const notification = await prisma.notification.create({
      data: {
        user_id,
        type,
        subject,
        message,
        is_read: false,
      },
    });

    return notification;
  }

  async getNotificationsByUser(userId) {
    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    return notifications;
  }

  async getUnreadNotifications(userId) {
    const notifications = await prisma.notification.findMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      orderBy: { created_at: 'desc' },
    });

    return notifications;
  }

  async markAsRead(notificationId) {
    const notification = await prisma.notification.update({
      where: { notification_id: notificationId },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    return notification;
  }

  async markAllAsRead(userId) {
    await prisma.notification.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }
}

module.exports = new NotificationService();
