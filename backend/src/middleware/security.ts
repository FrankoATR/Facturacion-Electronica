import { Request, Response, NextFunction } from "express";
import { validateSecureInput } from "../common/sanitize";

/**
 * Middleware para validar inputs contra inyecciones y ataques
 */
export function validateInputSecurity(req: Request, res: Response, next: NextFunction) {
  const checkObject = (obj: any, path: string = 'body'): string[] => {
    const threats: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        const validation = validateSecureInput(value);
        if (!validation.isValid) {
          threats.push(`${path}.${key}: ${validation.threats.join(', ')}`);
        }
      } else if (typeof value === 'object' && value !== null) {
        threats.push(...checkObject(value, `${path}.${key}`));
      }
    }
    
    return threats;
  };

  const bodyThreats = req.body ? checkObject(req.body, 'body') : [];
  const queryThreats = req.query ? checkObject(req.query, 'query') : [];
  const paramsThreats = req.params ? checkObject(req.params, 'params') : [];

  const allThreats = [...bodyThreats, ...queryThreats, ...paramsThreats];

  if (allThreats.length > 0) {
    console.error('🚨 [SECURITY] Potential attack detected:', {
      ip: req.ip,
      method: req.method,
      path: req.path,
      threats: allThreats,
      timestamp: new Date().toISOString()
    });

    return res.status(400).json({
      message: 'Invalid input detected',
      error: 'Security validation failed'
    });
  }

  next();
}

/**
 * Middleware para detectar user-agents sospechosos
 */
export function detectSuspiciousUserAgent(req: Request, res: Response, next: NextFunction) {
  const userAgent = req.headers['user-agent'] || '';
  
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /acunetix/i,
    /netsparker/i,
    /burp/i,
    /havij/i,
    /pangolin/i,
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));

  if (isSuspicious) {
    console.warn('⚠️ [SECURITY] Suspicious user agent detected:', {
      userAgent,
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }

  next();
}

/**
 * Middleware para prevenir ataques de timing
 * Agrega delay aleatorio para dificultar timing attacks
 */
export function preventTimingAttacks(sensitiveRoutes: string[] = ['/api/auth/login']) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (sensitiveRoutes.some(route => req.path.includes(route))) {
      // Agregar delay aleatorio de 100-300ms
      const delay = Math.floor(Math.random() * 200) + 100;
      setTimeout(() => next(), delay);
    } else {
      next();
    }
  };
}

/**
 * Middleware para agregar headers de seguridad adicionales
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevenir MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Habilitar protección XSS del navegador
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
}

