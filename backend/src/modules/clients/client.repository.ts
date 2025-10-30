import { prisma } from "../../config/prisma";
import { ClientStatus, Prisma } from "@prisma/client";

export type ClientCreateInput = {
  name: string;
  taxId: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: ClientStatus;
};

export type ClientUpdateInput = Partial<ClientCreateInput>;

export const clientRepository = {
  async list(params: { skip: number; take: number; search?: string }) {
    const { skip, take, search } = params;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { taxId: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};
    const [data, total] = await Promise.all([
      prisma.client.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
      prisma.client.count({ where }),
    ]);
    return { data, total };
  },
  async create(data: ClientCreateInput) {
    return prisma.client.create({ data });
  },
  async findById(id: string) {
    return prisma.client.findUnique({ where: { id } });
  },
  async update(id: string, data: ClientUpdateInput) {
    return prisma.client.update({ where: { id }, data });
  },
};


