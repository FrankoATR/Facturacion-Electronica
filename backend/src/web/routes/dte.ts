import { Router, Request, Response, NextFunction } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { prisma } from "../../config/prisma";
import PDFDocument from "pdfkit";
import { buildInvoiceDto, trySendDte } from "../../modules/dte/dte.service";
import { verifyToken } from "../../utils/jwt";

export const dteRouter = Router();

// Allow auth from header or token query param for file downloads
function authenticateFromQueryOrHeader(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = (req.query.token as string | undefined) || undefined;
  if (header && header.startsWith("Bearer ")) {
    return authenticate(req, res, next);
  }
  if (token) {
    try {
      const payload = verifyToken(token);
      req.user = payload;
      return next();
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }
  }
  return res.status(401).json({ message: "Unauthorized" });
}

dteRouter.post("/:invoiceId/send", authenticate, authorize(["ADMIN", "SELLER"]), async (req, res) => {
  const { invoiceId } = req.params;
  const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!inv) return res.status(404).json({ message: "Not found" });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({ where: { id: invoiceId }, data: { electronicFiscalStamp: `stamp-${invoiceId}` } });
    });
    await trySendDte(invoiceId);
    res.json({ message: "DTE accepted" });
  } catch (e: any) {
    res.status(502).json({ message: "DTE send failed" });
  }
});

dteRouter.post("/:invoiceId/retry", authenticate, authorize(["ADMIN", "SELLER"]), async (req, res) => {
  const { invoiceId } = req.params;
  const dte = await prisma.dTE.findUnique({ where: { invoiceId } });
  if (!dte) return res.status(404).json({ message: "DTE not found" });

  await trySendDte(invoiceId);
  res.json({ message: "Retry processed" });
});

// Download DTE JSON
dteRouter.get("/:invoiceId/json", authenticateFromQueryOrHeader, authorize(["ADMIN", "SELLER", "ACCOUNTANT", "AUDITOR", "CUSTOMER"]), async (req, res) => {
  const dto = await buildInvoiceDto(req.params.invoiceId);
  if (!dto) return res.status(404).json({ message: "Not found" });
  res.setHeader("Content-Disposition", `attachment; filename=dte-${dto.number}.json`);
  res.json(dto as any);
});

// Download DTE PDF (clean, sin botones)
dteRouter.get("/:invoiceId/pdf", authenticateFromQueryOrHeader, authorize(["ADMIN", "SELLER", "ACCOUNTANT", "AUDITOR", "CUSTOMER"]), async (req, res) => {
  const dto = await buildInvoiceDto(req.params.invoiceId);
  if (!dto) return res.status(404).json({ message: "Not found" });

  const doc = new PDFDocument({ margin: 36 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=dte-${dto.number}.pdf`);
  doc.pipe(res);

  doc.fontSize(18).text(`Factura ${dto.number}`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Fecha: ${dto.issuedAt ? new Date(dto.issuedAt).toLocaleString() : '-'}`);
  doc.text(`Tipo: ${dto.type}`);
  doc.text(`Cliente: ${dto.client.name} (${dto.client.taxId})`);
  doc.moveDown();

  doc.text('Items:', { underline: true });
  dto.items.forEach((it, idx) => {
    doc.text(`${idx + 1}. ${it.description} x${it.quantity}  PU: $${it.unitPrice.toFixed(2)}  Subtotal: $${it.subtotal.toFixed(2)}  IVA: $${it.taxAmount.toFixed(2)}  Total: $${it.total.toFixed(2)}`);
  });
  doc.moveDown();
  doc.text(`Subtotal: $${dto.totals.subtotal.toFixed(2)}`);
  doc.text(`IVA: $${dto.totals.taxTotal.toFixed(2)}`);
  doc.text(`Total: $${dto.totals.total.toFixed(2)}`);
  if (dto.dte) {
    doc.moveDown();
    doc.text(`DTE: ${dto.dte.status}`);
    if (dto.dte.xmlUrl) doc.text(`XML: ${dto.dte.xmlUrl}`);
    if (dto.dte.ackUrl) doc.text(`Acuse: ${dto.dte.ackUrl}`);
  }
  doc.end();
});


