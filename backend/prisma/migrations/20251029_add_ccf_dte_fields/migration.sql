-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('FCF', 'CCF');

-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'ANNULLED';

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "nit" TEXT,
ADD COLUMN     "nrc" TEXT,
ADD COLUMN     "giro" TEXT,
ADD COLUMN     "actividadEconomica" TEXT,
ADD COLUMN     "direccionFiscal" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "documentType" "DocumentType" NOT NULL DEFAULT 'FCF',
ADD COLUMN     "annulledAt" TIMESTAMP(3),
ADD COLUMN     "annulReason" TEXT,
ADD COLUMN     "dteJson" JSONB,
ADD COLUMN     "dteSignature" TEXT;

-- CreateIndex
CREATE INDEX "Invoice_issuedAt_idx" ON "Invoice"("issuedAt");

-- CreateIndex
CREATE INDEX "Invoice_documentType_idx" ON "Invoice"("documentType");

