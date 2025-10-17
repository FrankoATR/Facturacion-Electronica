import { prisma } from "../../config/prisma";

export const salesRepository = {
  async list(params: { skip: number; take: number; from?: Date; to?: Date; clientId?: string; type?: string }) {
    const filters: any = { status: { in: ["ISSUED", "CANCELED"] } };
    if (params.from || params.to) {
      filters.issuedAt = { gte: params.from, lte: params.to };
    }
    if (params.clientId) filters.clientId = params.clientId;
    if (params.type) filters.type = params.type as any;
    const [data, total] = await Promise.all([
      prisma.invoice.findMany({ where: filters, skip: params.skip, take: params.take, orderBy: { issuedAt: "desc" }, include: { client: true } }),
      prisma.invoice.count({ where: filters }),
    ]);
    return { data, total };
  },
};


