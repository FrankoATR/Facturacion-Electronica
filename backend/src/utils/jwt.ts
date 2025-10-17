import jwt from "jsonwebtoken";
import { env } from "../config/env";
import crypto from "crypto";

export type JwtPayload = {
  id: string;
  email: string;
  role: "ADMIN" | "SELLER" | "ACCOUNTANT" | "AUDITOR" | "CUSTOMER";
  jti?: string; // JWT ID para rastreo y revocación
  iat?: number; // Issued at
  exp?: number; // Expiration
};

// Blacklist simple en memoria (en producción usar Redis)
const tokenBlacklist = new Set<string>();
const sessionActivity = new Map<string, number>(); // userId -> lastActivityTimestamp

/**
 * Genera un token de acceso JWT
 * @param payload - Datos del usuario
 * @param expiresIn - Tiempo de expiración (por defecto desde env)
 */
export function signToken(payload: JwtPayload, expiresIn?: string): string {
  const jti = crypto.randomUUID(); // Identificador único del token
  return jwt.sign(
    { ...payload, jti },
    env.jwtSecret,
    { 
      expiresIn: expiresIn || env.jwtExpiresIn,
      issuer: "facturacion-system",
      audience: "facturacion-api"
    }
  );
}

/**
 * Genera un refresh token de larga duración
 * @param payload - Datos del usuario
 */
export function signRefreshToken(payload: JwtPayload): string {
  const jti = crypto.randomUUID();
  return jwt.sign(
    { ...payload, jti, type: "refresh" },
    env.jwtSecret,
    { 
      expiresIn: env.jwtRefreshExpiresIn,
      issuer: "facturacion-system",
      audience: "facturacion-api"
    }
  );
}

/**
 * Verifica un token JWT
 * @param token - Token a verificar
 * @returns Payload decodificado
 * @throws Error si el token es inválido o está en blacklist
 */
export function verifyToken(token: string): JwtPayload {
  // Verificar si el token está en blacklist
  if (tokenBlacklist.has(token)) {
    throw new Error("Token has been revoked");
  }

  const decoded = jwt.verify(token, env.jwtSecret, {
    issuer: "facturacion-system",
    audience: "facturacion-api"
  }) as JwtPayload;

  // Verificar actividad de sesión
  const lastActivity = sessionActivity.get(decoded.id);
  if (lastActivity && Date.now() - lastActivity > env.sessionTimeout) {
    throw new Error("Session timeout");
  }

  // Actualizar última actividad
  sessionActivity.set(decoded.id, Date.now());

  return decoded;
}

/**
 * Revoca un token agregándolo a la blacklist
 * @param token - Token a revocar
 */
export function revokeToken(token: string): void {
  tokenBlacklist.add(token);
  
  // Limpiar tokens expirados de la blacklist cada hora
  setTimeout(() => {
    try {
      jwt.verify(token, env.jwtSecret);
    } catch {
      // Si el token expiró, removerlo de la blacklist
      tokenBlacklist.delete(token);
    }
  }, 60 * 60 * 1000);
}

/**
 * Revoca todas las sesiones de un usuario
 * @param userId - ID del usuario
 */
export function revokeUserSessions(userId: string): void {
  sessionActivity.delete(userId);
  // En producción, aquí se invalidarían todos los tokens del usuario en Redis
}

/**
 * Obtiene el tiempo restante de un token en segundos
 * @param token - Token JWT
 * @returns Segundos restantes o null si es inválido
 */
export function getTokenExpiration(token: string): number | null {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded.exp) return null;
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.exp - now);
  } catch {
    return null;
  }
}


