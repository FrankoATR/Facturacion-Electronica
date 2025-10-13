import { Role } from "@prisma/client";
import { userRepository, UserCreateInput, UserUpdateInput } from "./user.repository";

export const userService = {
  async list() {
    return userRepository.list();
  },
  async create(input: { email: string; name: string; passwordHash: string; role: "ADMIN" | "SELLER" }) {
    const data: UserCreateInput = { ...input, role: input.role as Role } as any;
    return userRepository.create(data);
  },
  async update(id: string, input: { name?: string; role?: "ADMIN" | "SELLER"; isActive?: boolean; passwordHash?: string }) {
    const data: UserUpdateInput = { ...input, role: input.role as any };
    return userRepository.update(id, data);
  },
  async disable(id: string) {
    await userRepository.softDelete(id);
  },
  async findByEmail(email: string) {
    return userRepository.findByEmail(email);
  },
  async touchLastLogin(id: string) {
    await userRepository.touchLastLogin(id);
  },
};


