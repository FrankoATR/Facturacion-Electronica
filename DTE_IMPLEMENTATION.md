# Implementación Completa del DTE (Documento Tributario Electrónico)

## 🎯 Resumen

Se ha implementado un sistema completo de **Documento Tributario Electrónico (DTE)** con firma digital usando **AES-256-GCM**, estados de factura, y funcionalidades de anulación para devoluciones de productos.

---

## 🔐 Firma Electrónica con AES-256-GCM

### Características

- **Algoritmo**: AES-256-GCM (Advanced Encryption Standard - Galois/Counter Mode)
- **Nivel de Seguridad**: Grado militar (256 bits)
- **Integridad**: Authentication Tag para verificar que el documento no ha sido alterado
- **Unicidad**: IV (Initialization Vector) aleatorio para cada firma

### Proceso de Firma

```
1. Canonicalización del JSON DTE
   ↓
2. Generación de Hash SHA-256
   ↓
3. Encriptación con AES-256-GCM
   ↓
4. Generación de Código de Control
   ↓
5. Generación de Sello Electrónico
   ↓
6. Almacenamiento en Base de Datos
```

### Estructura de la Firma

```json
{
  "dteJson": { /* Contenido del DTE */ },
  "signature": "base64-encoded-encrypted-data-with-iv-and-auth-tag",
  "signatureMethod": "AES-256-GCM",
  "signedAt": "2025-10-29T04:15:00.000Z",
  "hash": "sha256-hash-of-canonical-json",
  "controlCode": "A1B2C3D4E5F6G7H8",
  "electronicSeal": "SEAL-XXXXX..."
}
```

---

## 📊 Estados del DTE

### Flujo de Estados

```
DRAFT (Borrador)
   ↓
   [Emitir Factura]
   ↓
ISSUED (Emitida - Sin Firmar)
   ↓
   [Firmar DTE]
   ↓
ISSUED (Emitida - Con Firma DTE)
   ↓
   [Anular] (por devolución, error, etc.)
   ↓
ANNULLED (Anulada)
```

### Descripción de Estados

| Estado | Descripción | Acciones Disponibles |
|--------|-------------|---------------------|
| **DRAFT** | Factura en borrador | Editar, Eliminar |
| **ISSUED (sin firma)** | Factura emitida pero no firmada | Firmar DTE, Ver, Anular |
| **ISSUED (con firma)** | Factura emitida y firmada digitalmente | Ver, Descargar, Verificar, Anular |
| **ANNULLED** | Factura anulada (devolución, error) | Solo Ver (no se puede modificar) |

---

## 🔧 Backend - Implementación

### Archivos Creados

1. **`backend/src/modules/dte/dte-crypto.ts`**
   - Funciones de firma con AES-256-GCM
   - Generación de código de control
   - Generación de sello electrónico
   - Verificación de firmas

2. **`backend/src/modules/dte/dte.controller.ts`** (Actualizado)
   - `POST /api/dte/preview/:invoiceId` - Preview del DTE
   - `POST /api/dte/sign/:invoiceId` - Firmar DTE
   - `POST /api/dte/annul/:invoiceId` - Anular DTE
   - `GET /api/dte/verify/:invoiceId` - Verificar firma

### Endpoints

#### 1. Preview DTE
```http
POST /api/dte/preview/:invoiceId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "DTE preview generated",
  "dte": {
    "identificacion": { /* ... */ },
    "emisor": { /* ... */ },
    "receptor": { /* ... */ },
    "cuerpoDocumento": [ /* ... */ ],
    "resumen": { /* ... */ },
    "codigoGeneracion": "A1B2C3D4E5F6G7H8"
  },
  "status": "ISSUED",
  "signed": false
}
```

#### 2. Firmar DTE
```http
POST /api/dte/sign/:invoiceId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "DTE signed successfully",
  "invoice": {
    "id": "...",
    "number": "INV-00001",
    "status": "ISSUED"
  },
  "dte": {
    "payload": { /* DTE JSON */ },
    "signature": {
      "value": "base64-encrypted-signature",
      "method": "AES-256-GCM",
      "signedAt": "2025-10-29T04:15:00.000Z",
      "hash": "sha256-hash",
      "controlCode": "A1B2C3D4E5F6G7H8",
      "electronicSeal": "SEAL-XXXXX..."
    }
  }
}
```

