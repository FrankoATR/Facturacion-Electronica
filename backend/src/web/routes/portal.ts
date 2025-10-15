import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { prisma } from "../../config/prisma";

export const portalRouter = Router();

// Customer portal: CUSTOMER role can only access own invoices/DTEs
portalRouter.use(authenticate, authorize(["CUSTOMER"]));

portalRouter.get("/my/invoices", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user?.clientId) return res.status(400).json({ message: "User not linked to client" });
  const invoices = await prisma.invoice.findMany({ where: { clientId: user.clientId }, orderBy: { createdAt: "desc" } });
  res.json({ data: invoices });
});

portalRouter.get("/my/invoices/:id/dte", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user?.clientId) return res.status(400).json({ message: "User not linked to client" });
  const inv = await prisma.invoice.findUnique({ where: { id: req.params.id } });
  if (!inv || inv.clientId !== user.clientId) return res.status(404).json({ message: "Not found" });
  const dte = await prisma.dTE.findUnique({ where: { invoiceId: inv.id } });
  res.json({ data: dte ?? { status: "PENDING" } });
});


