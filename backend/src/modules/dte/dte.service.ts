import { prisma } from "../../config/prisma";

export async function simulateDteSend(invoiceId: string) {
  const ok = Math.random() > 0.1; // 90% success
  if (ok) {
    return {
      status: "ACCEPTED" as const,
      xmlUrl: `https://example.com/dte/${invoiceId}.xml`,
      ackUrl: `https://example.com/ack/${invoiceId}.pdf`,
    };
  }
  throw new Error("Simulated DTE error");
}

export async function trySendDte(invoiceId: string) {
  try {
    const result = await simulateDteSend(invoiceId);
    await prisma.dTE.upsert({
      where: { invoiceId },
      create: {
        invoiceId,
        status: "ACCEPTED",
        hash: `hash-${invoiceId}`,
        xmlUrl: result.xmlUrl,
        ackUrl: result.ackUrl,
        sentAt: new Date(),
        ackAt: new Date(),
      },
      update: { status: "ACCEPTED", xmlUrl: result.xmlUrl, ackUrl: result.ackUrl, ackAt: new Date() },
    });
  } catch (e: any) {
    await prisma.dTE.upsert({
      where: { invoiceId },
      create: { invoiceId, status: "ERROR", hash: `hash-${invoiceId}`, lastError: e.message, retries: 0, sentAt: new Date() },
      update: { status: "ERROR", lastError: e.message, retries: { increment: 1 } },
    });
  }
}

export async function buildInvoiceDto(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { client: true, items: true, dte: true },
  });
  if (!invoice) return null;
  return {
    id: invoice.id,
    number: invoice.number,
    type: invoice.type,
    status: invoice.status,
    issuedAt: invoice.issuedAt,
    client: {
      id: invoice.client.id,
      name: invoice.client.name,
      taxId: invoice.client.taxId,
      email: invoice.client.email,
    },
    items: invoice.items.map((it) => ({
      id: it.id,
      description: it.description,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      taxRate: Number(it.taxRate),
      subtotal: Number(it.subtotal),
      taxAmount: Number(it.taxAmount),
      total: Number(it.total),
    })),
    totals: {
      subtotal: Number(invoice.subtotal),
      taxTotal: Number(invoice.taxTotal),
      total: Number(invoice.total),
    },
    dte: invoice.dte ? {
      status: invoice.dte.status,
      xmlUrl: invoice.dte.xmlUrl,
      ackUrl: invoice.dte.ackUrl,
      retries: invoice.dte.retries,
      lastError: invoice.dte.lastError,
    } : null,
  };
}


