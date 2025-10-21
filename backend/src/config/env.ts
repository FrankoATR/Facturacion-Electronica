import dotenv from "dotenv";

dotenv.config();

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Validar que JWT_SECRET esté configurado en producción
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production");
}

// Validar longitud mínima del JWT_SECRET
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.warn("⚠️  WARNING: JWT_SECRET should be at least 32 characters long for security");
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseNumber(process.env.PORT, 4000),
  jwtSecret: process.env.JWT_SECRET || "change-me-in-prod",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  rateLimitWindowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMax: parseNumber(process.env.RATE_LIMIT_MAX, 200),
  // Configuración para rate limiting de login
  loginRateLimitWindowMs: parseNumber(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  loginRateLimitMax: parseNumber(process.env.LOGIN_RATE_LIMIT_MAX, 5),
  // Número máximo de intentos de login fallidos antes de bloqueo temporal
  maxLoginAttempts: parseNumber(process.env.MAX_LOGIN_ATTEMPTS, 5),
  loginLockoutDuration: parseNumber(process.env.LOGIN_LOCKOUT_DURATION, 15 * 60 * 1000),
  // Configuración de sesión
  sessionTimeout: parseNumber(process.env.SESSION_TIMEOUT, 30 * 60 * 1000), // 30 minutos
  // Configuración SMTP
  smtpHost: process.env.SMTP_HOST || "smtp.office365.com",
  smtpPort: parseNumber(process.env.SMTP_PORT, 587),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "Adventure Works <00086221@uca.edu.sv>",
};


