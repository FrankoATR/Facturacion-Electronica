import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { securityLogger, SecurityEventType, SecuritySeverity } from "../common/security-logger";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  
  if (!header || !header.startsWith("Bearer ")) {
    securityLogger.logFromRequest(req, SecurityEventType.UNAUTHORIZED_ACCESS, SecuritySeverity.LOW, {
      reason: 'Missing or invalid authorization header'
    });
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const token = header.replace("Bearer ", "");
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    const isExpired = err.name === 'TokenExpiredError';
    
    securityLogger.logFromRequest(req, 
      isExpired ? SecurityEventType.TOKEN_EXPIRED : SecurityEventType.UNAUTHORIZED_ACCESS,
      SecuritySeverity.LOW,
      { reason: err.message }
    );
    
    return res.status(401).json({
      message: isExpired ? "Token expired" : "Invalid token",
      code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
    });
  }
}

export function authorize(roles: Array<"ADMIN" | "SELLER" | "ACCOUNTANT" | "AUDITOR" | "CUSTOMER">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      securityLogger.logFromRequest(req, SecurityEventType.UNAUTHORIZED_ACCESS, SecuritySeverity.MEDIUM, {
        reason: 'No user in request'
      });
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!roles.includes(req.user.role)) {
      securityLogger.logFromRequest(req, SecurityEventType.FORBIDDEN_ACCESS, SecuritySeverity.MEDIUM, {
        reason: 'Insufficient permissions',
        userRole: req.user.role,
        requiredRoles: roles
      });
      return res.status(403).json({ message: "Forbidden" });
    }
    
    return next();
  };
}


