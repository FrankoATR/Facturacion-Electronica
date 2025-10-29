# Backend API - Billing System

Stack: Node.js, Express, TypeScript, Prisma, PostgreSQL.

## Quick start

1. Create `.env` based on `.env.example`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/billing_db?schema=public"
JWT_SECRET="replace-with-strong-secret"
PORT=4000
```

2. Install and setup:

```
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

API runs at `http://localhost:4000/api`.

## Architecture

- src/
  - config/ (env, prisma)
  - common/ (errors, sanitize, pagination, serialization)
  - middleware/ (auth, error)
  - modules/
    - users/ (dto, repository, service, controller)
    - clients/
    - products/
    - invoices/
    - sales/
    - dashboard/
  - utils/ (jwt, password)
  - web/ (router, route files)

- Layers: controller -> service -> repository -> Prisma.
- RBAC: `authenticate` + `authorize(["ADMIN"|"SELLER"])`.

## Seed Data

### Default Users
- ADMIN: admin@example.com / admin1234
- SELLER: seller@example.com / seller1234
- ACCOUNTANT: accountant@example.com / accountant1234
- AUDITOR: auditor@example.com / auditor1234

### Additional Seeders
Run these commands to populate the database with test data:

```bash
# Seed AdventureWorks-inspired products (~90 products across categories)
npm run seed:products

# Seed dummy clients and invoices (3 clients, 20-30 invoices with FCF/CCF)
npm run seed:invoices
```

**Note:** Seeders respect the `SEND_EMAILS` environment variable and will not send real emails unless explicitly enabled.

## Main endpoints

- Auth: POST /api/auth/login, GET /api/auth/me
- Users: CRUD (ADMIN)
- Clients: CRUD + toggle (ADMIN, SELLER)
- Products: CRUD (ADMIN), adjust (ADMIN, SELLER)
- Invoices: list/create/issue (ADMIN, SELLER), cancel (ADMIN)
- Sales: list with filters (ADMIN, SELLER)
- Dashboard: metrics (ADMIN)

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/electroz_db?schema=public"

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# SMTP Configuration (optional - for email sending)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="EleCtroZ <noreply@electroz.com>"

# Email Control
# Set to 'true' to enable real email sending (disabled by default for development/seeding)
SEND_EMAILS=false

# Timezone
TZ=America/El_Salvador

# CORS
CORS_ORIGIN=http://localhost:5173
```

## DTE (Documento Tributario Electrónico)

The system includes internal DTE generation and signing with **AES-256-GCM encryption**:

- **FCF (Factura Consumidor Final)**: Standard consumer invoice
- **CCF (Comprobante de Crédito Fiscal)**: Fiscal credit invoice (requires client NIT/NRC)

### DTE Endpoints
- `POST /api/dte/preview/:invoiceId` - Preview DTE JSON without signing
- `POST /api/dte/sign/:invoiceId` - **Sign DTE with AES-256-GCM** (sets status to ISSUED)
- `POST /api/dte/annul/:invoiceId` - Annul invoice with reason (audit logged)
- `GET /api/dte/verify/:invoiceId` - Verify DTE signature integrity
- `GET /api/dte/:invoiceId/json` - Download DTE JSON
- `GET /api/dte/:invoiceId/pdf` - Download professional PDF

### DTE Signature Process

The system uses **AES-256-GCM** (Advanced Encryption Standard with Galois/Counter Mode) for signing DTEs:

1. **Canonicalization**: JSON is canonicalized (keys sorted alphabetically)
2. **Hash Generation**: SHA-256 hash of the canonical JSON
3. **Encryption**: AES-256-GCM encryption with:
   - Random IV (Initialization Vector)
   - Authentication Tag for integrity
   - Derived key from `DTE_SECRET_KEY`
4. **Control Code**: Unique control code generated from invoice data
5. **Electronic Seal**: Timestamp-based seal for additional security

**Signature Output:**
```json
{
  "signature": "base64-encoded-encrypted-data",
  "method": "AES-256-GCM",
  "signedAt": "2025-10-29T04:15:00.000Z",
  "hash": "sha256-hash-of-document",
  "controlCode": "A1B2C3D4E5F6G7H8",
  "electronicSeal": "SEAL-XXXXX..."
}
```

### RSA Key Generation

For production, generate RSA keys:

```bash
mkdir -p backend/src/config/keys
cd backend/src/config/keys
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

**Note:** Keys are gitignored. The system will auto-generate dev keys if missing.

## Monthly Metrics

The system calculates monthly billing totals in `America/El_Salvador` timezone:

- Endpoint: `GET /api/invoices/metrics?period=month`
- Aggregates all ISSUED invoices for the current calendar month
- Includes 60-second in-memory cache for performance

## Notes

- Totals are computed server-side. Decimal values serialized to numbers.
- Electronic billing (DTE) is fully implemented with internal RSA signing.
- Input sanitization uses basic controls aligned with OWASP recommendations.
- Email sending is disabled by default (`SEND_EMAILS=false`) to prevent accidental emails during development.


