import { prisma } from "../../config/prisma";
import { ProductStatus, StockMovementType } from "@prisma/client";

export type ProductCreateInput = {
  sku: string;
  name: string;
  category?: string | null;
  unitPrice: number;
  taxRate: number;
  stock?: number;
  lowStockThreshold?: number;
  status?: ProductStatus;
};

export type ProductUpdateInput = Partial<ProductCreateInput>;

export const productRepository = {
  async list(params: { skip: number; take: number; search?: string }) {
    const { skip, take, search } = params;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};
    const [data, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
      prisma.product.count({ where }),
    ]);
    return { data, total };
  },
  async create(data: ProductCreateInput) {
    return prisma.product.create({ data });
  },
  async update(id: string, data: ProductUpdateInput) {
    return prisma.product.update({ where: { id }, data });
  },
  async findById(id: string) {
    return prisma.product.findUnique({ where: { id } });
  },
  async adjustStock(params: { id: string; delta: number; userId?: string; reason?: string }) {
    const { id, delta, userId, reason } = params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return null;
    const newStock = product.stock + delta;
    if (newStock < 0) throw new Error("Insufficient stock");
    const type: StockMovementType = delta === 0 ? "ADJUST" : delta > 0 ? "IN" : "OUT";
    const [updated] = await prisma.$transaction([
      prisma.product.update({ where: { id }, data: { stock: newStock } }),
      prisma.stockMovement.create({ data: { productId: id, quantity: Math.abs(delta), type, reason, createdById: userId } }),
    ]);
    return updated;
  },
};


