import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { invoiceController } from "../../modules/invoices/invoice.controller";

export const invoicesRouter = Router();

invoicesRouter.use(authenticate, authorize(["ADMIN", "SELLER"]));

invoicesRouter.get("/", invoiceController.list);
invoicesRouter.post("/", invoiceController.create);
invoicesRouter.post("/:id/issue", invoiceController.issue);
invoicesRouter.post("/:id/cancel", authorize(["ADMIN"]), invoiceController.cancel);
invoicesRouter.get("/:id", invoiceController.get);


