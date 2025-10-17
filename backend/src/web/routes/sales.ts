import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { salesController } from "../../modules/sales/sales.controller";

export const salesRouter = Router();

salesRouter.use(authenticate, authorize(["ADMIN", "SELLER"]));

salesRouter.get("/", salesController.list);


