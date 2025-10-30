DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'InvoiceType'
      AND e.enumlabel = 'CREDIT_FISCAL'
  ) THEN
    ALTER TYPE "InvoiceType" ADD VALUE 'CREDIT_FISCAL';
  END IF;
END $$;

ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "nrc" TEXT;

ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT;
