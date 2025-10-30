-- AlterEnum
ALTER TYPE "InvoiceType" ADD VALUE 'CREDIT_FISCAL';

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "nrc" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "cancellationReason" TEXT;
