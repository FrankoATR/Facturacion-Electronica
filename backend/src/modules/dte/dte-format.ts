import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

// Estructura oficial del DTE de El Salvador según especificaciones del Ministerio de Hacienda

export interface DTEDocument {
  identificacion: {
    version: number;
    ambiente: "00" | "01"; // 00 = Prueba, 01 = Producción
    tipoDte: string; // 01 = Factura, 03 = CCF, etc.
    numeroControl: string; // DTE-01-00000001-000000000000001
    codigoGeneracion: string; // UUID único
    tipoModelo: number; // 1 = Normal, 2 = Previo
    tipoOperacion: number; // 1 = Normal
    tipoContingencia: null | number;
    motivoContin: null | string;
    fecEmi: string; // YYYY-MM-DD
    horEmi: string; // HH:MM:SS
    tipoMoneda: string; // USD
  };
  emisor: {
    nit: string;
    nrc: string;
    nombre: string;
    codActividad: string;
    descActividad: string;
    nombreComercial: string;
    tipoEstablecimiento: string;
    direccion: {
      departamento: string;
      municipio: string;
      complemento: string;
    };
    telefono: string;
    correo: string;
  };
  receptor: {
    tipoDocumento: string; // 36 = NIT, 13 = DUI, etc.
    numDocumento: string;
    nrc: string | null;
    nombre: string;
    codActividad: string | null;
    descActividad: string | null;
    direccion: {
      departamento: string;
      municipio: string;
      complemento: string;
    } | null;
    telefono: string | null;
    correo: string;
  };
  cuerpoDocumento: Array<{
    numItem: number;
    tipoItem: number; // 1 = Bien, 2 = Servicio, 3 = Ambos, 4 = Otro
    numeroDocumento: string | null;
    cantidad: number;
    codigo: string;
    codTributo: string | null; // Código de tributo (IVA, etc.)
    uniMedida: number; // 99 = Unidad
    descripcion: string;
    precioUni: number;
    montoDescu: number;
    ventaNoSuj: number; // Ventas no sujetas
    ventaExenta: number; // Ventas exentas
    ventaGravada: number; // Ventas gravadas
    tributos: string[] | null; // Códigos de tributos aplicables
    psv: number; // Precio Sugerido de Venta
    noGravado: number;
  }>;
  resumen: {
    totalNoSuj: number;
    totalExenta: number;
    totalGravada: number;
    subTotalVentas: number;
    descuNoSuj: number;
    descuExenta: number;
    descuGravada: number;
    porcentajeDescuento: number;
    totalDescu: number;
    tributos: Array<{
      codigo: string; // 20 = IVA
      descripcion: string;
      valor: number;
    }> | null;
    subTotal: number;
    ivaRete1: number; // Retención IVA 1%
    reteRenta: number; // Retención Renta
    montoTotalOperacion: number;
    totalNoGravado: number;
    totalPagar: number;
    totalLetras: string; // Total en letras
    saldoFavor: number;
    condicionOperacion: number; // 1 = Contado, 2 = Crédito, 3 = Otro
    pagos: Array<{
      codigo: string; // 01 = Efectivo, 02 = Cheque, etc.
      montoPago: number;
      referencia: string | null;
      plazo: string | null;
      periodo: number | null;
    }> | null;
    numPagoElectronico: string | null;
  };
  extension: {
    nombreEntrega: string | null;
    documentoEntrega: string | null;
    nombreRecibe: string | null;
    documentoRecibe: string | null;
    observaciones: string | null;
    placaVehiculo: string | null;
  } | null;
  apendice: Array<{
    campo: string;
    etiqueta: string;
    valor: string;
  }> | null;
  firma?: {
    nitFirmante: string;
    nombreFirmante: string;
    fechaFirma: string;
    selloDigital: string;
    algoritmoFirma: string;
    certificadoDigital: string;
  };
}

export function generateControlNumber(sequence: number): string {
  // Formato: DTE-01-CAJA0001-SEQ000000000001
  const tipo = "01"; // Tipo de documento (Factura)
  const caja = "CAJA0001"; // Punto de venta
  const seq = sequence.toString().padStart(15, "0");
  return `DTE-${tipo}-${caja}-${seq}`;
}

export function generateCodigoGeneracion(): string {
  // UUID único para el DTE
  return uuidv4().toUpperCase();
}

export function numberToWords(num: number): string {
  // Conversión simplificada de número a letras
  if (num === 0) return "CERO";
  
  const unidades = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const decenas = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const especiales = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"];
  
  const entero = Math.floor(num);
  const centavos = Math.round((num - entero) * 100);
  
  let resultado = "";
  
  if (entero >= 1000) {
    const miles = Math.floor(entero / 1000);
    resultado += (miles === 1 ? "MIL " : unidades[miles] + " MIL ");
    const resto = entero % 1000;
    if (resto > 0) {
      if (resto >= 100) {
        const centenas = Math.floor(resto / 100);
        resultado += (centenas === 1 ? "CIEN " : unidades[centenas] + "CIENTOS ");
      }
      const dec = resto % 100;
      if (dec >= 10 && dec < 20) {
        resultado += especiales[dec - 10] + " ";
      } else if (dec >= 20) {
        const d = Math.floor(dec / 10);
        const u = dec % 10;
        resultado += decenas[d] + (u > 0 ? " Y " + unidades[u] : "") + " ";
      } else if (dec > 0) {
        resultado += unidades[dec] + " ";
      }
    }
  } else if (entero >= 100) {
    const centenas = Math.floor(entero / 100);
    resultado += (centenas === 1 && entero === 100 ? "CIEN " : unidades[centenas] + "CIENTOS ");
    const dec = entero % 100;
    if (dec >= 10 && dec < 20) {
      resultado += especiales[dec - 10] + " ";
    } else if (dec >= 20) {
      const d = Math.floor(dec / 10);
      const u = dec % 10;
      resultado += decenas[d] + (u > 0 ? " Y " + unidades[u] : "") + " ";
    } else if (dec > 0) {
      resultado += unidades[dec] + " ";
    }
  } else if (entero >= 20) {
    const d = Math.floor(entero / 10);
    const u = entero % 10;
    resultado += decenas[d] + (u > 0 ? " Y " + unidades[u] : "") + " ";
  } else if (entero >= 10) {
    resultado += especiales[entero - 10] + " ";
  } else {
    resultado += unidades[entero] + " ";
  }
  
  resultado += entero === 1 ? "DÓLAR" : "DÓLARES";
  
  if (centavos > 0) {
    resultado += ` CON ${centavos}/100`;
  }
  
  return resultado.trim();
}

export function calculateIVA(baseImponible: number, rate: number = 13): number {
  return Number((baseImponible * (rate / 100)).toFixed(2));
}

export function generateFirmaElectronica(dteData: any): string {
  // Simular firma digital (en producción se usaría certificado digital real)
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(dteData))
    .digest("hex");
  return hash.toUpperCase();
}

export function generateSelloRecepcion(): string {
  // Simular sello de recepción del MH
  const timestamp = new Date().getTime();
  const hash = crypto
    .createHash("sha256")
    .update(`SELLO-MH-${timestamp}`)
    .digest("hex");
  return hash.toUpperCase();
}
