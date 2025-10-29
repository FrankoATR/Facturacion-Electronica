import * as nodemailer from "nodemailer";
import { env } from "../../config/env";

// Configurar transporter de nodemailer (opcional)
let transporter: any = null;

const initTransporter = () => {
  if (!env.smtpUser || !env.smtpPass) {
    console.log("⚠️  SMTP no configurado - los correos no se enviarán");
    return;
  }

  try {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465, // true para 465 (SSL), false para 587 (TLS)
      requireTLS: env.smtpPort === 587, // TLS para puerto 587
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
      tls: {
        // Configuración TLS mejorada
        rejectUnauthorized: false, // Solo para desarrollo
        minVersion: 'TLSv1.2',
      },
      connectionTimeout: 60000, // 60 segundos
      greetingTimeout: 30000, // 30 segundos
      socketTimeout: 60000, // 60 segundos
      pool: true, // Usar pool de conexiones
      maxConnections: 5,
      maxMessages: 100,
      debug: env.nodeEnv === 'development', // Debug en desarrollo
      logger: env.nodeEnv === 'development', // Logs en desarrollo
    });

    // Verificar la conexión SMTP (sin bloquear inicio)
    transporter.verify((error: any) => {
      if (error) {
        console.error("❌ Error de configuración SMTP (correos deshabilitados):", error.message);
        transporter = null;
      } else {
        console.log("✅ Servidor SMTP listo para enviar correos");
      }
    });
  } catch (error: any) {
    console.error("❌ Error al inicializar SMTP:", error.message);
    transporter = null;
  }
};

// Inicializar transporter
initTransporter();

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export const emailService = {
  async sendEmail(options: EmailOptions) {
    // Check if email sending is enabled
    if (process.env.SEND_EMAILS !== 'true') {
      console.log("📧 Email sending disabled (SEND_EMAILS !== 'true') - skipping:", options.to);
      return { success: true, skipped: true, reason: "SEND_EMAILS disabled" };
    }

    if (!transporter) {
      console.log("⚠️  SMTP no disponible - correo no enviado a:", options.to);
      return { success: false, error: "SMTP not configured" };
    }

    try {
      const info = await transporter.sendMail({
        from: env.smtpFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      });

      console.log("✅ Correo enviado:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error("❌ Error al enviar correo:", error);
      return { success: false, error: error.message };
    }
  },

  async sendInvoiceEmail(
    clientEmail: string,
    invoiceNumber: string,
    clientName: string,
    total: number,
    pdfBuffer: Buffer
  ) {
    const subject = `Factura Electrónica ${invoiceNumber} - EleCtroZ`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border: 1px solid #e0e0e0;
          }
          .info-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #ff6b35;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: bold;
            color: #555;
          }
          .value {
            color: #333;
          }
          .total {
            font-size: 24px;
            color: #ff6b35;
            font-weight: bold;
          }
          .footer {
            background: #333;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 10px 10px;
            font-size: 12px;
          }
          .footer a {
            color: #ff6b35;
            text-decoration: none;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #ff6b35;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏪 EleCtroZ</h1>
          <p>Sistema de Facturación Electrónica</p>
        </div>
        
          <div class="content">
            <h2>Estimado/a ${clientName},</h2>
            <p>Le enviamos su <strong>factura electrónica</strong> generada en nuestro sistema.</p>
          
          <div class="info-box">
            <div class="info-row">
              <span class="label">Número de Factura:</span>
              <span class="value">${invoiceNumber}</span>
            </div>
            <div class="info-row">
              <span class="label">Cliente:</span>
              <span class="value">${clientName}</span>
            </div>
            <div class="info-row">
              <span class="label">Total a Pagar:</span>
              <span class="value total">$${total.toFixed(2)}</span>
            </div>
          </div>
          
          <p>
            <strong>Documento adjunto:</strong> Encontrará su factura en formato PDF adjunta a este correo.
            Este documento es válido como comprobante fiscal electrónico.
          </p>
          
          <p>
            Si tiene alguna pregunta sobre esta factura, no dude en contactarnos.
          </p>
          
          <p>Gracias por su preferencia.</p>
        </div>
        
        <div class="footer">
          <p><strong>EleCtroZ</strong></p>
          <p>Sistema de Facturación Electrónica - El Salvador</p>
          <p>Este es un correo automático, por favor no responder.</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: clientEmail,
      subject,
      html,
      attachments: [
        {
          filename: `Factura-${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
  },

  async sendStockAlertEmail(adminEmail: string, lowStockProducts: Array<{ name: string; stock: number; sku: string }>) {
    const subject = "⚠️ Alerta de Stock Bajo - EleCtroZ";
    
    const productRows = lowStockProducts
      .map(
        (p) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.sku}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; color: #e53e3e; font-weight: bold;">${p.stock}</td>
        </tr>
      `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #e53e3e;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #fff;
            padding: 30px;
            border: 1px solid #e0e0e0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th {
            background: #f7fafc;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid #e2e8f0;
          }
          .footer {
            background: #333;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 10px 10px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⚠️ Alerta de Stock Bajo</h1>
          <p>EleCtroZ</p>
        </div>
        
        <div class="content">
          <h2>Atención Administrador,</h2>
          <p>Los siguientes productos tienen stock bajo (≤ 5 unidades):</p>
          
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>
          
          <p><strong>Acción requerida:</strong> Por favor, considere reabastecer estos productos lo antes posible.</p>
        </div>
        
        <div class="footer">
          <p><strong>EleCtroZ</strong></p>
          <p>Sistema de Facturación Electrónica</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject,
      html,
    });
  },
};

