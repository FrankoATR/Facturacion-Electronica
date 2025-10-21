import { prisma } from "../../config/prisma";
import {
  DTEDocument,
  generateControlNumber,
  generateCodigoGeneracion,
  numberToWords,
  calculateIVA,
  generateFirmaElectronica,
  generateSelloRecepcion,
} from "./dte-format";

export async function simulateDteSend(invoiceId: string) {
  const ok = Math.random() > 0.1; // 90% success
  if (ok) {
    return {
      status: "ACCEPTED" as const,
      xmlUrl: `https://example.com/dte/${invoiceId}.xml`,
      ackUrl: `https://example.com/ack/${invoiceId}.pdf`,
    };
  }
  throw new Error("Simulated DTE error");
}

export async function trySendDte(invoiceId: string) {
  try {
    const result = await simulateDteSend(invoiceId);
    await prisma.dTE.upsert({
      where: { invoiceId },
      create: {
        invoiceId,
        status: "ACCEPTED",
        hash: `hash-${invoiceId}`,
        xmlUrl: result.xmlUrl,
        ackUrl: result.ackUrl,
        sentAt: new Date(),
        ackAt: new Date(),
      },
      update: { status: "ACCEPTED", xmlUrl: result.xmlUrl, ackUrl: result.ackUrl, ackAt: new Date() },
    });
  } catch (e: any) {
    await prisma.dTE.upsert({
      where: { invoiceId },
      create: { invoiceId, status: "ERROR", hash: `hash-${invoiceId}`, lastError: e.message, retries: 0, sentAt: new Date() },
      update: { status: "ERROR", lastError: e.message, retries: { increment: 1 } },
    });
  }
}

export async function buildInvoiceDto(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { client: true, items: { include: { product: true } }, dte: true },
  });
  if (!invoice) return null;
  return {
    id: invoice.id,
    number: invoice.number,
    type: invoice.type,
    status: invoice.status,
    issuedAt: invoice.issuedAt,
    client: {
      id: invoice.client.id,
      name: invoice.client.name,
      taxId: invoice.client.taxId,
      email: invoice.client.email,
      phone: invoice.client.phone,
      address: invoice.client.address,
    },
    items: invoice.items.map((it) => ({
      id: it.id,
      description: it.description,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      discount: Number(it.discount || 0),
      taxRate: Number(it.taxRate),
      subtotal: Number(it.subtotal),
      taxAmount: Number(it.taxAmount),
      total: Number(it.total),
      product: it.product ? {
        sku: it.product.sku,
        name: it.product.name,
      } : null,
    })),
    totals: {
      subtotal: Number(invoice.subtotal),
      taxTotal: Number(invoice.taxTotal),
      total: Number(invoice.total),
    },
    paymentMethod: invoice.paymentMethod,
    notes: invoice.notes,
    dte: invoice.dte ? {
      status: invoice.dte.status,
      xmlUrl: invoice.dte.xmlUrl,
      ackUrl: invoice.dte.ackUrl,
      retries: invoice.dte.retries,
      lastError: invoice.dte.lastError,
    } : null,
  };
}

