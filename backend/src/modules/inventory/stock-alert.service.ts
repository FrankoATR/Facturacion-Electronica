import { prisma } from "../../config/prisma";
import { emailService } from "../email/email.service";
import { notificationService } from "../notifications/notification.service";
import { env } from "../../config/env";

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

    // Obtener todos los administradores para notificaciones internas
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

    // Crear notificaciones internas para cada admin
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

    // Enviar correo solo al SMTP_USER configurado (para pruebas)
    if (env.smtpUser) {
      try {
        console.log(`[STOCK_ALERT] Enviando alerta de stock bajo a ${env.smtpUser}`);
        
        await emailService.sendStockAlertEmail(
          env.smtpUser,
          lowStockProducts.map(p => ({
            sku: p.sku,
            name: p.name,
            stock: p.stock,
          }))
        );
        
        console.log(`✅ Correo de alerta de stock enviado exitosamente a ${env.smtpUser}`);
      } catch (error) {
        console.error(`❌ Error al enviar correo de alerta de stock a ${env.smtpUser}:`, error);
      }
    } else {
      console.log(`⚠️ SMTP no configurado - no se enviará correo de alerta de stock`);
    }

    return {
      lowStockProducts,
      notificationsSent: env.smtpUser ? 1 : 0, // Solo se envía un correo al SMTP_USER
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
      // Notificar a todos los administradores (notificaciones internas)
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

      // Enviar correo de alerta individual al SMTP_USER (para pruebas)
      if (env.smtpUser) {
        try {
          console.log(`[STOCK_ALERT] Enviando alerta individual de stock bajo para ${product.name} a ${env.smtpUser}`);
          
          await emailService.sendStockAlertEmail(
            env.smtpUser,
            [{
              sku: product.sku,
              name: product.name,
              stock: product.stock,
            }]
          );
          
          console.log(`✅ Correo de alerta individual enviado para ${product.name}`);
        } catch (error) {
          console.error(`❌ Error al enviar correo de alerta individual para ${product.name}:`, error);
        }
      }

      console.log(`⚠️  Alerta: ${product.name} tiene stock bajo (${product.stock} unidades)`);
    }
  },
};

