import PDFDocument from "pdfkit";
import type { DTEDocument } from "./dte-format";

export interface InvoiceRenderData {
  number: string;
  client: {
    name: string;
    taxId: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
    taxAmount: number;
    total: number;
  }>;
  totals: {
    subtotal: number;
    taxTotal: number;
    total: number;
  };
  paymentMethod?: string | null;
  notes?: string | null;
}

export function createInvoicePdfDocument(invoiceNumber: string) {
  return new PDFDocument({
    margin: 50,
    size: "LETTER",
    info: {
      Title: `Factura ${invoiceNumber}`,
      Author: "EleCtroZ S.A. DE C.V.",
      Subject: "Factura Electrónica",
      Creator: "Sistema EleCtroZ",
    },
  });
}

export function renderInvoicePdf(doc: PDFDocument, dto: InvoiceRenderData, dteDoc: DTEDocument) {
  // === HEADER CON LOGO ===
  doc.fontSize(24).fillColor("#ff6b35").text("⚡ EleCtroZ", { align: "center" });
  doc.fontSize(10).fillColor("#333").text("EleCtroZ S.A. DE C.V.", { align: "center" });
  doc.text("NIT: 0614-031289-001-9 | NRC: 12345-6", { align: "center" });
  doc.text("Colonia Escalón, San Salvador, El Salvador", { align: "center" });
  doc.text("Tel: 2222-2222 | Email: info@electroz.com", { align: "center" });
  doc.moveDown(0.5);

  // Línea divisoria
  doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
  doc.moveDown(0.5);

  // === TIPO DE DOCUMENTO ===
  doc.fontSize(16).fillColor("#ff6b35").text("FACTURA ELECTRÓNICA", { align: "center" });
  doc.fontSize(12).fillColor("#333").text(`No. ${dto.number}`, { align: "center" });
  doc.moveDown(0.5);

  // === FECHAS EN UNA LÍNEA ===
  const currentY = doc.y;
  doc.fontSize(10).fillColor("#333");
  doc.text(`Fecha Emisión: ${dteDoc.identificacion.fecEmi}`, 50, currentY);
  doc.text(`Hora: ${dteDoc.identificacion.horEmi}`, 350, currentY);
  doc.moveDown();

  // === INFORMACIÓN DEL CLIENTE (COMPACTA) ===
  doc.fillColor("#ff6b35").fontSize(12).text("DATOS DEL CLIENTE", { underline: true });
  doc.moveDown(0.3);
  doc.fillColor("#333").fontSize(10);

  const clientY = doc.y;
  doc.text(`Nombre: ${dto.client.name}`, 50, clientY);
  doc.text(`NIT/DUI: ${dto.client.taxId || "N/A"}`, 300, clientY);

  if (dto.client.address || dto.client.phone) {
    doc.moveDown(0.8);
    const clientY2 = doc.y;
    if (dto.client.address) doc.text(`Dirección: ${dto.client.address}`, 50, clientY2);
    if (dto.client.phone) doc.text(`Teléfono: ${dto.client.phone}`, 300, clientY2);
  }

  if (dto.client.email) {
    doc.moveDown(0.8);
    doc.text(`Email: ${dto.client.email}`, 50);
  }

  doc.moveDown();

  // === TABLA DE ITEMS (OPTIMIZADA) ===
  doc.fillColor("#ff6b35").fontSize(12).text("DETALLE DE PRODUCTOS/SERVICIOS", { underline: true });
  doc.moveDown(0.3);

  // Encabezado de tabla más compacto
  const tableTop = doc.y;
  doc.fillColor("#f7fafc").rect(50, tableTop, 512, 18).fill();
  doc.fillColor("#333").fontSize(8).font("Helvetica-Bold");
  doc.text("No.", 55, tableTop + 4, { width: 25 });
  doc.text("Descripción", 85, tableTop + 4, { width: 160 });
  doc.text("Cant.", 250, tableTop + 4, { width: 35 });
  doc.text("P. Unit.", 290, tableTop + 4, { width: 50 });
  doc.text("Desc.", 345, tableTop + 4, { width: 40 });
  doc.text("Subtotal", 390, tableTop + 4, { width: 50 });
  doc.text("IVA", 445, tableTop + 4, { width: 35 });
  doc.text("Total", 485, tableTop + 4, { width: 50 });

  doc.font("Helvetica");
  let yPosition = tableTop + 22;

  dto.items.forEach((it, idx) => {
    doc.fontSize(8);
    doc.text(`${idx + 1}`, 55, yPosition, { width: 25 });
    doc.text(it.description, 85, yPosition, { width: 160 });
    doc.text(`${it.quantity}`, 250, yPosition, { width: 35 });
    doc.text(`$${it.unitPrice.toFixed(2)}`, 290, yPosition, { width: 50 });
    doc.text(`$${it.discount.toFixed(2)}`, 345, yPosition, { width: 40 });
    doc.text(`$${it.subtotal.toFixed(2)}`, 390, yPosition, { width: 50 });
    doc.text(`$${it.taxAmount.toFixed(2)}`, 445, yPosition, { width: 35 });
    doc.text(`$${it.total.toFixed(2)}`, 485, yPosition, { width: 50, align: "right" });

    yPosition += 16;
  });

  // === TOTALES (COMPACTOS) ===
  yPosition += 10;
  doc.moveTo(50, yPosition).lineTo(562, yPosition).stroke();
  yPosition += 8;

  doc.fontSize(9);
  doc.text("Subtotal:", 400, yPosition);
  doc.text(`$${dto.totals.subtotal.toFixed(2)}`, 480, yPosition, { align: "right" });

  yPosition += 12;
  doc.text("IVA (13%):", 400, yPosition);
  doc.text(`$${dto.totals.taxTotal.toFixed(2)}`, 480, yPosition, { align: "right" });

  yPosition += 15;
  doc.fontSize(11).font("Helvetica-Bold");
  doc.fillColor("#ff6b35");
  doc.text("TOTAL A PAGAR:", 400, yPosition);
  doc.text(`$${dto.totals.total.toFixed(2)}`, 480, yPosition, { align: "right" });

  // === INFORMACIÓN ADICIONAL (COMPACTA) ===
  yPosition += 20;
  doc.fontSize(8).fillColor("#333").font("Helvetica");
  doc.text(`Son: ${dteDoc.resumen.totalLetras}`, 50, yPosition);

  yPosition += 15;
  doc.text(`Forma de Pago: ${dto.paymentMethod || "Efectivo"}`, 50, yPosition);

  if (dto.notes) {
    yPosition += 15;
    doc.fontSize(9).font("Helvetica-Bold").text("Notas:", 50, yPosition);
    yPosition += 10;
    doc.fontSize(8).font("Helvetica").text(dto.notes, 50, yPosition, { width: 500 });
  }

  // === FOOTER FIJO ===
  const footerY = 720;
  doc.moveTo(50, footerY).lineTo(562, footerY).stroke();
  doc.fontSize(7).fillColor("#666");
  doc.text("Documento Tributario Electrónico - El Salvador", 50, footerY + 5, { align: "center" });
  doc.text("Sistema de Facturación EleCtroZ", 50, footerY + 15, { align: "center" });
  doc.text(`Generado: ${new Date().toLocaleString("es-SV")}`, 50, footerY + 25, { align: "center" });
}

export async function generateInvoicePdfBuffer(dto: InvoiceRenderData, dteDoc: DTEDocument) {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const pdfDoc = createInvoicePdfDocument(dto.number);
      const chunks: Buffer[] = [];
      pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
      pdfDoc.on("error", (error) => reject(error));

      renderInvoicePdf(pdfDoc, dto, dteDoc);
      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
}

