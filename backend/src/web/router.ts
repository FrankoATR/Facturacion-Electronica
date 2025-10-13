import { Router } from "express";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { clientsRouter } from "./routes/clients";
import { productsRouter } from "./routes/products";
import { invoicesRouter } from "./routes/invoices";
import { salesRouter } from "./routes/sales";
import { dashboardRouter } from "./routes/dashboard";

export const router = Router();

router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/clients", clientsRouter);
router.use("/products", productsRouter);
router.use("/invoices", invoicesRouter);
router.use("/sales", salesRouter);
router.use("/dashboard", dashboardRouter);


