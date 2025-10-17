import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { prisma } from "../../config/prisma";
import { appendAuditLog } from "../../common/audit";

export const paymentsRouter = Router();

paymentsRouter.use(authenticate, authorize(["ADMIN", "SELLER", "ACCOUNTANT"]));

paymentsRouter.post("/:invoiceId", async (req, res) => {
  const { invoiceId } = req.params;
  const { amount, method, note } = req.body ?? {};
  if (!(amount > 0) || !method) return res.status(400).json({ message: "Invalid" });

  const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!inv) return res.status(404).json({ message: "Not found" });

  const result = await prisma.$transaction(async (tx) => {
    await tx.payment.create({ data: { invoiceId, amount, method, note, createdById: req.user?.id } });
    const paidTotal = Number(inv.paidTotal) + Number(amount);
    const balance = Number(inv.total) - paidTotal;
    const updated = await tx.invoice.update({ where: { id: invoiceId }, data: { paidTotal, balance } });
    return updated;
  });

  await appendAuditLog({ actorId: req.user?.id, action: "PAYMENT_REGISTERED", entity: "Invoice", entityId: invoiceId, payload: { amount, method } });
  res.json({ data: { id: invoiceId, paidTotal: result.paidTotal, balance: result.balance } });
});


