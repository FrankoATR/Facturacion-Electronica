import { z } from "zod";

export const InvoiceItemDto = z.object({
  productId: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).default(0), // Descuento por item
  taxRate: z.number().min(0),
});

export const CreateInvoiceDto = z.object({
  clientId: z.string(),
  type: z.enum(["ELECTRONIC", "TRADITIONAL"]),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(InvoiceItemDto).min(1),
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceDto>;


