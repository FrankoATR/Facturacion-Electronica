import { Router, Request, Response, NextFunction } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { prisma } from "../../config/prisma";
import PDFDocument from "pdfkit";
import { buildInvoiceDto, buildDTEDocument, trySendDte } from "../../modules/dte/dte.service";
import { verifyToken } from "../../utils/jwt";
import { emailService } from "../../modules/email/email.service";

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
        // Generar PDF en buffer
        const dto = await buildInvoiceDto(invoiceId);
        const dteDoc = await buildDTEDocument(invoiceId);
        
        if (dto && dteDoc) {
          const pdfDoc = new PDFDocument({ margin: 50, size: 'LETTER' });
          const chunks: Buffer[] = [];
          
          pdfDoc.on('data', (chunk) => chunks.push(chunk));
          
          await new Promise<void>((resolve) => {
            pdfDoc.on('end', () => resolve());
            
            // Generar mismo contenido del PDF (simplificado para el buffer)
            pdfDoc.fontSize(24).fillColor('#667eea').text('🏪 ADVENTURE WORKS', { align: 'center' });
            pdfDoc.fontSize(10).fillColor('#333').text('ADVENTURE WORKS S.A. DE C.V.', { align: 'center' });
            pdfDoc.text('NIT: 0614-031289-001-9 | NRC: 12345-6', { align: 'center' });
            pdfDoc.moveDown();
            pdfDoc.fontSize(16).text('FACTURA ELECTRÓNICA', { align: 'center' });
            pdfDoc.fontSize(12).text(`No. ${dto.number}`, { align: 'center' });
            pdfDoc.moveDown();
            pdfDoc.fontSize(10).text(`Cliente: ${dto.client.name}`);
            pdfDoc.text(`Total: $${dto.totals.total.toFixed(2)}`);
            pdfDoc.end();
          });

          const pdfBuffer = Buffer.concat(chunks);
          
          await emailService.sendInvoiceEmail(
            inv.client.email,
            inv.number,
            inv.client.name,
            Number(inv.total),
            pdfBuffer
          );
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

// Download DTE PDF (formato profesional con Adventure Works)
dteRouter.get("/:invoiceId/pdf", authenticateFromQueryOrHeader, authorize(["ADMIN", "SELLER", "ACCOUNTANT", "AUDITOR", "CUSTOMER"]), async (req, res) => {
  const dto = await buildInvoiceDto(req.params.invoiceId);
  const dteDoc = await buildDTEDocument(req.params.invoiceId);
  if (!dto || !dteDoc) return res.status(404).json({ message: "Not found" });

  const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=Factura-${dto.number}.pdf`);
  doc.pipe(res);

  // === HEADER CON LOGO ===
  doc.fontSize(24).fillColor('#ff6b35').text('⚡ EleCtroZ', { align: 'center' });
  doc.fontSize(10).fillColor('#333').text('EleCtroZ S.A. DE C.V.', { align: 'center' });
  doc.text('NIT: 0614-031289-001-9 | NRC: 12345-6', { align: 'center' });
  doc.text('Colonia Escalón, San Salvador, El Salvador', { align: 'center' });
  doc.text('Tel: 2222-2222 | Email: info@electroz.com', { align: 'center' });
  doc.moveDown();

  // Línea divisoria
  doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
  doc.moveDown();

  // === TIPO DE DOCUMENTO ===
  doc.fontSize(16).fillColor('#ff6b35').text('FACTURA ELECTRÓNICA', { align: 'center' });
  doc.fontSize(12).fillColor('#333').text(`No. ${dto.number}`, { align: 'center' });
  doc.moveDown();

  // === INFORMACIÓN DTE ===
  if (dto.type === 'ELECTRONIC') {
    doc.fontSize(9).fillColor('#666');
    doc.text(`Código de Generación: ${dteDoc.identificacion.codigoGeneracion}`, { align: 'center' });
    doc.text(`Número de Control: ${dteDoc.identificacion.numeroControl}`, { align: 'center' });
    doc.moveDown();
  }

  // === FECHAS ===
  const y1 = doc.y;
  doc.fontSize(10).fillColor('#333');
  doc.text(`Fecha Emisión: ${dteDoc.identificacion.fecEmi}`, 50, y1);
  doc.text(`Hora: ${dteDoc.identificacion.horEmi}`, 350, y1);
  doc.moveDown();

  // === INFORMACIÓN DEL CLIENTE ===
  doc.fillColor('#ff6b35').fontSize(12).text('DATOS DEL CLIENTE', { underline: true });
  doc.moveDown(0.5);
  doc.fillColor('#333').fontSize(10);
  doc.text(`Nombre: ${dto.client.name}`);
  doc.text(`NIT/DUI: ${dto.client.taxId}`);
  if (dto.client.address) doc.text(`Dirección: ${dto.client.address}`);
  if (dto.client.phone) doc.text(`Teléfono: ${dto.client.phone}`);
  if (dto.client.email) doc.text(`Email: ${dto.client.email}`);
  doc.moveDown();

  // === TABLA DE ITEMS ===
  doc.fillColor('#ff6b35').fontSize(12).text('DETALLE DE PRODUCTOS/SERVICIOS', { underline: true });
  doc.moveDown(0.5);

  // Encabezado de tabla
  const tableTop = doc.y;
  doc.fillColor('#f7fafc').rect(50, tableTop, 512, 20).fill();
  doc.fillColor('#333').fontSize(9).font('Helvetica-Bold');
  doc.text('No.', 55, tableTop + 5, { width: 30 });
  doc.text('Descripción', 90, tableTop + 5, { width: 180 });
  doc.text('Cant.', 275, tableTop + 5, { width: 40 });
  doc.text('P. Unit.', 320, tableTop + 5, { width: 60 });
  doc.text('Desc.', 385, tableTop + 5, { width: 45 });
  doc.text('Subtotal', 435, tableTop + 5, { width: 55 });
  doc.text('IVA', 495, tableTop + 5, { width: 35 });
  doc.text('Total', 535, tableTop + 5, { width: 60 });

  doc.font('Helvetica');
  let yPosition = tableTop + 25;

  dto.items.forEach((it, idx) => {
    if (yPosition > 700) { // Nueva página si es necesario
      doc.addPage();
      yPosition = 50;
    }

    doc.fontSize(9);
    doc.text(`${idx + 1}`, 55, yPosition, { width: 30 });
    doc.text(it.description, 90, yPosition, { width: 180 });
    doc.text(`${it.quantity}`, 275, yPosition, { width: 40 });
    doc.text(`$${it.unitPrice.toFixed(2)}`, 320, yPosition, { width: 60 });
    doc.text(`$${it.discount.toFixed(2)}`, 385, yPosition, { width: 45 });
    doc.text(`$${it.subtotal.toFixed(2)}`, 435, yPosition, { width: 55 });
    doc.text(`$${it.taxAmount.toFixed(2)}`, 495, yPosition, { width: 35 });
    doc.text(`$${it.total.toFixed(2)}`, 535, yPosition, { width: 60, align: 'right' });

    yPosition += 20;
  });

  doc.moveDown();
  yPosition = doc.y;

  // Línea divisoria
  doc.moveTo(50, yPosition).lineTo(562, yPosition).stroke();

  // === TOTALES ===
  yPosition += 10;
  doc.fontSize(10);
  doc.text('Subtotal:', 400, yPosition);
  doc.text(`$${dto.totals.subtotal.toFixed(2)}`, 480, yPosition, { align: 'right' });

  yPosition += 15;
  doc.text('IVA (13%):', 400, yPosition);
  doc.text(`$${dto.totals.taxTotal.toFixed(2)}`, 480, yPosition, { align: 'right' });

  yPosition += 20;
  doc.fontSize(12).font('Helvetica-Bold');
  doc.fillColor('#ff6b35');
  doc.text('TOTAL A PAGAR:', 400, yPosition);
  doc.text(`$${dto.totals.total.toFixed(2)}`, 480, yPosition, { align: 'right' });

  // Total en letras
  yPosition += 25;
  doc.fontSize(9).fillColor('#333').font('Helvetica');
  doc.text(`Son: ${dteDoc.resumen.totalLetras}`, 50, yPosition);

  // === FORMA DE PAGO ===
  yPosition += 20;
  doc.text(`Forma de Pago: ${dto.paymentMethod || 'Efectivo'}`, 50, yPosition);

  // === NOTAS ===
  if (dto.notes) {
    yPosition += 20;
    doc.fontSize(10).font('Helvetica-Bold').text('Notas:', 50, yPosition);
    doc.fontSize(9).font('Helvetica').text(dto.notes, 50, yPosition + 12, { width: 500 });
  }

  // === FOOTER ===
  const footerY = 720;
  doc.moveTo(50, footerY).lineTo(562, footerY).stroke();
  doc.fontSize(8).fillColor('#666');
  doc.text('Documento Tributario Electrónico - El Salvador', 50, footerY + 5, { align: 'center' });
  doc.text('Sistema de Facturación Adventure Works', 50, footerY + 15, { align: 'center' });
  doc.text(`Generado: ${new Date().toLocaleString()}`, 50, footerY + 25, { align: 'center' });

  doc.end();
});


