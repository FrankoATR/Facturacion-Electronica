import { invoiceRepository } from "./invoice.repository";
import { CreateInvoiceInput } from "./invoice.dto";
import { prisma } from "../../config/prisma";
import { mapInvoiceNumbers } from "../../common/serialization";
import { appendAuditLog } from "../../common/audit";
import { notificationService } from "../notifications/notification.service";
import { stockAlertService } from "../inventory/stock-alert.service";
import { emailService } from "../email/email.service";
import { env } from "../../config/env";

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

// CCF (Comprobante de Crédito Fiscal) calculation - IVA 13% breakdown
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
          // Set as ISSUED at creation so invoices are recorded as finalized
          status: "ISSUED",
          issuedAt: new Date(),
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

    // Verificar stock bajo para cada producto vendido
    for (const it of input.items) {
      if (it.productId) {
        await stockAlertService.checkProductStock(it.productId);
      }
    }

    await appendAuditLog({
      actorId: userId,
      action: "INVOICE_ISSUED",
      entity: "Invoice",
      entityId: created.id,
      payload: { number: created.number, clientId: created.clientId, total },
    });

    // Crear notificación para admins
    await notificationService.notifyAdmins(
      "INVOICE_ISSUED",
      "Factura Emitida",
      `Factura ${created.number} emitida por $${total.toFixed(2)}`,
      { invoiceId: created.id, invoiceNumber: created.number, total }
    );

    // Enviar correo automáticamente solo para facturas electrónicas
    if (input.type === "ELECTRONIC" && env.smtpUser) {
      try {
        // Obtener información del cliente
        const client = await prisma.client.findUnique({ where: { id: input.clientId } });
        const clientName = client?.name || 'Cliente';
        
        // Para pruebas, enviar al mismo email configurado en SMTP_USER
        const emailToSend = env.smtpUser;
        
        console.log(`[INVOICE] Enviando factura electrónica ${created.number} por email a ${emailToSend}`);
        
        // Crear un PDF simple (mock) para el adjunto
        const mockPdfContent = `Factura Electrónica ${created.number}\nCliente: ${clientName}\nTotal: $${total.toFixed(2)}\nFecha: ${new Date().toLocaleDateString()}\nTipo: Electrónica`;
        const pdfBuffer = Buffer.from(mockPdfContent, 'utf-8');
        
        await emailService.sendInvoiceEmail(
          emailToSend,
          created.number,
          clientName,
          total,
          pdfBuffer
        );
        
        console.log(`[INVOICE] ✅ Correo enviado exitosamente para factura electrónica ${created.number}`);
      } catch (emailError: any) {
        console.error(`[INVOICE] ❌ Error al enviar correo para factura electrónica ${created.number}:`, emailError.message);
        // No fallar la creación de factura si el email falla
      }
    } else if (input.type === "TRADITIONAL") {
      console.log(`[INVOICE] ℹ️ Factura tradicional ${created.number} - no se enviará correo (solo facturas electrónicas)`);
    } else if (!env.smtpUser) {
      console.log(`[INVOICE] ⚠️ SMTP no configurado - no se enviará correo para factura ${created.number}`);
    }

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


