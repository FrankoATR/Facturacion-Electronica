import { Invoice, Client, InvoiceItem, Product } from "@prisma/client";
import { DTEPayload } from "./dte.types";
import { generateControlNumber, generateCodigoGeneracion, numberToWords } from "./dte-format";

type InvoiceWithRelations = Invoice & {
  client: Client;
  items: (InvoiceItem & { product: Product | null })[];
};

/**
 * Convert an Invoice to DTE JSON format
 */
export function fromInvoiceToDTE(invoice: InvoiceWithRelations): DTEPayload {
  if (!invoice.issuedAt) {
    throw new Error("Invoice must be issued before generating DTE");
  }

  const fechaEmi = invoice.issuedAt.toISOString().split("T")[0];
  const horEmi = invoice.issuedAt.toTimeString().split(" ")[0];

  // Get sequence number from invoice number
  const sequence = parseInt(invoice.number.replace(/\D/g, "")) || 1;
  const numeroControl = generateControlNumber(sequence);
  const codigoGeneracion = generateCodigoGeneracion();

  // Calculate totals
  const totalGravada = Number(invoice.subtotal);
  const totalIVA = Number(invoice.taxTotal);
  const totalPagar = Number(invoice.total);
  const totalDescuentos = invoice.items.reduce((sum, it) => sum + Number(it.discount || 0), 0);

  // Determine document type based on documentType field
  const tipoDte = invoice.documentType === "CCF" ? "03" : "01"; // 01 = FCF, 03 = CCF

  const dteDoc: DTEPayload = {
    identificacion: {
      version: 1,
      ambiente: "00", // Prueba (use "01" for production)
      tipoDte,
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
      nombre: "ELECTROZ S.A. DE C.V.",
      codActividad: "47110",
      descActividad: "Venta al por menor en comercios no especializados",
      nombreComercial: "EleCtroZ",
      tipoEstablecimiento: "01",
      direccion: {
        departamento: "06",
        municipio: "14",
        complemento: "Colonia Escalón, San Salvador",
      },
      telefono: "2222-2222",
      correo: "info@electroz.com.sv",
    },
    receptor: {
      tipoDocumento: invoice.documentType === "CCF" ? "36" : "13", // 36 = NIT (for CCF), 13 = DUI (for FCF)
      numDocumento: invoice.client.nit || invoice.client.taxId,
      nrc: invoice.client.nrc || null,
      nombre: invoice.client.name,
      codActividad: null,
      descActividad: null,
      direccion: invoice.client.direccionFiscal || invoice.client.address ? {
        departamento: "06",
        municipio: "14",
        complemento: invoice.client.direccionFiscal || invoice.client.address || "",
      } : null,
      telefono: invoice.client.phone || null,
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
        campo: "documentType",
        etiqueta: "Tipo de Documento",
        valor: invoice.documentType,
      },
      {
        campo: "sistema",
        etiqueta: "Sistema",
        valor: "EleCtroZ Facturación Electrónica",
      },
    ],
  };

  return dteDoc;
}

