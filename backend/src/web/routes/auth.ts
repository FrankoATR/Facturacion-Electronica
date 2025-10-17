import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { authController } from "../../modules/auth/auth.controller";
import { bruteForceMiddleware } from "../../middleware/brute-force";

export const authRouter = Router();

// Login con protección contra brute force
authRouter.post("/login", bruteForceMiddleware, authController.login);

// Obtener información del usuario autenticado
authRouter.get("/me", authenticate, authController.me);

// Logout (revocar token)
authRouter.post("/logout", authenticate, authController.logout);


