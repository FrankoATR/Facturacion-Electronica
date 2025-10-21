import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { notificationController } from "../../modules/notifications/notification.controller";

export const notificationsRouter = Router();

notificationsRouter.get("/", authenticate, notificationController.list);
notificationsRouter.get("/unread-count", authenticate, notificationController.countUnread);
notificationsRouter.put("/:id/read", authenticate, notificationController.markAsRead);
notificationsRouter.put("/mark-all-read", authenticate, notificationController.markAllAsRead);
notificationsRouter.delete("/:id", authenticate, notificationController.delete);

