import { Request, Response } from "express";
import { notificationService } from "./notification.service";

export const notificationController = {
  async list(req: Request, res: Response) {
    const userId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    
    const notifications = await notificationService.list(userId, limit);
    const unreadCount = await notificationService.countUnread(userId);
    
    res.json({ notifications, unreadCount });
  },

  async countUnread(req: Request, res: Response) {
    const userId = req.user!.id;
    const count = await notificationService.countUnread(userId);
    res.json({ count });
  },

  async markAsRead(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;
    
    await notificationService.markAsRead(id, userId);
    res.json({ message: "Notification marked as read" });
  },

  async markAllAsRead(req: Request, res: Response) {
    const userId = req.user!.id;
    await notificationService.markAllAsRead(userId);
    res.json({ message: "All notifications marked as read" });
  },

  async delete(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;
    
    await notificationService.delete(id, userId);
    res.json({ message: "Notification deleted" });
  },
};

