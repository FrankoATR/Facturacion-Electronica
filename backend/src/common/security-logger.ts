import { Request } from "express";
import { prisma } from "../config/prisma";

/**
 * Tipos de eventos de seguridad
 */
export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGIN_BLOCKED = 'LOGIN_BLOCKED',
  LOGOUT = 'LOGOUT',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  FORBIDDEN_ACCESS = 'FORBIDDEN_ACCESS',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT',
  DATA_BREACH_ATTEMPT = 'DATA_BREACH_ATTEMPT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

/**
 * Severidad del evento de seguridad
 */
export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

interface SecurityLogEntry {
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  userEmail?: string;
  ip: string;
  userAgent: string;
  endpoint: string;
  method: string;
  details?: any;
  timestamp: Date;
}

/**
 * Logger de eventos de seguridad
 */
class SecurityLogger {
  private logs: SecurityLogEntry[] = [];
  private maxLogsInMemory = 1000;

  /**
   * Registra un evento de seguridad
   */
  async log(entry: SecurityLogEntry): Promise<void> {
    // Agregar a memoria
    this.logs.push(entry);
    
    // Mantener solo los últimos N logs en memoria
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs.shift();
    }

    // Log en consola con color según severidad
    const color = this.getSeverityColor(entry.severity);
    console.log(
      `${color}[SECURITY ${entry.severity}] ${entry.eventType}\x1b[0m`,
      {
        user: entry.userEmail || entry.userId || 'anonymous',
        ip: entry.ip,
        endpoint: `${entry.method} ${entry.endpoint}`,
        details: entry.details,
        timestamp: entry.timestamp.toISOString(),
      }
    );

    // Registrar en base de datos (AuditLog)
    try {
      await prisma.auditLog.create({
        data: {
          action: entry.eventType,
          entity: 'SECURITY',
          entityId: entry.userId || 'system',
          actorId: entry.userId,
          payload: {
            severity: entry.severity,
            ip: entry.ip,
            userAgent: entry.userAgent,
            endpoint: entry.endpoint,
            method: entry.method,
            details: entry.details,
          },
          hash: this.generateHash(entry),
          prevHash: await this.getLastHash(),
        },
      });
    } catch (error) {
      console.error('Error saving security log to database:', error);
    }

    // Alertas para eventos críticos
    if (entry.severity === SecuritySeverity.CRITICAL) {
      await this.sendCriticalAlert(entry);
    }
  }

  /**
   * Crea un log desde un request de Express
   */
  logFromRequest(
    req: Request,
    eventType: SecurityEventType,
    severity: SecuritySeverity,
    details?: any
  ): Promise<void> {
    return this.log({
      eventType,
      severity,
      userId: req.user?.id,
      userEmail: req.user?.email,
      ip: this.getClientIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      endpoint: req.path,
      method: req.method,
      details,
      timestamp: new Date(),
    });
  }

  /**
   * Obtiene la IP real del cliente (considerando proxies)
   */
  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Genera hash del evento para integridad
   */
  private generateHash(entry: SecurityLogEntry): string {
    const crypto = require('crypto');
    const data = JSON.stringify({
      eventType: entry.eventType,
      userId: entry.userId,
      ip: entry.ip,
      timestamp: entry.timestamp.toISOString(),
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Obtiene el último hash de la cadena de auditoría
   */
  private async getLastHash(): Promise<string | null> {
    try {
      const lastLog = await prisma.auditLog.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { hash: true },
      });
      return lastLog?.hash || null;
    } catch {
      return null;
    }
  }

  /**
   * Color según severidad
   */
  private getSeverityColor(severity: SecuritySeverity): string {
    switch (severity) {
      case SecuritySeverity.LOW:
        return '\x1b[36m'; // Cyan
      case SecuritySeverity.MEDIUM:
        return '\x1b[33m'; // Yellow
      case SecuritySeverity.HIGH:
        return '\x1b[31m'; // Red
      case SecuritySeverity.CRITICAL:
        return '\x1b[35m\x1b[1m'; // Magenta bold
      default:
        return '\x1b[0m'; // Reset
    }
  }

  /**
   * Envía alerta para eventos críticos
   */
  private async sendCriticalAlert(entry: SecurityLogEntry): Promise<void> {
    // En producción, aquí se enviaría email, SMS, webhook, etc.
    console.error('🚨🚨🚨 CRITICAL SECURITY EVENT 🚨🚨🚨');
    console.error(JSON.stringify(entry, null, 2));
    
    // TODO: Integrar con servicio de alertas (email, Slack, PagerDuty, etc.)
  }

  /**
   * Obtiene logs recientes
   */
  getRecentLogs(limit: number = 100): SecurityLogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Obtiene logs por usuario
   */
  getLogsByUser(userId: string, limit: number = 50): SecurityLogEntry[] {
    return this.logs
      .filter(log => log.userId === userId)
      .slice(-limit);
  }

  /**
   * Obtiene estadísticas de seguridad
   */
  getStats(): {
    total: number;
    bySeverity: Record<SecuritySeverity, number>;
    byType: Record<SecurityEventType, number>;
  } {
    const stats = {
      total: this.logs.length,
      bySeverity: {} as Record<SecuritySeverity, number>,
      byType: {} as Record<SecurityEventType, number>,
    };

    this.logs.forEach(log => {
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
      stats.byType[log.eventType] = (stats.byType[log.eventType] || 0) + 1;
    });

    return stats;
  }
}

// Singleton
export const securityLogger = new SecurityLogger();

