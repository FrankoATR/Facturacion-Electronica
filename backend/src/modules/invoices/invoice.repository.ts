import { prisma } from "../../config/prisma";
import { InvoiceStatus, InvoiceType } from "@prisma/client";

export type InvoiceListParams = {
  skip: number;
  take: number;
  status?: InvoiceStatus;
  type?: InvoiceType;
};

export const invoiceRepository = {
  async nextNumber() {
    const count = await prisma.invoice.count();
    return `INV-${String(count + 1).padStart(6, "0")}`;
  },
  async list(params: InvoiceListParams) {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;
    const [data, total] = await Promise.all([
      prisma.invoice.findMany({ where, skip: params.skip, take: params.take, orderBy: { createdAt: "desc" }, include: { client: true } }),
      prisma.invoice.count({ where }),
    ]);
    return { data, total };
  },
  async findById(id: string) {
    return prisma.invoice.findUnique({ where: { id }, include: { client: true, items: true } });
  },
};


