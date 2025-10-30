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
  // === HEADER PROFESIONAL CON DISEÑO MEJORADO ===
  // Fondo naranja para el header
  doc.rect(0, 0, 612, 120).fillAndStroke("#ff6b35", "#ff6b35");

  // Logo y nombre de la empresa
  doc.fontSize(32).fillColor("#ffffff").font("Helvetica-Bold").text("⚡ EleCtroZ", 50, 25);
  doc.fontSize(10).fillColor("#ffffff").font("Helvetica").text("EleCtroZ S.A. DE C.V.", 50, 65);
  doc.fontSize(9).text("NIT: 0614-031289-001-9 | NRC: 12345-6", 50, 80);
  doc.text("Colonia Escalón, San Salvador, El Salvador", 50, 93);

  // Información de contacto alineada a la derecha
  doc.fontSize(9).text("Tel: 2222-2222", 400, 80, { align: "right" });
  doc.text("Email: info@electroz.com", 400, 93, { align: "right" });

  // === INFORMACIÓN DE FACTURA EN RECUADRO ===
  doc.rect(400, 140, 162, 85).fillAndStroke("#f8f9fa", "#dee2e6");
  doc.fontSize(14).fillColor("#ff6b35").font("Helvetica-Bold").text("FACTURA ELECTRÓNICA", 410, 150);
  doc.fontSize(11).fillColor("#333").font("Helvetica").text(`No. ${dto.number}`, 410, 170);

  // Fecha y hora
  const fechaFormateada = new Date(dteDoc.identificacion.fecEmi).toLocaleDateString("es-SV", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  doc.fontSize(9).text(`Fecha: ${fechaFormateada}`, 410, 190);
  doc.text(`Hora: ${dteDoc.identificacion.horEmi}`, 410, 203);

  // === INFORMACIÓN DEL CLIENTE EN RECUADRO ===
  doc.rect(50, 140, 330, 85).fillAndStroke("#f8f9fa", "#dee2e6");
  doc.fontSize(11).fillColor("#ff6b35").font("Helvetica-Bold").text("DATOS DEL CLIENTE", 60, 150);

  doc.fontSize(10).fillColor("#333").font("Helvetica-Bold").text("Nombre:", 60, 170);
  doc.font("Helvetica").text(dto.client.name, 115, 170);

  doc.font("Helvetica-Bold").text("NIT/DUI:", 60, 185);
  doc.font("Helvetica").text(dto.client.taxId || "N/A", 115, 185);

  if (dto.client.phone) {
    doc.font("Helvetica-Bold").text("Teléfono:", 60, 200);
    doc.font("Helvetica").text(dto.client.phone, 115, 200);
  }

  if (dto.client.email) {
    doc.font("Helvetica-Bold").text("Email:", 230, 200);
    doc.font("Helvetica").text(dto.client.email, 270, 200, { width: 100 });
  }

  if (dto.client.address) {
    doc.font("Helvetica-Bold").text("Dirección:", 60, 215);
    doc.font("Helvetica").text(dto.client.address, 115, 215, { width: 255 });
  }

  // === TABLA DE PRODUCTOS MEJORADA ===
  let tableTop = 245;
  doc.fontSize(12).fillColor("#ff6b35").font("Helvetica-Bold").text("DETALLE DE PRODUCTOS/SERVICIOS", 50, tableTop);
  tableTop += 20;

  // Header de tabla con fondo
  doc.rect(50, tableTop, 512, 25).fillAndStroke("#ff6b35", "#ff6b35");
  doc.fontSize(9).fillColor("#ffffff").font("Helvetica-Bold");
  doc.text("No.", 55, tableTop + 8, { width: 25 });
  doc.text("Descripción", 85, tableTop + 8, { width: 180 });
  doc.text("Cant.", 270, tableTop + 8, { width: 35, align: "center" });
  doc.text("P. Unit.", 310, tableTop + 8, { width: 60, align: "right" });
  doc.text("Desc.", 375, tableTop + 8, { width: 45, align: "right" });
  doc.text("Subtotal", 425, tableTop + 8, { width: 50, align: "right" });
  doc.text("IVA", 480, tableTop + 8, { width: 35, align: "right" });
  doc.text("Total", 520, tableTop + 8, { width: 42, align: "right" });

  let yPosition = tableTop + 30;

  // Filas de la tabla con alternancia de colores
  dto.items.forEach((it, idx) => {
    // Fondo alternado para mejor legibilidad
    if (idx % 2 === 0) {
      doc.rect(50, yPosition - 2, 512, 18).fillAndStroke("#f8f9fa", "#f8f9fa");
    }

    doc.fontSize(9).fillColor("#333").font("Helvetica");
    doc.text(`${idx + 1}`, 55, yPosition, { width: 25 });
    doc.text(it.description, 85, yPosition, { width: 180 });
    doc.text(`${it.quantity}`, 270, yPosition, { width: 35, align: "center" });
    doc.text(`$${it.unitPrice.toFixed(2)}`, 310, yPosition, { width: 60, align: "right" });
    doc.text(`$${it.discount.toFixed(2)}`, 375, yPosition, { width: 45, align: "right" });
    doc.text(`$${it.subtotal.toFixed(2)}`, 425, yPosition, { width: 50, align: "right" });
    doc.text(`$${it.taxAmount.toFixed(2)}`, 480, yPosition, { width: 35, align: "right" });
    doc.text(`$${it.total.toFixed(2)}`, 520, yPosition, { width: 42, align: "right" });

    yPosition += 18;
  });

  // === SECCIÓN DE TOTALES MEJORADA ===
  yPosition += 10;

  // Recuadro para totales
  const totalsBoxTop = yPosition;
  doc.rect(380, totalsBoxTop, 182, 75).fillAndStroke("#f8f9fa", "#dee2e6");

  yPosition = totalsBoxTop + 12;
  doc.fontSize(10).fillColor("#333").font("Helvetica");
  doc.text("Subtotal:", 390, yPosition);
  doc.text(`$${dto.totals.subtotal.toFixed(2)}`, 480, yPosition, { width: 72, align: "right" });

  yPosition += 18;
  doc.text("IVA (13%):", 390, yPosition);
  doc.text(`$${dto.totals.taxTotal.toFixed(2)}`, 480, yPosition, { width: 72, align: "right" });

  yPosition += 22;
  // Total con fondo destacado
  doc.rect(380, yPosition - 5, 182, 23).fillAndStroke("#ff6b35", "#ff6b35");
  doc.fontSize(12).fillColor("#ffffff").font("Helvetica-Bold");
  doc.text("TOTAL A PAGAR:", 390, yPosition);
  doc.text(`$${dto.totals.total.toFixed(2)}`, 480, yPosition, { width: 72, align: "right" });

  // === INFORMACIÓN ADICIONAL ===
  yPosition = totalsBoxTop + 85;

  // Total en letras en recuadro
  doc.rect(50, yPosition, 512, 30).fillAndStroke("#fffaf0", "#ffe4c4");
  doc.fontSize(9).fillColor("#333").font("Helvetica-Bold").text("Son:", 60, yPosition + 10);
  doc.font("Helvetica").text(dteDoc.resumen.totalLetras.toUpperCase(), 90, yPosition + 10, { width: 460 });

  yPosition += 40;
  doc.fontSize(9).font("Helvetica-Bold").text("Forma de Pago:", 50, yPosition);
  doc.font("Helvetica").text(dto.paymentMethod || "Efectivo", 140, yPosition);

  if (dto.notes) {
    yPosition += 20;
    doc.rect(50, yPosition, 512, 40).fillAndStroke("#f8f9fa", "#dee2e6");
    doc.fontSize(9).font("Helvetica-Bold").text("Notas:", 60, yPosition + 8);
    doc.font("Helvetica").text(dto.notes, 60, yPosition + 20, { width: 492 });
  }

  // === FOOTER PROFESIONAL ===
  const footerY = 720;
  doc.rect(0, footerY, 612, 72).fillAndStroke("#2c3e50", "#2c3e50");

  doc.fontSize(8).fillColor("#ffffff").font("Helvetica-Bold");
  doc.text("Documento Tributario Electrónico - El Salvador", 50, footerY + 15, { align: "center" });

  doc.fontSize(7).font("Helvetica");
  doc.text("Sistema de Facturación Electrónica EleCtroZ", 50, footerY + 30, { align: "center" });
  doc.text(`Generado: ${new Date().toLocaleString("es-SV", {
    dateStyle: "long",
    timeStyle: "short"
  })}`, 50, footerY + 43, { align: "center" });

  doc.fontSize(6).fillColor("#95a5a6");
  doc.text("Este documento es válido como comprobante fiscal electrónico", 50, footerY + 56, { align: "center" });
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

