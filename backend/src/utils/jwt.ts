import jwt from "jsonwebtoken";
import { env } from "../config/env";

type JwtPayload = {
  id: string;
  email: string;
  role: "ADMIN" | "SELLER";
};

export function signToken(payload: JwtPayload, expiresIn: string = "8h"): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}


