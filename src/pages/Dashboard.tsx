// TODO: validar vs PDF - Dashboard principal con resumen ejecutivo
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Package, 
  FileText, 
  History, 
  TrendingUp, 
  DollarSign,
  AlertTriangle,
  Plus,
  Download
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useClientStore } from '../stores/clientStore';
import { useProductStore } from '../stores/productStore';
import { apiFetch } from '../lib/api';
import { hasPermission } from '../config/permissions';
import { showError, showSuccess } from '../lib/toast';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { clients, fetchClients } = useClientStore();
  const { products, fetchProducts, getLowStockProducts } = useProductStore();
  const [metrics, setMetrics] = useState<{ users?: number; clients?: number; products?: number; invoices?: number; salesToday?: number }>({});
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchProducts();
    // Cargar métricas reales desde backend (si el rol tiene acceso)
    const load = async () => {
      try {
        const res = await apiFetch<{ users: number; clients: number; products: number; invoices: number; salesToday: number }>(`/dashboard/metrics`);
        setMetrics(res);
      } catch {
        // Silent: algunos roles podrían no tener acceso
      }
    };
    load();
  }, [fetchClients, fetchProducts]);

  const handleBackupDownload = async () => {
    try {
      setDownloading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL?.replace(/\/$/, '')}/admin/backup/invoices`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Error al generar backup');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-facturas-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess('Backup descargado exitosamente');
    } catch (error) {
      console.error('Error downloading backup:', error);
      showError('Error al descargar backup');
    } finally {
      setDownloading(false);
    }
  };

  const lowStockProducts = getLowStockProducts();

  // Métricas renderizadas con fallback local
  const dashboardValues = {
    totalClients: metrics.clients ?? clients.length,
    totalProducts: metrics.products ?? products.length,
    monthlyRevenue: metrics.salesToday ?? 0,
    invoicesThisMonth: metrics.invoices ?? 0,
    pendingInvoices: 0
  };

  const quickActions = [
    {
      title: 'Nueva Factura',
      description: 'Crear factura electrónica o tradicional',
      icon: Plus,
      to: '/facturacion/nueva',
      color: 'bg-blue-500 hover:bg-blue-600',
      module: 'facturacion',
      action: 'create'
    },
    {
      title: 'Agregar Cliente',
      description: 'Registrar nuevo cliente',
      icon: Users,
      to: '/clientes/nuevo',
      color: 'bg-green-500 hover:bg-green-600',
      module: 'clientes',
      action: 'create'
    },
    {
      title: 'Gestionar Inventario',
      description: 'Actualizar productos y stock',
      icon: Package,
      to: '/inventario',
      color: 'bg-purple-500 hover:bg-purple-600',
      module: 'inventario',
      action: 'read'
    }
  ];

  const moduleCards = [
    {
      title: 'Clientes',
      description: 'Gestionar base de clientes',
      icon: Users,
      to: '/clientes',
      count: metrics.totalClients,
      color: 'text-blue-600 bg-blue-100',
      module: 'clientes',
      action: 'read'
    },
    {
      title: 'Inventario',
      description: 'Control de productos y stock',
      icon: Package,
      to: '/inventario',
      count: metrics.totalProducts,
      color: 'text-green-600 bg-green-100',
      module: 'inventario',
      action: 'read'
    },
    {
      title: 'Facturación',
      description: 'Emitir facturas',
      icon: FileText,
      to: '/facturacion',
      count: metrics.invoicesThisMonth,
      color: 'text-purple-600 bg-purple-100',
      module: 'facturacion',
      action: 'read'
    },
    {
      title: 'Historial de Ventas',
      description: 'Consultar ventas realizadas',
      icon: History,
      to: '/historial',
      count: metrics.pendingInvoices,
      color: 'text-orange-600 bg-orange-100',
      module: 'historial',
      action: 'read'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">¡Bienvenido, {user?.name}!</h1>
        <p className="mt-2 opacity-90">
          Sistema de Facturación - Rol: {user?.role === 'administrador' ? 'Administrador' : 'Vendedor'}
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Facturación del Mes</p>
              <p className="text-2xl font-bold text-gray-900">
                ${dashboardValues.monthlyRevenue.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Facturas Emitidas</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardValues.invoicesThisMonth}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes Activos</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardValues.totalClients}</p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Productos en Stock</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardValues.totalProducts}</p>
            </div>
            <Package className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Alerta de Stock Bajo
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                {lowStockProducts.length} producto(s) con stock bajo. 
                <Link to="/inventario" className="font-medium underline ml-1">
                  Ver inventario
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Backup para Administradores */}
      {user?.role === 'administrador' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Download className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">
                  Backup de Facturas
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Descarga un respaldo completo de todas las facturas en formato JSON
                </p>
              </div>
            </div>
            <button
              onClick={handleBackupDownload}
              disabled={downloading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {downloading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Generando...
                </>
              ) : (
                <>
                  <Download size={16} className="mr-2" />
                  Descargar Backup
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="space-y-3">
            {quickActions.map((action) => {
      const canPerform = user && hasPermission(user.role, action.module, action.action);
              
              if (!canPerform) return null;

              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className={`flex items-center p-3 rounded-lg ${action.color} text-white transition-colors`}
                >
                  <action.icon className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">{action.title}</p>
                    <p className="text-sm opacity-90">{action.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Module Access */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Módulos del Sistema</h2>
          <div className="grid grid-cols-2 gap-4">
            {moduleCards.map((module) => {
      const canAccess = user && hasPermission(user.role, module.module, module.action);
              
              if (!canAccess) return null;

              return (
                <Link
                  key={module.to}
                  to={module.to}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className={`w-8 h-8 rounded-lg ${module.color} flex items-center justify-center mb-3`}>
                    <module.icon size={16} />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">{module.title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{module.description}</p>
                  <p className="text-lg font-bold text-gray-900 mt-2">{module.count}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};