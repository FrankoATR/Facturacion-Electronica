// TODO: validar vs PDF - Store para gestión de clientes
import { create } from 'zustand';
import { Client } from '../types';
import { apiFetch } from '../lib/api';
import { mapApiClient } from '../lib/mappers';

interface ClientState {
  clients: Client[];
  loading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  createClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClientById: (id: string) => Client | undefined;
}

// Mock data para demostración
const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Empresa ABC S.A.',
    taxId: '20-12345678-9',
    email: 'contacto@empresaabc.com',
    phone: '+1234567890',
    address: 'Calle Principal 123, Ciudad',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Comercial XYZ Ltda.',
    taxId: '30-87654321-2',
    email: 'ventas@comercialxyz.com',
    phone: '+0987654321',
    address: 'Avenida Central 456, Ciudad',
    isActive: true,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  }
];

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  loading: false,
  error: null,

  fetchClients: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiFetch<{ data: any[]; total?: number }>(`/clients`);
      set({ clients: res.data.map(mapApiClient), loading: false });
    } catch (error) {
      set({ error: 'Error al cargar clientes', loading: false });
    }
  },

  createClient: async (clientData) => {
    set({ loading: true, error: null });
    try {
      const res = await apiFetch<{ data: any }>(`/clients`, { method: 'POST', body: clientData });
      set(state => ({ clients: [...state.clients, mapApiClient(res.data)], loading: false }));
    } catch (error) {
      set({ error: 'Error al crear cliente', loading: false });
    }
  },

  updateClient: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const res = await apiFetch<{ data: any }>(`/clients/${id}`, { method: 'PATCH', body: updates });
      set(state => ({
        clients: state.clients.map(client => client.id === id ? mapApiClient(res.data) : client),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Error al actualizar cliente', loading: false });
    }
  },

  deleteClient: async (id) => {
    set({ loading: true, error: null });
    try {
      await apiFetch<void>(`/clients/${id}/toggle`, { method: 'POST' });
      set(state => ({ clients: state.clients.map(c => c.id === id ? { ...c, isActive: !c.isActive } as Client : c), loading: false }));
    } catch (error) {
      set({ error: 'Error al cambiar estado del cliente', loading: false });
    }
  },

  getClientById: (id) => {
    return get().clients.find(client => client.id === id);
  }
}));