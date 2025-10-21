import { prisma } from "../../config/prisma";
import { emailService } from "../email/email.service";
import { notificationService } from "../notifications/notification.service";

export const stockAlertService = {
  async checkLowStock() {
    // Obtener productos con stock bajo (≤ 5 unidades)
    const lowStockProducts = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        stock: {
          lte: 5,
        },
      },
      select: {
        id: true,
        sku: true,
        name: true,
        stock: true,
        lowStockThreshold: true,
      },
    });

    if (lowStockProducts.length === 0) {
      console.log("✅ No hay productos con stock bajo");
      return { lowStockProducts: [], notificationsSent: 0 };
    }

    console.log(`⚠️  ${lowStockProducts.length} producto(s) con stock bajo detectado(s)`);

    // Obtener todos los administradores
    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN",
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Crear notificaciones para cada admin
    for (const admin of admins) {
      // Crear notificación en el sistema para cada producto
      for (const product of lowStockProducts) {
        await notificationService.createStockLowNotification(
          admin.id,
          product.name,
          product.stock
        );
      }
    }

    // Enviar un único correo con todos los productos con stock bajo
    for (const admin of admins) {
      try {
        await emailService.sendStockAlertEmail(
          admin.email,
          lowStockProducts.map(p => ({
            sku: p.sku,
            name: p.name,
            stock: p.stock,
          }))
        );
        console.log(`✅ Correo de alerta enviado a ${admin.email}`);
      } catch (error) {
        console.error(`❌ Error al enviar correo a ${admin.email}:`, error);
      }
    }

    return {
      lowStockProducts,
      notificationsSent: admins.length,
    };
  },

  // Verificar stock bajo para un producto específico después de una venta
  async checkProductStock(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        sku: true,
        name: true,
        stock: true,
        lowStockThreshold: true,
        status: true,
      },
    });

    if (!product || product.status !== "ACTIVE") {
      return;
    }

    // Si el stock está por debajo o igual al umbral
    if (product.stock <= product.lowStockThreshold) {
      // Notificar a todos los administradores
      await notificationService.notifyAdmins(
        "STOCK_LOW",
        "Stock Bajo",
        `El producto "${product.name}" tiene solo ${product.stock} unidades en stock`,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          stock: product.stock,
          threshold: product.lowStockThreshold,
        }
      );

      console.log(`⚠️  Alerta: ${product.name} tiene stock bajo (${product.stock} unidades)`);
    }
  },
};

