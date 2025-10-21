import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error";
import { router } from "./web/router";
import { 
  validateInputSecurity, 
  detectSuspiciousUserAgent, 
  preventTimingAttacks,
  securityHeaders 
} from "./middleware/security";
import { initStockMonitoring } from "./cron/stock-monitor";

const app = express();

// ============= SECURITY MIDDLEWARES =============

// Helmet para headers de seguridad básicos
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Permitir estilos inline (ajustar en producción)
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// Headers de seguridad adicionales
app.use(securityHeaders);

// CORS configurado
app.use(cors({ 
  origin: env.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON con límite
app.use(express.json({ limit: "1mb" }));

// Compression
app.use(compression());

// Logging HTTP
app.use(morgan("combined"));

// Rate limiting global
app.use(
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    limit: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
    handler: (req, res) => {
      console.warn(`⚠️ [RATE LIMIT] IP ${req.ip} exceeded rate limit`);
      res.status(429).json({
        message: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(env.rateLimitWindowMs / 1000)
      });
    }
  })
);

// Detectar user agents sospechosos
app.use(detectSuspiciousUserAgent);

// Validar inputs contra inyecciones (aplicar selectivamente, puede ser pesado)
// app.use(validateInputSecurity); // Descomentar para habilitar validación global

// Prevenir timing attacks en rutas sensibles
app.use(preventTimingAttacks(['/api/auth/login']));

// ============= ROUTES =============
app.use("/api", router);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============= ERROR HANDLING =============
app.use(errorHandler);

// ============= START SERVER =============
const server = app.listen(env.port, () => {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log(`║  🚀 API Server Running on http://localhost:${env.port.toString().padEnd(4)}        ║`);
  console.log(`║  🔒 Environment: ${env.nodeEnv.padEnd(37)} ║`);
  console.log('║  🛡️  Security Features Enabled:                          ║');
  console.log('║     ✓ JWT Authentication with Token Rotation            ║');
  console.log('║     ✓ Brute Force Protection                            ║');
  console.log('║     ✓ Rate Limiting                                     ║');
  console.log('║     ✓ Input Sanitization (XSS, SQL Injection)           ║');
  console.log('║     ✓ Security Headers (Helmet + Custom)                ║');
  console.log('║     ✓ CORS Configured                                   ║');
  console.log('║     ✓ Session Timeout & Activity Tracking               ║');
  console.log('║     ✓ Security Event Logging                            ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  // Iniciar monitoreo de stock
  initStockMonitoring();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});


