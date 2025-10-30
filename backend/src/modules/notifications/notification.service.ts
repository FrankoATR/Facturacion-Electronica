import { prisma } from "../../config/prisma";
import { NotificationType } from "@prisma/client";

export const notificationService = {
  async create(userId: string, type: NotificationType, title: string, message: string, metadata?: any) {
    return prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata,
      },
    });
  },

  async list(userId: string, limit: number = 50) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async countUnread(userId: string) {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  },

  async markAsRead(id: string, userId: string) {
    return prisma.notification.update({
      where: { id, userId },
      data: { read: true },
    });
  },

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },

  async delete(id: string, userId: string) {
    return prisma.notification.delete({
      where: { id, userId },
    });
  },

  // Crear notificación de stock bajo
  async createStockLowNotification(userId: string, productName: string, stock: number) {
    return this.create(
      userId,
      "STOCK_LOW",
      "Stock Bajo",
      `El producto "${productName}" tiene solo ${stock} unidades en stock`,
      { productName, stock }
    );
  },

  // Crear notificación de factura emitida
  async createInvoiceIssuedNotification(userId: string, invoiceNumber: string, total: number) {
    return this.create(
      userId,
      "INVOICE_ISSUED",
      "Factura Emitida",
      `Factura ${invoiceNumber} emitida por $${total.toFixed(2)}`,
      { invoiceNumber, total }
    );
  },

  // Crear notificación de pago recibido
  async createPaymentReceivedNotification(userId: string, invoiceNumber: string, amount: number) {
    return this.create(
      userId,
      "PAYMENT_RECEIVED",
      "Pago Recibido",
      `Pago de $${amount.toFixed(2)} registrado para factura ${invoiceNumber}`,
      { invoiceNumber, amount }
    );
  },

  // Notificar a todos los administradores
  async notifyAdmins(type: NotificationType, title: string, message: string, metadata?: any) {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    });

    const notifications = admins.map((admin) =>
      this.create(admin.id, type, title, message, metadata)
    );

    return Promise.all(notifications);
  },
};

