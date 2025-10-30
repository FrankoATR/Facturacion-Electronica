import cron from "node-cron";
import { stockAlertService } from "../modules/inventory/stock-alert.service";

// Ejecutar verificación de stock bajo todos los días a las 8:00 AM
// Formato cron: segundo minuto hora día mes día_semana
// 0 8 * * * = A las 8:00 AM todos los días
export const initStockMonitoring = () => {
  // Ejecutar todos los días a las 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("🔍 Ejecutando verificación de stock bajo...");
    try {
      const result = await stockAlertService.checkLowStock();
      console.log(
        `✅ Verificación completada: ${result.lowStockProducts.length} productos con stock bajo, ${result.notificationsSent} notificaciones enviadas`
      );
    } catch (error) {
      console.error("❌ Error en verificación de stock:", error);
    }
  });

  console.log("✅ Monitor de stock iniciado (verificación diaria a las 8:00 AM)");

  // Opcional: Ejecutar una vez al iniciar el servidor para pruebas
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 Ejecutando verificación inicial de stock (modo desarrollo)...");
    stockAlertService.checkLowStock().catch((error) => {
      console.error("❌ Error en verificación inicial de stock:", error);
    });
  }
};

