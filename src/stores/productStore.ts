// TODO: validar vs PDF - Store para control de inventario
import { create } from 'zustand';
import { Product } from '../types';
import { apiFetch } from '../lib/api';
import { mapApiProduct } from '../lib/mappers';

interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  createProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  updateStock: (id: string, newStock: number) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  getLowStockProducts: () => Product[];
}

// Mock data para demostración
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    sku: 'PROD-001',
    name: 'Producto A',
    category: 'Categoría 1',
    unitPrice: 100.00,
    taxRate: 21, // 21% IVA
    stock: 50,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    sku: 'PROD-002',
    name: 'Producto B',
    category: 'Categoría 2',
    unitPrice: 150.50,
    taxRate: 10.5, // 10.5% IVA
    stock: 5, // Stock bajo
    isActive: true,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  }
];

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiFetch<{ data: any[]; total?: number }>(`/products`);
      set({ products: res.data.map(mapApiProduct), loading: false });
    } catch (error) {
      set({ error: 'Error al cargar productos', loading: false });
    }
  },

  createProduct: async (productData) => {
    set({ loading: true, error: null });
    try {
      const res = await apiFetch<{ data: any }>(`/products`, { method: 'POST', body: productData });
      set(state => ({ products: [...state.products, mapApiProduct(res.data)], loading: false }));
    } catch (error) {
      set({ error: 'Error al crear producto', loading: false });
    }
  },

  updateProduct: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const res = await apiFetch<{ data: any }>(`/products/${id}`, { method: 'PATCH', body: updates });
      set(state => ({
        products: state.products.map(product => product.id === id ? mapApiProduct(res.data) : product),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Error al actualizar producto', loading: false });
    }
  },

  updateStock: async (id, newStock) => {
    set({ loading: true, error: null });
    try {
      const current = get().products.find(p => p.id === id);
      if (!current) throw new Error('Producto no encontrado');
      const delta = newStock - current.stock;
      const res = await apiFetch<{ data: any }>(`/products/${id}/adjust`, { method: 'POST', body: { quantity: delta, reason: 'UI adjust' } });
      set(state => ({
        products: state.products.map(product => product.id === id ? mapApiProduct(res.data) : product),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Error al actualizar stock', loading: false });
    }
  },

  deleteProduct: async (_id) => {
    // No hay endpoint de borrado físico; podría desactivarse vía status en el futuro
    set({ error: 'Operación no soportada', loading: false });
  },

  getProductById: (id) => {
    return get().products.find(product => product.id === id);
  },

  getLowStockProducts: () => {
    return get().products.filter(product => product.stock <= 10);
  }
}));