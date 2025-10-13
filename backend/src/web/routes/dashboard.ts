import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { dashboardController } from "../../modules/dashboard/dashboard.controller";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate, authorize(["ADMIN"]));

dashboardRouter.get("/metrics", dashboardController.metrics);


