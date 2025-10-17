import { Decimal } from "@prisma/client/runtime/library";

export function decimalToNumber(value: any): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (value instanceof Decimal) return Number(value.toString());
  if (typeof value === "string") return Number.parseFloat(value);
  return Number(value);
}

export function mapInvoiceNumbers<T extends any>(invoice: T): any {
  // shallow convert known money fields if present
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyInv: any = invoice;
  if ("subtotal" in anyInv) anyInv.subtotal = decimalToNumber(anyInv.subtotal);
  if ("taxTotal" in anyInv) anyInv.taxTotal = decimalToNumber(anyInv.taxTotal);
  if ("total" in anyInv) anyInv.total = decimalToNumber(anyInv.total);
  return anyInv;
}


