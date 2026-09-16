import { Router, Request, Response } from 'express';
import { authenticateJwt } from '../../middleware/auth.js';
import { NotificationService } from './notification.service.js';

export const notificationRouter = Router();
notificationRouter.use(authenticateJwt);

// GET /api/notifications - Get current user notifications
notificationRouter.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;
    const role = req.user!.role;

    const result = await NotificationService.getForUser(tenantId, userId, role);
    return res.json(result);
  } catch (error: any) {
    console.error('Fetch notifications error:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/notifications/:id/read - Mark one notification as read
notificationRouter.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const notificationId = req.params.id;

    await NotificationService.markRead(tenantId, notificationId);
    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// POST /api/notifications/read-all - Mark all user notifications as read
notificationRouter.post('/read-all', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;
    const role = req.user!.role;

    await NotificationService.markAllRead(tenantId, userId, role);
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('Mark all notifications read error:', error);
    return res.status(500).json({ error: 'Failed to mark all as read' });
  }
});
