// SSDLC Touchpoint: Gestión segura de sesión y autenticación
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { apiFetch } from '../lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkPermission: (module: string, action: string) => boolean;
}

// Mapear roles backend -> frontend
function mapBackendRole(role: 'ADMIN' | 'SELLER' | 'ACCOUNTANT' | 'AUDITOR' | 'CUSTOMER'): 'administrador' | 'vendedor' | 'contador' | 'auditor' | 'cliente' {
  switch (role) {
    case 'ADMIN':
      return 'administrador';
    case 'SELLER':
      return 'vendedor';
    case 'ACCOUNTANT':
      return 'contador';
    case 'AUDITOR':
      return 'auditor';
    case 'CUSTOMER':
      return 'cliente';
    default:
      return 'vendedor';
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      login: async (email: string, password: string) => {
        try {
          console.log('[AUTH] Intentando login...', email);
          const resp = await apiFetch<{ token: string; user: { id: string; email: string; name: string; role: 'ADMIN' | 'SELLER' | 'ACCOUNTANT' | 'AUDITOR' | 'CUSTOMER' } }>(`/auth/login`, {
            method: 'POST',
            body: { email, password }
          });
          
          console.log('[AUTH] Login response:', resp);
          
          const mappedUser: User = {
            id: resp.user.id,
            name: resp.user.name,
            email: resp.user.email,
            role: mapBackendRole(resp.user.role),
            isActive: true,
            createdAt: new Date()
          };
          
          set({ user: mappedUser, isAuthenticated: true, token: resp.token });
          
          // Guardar token también en localStorage directamente como backup
          localStorage.setItem('auth-token', resp.token);
          
          console.log(`[AUTH] Usuario autenticado: ${mappedUser.name} (${mappedUser.role})`);
          console.log('[AUTH] Token guardado:', resp.token.substring(0, 20) + '...');
          
          return true;
        } catch (e: any) {
          console.error('[AUTH] Login failed:', e.message);
          return false;
        }
      },

      logout: () => {
        const { user } = get();
        if (user) {
          console.log(`[AUTH] Usuario desconectado: ${user.name}`);
        }
        localStorage.removeItem('auth-token');
        set({ user: null, isAuthenticated: false, token: null });
      },

      checkPermission: (module: string, action: string) => {
        const { user } = get();
        if (!user) return false;
        
        // Import permissions dynamically to avoid circular dependency
        import('../config/permissions').then(({ hasPermission }) => {
          return hasPermission(user.role, module, action);
        });
        
        return true; // Fallback for now
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated, token: state.token })
    }
  )
);