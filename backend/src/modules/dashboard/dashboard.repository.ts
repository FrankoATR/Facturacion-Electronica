import { prisma } from "../../config/prisma";
import { getMonthRange } from "../../common/date";

export const dashboardRepository = {
  async metrics() {
    const { start, end } = getMonthRange();
    
    const [users, clients, products, invoices, salesThisMonth] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.client.count({}),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.invoice.count({}),
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: {
          status: "ISSUED",
          issuedAt: {
            gte: start,
            lte: end,
          },
        },
      }),
    ]);
    return { 
      users, 
      clients, 
      products, 
      invoices, 
      salesThisMonth: Number(salesThisMonth._sum.total || 0) 
    };
  },
};


