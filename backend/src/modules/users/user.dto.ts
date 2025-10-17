import { z } from "zod";

export const CreateUserDto = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "SELLER"]),
});

export const UpdateUserDto = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "SELLER"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserDto>;
export type UpdateUserInput = z.infer<typeof UpdateUserDto>;


