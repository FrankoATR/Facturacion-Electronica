import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { emailService } from "../../modules/email/email.service";

export const testSmtpRouter = Router();

// Endpoint para probar SMTP (solo administradores)
testSmtpRouter.post("/test-smtp", authenticate, authorize(["ADMIN"]), async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email es requerido" });
    }

    const result = await emailService.sendEmail({
      to: email,
      subject: "Prueba de SMTP - EleCtroZ",
      html: `
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
            .content {
              background: #f9f9f9;
              padding: 30px;
              border: 1px solid #e0e0e0;
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
            <h1>🏪 EleCtroZ</h1>
            <p>Prueba de SMTP</p>
          </div>
          
          <div class="content">
            <h2>¡Hola!</h2>
            <p>Este es un correo de prueba para verificar que el servicio SMTP está funcionando correctamente.</p>
            <p><strong>Fecha de envío:</strong> ${new Date().toLocaleString('es-SV')}</p>
            <p><strong>Servidor:</strong> ${process.env.SMTP_HOST || 'smtp.office365.com'}</p>
          </div>
          
          <div class="footer">
            <p><strong>EleCtroZ</strong></p>
            <p>Sistema de Facturación Electrónica - El Salvador</p>
          </div>
        </body>
        </html>
      `
    });

    if (result.success) {
      res.json({ 
        success: true, 
        message: "Correo enviado exitosamente",
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: "Error al enviar correo",
        error: result.error 
      });
    }
  } catch (error: any) {
    console.error("Error en test SMTP:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor",
      error: error.message 
    });
  }
});

// Endpoint para verificar configuración SMTP
testSmtpRouter.get("/smtp-status", authenticate, authorize(["ADMIN"]), async (req, res) => {
  try {
    const smtpConfig = {
      host: process.env.SMTP_HOST || "smtp.office365.com",
      port: process.env.SMTP_PORT || 587,
      user: process.env.SMTP_USER || "No configurado",
      userMasked: process.env.SMTP_USER ? "***@***.***" : "No configurado",
      from: process.env.SMTP_FROM || "EleCtroZ <noreply@electroz.com>",
      configured: !!(process.env.SMTP_USER && process.env.SMTP_PASS)
    };

    res.json({
      success: true,
      config: smtpConfig
    });
  } catch (error: any) {
    console.error("Error al obtener estado SMTP:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor",
      error: error.message 
    });
  }
});
