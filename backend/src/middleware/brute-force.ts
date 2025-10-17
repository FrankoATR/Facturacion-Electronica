import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { securityLogger, SecurityEventType, SecuritySeverity } from "../common/security-logger";

interface LoginAttempt {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  lockedUntil?: number;
}

/**
 * Sistema de protección contra Brute Force
 * Rastrea intentos de login fallidos por IP y email
 */
class BruteForceProtection {
  private attemptsByIp = new Map<string, LoginAttempt>();
  private attemptsByEmail = new Map<string, LoginAttempt>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Limpiar registros antiguos cada 5 minutos
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Verifica si una IP está bloqueada
   */
  isIpBlocked(ip: string): boolean {
    const attempt = this.attemptsByIp.get(ip);
    if (!attempt || !attempt.lockedUntil) return false;
    
    if (Date.now() < attempt.lockedUntil) {
      return true;
    }
    
    // Desbloquear si el tiempo expiró
    this.attemptsByIp.delete(ip);
    return false;
  }

  /**
   * Verifica si un email está bloqueado
   */
  isEmailBlocked(email: string): boolean {
    const attempt = this.attemptsByEmail.get(email);
    if (!attempt || !attempt.lockedUntil) return false;
    
    if (Date.now() < attempt.lockedUntil) {
      return true;
    }
    
    // Desbloquear si el tiempo expiró
    this.attemptsByEmail.delete(email);
    return false;
  }

  /**
   * Registra un intento de login fallido
   */
  recordFailedAttempt(ip: string, email: string): void {
    const now = Date.now();
    
    // Registrar por IP
    this.recordAttempt(this.attemptsByIp, ip, now);
    
    // Registrar por email
    this.recordAttempt(this.attemptsByEmail, email, now);
  }

  /**
   * Registra un intento en un mapa
   */
  private recordAttempt(map: Map<string, LoginAttempt>, key: string, now: number): void {
    const existing = map.get(key);
    
    if (!existing) {
      map.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return;
    }

    // Si pasó el tiempo de ventana, resetear contador
    if (now - existing.firstAttempt > env.loginRateLimitWindowMs) {
      map.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return;
    }

    // Incrementar contador
    existing.count++;
    existing.lastAttempt = now;

    // Bloquear si excede el máximo de intentos
    if (existing.count >= env.maxLoginAttempts) {
      existing.lockedUntil = now + env.loginLockoutDuration;
      map.set(key, existing);
    }
  }

  /**
   * Resetea los intentos después de un login exitoso
   */
  resetAttempts(ip: string, email: string): void {
    this.attemptsByIp.delete(ip);
    this.attemptsByEmail.delete(email);
  }

  /**
   * Obtiene el número de intentos restantes para una IP
   */
  getRemainingAttempts(ip: string): number {
    const attempt = this.attemptsByIp.get(ip);
    if (!attempt) return env.maxLoginAttempts;
    return Math.max(0, env.maxLoginAttempts - attempt.count);
  }

  /**
   * Obtiene el tiempo restante de bloqueo en segundos
   */
  getLockoutTimeRemaining(ip: string, email: string): number {
    const ipAttempt = this.attemptsByIp.get(ip);
    const emailAttempt = this.attemptsByEmail.get(email);
    
    const ipLockout = ipAttempt?.lockedUntil || 0;
    const emailLockout = emailAttempt?.lockedUntil || 0;
    
    const maxLockout = Math.max(ipLockout, emailLockout);
    
    if (maxLockout === 0) return 0;
    
    return Math.max(0, Math.ceil((maxLockout - Date.now()) / 1000));
  }

  /**
   * Limpia registros antiguos
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = env.loginRateLimitWindowMs * 2;

    // Limpiar IPs
    for (const [ip, attempt] of this.attemptsByIp.entries()) {
      if (now - attempt.lastAttempt > maxAge && (!attempt.lockedUntil || now > attempt.lockedUntil)) {
        this.attemptsByIp.delete(ip);
      }
    }

    // Limpiar emails
    for (const [email, attempt] of this.attemptsByEmail.entries()) {
      if (now - attempt.lastAttempt > maxAge && (!attempt.lockedUntil || now > attempt.lockedUntil)) {
        this.attemptsByEmail.delete(email);
      }
    }
  }

  /**
   * Obtiene estadísticas
   */
  getStats(): { blockedIps: number; blockedEmails: number; totalAttempts: number } {
    const now = Date.now();
    let blockedIps = 0;
    let blockedEmails = 0;
    let totalAttempts = 0;

    for (const attempt of this.attemptsByIp.values()) {
      totalAttempts += attempt.count;
      if (attempt.lockedUntil && now < attempt.lockedUntil) {
        blockedIps++;
      }
    }

    for (const attempt of this.attemptsByEmail.values()) {
      if (attempt.lockedUntil && now < attempt.lockedUntil) {
        blockedEmails++;
      }
    }

    return { blockedIps, blockedEmails, totalAttempts };
  }

  /**
   * Desbloquea manualmente una IP o email (uso administrativo)
   */
  unblock(identifier: string): void {
    this.attemptsByIp.delete(identifier);
    this.attemptsByEmail.delete(identifier);
  }

  /**
   * Destructor para limpiar el intervalo
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

// Singleton
export const bruteForceProtection = new BruteForceProtection();

/**
 * Middleware para proteger rutas de login contra brute force
 */
export function bruteForceMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
              req.ip ||
              req.socket.remoteAddress ||
              'unknown';
  
  const email = req.body?.email || '';

  // Verificar si la IP está bloqueada
  if (bruteForceProtection.isIpBlocked(ip)) {
    const remainingTime = bruteForceProtection.getLockoutTimeRemaining(ip, email);
    
    securityLogger.logFromRequest(
      req,
      SecurityEventType.LOGIN_BLOCKED,
      SecuritySeverity.HIGH,
      { reason: 'IP blocked due to too many failed attempts', remainingTime }
    );

    return res.status(429).json({
      message: `Too many login attempts. Please try again in ${remainingTime} seconds.`,
      retryAfter: remainingTime,
    });
  }

  // Verificar si el email está bloqueado
  if (email && bruteForceProtection.isEmailBlocked(email)) {
    const remainingTime = bruteForceProtection.getLockoutTimeRemaining(ip, email);
    
    securityLogger.logFromRequest(
      req,
      SecurityEventType.LOGIN_BLOCKED,
      SecuritySeverity.HIGH,
      { reason: 'Email blocked due to too many failed attempts', remainingTime }
    );

    return res.status(429).json({
      message: `Too many login attempts for this account. Please try again in ${remainingTime} seconds.`,
      retryAfter: remainingTime,
    });
  }

  next();
}

