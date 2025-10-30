import { Client, Product, Invoice, InvoiceItem } from '../types';

export function mapApiClient(c: any): Client {
  return {
    id: c.id,
    name: c.name,
    taxId: c.taxId,
    nrc: c.nrc ?? undefined,
    email: c.email ?? '',
    phone: c.phone ?? '',
    address: c.address ?? '',
    isActive: (c.status ?? 'ACTIVE') === 'ACTIVE',
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt)
  };
}

export function mapApiProduct(p: any): Product {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category ?? '',
    unitPrice: typeof p.unitPrice === 'number' ? p.unitPrice : Number(p.unitPrice),
    taxRate: typeof p.taxRate === 'number' ? p.taxRate : Number(p.taxRate),
    stock: p.stock ?? 0,
    isActive: (p.status ?? 'ACTIVE') === 'ACTIVE',
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt)
  };
}

function mapStatusToUi(status: string): Invoice['status'] {
  if (!status) return 'draft';

  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'DRAFT':
      return 'draft';
    case 'ISSUED':
      return 'emmited';
    case 'CANCELED':
    case 'ANNULLED':
      return 'rejected';
    default:
      switch (status) {
        case 'draft':
        case 'emmited':
        case 'rejected':
          return status;
        default:
          return (status as any) ?? 'draft';
      }
  }
}

function mapTypeToUi(type: string): Invoice['type'] {
  switch (type) {
    case 'ELECTRONIC':
      return 'electronica';
    case 'TRADITIONAL':
      return 'tradicional';
    case 'CREDIT_FISCAL':
      return 'credito_fiscal';
    default:
      return (type as any) ?? 'electronica';
  }
}

export function mapApiInvoice(inv: any): Invoice {
  const items: InvoiceItem[] = (inv.items || []).map((it: any) => ({
    id: it.id,
    productId: it.productId || '',
    quantity: it.quantity,
    unitPrice: typeof it.unitPrice === 'number' ? it.unitPrice : Number(it.unitPrice),
    taxRate: typeof it.taxRate === 'number' ? it.taxRate : Number(it.taxRate),
    subtotal: typeof it.subtotal === 'number' ? it.subtotal : Number(it.subtotal),
    taxAmount: typeof it.taxAmount === 'number' ? it.taxAmount : Number(it.taxAmount),
    total: typeof it.total === 'number' ? it.total : Number(it.total),
  }));

  return {
    id: inv.id,
    clientId: inv.clientId,
    number: inv.number,
    type: mapTypeToUi(inv.type),
    status: mapStatusToUi(inv.status),
    items,
    subtotal: typeof inv.subtotal === 'number' ? inv.subtotal : Number(inv.subtotal),
    totalTax: typeof inv.totalTax === 'number' ? inv.totalTax : typeof inv.taxTotal === 'number' ? inv.taxTotal : Number(inv.totalTax ?? inv.taxTotal ?? 0),
    total: typeof inv.total === 'number' ? inv.total : Number(inv.total),
    paymentMethod: inv.paymentMethod ?? '',
    notes: inv.notes ?? '',
    issuedBy: inv.createdById ?? '',
    issuedAt: inv.issuedAt ? new Date(inv.issuedAt) : undefined,
    createdAt: new Date(inv.createdAt),
    updatedAt: new Date(inv.updatedAt),
    dteJson: inv.dteJson ?? undefined,
    dteSignature: inv.dteSignature ?? undefined,
    annulledAt: inv.annulledAt ? new Date(inv.annulledAt) : undefined,
    annulReason: inv.annulReason ?? undefined,
  };
}

export function mapUiTypeToApi(type: Invoice['type']): 'ELECTRONIC' | 'TRADITIONAL' | 'CREDIT_FISCAL' {
  if (type === 'electronica' || type === 'ELECTRONIC') return 'ELECTRONIC';
  if (type === 'credito_fiscal' || type === 'CREDIT_FISCAL') return 'CREDIT_FISCAL';
  return 'TRADITIONAL';
}


