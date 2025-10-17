import { z } from "zod";

export const UpsertProductDto = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  category: z.string().optional(),
  unitPrice: z.number().positive(),
  taxRate: z.number().min(0),
  stock: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const AdjustStockDto = z.object({
  quantity: z.number().int(),
  reason: z.string().optional(),
});

export type UpsertProductInput = z.infer<typeof UpsertProductDto>;
export type AdjustStockInput = z.infer<typeof AdjustStockDto>;


