import { prisma } from "../../config/prisma";

export const dashboardRepository = {
  async metrics() {
    // Calcular primer y último día del mes actual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [users, clients, products, invoices, salesThisMonth] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.client.count({}),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.invoice.count({
        where: {
          status: "ISSUED",
          issuedAt: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth,
          },
        },
      }),
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: {
          status: "ISSUED",
          issuedAt: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth,
          },
        },
      }),
    ]);
    return { users, clients, products, invoices, salesToday: (salesThisMonth._sum.total as any) ?? 0 };
  },
};


