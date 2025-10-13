import { prisma } from "../../config/prisma";

export const dashboardRepository = {
  async metrics() {
    const [users, clients, products, invoices, salesToday] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.client.count({}),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.invoice.count({}),
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: {
          status: "ISSUED",
          issuedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(24, 0, 0, 0)),
          },
        },
      }),
    ]);
    return { users, clients, products, invoices, salesToday: (salesToday._sum.total as any) ?? 0 };
  },
};


