import { Router } from "express";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { clientsRouter } from "./routes/clients";
import { productsRouter } from "./routes/products";
import { invoicesRouter } from "./routes/invoices";
import { salesRouter } from "./routes/sales";
import { dashboardRouter } from "./routes/dashboard";
import { reportsRouter } from "./routes/reports";
import { dteRouter } from "./routes/dte";
import { paymentsRouter } from "./routes/payments";
import { auditRouter } from "./routes/audit";
import { portalRouter } from "./routes/portal";
import { backupRouter } from "./routes/backup";
import { notificationsRouter } from "./routes/notifications";
import { testSmtpRouter } from "./routes/test-smtp";

export const router = Router();

router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/clients", clientsRouter);
router.use("/products", productsRouter);
router.use("/invoices", invoicesRouter);
router.use("/sales", salesRouter);
router.use("/dashboard", dashboardRouter);
router.use("/reports", reportsRouter);
router.use("/dte", dteRouter);
router.use("/payments", paymentsRouter);
router.use("/audit", auditRouter);
router.use("/portal", portalRouter);
router.use("/admin", backupRouter);
router.use("/notifications", notificationsRouter);
router.use("/admin", testSmtpRouter);


