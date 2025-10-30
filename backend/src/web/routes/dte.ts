import { Router, Request, Response, NextFunction } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { prisma } from "../../config/prisma";
import { buildInvoiceDto, buildDTEDocument, trySendDte } from "../../modules/dte/dte.service";
import { dteController } from "../../modules/dte/dte.controller";
import { verifyToken } from "../../utils/jwt";
import { emailService } from "../../modules/email/email.service";
import { createInvoicePdfDocument, generateInvoicePdfBuffer, renderInvoicePdf } from "../../modules/dte/pdf-renderer";

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

// New DTE endpoints
dteRouter.post("/preview/:invoiceId", authenticate, authorize(["ADMIN", "SELLER"]), dteController.preview);
dteRouter.post("/sign/:invoiceId", authenticate, authorize(["ADMIN", "SELLER"]), dteController.sign);
dteRouter.post("/annul/:invoiceId", authenticate, authorize(["ADMIN"]), dteController.annul);
dteRouter.get("/verify/:invoiceId", authenticate, authorize(["ADMIN", "SELLER", "ACCOUNTANT", "AUDITOR"]), dteController.verify);

dteRouter.post("/:invoiceId/send", authenticate, authorize(["ADMIN", "SELLER"]), async (req, res) => {
  const { invoiceId } = req.params;
  const inv = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { client: true },
  });
  if (!inv) return res.status(404).json({ message: "Not found" });

  try {
    // Marcar como enviado
    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({ where: { id: invoiceId }, data: { electronicFiscalStamp: `stamp-${invoiceId}` } });
    });
    await trySendDte(invoiceId);

    // Si es factura electrónica y el cliente tiene email, enviar por correo
    if (inv.type === "ELECTRONIC" && inv.client.email) {
      try {
        // Generar PDF en buffer con el mismo formato optimizado
        const dto = await buildInvoiceDto(invoiceId);
        const dteDoc = await buildDTEDocument(invoiceId);
        
        if (dto && dteDoc) {
          const pdfBuffer = await generateInvoicePdfBuffer(dto, dteDoc);

          // Enviar email y verificar resultado
          const emailResult = await emailService.sendInvoiceEmail(
            inv.client.email,
            inv.number,
            inv.client.name,
            Number(inv.total),
            pdfBuffer
          );

          if (emailResult.success) {
            console.log(`✅ Email enviado exitosamente a ${inv.client.email} para factura ${inv.number}`);
          } else {
            console.error(`❌ Error al enviar email a ${inv.client.email}: ${emailResult.error}`);
          }
        }
      } catch (emailError) {
        console.error("Error al enviar correo:", emailError);
        // No fallar la operación si el correo falla
      }
    }

    res.json({ message: "DTE accepted and email sent" });
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

// Download DTE JSON (formato oficial El Salvador)
dteRouter.get("/:invoiceId/json", authenticateFromQueryOrHeader, authorize(["ADMIN", "SELLER", "ACCOUNTANT", "AUDITOR", "CUSTOMER"]), async (req, res) => {
  const dteDoc = await buildDTEDocument(req.params.invoiceId);
  if (!dteDoc) return res.status(404).json({ message: "Not found" });
  
  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.invoiceId },
    select: { number: true },
  });
  
  res.setHeader("Content-Disposition", `attachment; filename=DTE-${invoice?.number || "FACTURA"}.json`);
  res.setHeader("Content-Type", "application/json");
  res.json(dteDoc);
});

// Download DTE PDF (formato profesional con EleCtroZ)
dteRouter.get("/:invoiceId/pdf", authenticateFromQueryOrHeader, authorize(["ADMIN", "SELLER", "ACCOUNTANT", "AUDITOR", "CUSTOMER"]), async (req, res) => {
  const dto = await buildInvoiceDto(req.params.invoiceId);
  const dteDoc = await buildDTEDocument(req.params.invoiceId);
  if (!dto || !dteDoc) return res.status(404).json({ message: "Not found" });

  // Configurar PDF con codificación UTF-8
  const doc = createInvoicePdfDocument(dto.number);
  
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=Factura-${dto.number}.pdf`);
  doc.pipe(res);

  renderInvoicePdf(doc, dto, dteDoc);

  doc.end();
});

