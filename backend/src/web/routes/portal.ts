import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { prisma } from "../../config/prisma";

export const portalRouter = Router();

// Customer portal: CUSTOMER and ADMIN roles can access
portalRouter.use(authenticate, authorize(["CUSTOMER", "ADMIN"]));

portalRouter.get("/my/invoices", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user?.clientId) return res.json({ data: [], linked: false });
  const invoices = await prisma.invoice.findMany({ 
    where: { clientId: user.clientId }, 
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
    }
  });
  res.json({ data: invoices, linked: true, clientId: user.clientId });
});

portalRouter.get("/my/invoices/:id/dte", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user?.clientId) return res.status(400).json({ message: "User not linked to client" });
  const inv = await prisma.invoice.findUnique({ where: { id: req.params.id } });
  if (!inv || inv.clientId !== user.clientId) return res.status(404).json({ message: "Not found" });
  const dte = await prisma.dTE.findUnique({ where: { invoiceId: inv.id } });
  res.json({ data: dte ?? { status: "PENDING" } });
});

// Nota: Se eliminaron las funcionalidades de vinculación de cuentas
// Los usuarios CUSTOMER ya están automáticamente vinculados a sus clientes al crearse


