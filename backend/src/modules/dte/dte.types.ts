// DTE Types for El Salvador Electronic Tax Documents

export interface DTEPayload {
  identificacion: {
    version: number;
    ambiente: string; // "00" = Prueba, "01" = Producción
    tipoDte: string; // "01" = Factura, "03" = CCF, etc.
    numeroControl: string;
    codigoGeneracion: string;
    tipoModelo: number;
    tipoOperacion: number;
    tipoContingencia: string | null;
    motivoContin: string | null;
    fecEmi: string; // YYYY-MM-DD
    horEmi: string; // HH:MM:SS
    tipoMoneda: string; // "USD"
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
    tipoDocumento: string; // "36" = NIT, "13" = DUI, etc.
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
    tipoItem: number; // 1 = Bien, 2 = Servicio
    numeroDocumento: string | null;
    cantidad: number;
    codigo: string;
    codTributo: string; // "20" = IVA
    uniMedida: number; // 99 = Unidad
    descripcion: string;
    precioUni: number;
    montoDescu: number;
    ventaNoSuj: number;
    ventaExenta: number;
    ventaGravada: number;
    tributos: string[];
    psv: number; // Precio sugerido de venta
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
      codigo: string;
      descripcion: string;
      valor: number;
    }>;
    subTotal: number;
    ivaRete1: number;
    reteRenta: number;
    montoTotalOperacion: number;
    totalNoGravado: number;
    totalPagar: number;
    totalLetras: string;
    saldoFavor: number;
    condicionOperacion: number; // 1 = Contado, 2 = Crédito
    pagos: Array<{
      codigo: string; // "01" = Efectivo, "02" = Cheque, "03" = Tarjeta, etc.
      montoPago: number;
      referencia: string | null;
      plazo: string | null;
      periodo: number | null;
    }>;
    numPagoElectronico: string | null;
  };
  extension: {
    nombreEntrega: string | null;
    documentoEntrega: string | null;
    nombreRecibe: string | null;
    documentoRecibe: string | null;
    observaciones: string | null;
    placaVehiculo: string | null;
  };
  apendice: Array<{
    campo: string;
    etiqueta: string;
    valor: string;
  }> | null;
}

export interface DTESignature {
  payload: DTEPayload;
  signature: string; // Base64 encoded RSA signature
  hash: string; // SHA-256 hash of canonical JSON
  signedAt: Date;
  algorithm: string; // "RS256"
}

export interface DTEAnnulRequest {
  reason: string;
}

