import { prisma } from "../../config/prisma";
import { Role } from "@prisma/client";

export type UserCreateInput = {
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
};

export type UserUpdateInput = Partial<{
  name: string;
  role: Role;
  isActive: boolean;
  passwordHash: string;
}>;

export const userRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },
  async list() {
    return prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, lastLoginAt: true } });
  },
  async create(data: UserCreateInput) {
    return prisma.user.create({ data, select: { id: true, email: true, name: true, role: true } });
  },
  async update(id: string, data: UserUpdateInput) {
    return prisma.user.update({ where: { id }, data, select: { id: true, email: true, name: true, role: true, isActive: true } });
  },
  async softDelete(id: string) {
    return prisma.user.update({ where: { id }, data: { isActive: false } });
  },
  async touchLastLogin(id: string) {
    return prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  },
};