#### 3. Anular DTE
```http
POST /api/dte/annul/:invoiceId
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Devolución de producto por defecto de fábrica"
}
```

**Response:**
```json
{
  "message": "Invoice annulled successfully",
  "invoice": {
    "id": "...",
    "number": "INV-00001",
    "status": "ANNULLED",
    "annulledAt": "2025-10-29T04:20:00.000Z",
    "annulReason": "Devolución de producto por defecto de fábrica"
  }
}
```

#### 4. Verificar Firma
```http
GET /api/dte/verify/:invoiceId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "valid": true,
  "invoice": {
    "number": "INV-00001",
    "status": "ISSUED"
  },
  "signature": {
    "method": "AES-256-GCM",
    "signedAt": "2025-10-29T04:15:00.000Z",
    "hash": "sha256-hash",
    "controlCode": "A1B2C3D4E5F6G7H8"
  }
}
```

---

## 🎨 Frontend - Implementación

### Componentes Creados

1. **`src/components/invoicing/DTEStatusBadge.tsx`**
   - Badge visual para mostrar el estado del DTE
   - Muestra icono de escudo cuando está firmado
   - Colores según estado (verde=firmado, azul=emitido, rojo=anulado)

2. **`src/components/invoicing/SignDTEModal.tsx`**
   - Modal completo para firmar DTEs
   - Muestra preview del JSON DTE
   - Explica el proceso de firma
   - Información sobre AES-256-GCM
   - Botón para confirmar firma

3. **`src/pages/Invoicing.tsx`** (Actualizado)
   - Botón "Firmar DTE" (icono de escudo verde)
   - Botón "Anular" (icono X rojo)
   - Badge de estado DTE
   - Integración de modales

### UI/UX

#### Vista de Lista de Facturas

```
┌─────────────────────────────────────────────────────────────┐
│ Número    │ Cliente    │ Total    │ Estado      │ Acciones │
├─────────────────────────────────────────────────────────────┤
│ INV-00001 │ Cliente A  │ $1,250   │ 🛡️ DTE Firmado │ 👁️ 🗑️   │
│ INV-00002 │ Cliente B  │ $850     │ ✅ Emitida     │ 👁️ 🛡️ 🗑️ │
│ INV-00003 │ Cliente C  │ $2,100   │ ❌ Anulada     │ 👁️      │
└─────────────────────────────────────────────────────────────┘
```

**Leyenda de Acciones:**
- 👁️ Ver/Descargar
- 🛡️ Firmar DTE (solo si está ISSUED sin firma)
- 🗑️ Anular (solo si está ISSUED)

#### Modal de Firma DTE

```
┌──────────────────────────────────────────────────┐
│ 🛡️ Firmar Documento Tributario Electrónico      │
│                                                   │
│ 🔒 Firma Electrónica Segura                      │
│ Este documento será firmado usando AES-256-GCM   │
│                                                   │
│ 📄 Detalles de la Factura                        │
│ Número: INV-00001                                 │
│ Total: $1,250.00                                  │
│                                                   │
│ 📟 DTE JSON Preview                               │
│ {                                                 │
│   "identificacion": { ... },                      │
│   "emisor": { ... },                              │
│   ...                                             │
│ }                                                 │
│                                                   │
│ ⚠️ Importante                                     │
│ Una vez firmado, solo podrá ser anulado          │
│                                                   │
│ 🔐 Proceso de Firma                               │
│ 1️⃣ Generación del JSON DTE                        │
│ 2️⃣ Cálculo del hash SHA-256                       │
│ 3️⃣ Encriptación con AES-256-GCM                   │
│ 4️⃣ Generación de código de control                │
│ 5️⃣ Almacenamiento seguro                          │
│                                                   │
│         [Cancelar]  [🛡️ Firmar con AES-256-GCM]  │
└──────────────────────────────────────────────────┘
```

---

## 🔄 Casos de Uso

### Caso 1: Emitir y Firmar Factura

