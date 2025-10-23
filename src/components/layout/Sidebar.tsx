// TODO: validar vs PDF - Navegación lateral con control por roles
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  History,
  ShieldQuestion,
  FileBarChart2,
  LogOut,
  UserCog
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { hasPermission } from '../../config/permissions';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  module: string;
  action: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', module: 'dashboard', action: 'read' },
  { to: '/clientes', icon: Users, label: 'Clientes', module: 'clientes', action: 'read' },
  { to: '/inventario', icon: Package, label: 'Inventario', module: 'inventario', action: 'read' },
  { to: '/facturacion', icon: FileText, label: 'Facturación', module: 'facturacion', action: 'read' },
  { to: '/historial', icon: History, label: 'Historial de Ventas', module: 'historial', action: 'read' },
  { to: '/usuarios', icon: UserCog, label: 'Gestión de Usuarios', module: 'usuarios', action: 'read' },
  { to: '/reportes', icon: FileBarChart2, label: 'Reporte IVA', module: 'reportes', action: 'read' },
  { to: '/auditoria', icon: ShieldQuestion, label: 'Bitácora', module: 'auditoria', action: 'read' },
  { to: '/portal', icon: FileText, label: 'Portal Cliente', module: 'portal', action: 'read' }
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h1 className="text-xl font-bold text-gray-800">Sistema Facturación</h1>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 border-b bg-gray-50">
              <p className="font-medium text-gray-800">{user.name}</p>
              <p className="text-sm text-gray-600 capitalize">{user.role}</p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                // SSDLC Touchpoint: Control de visibilidad por permisos
                const canAccess = user && hasPermission(user.role, item.module, item.action);
                
                if (!canAccess) return null;

                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`
                      }
                    >
                      <item.icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full p-3 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};