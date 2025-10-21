import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { prisma } from "../../config/prisma";

export const backupRouter = Router();

backupRouter.use(authenticate, authorize(["ADMIN"]));

backupRouter.post("/backup", async (req, res) => {
  const note = req.body?.note as string | undefined;
  const record = await prisma.backupRecord.create({ data: { createdById: req.user?.id, note, location: "local" } });
  res.json({ data: record });
});

backupRouter.get("/backup/invoices", async (req, res) => {
  try {
    // Obtener todas las facturas con sus relaciones
    const invoices = await prisma.invoice.findMany({
      include: {
        client: true,
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
        dte: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Metadata del backup
    const backupData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: req.user?.id || 'system',
        totalInvoices: invoices.length,
        system: 'Adventure Works - Sistema de Facturación',
        version: '1.0.0',
      },
      invoices: invoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        type: inv.type,
        status: inv.status,
        issuedAt: inv.issuedAt,
        canceledAt: inv.canceledAt,
        client: {
          id: inv.client.id,
          name: inv.client.name,
          taxId: inv.client.taxId,
          email: inv.client.email,
          phone: inv.client.phone,
          address: inv.client.address,
        },
        items: inv.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount),
          taxRate: Number(item.taxRate),
          subtotal: Number(item.subtotal),
          taxAmount: Number(item.taxAmount),
          total: Number(item.total),
          product: item.product ? {
            sku: item.product.sku,
            name: item.product.name,
          } : null,
        })),
        totals: {
          subtotal: Number(inv.subtotal),
          taxTotal: Number(inv.taxTotal),
          total: Number(inv.total),
          paidTotal: Number(inv.paidTotal),
          balance: Number(inv.balance),
        },
        payments: inv.payments.map((payment) => ({
          amount: Number(payment.amount),
          method: payment.method,
          note: payment.note,
          paidAt: payment.paidAt,
        })),
        paymentMethod: inv.paymentMethod,
        notes: inv.notes,
        electronicFiscalStamp: inv.electronicFiscalStamp,
        dte: inv.dte ? {
          status: inv.dte.status,
          retries: inv.dte.retries,
          sentAt: inv.dte.sentAt,
          ackAt: inv.dte.ackAt,
          xmlUrl: inv.dte.xmlUrl,
          ackUrl: inv.dte.ackUrl,
          lastError: inv.dte.lastError,
        } : null,
        createdBy: inv.createdBy ? {
          name: inv.createdBy.name,
          email: inv.createdBy.email,
        } : null,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt,
      })),
    };

    // Registrar el backup
    await prisma.backupRecord.create({
      data: {
        createdById: req.user?.id,
        note: `Backup completo de ${invoices.length} facturas`,
        location: 'download',
      },
    });

    // Enviar como descarga JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=backup-facturas-${new Date().toISOString().split('T')[0]}.json`
    );
    res.json(backupData);
  } catch (error: any) {
    console.error('Error generating backup:', error);
    res.status(500).json({ message: 'Error al generar backup', error: error.message });
  }
});

backupRouter.post("/restore", async (_req, res) => {
  // In real systems you'd trigger a restore job; here we just acknowledge
  res.json({ message: "Restore initiated" });
});


