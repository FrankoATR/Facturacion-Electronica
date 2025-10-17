import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { prisma } from "../../config/prisma";

export const reportsRouter = Router();

// Accountants and Admin can access IVA reports
reportsRouter.use(authenticate, authorize(["ADMIN", "ACCOUNTANT"]));

reportsRouter.get("/iva", async (req, res) => {
  const parseLocalDate = (s: string) => {
    const [y, m, d] = s.split("-").map((n) => parseInt(n, 10));
    return new Date(y, (m || 1) - 1, d || 1);
  };
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  const fromParam = (req.query.from as string) || undefined;
  const toParam = (req.query.to as string) || undefined;
  const from = startOfDay(fromParam ? parseLocalDate(fromParam) : new Date(new Date().getFullYear(), 0, 1));
  const to = endOfDay(toParam ? parseLocalDate(toParam) : new Date());

  const data = await prisma.invoice.findMany({
    where: { status: "ISSUED", issuedAt: { gte: from, lte: to } },
    select: { subtotal: true, taxTotal: true, total: true, type: true, number: true, issuedAt: true },
    orderBy: { issuedAt: "asc" },
  });

  const toNum = (v: any) => (typeof v === "number" ? v : Number(String(v)));
  const totals = data.reduce(
    (acc, it) => {
      acc.subtotal += toNum(it.subtotal);
      acc.taxTotal += toNum(it.taxTotal);
      acc.total += toNum(it.total);
      return acc;
    },
    { subtotal: 0, taxTotal: 0, total: 0 }
  );

  res.json({ range: { from, to }, totals, data });
});


