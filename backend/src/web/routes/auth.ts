import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { authController } from "../../modules/auth/auth.controller";

export const authRouter = Router();

authRouter.post("/login", authController.login);
authRouter.get("/me", authenticate, authController.me);