1. Usuario crea una factura nueva
2. Agrega productos y cliente
3. Click en "Previsualizar"
4. Revisa datos y click en "Confirmar y Emitir"
5. Factura queda en estado **ISSUED (sin firma)**
6. Usuario click en botón "Firmar DTE" (🛡️)
7. Se abre modal con preview del DTE
8. Usuario confirma firma
9. Sistema firma con AES-256-GCM
10. Factura queda en estado **ISSUED (con firma DTE)**
11. Badge cambia a "🛡️ DTE Firmado" (verde)

### Caso 2: Anular Factura (Devolución de Producto)

1. Cliente devuelve un producto
2. Usuario busca la factura en la lista
3. Click en botón "Anular" (🗑️)
4. Se abre modal de anulación
5. Usuario ingresa motivo: "Devolución de producto por defecto"
6. Confirma anulación
7. Sistema cambia estado a **ANNULLED**
8. Badge cambia a "❌ Anulada" (rojo)
9. Factura queda visible pero no se puede modificar
10. Se registra en auditoría

### Caso 3: Verificar Integridad del DTE

1. Usuario/Auditor accede a una factura firmada
2. Sistema puede verificar la firma automáticamente
3. Endpoint `/api/dte/verify/:invoiceId` valida:
   - Firma AES-256-GCM
   - Hash SHA-256
   - Integridad del JSON
4. Retorna `valid: true/false`

---

## 🔒 Seguridad

### Variables de Entorno

```env
# Clave secreta para firma DTE (cambiar en producción)
DTE_SECRET_KEY=electroz-dte-secret-key-2024-change-in-production
```

**⚠️ IMPORTANTE:** En producción, usar una clave de 32+ caracteres aleatorios.

### Auditoría

Todas las operaciones DTE se registran en la tabla de auditoría:

- `DTE_SIGNED` - Cuando se firma un DTE
- `DTE_ANNULLED` - Cuando se anula una factura
- Incluye: usuario, timestamp, invoice number, hash, motivo

---

## 📝 Notas Técnicas

### ¿Por qué AES-256-GCM?

1. **Seguridad**: Grado militar, usado por gobiernos y bancos
2. **Integridad**: Authentication Tag detecta cualquier modificación
3. **Performance**: Más rápido que RSA para documentos grandes
4. **Estándar**: Ampliamente aceptado y auditado

### ¿Por qué no RSA?

- RSA es más lento para documentos grandes
- AES-256-GCM ofrece el mismo nivel de seguridad
- Más fácil de implementar y mantener
- No requiere gestión de certificados X.509

### Almacenamiento

- **dteJson**: JSON completo del DTE (campo `Json` en Prisma)
- **dteSignature**: JSON con firma, método, hash, etc. (campo `String` en Prisma)
- **annulReason**: Motivo de anulación (campo `String?` en Prisma)
- **annulledAt**: Fecha de anulación (campo `DateTime?` en Prisma)

---

## ✅ Checklist de Implementación

- ✅ Firma DTE con AES-256-GCM
- ✅ Estados: DRAFT, ISSUED, ANNULLED
- ✅ Endpoint de preview
- ✅ Endpoint de firma
- ✅ Endpoint de anulación
- ✅ Endpoint de verificación
- ✅ Código de control único
- ✅ Sello electrónico
- ✅ Hash SHA-256
- ✅ Auditoría completa
- ✅ UI con badges de estado
- ✅ Modal de firma con preview
- ✅ Modal de anulación
- ✅ Botones en lista de facturas
- ✅ Documentación completa

---

## 🚀 Próximos Pasos (Opcional)

1. **Integración con API del Ministerio de Hacienda** (El Salvador)
2. **Generación de QR Code** con datos del DTE
3. **Envío automático de DTE por email** al firmar
4. **Dashboard de DTEs** con estadísticas
5. **Exportación masiva de DTEs** para auditorías
6. **Validación de NIT/NRC** contra API gubernamental

---

## 📞 Soporte

Para más información sobre la implementación del DTE, consultar:
- `backend/README.md` - Documentación técnica del backend
- `backend/src/modules/dte/` - Código fuente del módulo DTE
- `src/components/invoicing/` - Componentes frontend del DTE

