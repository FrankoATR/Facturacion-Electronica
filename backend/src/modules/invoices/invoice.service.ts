import { invoiceRepository } from "./invoice.repository";
import { CreateInvoiceInput } from "./invoice.dto";
import { prisma } from "../../config/prisma";
import { mapInvoiceNumbers } from "../../common/serialization";
import { appendAuditLog } from "../../common/audit";

function calcTotals(items: CreateInvoiceInput["items"]) {
  const subtotal = items.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  const taxTotal = items.reduce((acc, it) => acc + (it.unitPrice * it.quantity) * (it.taxRate / 100), 0);
  const total = subtotal + taxTotal;
  return { subtotal, taxTotal, total };
}

export const invoiceService = {
  async list(params: { skip: number; take: number; status?: string; type?: string }) {
    const { skip, take, status, type } = params;
    const input: any = { skip, take };
    if (status) input.status = status;
    if (type) input.type = type;
    return invoiceRepository.list(input);
  },

  async create(userId: string | undefined, input: CreateInvoiceInput) {
    const productIds = input.items.map(i => i.productId).filter(Boolean) as string[];
    const products = productIds.length ? await prisma.product.findMany({ where: { id: { in: productIds } } }) : [];
    const productById = new Map(products.map(p => [p.id, p]));
    for (const it of input.items) {
      if (it.productId) {
        const p = productById.get(it.productId);
        if (!p) throw new Error("Invalid product");
        if (p.stock < it.quantity) throw new Error(`Insufficient stock for ${p.name}`);
      }
    }

    const { subtotal, taxTotal, total } = calcTotals(input.items);
    const number = await invoiceRepository.nextNumber();

    const created = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          number,
          clientId: input.clientId,
          type: input.type as any,
          paymentMethod: input.paymentMethod,
          notes: input.notes,
          createdById: userId,
          // Set as ISSUED at creation so invoices are recorded as finalized
          status: "ISSUED",
          issuedAt: new Date(),
          subtotal,
          taxTotal,
          total,
          items: {
            create: input.items.map(it => ({
              productId: it.productId,
              description: it.description,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              taxRate: it.taxRate,
              subtotal: it.unitPrice * it.quantity,
              taxAmount: (it.unitPrice * it.quantity) * (it.taxRate / 100),
              total: (it.unitPrice * it.quantity) * (1 + it.taxRate / 100),
            })),
          },
        },
        include: { items: true },
      });

      for (const it of input.items) {
        if (it.productId) {
          const p = productById.get(it.productId)!;
          await tx.product.update({ where: { id: p.id }, data: { stock: p.stock - it.quantity } });
          await tx.stockMovement.create({ data: { productId: p.id, quantity: it.quantity, type: "OUT", createdById: userId, invoiceId: inv.id } });
        }
      }

      return inv;
    });

    await appendAuditLog({
      actorId: userId,
      action: "INVOICE_ISSUED",
      entity: "Invoice",
      entityId: created.id,
      payload: { number: created.number, clientId: created.clientId, total },
    });

    return mapInvoiceNumbers(created);
  },

  async issue(id: string) {
    const inv = await prisma.invoice.update({ where: { id }, data: { status: "ISSUED", issuedAt: new Date() } });
    return mapInvoiceNumbers(inv);
  },

  async cancel(userId: string | undefined, id: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id }, include: { items: true } });
    if (!invoice) throw new Error("Not found");
    if (invoice.status === "CANCELED") throw new Error("Already canceled");

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({ where: { id }, data: { status: "CANCELED", canceledAt: new Date() } });
      for (const it of invoice.items) {
        if (it.productId) {
          const p = await tx.product.findUnique({ where: { id: it.productId } });
          if (p) {
            await tx.product.update({ where: { id: p.id }, data: { stock: p.stock + it.quantity } });
            await tx.stockMovement.create({ data: { productId: p.id, quantity: it.quantity, type: "IN", createdById: userId, invoiceId: invoice.id } });
          }
        }
      }
    });
  },

  async get(id: string) {
    const inv = await invoiceRepository.findById(id);
    return inv ? mapInvoiceNumbers(inv) : null;
  },
};


