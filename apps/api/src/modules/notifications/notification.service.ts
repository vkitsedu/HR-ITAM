import { prisma } from '@empops/database';

export interface CreateNotificationParams {
  tenantId: string;
  userId?: string;
  role?: string;
  title: string;
  message: string;
  type?: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  link?: string;
}

export class NotificationService {
  static async send(params: CreateNotificationParams) {
    try {
      return await prisma.systemNotification.create({
        data: {
          tenantId: params.tenantId,
          userId: params.userId,
          role: params.role,
          title: params.title,
          message: params.message,
          type: params.type || 'INFO',
          link: params.link,
          isRead: false,
        },
      });
    } catch (error) {
      console.error('Failed to create system notification:', error);
      return null;
    }
  }

  static async getForUser(tenantId: string, userId: string, role: string) {
    const notifications = await prisma.systemNotification.findMany({
      where: {
        tenantId,
        OR: [
          { userId },
          { role },
          { AND: [{ userId: null }, { role: null }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return {
      unreadCount,
      notifications: notifications.map(n => ({
        id: n.id,
        tenantId: n.tenantId,
        userId: n.userId,
        role: n.role,
        title: n.title,
        message: n.message,
        type: n.type,
        link: n.link,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
    };
  }

  static async markRead(tenantId: string, notificationId: string) {
    return await prisma.systemNotification.updateMany({
      where: { id: notificationId, tenantId },
      data: { isRead: true },
    });
  }

  static async markAllRead(tenantId: string, userId: string, role: string) {
    return await prisma.systemNotification.updateMany({
      where: {
        tenantId,
        isRead: false,
        OR: [
          { userId },
          { role },
          { AND: [{ userId: null }, { role: null }] },
        ],
      },
      data: { isRead: true },
    });
  }
}
