// TODO: validar vs PDF - Store para gestión de facturación
import { create } from 'zustand';
import { Invoice, InvoiceItem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { apiFetch } from '../lib/api';
import { mapApiInvoice, mapUiTypeToApi } from '../lib/mappers';

interface InvoiceState {
  invoices: Invoice[];
  currentInvoice: Invoice | null;
  loading: boolean;
  error: string | null;
  fetchInvoices: () => Promise<void>;
  createInvoice: (invoice: Omit<Invoice, 'id' | 'number' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  getInvoiceById: (id: string) => Invoice | undefined;
  setCurrentInvoice: (invoice: Invoice | null) => void;
  addItemToCurrentInvoice: (item: Omit<InvoiceItem, 'id'>) => void;
  removeItemFromCurrentInvoice: (itemId: string) => void;
  updateItemInCurrentInvoice: (itemId: string, updates: Partial<InvoiceItem>) => void;
  calculateInvoiceTotals: (items: InvoiceItem[]) => { subtotal: number; totalTax: number; total: number };
}

// Mock data para demostración
const MOCK_INVOICES: Invoice[] = [
  {
    id: '1',
    clientId: '1',
    number: 'FAC-2024-001',
    type: 'electronica',
    status: 'emitida',
    items: [
      {
        id: '1',
        productId: '1',
        quantity: 2,
        unitPrice: 100.00,
        taxRate: 21,
        subtotal: 200.00,
        taxAmount: 42.00,
        total: 242.00
      }
    ],
    subtotal: 200.00,
    totalTax: 42.00,
    total: 242.00,
    paymentMethod: 'Efectivo',
    notes: 'Factura de prueba',
    issuedBy: '1',
    issuedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  }
];

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: [],
  currentInvoice: null,
  loading: false,
  error: null,

  fetchInvoices: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiFetch<{ data: any[]; total?: number }>(`/invoices`);
      set({ invoices: res.data.map(mapApiInvoice), loading: false });
    } catch (error) {
      set({ error: 'Error al cargar facturas', loading: false });
    }
  },

  createInvoice: async (invoiceData) => {
    set({ loading: true, error: null });
    try {
      // map UI types/status to API
      const payload: any = {
        clientId: invoiceData.clientId,
        type: mapUiTypeToApi(invoiceData.type),
        paymentMethod: invoiceData.paymentMethod,
        notes: invoiceData.notes,
        items: invoiceData.items.map(it => ({
          productId: it.productId,
          description: it.productId ? 'Item' : 'Item libre',
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          taxRate: it.taxRate,
        })),
      };
      const res = await apiFetch<{ data: any }>(`/invoices`, { method: 'POST', body: payload });
      set(state => ({ invoices: [...state.invoices, mapApiInvoice(res.data)], loading: false }));
    } catch (error) {
      set({ error: 'Error al crear factura', loading: false });
    }
  },

  updateInvoice: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      // specific endpoints for state transitions
      if (updates.status === 'emitida') {
        const res = await apiFetch<{ data: any }>(`/invoices/${id}/issue`, { method: 'POST' });
        set(state => ({ invoices: state.invoices.map(i => i.id === id ? mapApiInvoice(res.data) : i), loading: false }));
        return;
      }
      if (updates.status === 'anulada') {
        await apiFetch<void>(`/invoices/${id}/cancel`, { method: 'POST' });
        set(state => ({ invoices: state.invoices.map(i => i.id === id ? { ...i, status: 'anulada' } : i), loading: false }));
        return;
      }
      // fallback: no generic PATCH endpoint for invoices in backend; refresh
      await get().fetchInvoices();
      set({ loading: false });
    } catch (error) {
      set({ error: 'Error al actualizar factura', loading: false });
    }
  },

  deleteInvoice: async (_id) => {
    // No hay endpoint de borrado; se maneja estado anulada
    set({ error: null, loading: false });
  },

  getInvoiceById: (id) => {
    return get().invoices.find(invoice => invoice.id === id);
  },

  setCurrentInvoice: (invoice) => {
    set({ currentInvoice: invoice });
  },

  addItemToCurrentInvoice: (itemData) => {
    const { currentInvoice } = get();
    if (!currentInvoice) return;

    const newItem: InvoiceItem = {
      ...itemData,
      id: uuidv4()
    };

    const updatedItems = [...currentInvoice.items, newItem];
    const totals = get().calculateInvoiceTotals(updatedItems);

    set({
      currentInvoice: {
        ...currentInvoice,
        items: updatedItems,
        ...totals
      }
    });
  },

  removeItemFromCurrentInvoice: (itemId) => {
    const { currentInvoice } = get();
    if (!currentInvoice) return;

    const updatedItems = currentInvoice.items.filter(item => item.id !== itemId);
    const totals = get().calculateInvoiceTotals(updatedItems);

    set({
      currentInvoice: {
        ...currentInvoice,
        items: updatedItems,
        ...totals
      }
    });
  },

  updateItemInCurrentInvoice: (itemId, updates) => {
    const { currentInvoice } = get();
    if (!currentInvoice) return;

    const updatedItems = currentInvoice.items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates };
        // Recalcular totales del item
        updatedItem.subtotal = updatedItem.quantity * updatedItem.unitPrice;
        updatedItem.taxAmount = updatedItem.subtotal * (updatedItem.taxRate / 100);
        updatedItem.total = updatedItem.subtotal + updatedItem.taxAmount;
        return updatedItem;
      }
      return item;
    });

    const totals = get().calculateInvoiceTotals(updatedItems);

    set({
      currentInvoice: {
        ...currentInvoice,
        items: updatedItems,
        ...totals
      }
    });
  },

  calculateInvoiceTotals: (items) => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalTax = items.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = subtotal + totalTax;

    return { subtotal, totalTax, total };
  }
}));