import { Request, Response } from "express";
import { LoginDto } from "./auth.dto";
import { authService } from "./auth.service";
import { prisma } from "../../config/prisma";
import { bruteForceProtection } from "../../middleware/brute-force";
import { securityLogger, SecurityEventType, SecuritySeverity } from "../../common/security-logger";
import { revokeToken, signRefreshToken } from "../../utils/jwt";
import { sanitizeEmail } from "../../common/sanitize";

export const authController = {
  async login(req: Request, res: Response) {
    try {
      // Validar y sanitizar input
      const parsed = LoginDto.safeParse(req.body);
      if (!parsed.success) {
        await securityLogger.logFromRequest(req, SecurityEventType.LOGIN_FAILED, SecuritySeverity.LOW, {
          reason: 'Invalid input format',
          errors: parsed.error.errors
        });
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const { email, password } = parsed.data;
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';

      // Sanitizar email
      let sanitizedEmail: string;
      try {
        sanitizedEmail = sanitizeEmail(email);
      } catch (error) {
        await securityLogger.logFromRequest(req, SecurityEventType.LOGIN_FAILED, SecuritySeverity.MEDIUM, {
          reason: 'Invalid email format or suspicious characters'
        });
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Intentar autenticar
      const result = await authService.login(sanitizedEmail, password);
      
      if (!result) {
        // Registrar intento fallido
        bruteForceProtection.recordFailedAttempt(ip, sanitizedEmail);
        
        const remainingAttempts = bruteForceProtection.getRemainingAttempts(ip);
        
        await securityLogger.logFromRequest(req, SecurityEventType.LOGIN_FAILED, SecuritySeverity.MEDIUM, {
          email: sanitizedEmail,
          remainingAttempts
        });

        return res.status(401).json({
          message: "Invalid credentials",
          remainingAttempts: remainingAttempts > 0 ? remainingAttempts : undefined
        });
      }

      // Login exitoso - resetear intentos
      bruteForceProtection.resetAttempts(ip, sanitizedEmail);

      // Generar refresh token
      const refreshToken = signRefreshToken({
        id: result.user.id,
        email: result.user.email,
        role: result.user.role
      });

      await securityLogger.logFromRequest(req, SecurityEventType.LOGIN_SUCCESS, SecuritySeverity.LOW, {
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role
      });

      res.json({
        ...result,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      });
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      await securityLogger.logFromRequest(req, SecurityEventType.LOGIN_FAILED, SecuritySeverity.HIGH, {
        error: String(error)
      });
      res.status(500).json({ message: "Internal server error" });
    }
  },

  async me(req: Request, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { id: true, email: true, name: true, role: true, isActive: true, lastLoginAt: true }
      });

      if (!user || !user.isActive) {
        await securityLogger.logFromRequest(req, SecurityEventType.UNAUTHORIZED_ACCESS, SecuritySeverity.MEDIUM, {
          reason: 'User not found or inactive'
        });
        return res.status(401).json({ message: "Unauthorized" });
      }

      res.json({ user });
    } catch (error) {
      console.error('[AUTH] Me error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  async logout(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (token) {
        revokeToken(token);
      }

      await securityLogger.logFromRequest(req, SecurityEventType.LOGOUT, SecuritySeverity.LOW);

      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error('[AUTH] Logout error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  /**
   * POST /api/auth/unblock
   * Administrative endpoint to unblock a user/IP from brute force protection
   */
  async unblock(req: Request, res: Response) {
    try {
      const { identifier } = req.body; // email or IP

      if (!identifier) {
        return res.status(400).json({ message: "Identifier (email or IP) is required" });
      }

      // Import brute force protection
      const { bruteForceProtection } = await import("../../middleware/brute-force");

      // Unblock the identifier
      bruteForceProtection.unblock(identifier);

      await securityLogger.logFromRequest(req, SecurityEventType.SUSPICIOUS_ACTIVITY, SecuritySeverity.MEDIUM, {
        action: 'UNBLOCK_USER',
        identifier,
        adminUser: req.user?.email || 'system'
      });

      return res.json({
        message: `Successfully unblocked: ${identifier}`,
      });
    } catch (error: any) {
      console.error("[AUTH] Unblock error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};


