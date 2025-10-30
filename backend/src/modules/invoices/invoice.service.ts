import { invoiceRepository } from "./invoice.repository";
import { CreateInvoiceInput } from "./invoice.dto";
import { prisma } from "../../config/prisma";
import { mapInvoiceNumbers } from "../../common/serialization";
import { appendAuditLog } from "../../common/audit";
import { stockAlertService } from "../inventory/stock-alert.service";
import { fromInvoiceToDTE } from "../dte/dte.mapper";

// FCF (Factura Consumidor Final) calculation - same as before
function computeTotalsFCF(items: CreateInvoiceInput["items"]) {
  const subtotal = items.reduce((acc, it) => {
    const baseAmount = it.unitPrice * it.quantity;
    const discount = it.discount || 0;
    return acc + (baseAmount - discount);
  }, 0);
  
  const taxTotal = items.reduce((acc, it) => {
    const baseAmount = it.unitPrice * it.quantity;
    const discount = it.discount || 0;
    const taxableAmount = baseAmount - discount;
    return acc + (taxableAmount * (it.taxRate / 100));
  }, 0);
  
  const total = subtotal + taxTotal;
  return { subtotal, taxTotal, total };
}

// CCF (Comprobante de Credito Fiscal) calculation - IVA 13% breakdown
function computeTotalsCCF(items: CreateInvoiceInput["items"]) {
  // For CCF, we need to break down the IVA clearly
  const subtotal = items.reduce((acc, it) => {
    const baseAmount = it.unitPrice * it.quantity;
    const discount = it.discount || 0;
    return acc + (baseAmount - discount);
  }, 0);
  
  // IVA 13% (El Salvador standard rate)
  const taxTotal = items.reduce((acc, it) => {
    const baseAmount = it.unitPrice * it.quantity;
    const discount = it.discount || 0;
    const taxableAmount = baseAmount - discount;
    return acc + (taxableAmount * (it.taxRate / 100));
  }, 0);
  
  const total = subtotal + taxTotal;
  
  // CCF includes the same calculation but may have additional fields for retention
  // For now, we use the same calculation (retention = 0)
  return { subtotal, taxTotal, total, retention: 0 };
}

// Legacy function for backward compatibility
function calcTotals(items: CreateInvoiceInput["items"]) {
  return computeTotalsFCF(items);
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
    // Validate client for CCF
    if (input.documentType === "CCF") {
      const client = await prisma.client.findUnique({
        where: { id: input.clientId },
      });
      
      if (!client) {
        throw new Error("Client not found");
      }
      
      if (!client.nit || !client.nrc) {
        throw new Error("CCF requires client to have NIT and NRC. Please update client information.");
      }
    }
    
    // Validar que si es crédito fiscal, el cliente tenga NRC
    if (input.type === "CREDIT_FISCAL") {
      const client = await prisma.client.findUnique({ where: { id: input.clientId } });
      if (!client) throw new Error("Cliente no encontrado");
      if (!client.nrc || client.nrc.trim() === "") {
        throw new Error("El crédito fiscal requiere que el cliente tenga un NRC (Número de Registro de Contribuyente) registrado");
      }
    }

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

    // Use appropriate calculation based on document type
    const totals = input.documentType === "CCF" 
      ? computeTotalsCCF(input.items)
      : computeTotalsFCF(input.items);
    const { subtotal, taxTotal, total } = totals;
    const number = await invoiceRepository.nextNumber();

    const created = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          number,
          clientId: input.clientId,
          type: input.type as any,
          documentType: input.documentType as any,
          paymentMethod: input.paymentMethod,
          notes: input.notes,
          createdById: userId,
          // Set as DRAFT at creation so invoices can be finalized after signature
          status: "DRAFT",
          issuedAt: null,
          subtotal,
          taxTotal,
          total,
          items: {
            create: input.items.map(it => {
              const baseAmount = it.unitPrice * it.quantity;
              const discount = it.discount || 0;
              const subtotal = baseAmount - discount;
              const taxAmount = subtotal * (it.taxRate / 100);
              const total = subtotal + taxAmount;
              
              return {
                productId: it.productId,
                description: it.description,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                discount,
                taxRate: it.taxRate,
                subtotal,
                taxAmount,
                total,
              };
            }),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          client: true,
        },
      });

      for (const it of input.items) {
        if (it.productId) {
          const p = productById.get(it.productId)!;
          await tx.product.update({ where: { id: p.id }, data: { stock: p.stock - it.quantity } });
          await tx.stockMovement.create({ data: { productId: p.id, quantity: it.quantity, type: "OUT", createdById: userId, invoiceId: inv.id } });
        }
      }

      const dtePayload = fromInvoiceToDTE(inv as any);
      await tx.invoice.update({
        where: { id: inv.id },
        data: {
          dteJson: dtePayload as any,
        },
      });

      return {
        ...inv,
        dteJson: dtePayload as any,
      };
    });

    // Verificar stock bajo para cada producto vendido
    for (const it of input.items) {
      if (it.productId) {
        await stockAlertService.checkProductStock(it.productId);
      }
    }

    await appendAuditLog({
      actorId: userId,
      action: "INVOICE_CREATED",
      entity: "Invoice",
      entityId: created.id,
      payload: { number: created.number, clientId: created.clientId, total, status: "DRAFT" },
    });
    return mapInvoiceNumbers(created);
  },

  async issue(id: string) {
    const inv = await prisma.invoice.update({ where: { id }, data: { status: "ISSUED", issuedAt: new Date() } });
    return mapInvoiceNumbers(inv);
  },

  async cancel(userId: string | undefined, id: string, cancellationReason: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id }, include: { items: true } });
    if (!invoice) throw new Error("Not found");
    if (invoice.status === "CANCELED") throw new Error("Already canceled");
    if (!cancellationReason || cancellationReason.trim().length === 0) {
      throw new Error("La observación es obligatoria para anular una factura");
    }

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({ 
        where: { id }, 
        data: { 
          status: "CANCELED", 
          canceledAt: new Date(),
          cancellationReason: cancellationReason.trim(),
        } 
      });
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

    await appendAuditLog({
      actorId: userId,
      action: "INVOICE_CANCELED",
      entity: "Invoice",
      entityId: invoice.id,
      payload: { number: invoice.number, cancellationReason: cancellationReason.trim() },
    });
  },

  async get(id: string) {
    const inv = await invoiceRepository.findById(id);
    return inv ? mapInvoiceNumbers(inv) : null;
  },
};
