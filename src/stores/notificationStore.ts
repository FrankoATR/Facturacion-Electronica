import { create } from 'zustand';
import { apiFetch } from '../lib/api';

export interface Notification {
  id: string;
  userId: string;
  type: 'stock_bajo' | 'factura_emitida' | 'pago_recibido' | 'error_sistema';
  title: string;
  message: string;
  read: boolean;
  metadata?: any;
  createdAt: Date;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetchNotifications: async () => {
    try {
      set({ loading: true, error: null });
      const response = await apiFetch<{ notifications: Notification[]; unreadCount: number }>('/notifications');
      set({ 
        notifications: response.notifications,
        unreadCount: response.unreadCount,
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await apiFetch<{ count: number }>('/notifications/unread-count');
      set({ unreadCount: response.count });
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
    }
  },

  markAsRead: async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, {
        method: 'PUT',
      });
      
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  markAllAsRead: async () => {
    try {
      await apiFetch('/notifications/mark-all-read', {
        method: 'PUT',
      });
      
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}`, {
        method: 'DELETE',
      });
      
      set(state => ({
        notifications: state.notifications.filter(n => n.id !== id)
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));

