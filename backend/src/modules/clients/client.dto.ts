import { z } from "zod";

export const UpsertClientDto = z.object({
  name: z.string().min(1),
  taxId: z.string().min(3),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  nit: z.string().optional(),
  nrc: z.string().optional(),
  giro: z.string().optional(),
  actividadEconomica: z.string().optional(),
  direccionFiscal: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type UpsertClientInput = z.infer<typeof UpsertClientDto>;