export async function buildDTEDocument(invoiceId: string): Promise<DTEDocument | null> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      client: true,
      items: { include: { product: true } },
    },
  });

  if (!invoice || !invoice.issuedAt) return null;

  const fechaEmi = invoice.issuedAt.toISOString().split("T")[0];
  const horEmi = invoice.issuedAt.toTimeString().split(" ")[0];

  // Obtener el número de secuencia del número de factura
  const sequence = parseInt(invoice.number.replace(/\D/g, "")) || 1;
  const numeroControl = generateControlNumber(sequence);
  const codigoGeneracion = generateCodigoGeneracion();

  // Calcular totales
  const totalGravada = Number(invoice.subtotal);
  const totalIVA = Number(invoice.taxTotal);
  const totalPagar = Number(invoice.total);
  const totalDescuentos = invoice.items.reduce((sum, it) => sum + Number(it.discount || 0), 0);

  const dteDoc: DTEDocument = {
    identificacion: {
      version: 1,
      ambiente: "00", // Prueba
      tipoDte: "01", // Factura
      numeroControl,
      codigoGeneracion,
      tipoModelo: 1,
      tipoOperacion: 1,
      tipoContingencia: null,
      motivoContin: null,
      fecEmi: fechaEmi,
      horEmi,
      tipoMoneda: "USD",
    },
    emisor: {
      nit: "0614-031289-001-9",
      nrc: "12345-6",
      nombre: "ADVENTURE WORKS S.A. DE C.V.",
      codActividad: "47110",
      descActividad: "Venta al por menor en comercios no especializados",
      nombreComercial: "Adventure Works",
      tipoEstablecimiento: "01",
      direccion: {
        departamento: "06",
        municipio: "14",
        complemento: "Colonia Escalón, San Salvador",
      },
      telefono: "2222-2222",
      correo: "info@adventureworks.com.sv",
    },
    receptor: {
      tipoDocumento: "36", // NIT
      numDocumento: invoice.client.taxId,
      nrc: null,
      nombre: invoice.client.name,
      codActividad: null,
      descActividad: null,
      direccion: invoice.client.address ? {
        departamento: "06",
        municipio: "14",
        complemento: invoice.client.address,
      } : null,
      telefono: invoice.client.phone,
      correo: invoice.client.email || "cliente@example.com",
    },
    cuerpoDocumento: invoice.items.map((item, index) => {
      const cantidad = item.quantity;
      const precioUni = Number(item.unitPrice);
      const montoDescu = Number(item.discount || 0);
      const ventaGravada = Number(item.subtotal) - montoDescu;
      
      return {
        numItem: index + 1,
        tipoItem: 1, // Bien
        numeroDocumento: null,
        cantidad,
        codigo: item.product?.sku || `ITEM-${index + 1}`,
        codTributo: "20", // IVA
        uniMedida: 99, // Unidad
        descripcion: item.description,
        precioUni,
        montoDescu,
        ventaNoSuj: 0,
        ventaExenta: 0,
        ventaGravada,
        tributos: ["20"],
        psv: precioUni,
        noGravado: 0,
      };
    }),
    resumen: {
      totalNoSuj: 0,
      totalExenta: 0,
      totalGravada,
      subTotalVentas: totalGravada,
      descuNoSuj: 0,
      descuExenta: 0,
      descuGravada: totalDescuentos,
      porcentajeDescuento: totalGravada > 0 ? (totalDescuentos / (totalGravada + totalDescuentos)) * 100 : 0,
      totalDescu: totalDescuentos,
      tributos: [
        {
          codigo: "20",
          descripcion: "Impuesto al Valor Agregado 13%",
          valor: totalIVA,
        },
      ],
      subTotal: totalGravada,
      ivaRete1: 0,
      reteRenta: 0,
      montoTotalOperacion: totalPagar,
      totalNoGravado: 0,
      totalPagar,
      totalLetras: numberToWords(totalPagar),
      saldoFavor: 0,
      condicionOperacion: 1, // Contado
      pagos: [
        {
          codigo: invoice.paymentMethod === "Efectivo" ? "01" : invoice.paymentMethod === "Tarjeta" ? "03" : "02",
          montoPago: totalPagar,
          referencia: null,
          plazo: null,
          periodo: null,
        },
      ],
      numPagoElectronico: null,
    },
    extension: {
      nombreEntrega: null,
      documentoEntrega: null,
      nombreRecibe: null,
      documentoRecibe: null,
      observaciones: invoice.notes,
      placaVehiculo: null,
    },
    apendice: [
      {
        campo: "numeroFactura",
        etiqueta: "Número de Factura",
        valor: invoice.number,
      },
      {
        campo: "sistema",
        etiqueta: "Sistema",
        valor: "Adventure Works Facturación Electrónica",
      },
    ],
  };

  return dteDoc;
}


