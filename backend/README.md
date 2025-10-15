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

## Seed users

- ADMIN: admin@example.com / admin1234
- SELLER: seller@example.com / seller1234
- ACCOUNTANT: accountant@example.com / accountant1234
- AUDITOR: auditor@example.com / auditor1234
- CUSTOMER: customer@example.com / customer1234

## Main endpoints

- Auth: POST /api/auth/login, GET /api/auth/me
- Users: CRUD (ADMIN)
- Clients: CRUD + toggle (ADMIN, SELLER)
- Products: CRUD (ADMIN), adjust (ADMIN, SELLER)
- Invoices: list/create/issue (ADMIN, SELLER), cancel (ADMIN)
- Sales: list with filters (ADMIN, SELLER)
- Dashboard: metrics (ADMIN)

## Notes

- Totals are computed server-side. Decimal values serialized to numbers.
- Electronic billing fields are stubbed for future integration.
- Input sanitization uses basic controls aligned with OWASP recommendations.


