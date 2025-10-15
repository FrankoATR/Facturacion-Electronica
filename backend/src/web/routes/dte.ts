import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { prisma } from "../../config/prisma";

export const dteRouter = Router();

// Only Admin and Seller can send DTE; retry allowed as well
dteRouter.use(authenticate, authorize(["ADMIN", "SELLER"]));

async function simulateDteSend(invoiceId: string) {
  // This simulates a DTE send: 80% success, 20% error
  const ok = Math.random() > 0.2;
  if (ok) {
    return { status: "ACCEPTED", xmlUrl: `https://example.com/dte/${invoiceId}.xml`, ackUrl: `https://example.com/ack/${invoiceId}.pdf` } as const;
  }
  throw new Error("Simulated DTE error");
}

dteRouter.post("/:invoiceId/send", async (req, res) => {
  const { invoiceId } = req.params;
  const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!inv) return res.status(404).json({ message: "Not found" });

  try {
    const result = await simulateDteSend(invoiceId);
    await prisma.$transaction(async (tx) => {
      await tx.dTE.upsert({
        where: { invoiceId },
        create: { invoiceId, status: "ACCEPTED", hash: `hash-${invoiceId}`, xmlUrl: result.xmlUrl, ackUrl: result.ackUrl, sentAt: new Date(), ackAt: new Date() },
        update: { status: "ACCEPTED", xmlUrl: result.xmlUrl, ackUrl: result.ackUrl, ackAt: new Date() },
      });
      await tx.invoice.update({ where: { id: invoiceId }, data: { electronicFiscalStamp: `stamp-${invoiceId}` } });
    });
    res.json({ message: "DTE accepted" });
  } catch (e: any) {
    await prisma.dTE.upsert({
      where: { invoiceId },
      create: { invoiceId, status: "ERROR", hash: `hash-${invoiceId}`, lastError: e.message, retries: 0, sentAt: new Date() },
      update: { status: "ERROR", lastError: e.message },
    });
    res.status(502).json({ message: "DTE send failed" });
  }
});

dteRouter.post("/:invoiceId/retry", async (req, res) => {
  const { invoiceId } = req.params;
  const dte = await prisma.dTE.findUnique({ where: { invoiceId } });
  if (!dte) return res.status(404).json({ message: "DTE not found" });

  try {
    const result = await simulateDteSend(invoiceId);
    await prisma.dTE.update({ where: { invoiceId }, data: { status: "ACCEPTED", retries: dte.retries + 1, xmlUrl: result.xmlUrl, ackUrl: result.ackUrl, ackAt: new Date() } });
    res.json({ message: "DTE accepted" });
  } catch (e: any) {
    await prisma.dTE.update({ where: { invoiceId }, data: { status: "ERROR", retries: dte.retries + 1, lastError: e.message } });
    res.status(502).json({ message: "DTE send failed" });
  }
});


