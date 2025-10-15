import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { dashboardController } from "../../modules/dashboard/dashboard.controller";

export const dashboardRouter = Router();

// Dashboard visible para ADMIN y SELLER (según permisos de frontend)
dashboardRouter.use(authenticate, authorize(["ADMIN", "SELLER"]));

dashboardRouter.get("/metrics", dashboardController.metrics);


