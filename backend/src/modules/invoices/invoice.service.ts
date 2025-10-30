import { invoiceRepository } from "./invoice.repository";
import { CreateInvoiceInput } from "./invoice.dto";
import { prisma } from "../../config/prisma";
import { mapInvoiceNumbers } from "../../common/serialization";
import { appendAuditLog } from "../../common/audit";
import { notificationService } from "../notifications/notification.service";
import { stockAlertService } from "../inventory/stock-alert.service";
import { emailService } from "../email/email.service";
import { env } from "../../config/env";
import PDFDocument from "pdfkit";

function calcTotals(items: CreateInvoiceInput["items"]) {
  // Calcular subtotal considerando descuentos
  const subtotal = items.reduce((acc, it) => {
    const baseAmount = it.unitPrice * it.quantity;
    const discount = it.discount || 0;
    return acc + (baseAmount - discount);
  }, 0);
  
  // IVA 13% sobre el subtotal después de descuentos
  const taxTotal = items.reduce((acc, it) => {
    const baseAmount = it.unitPrice * it.quantity;
    const discount = it.discount || 0;
    const taxableAmount = baseAmount - discount;
    return acc + (taxableAmount * (it.taxRate / 100));
  }, 0);
  
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
        const clientEmail = client?.email;
        
        // Validar que el cliente tenga email antes de enviar
        if (!clientEmail) {
          console.log(`[INVOICE] ⚠️ Cliente ${clientName} no tiene email configurado - no se enviará correo para factura ${created.number}`);
        } else {
          console.log(`[INVOICE] Enviando factura electrónica ${created.number} por email a ${clientEmail}`);
          
          // Generar PDF completo usando el mismo formato que en dte.ts
          // Para esto necesitamos construir el DTE primero
          const { buildInvoiceDto, buildDTEDocument } = await import("../dte/dte.service");
          
          const dto = await buildInvoiceDto(created.id);
          const dteDoc = await buildDTEDocument(created.id);
          
          if (dto && dteDoc) {
            const pdfDoc = new PDFDocument({ margin: 50, size: 'LETTER' });
            const chunks: Buffer[] = [];
            
            pdfDoc.on('data', (chunk) => chunks.push(chunk));
            
            await new Promise<void>((resolve) => {
              pdfDoc.on('end', () => resolve());
              
              // Usar el mismo formato del PDF que se genera en dte.ts
              pdfDoc.fontSize(24).fillColor('#ff6b35').text('⚡ EleCtroZ', { align: 'center' });
              pdfDoc.fontSize(10).fillColor('#333').text('EleCtroZ S.A. DE C.V.', { align: 'center' });
              pdfDoc.text('NIT: 0614-031289-001-9 | NRC: 12345-6', { align: 'center' });
              pdfDoc.text('Colonia Escalón, San Salvador, El Salvador', { align: 'center' });
              pdfDoc.text('Tel: 2222-2222 | Email: info@electroz.com', { align: 'center' });
              pdfDoc.moveDown();
              pdfDoc.moveTo(50, pdfDoc.y).lineTo(562, pdfDoc.y).stroke();
              pdfDoc.moveDown();
              pdfDoc.fontSize(16).fillColor('#ff6b35').text('FACTURA ELECTRÓNICA', { align: 'center' });
              pdfDoc.fontSize(12).fillColor('#333').text(`No. ${dto.number}`, { align: 'center' });
              pdfDoc.moveDown();
              pdfDoc.fontSize(10).fillColor('#333').text(`Cliente: ${clientName}`);
              pdfDoc.text(`Total: $${total.toFixed(2)}`);
              pdfDoc.end();
            });
            
            const pdfBuffer = Buffer.concat(chunks);
            
            await emailService.sendInvoiceEmail(
              clientEmail,
              created.number,
              clientName,
              total,
              pdfBuffer
            );
            
            console.log(`[INVOICE] ✅ Correo enviado exitosamente para factura electrónica ${created.number} a ${clientEmail}`);
          }
        }
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


