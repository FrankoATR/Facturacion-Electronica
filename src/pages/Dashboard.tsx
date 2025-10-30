// TODO: validar vs PDF - Dashboard principal con resumen ejecutivo
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

type ClientInvoice = {
  id: string;
  number: string;
  issuedAt?: string | null;
  createdAt?: string | null;
  status: string;
  total: number;
  type?: string | null;
};

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  ISSUED: { label: 'Emitida', className: 'bg-green-100 text-green-700' },
  DRAFT: { label: 'Borrador', className: 'bg-yellow-100 text-yellow-700' },
  CANCELED: { label: 'Anulada', className: 'bg-red-100 text-red-700' },
  ANNULLED: { label: 'Anulada', className: 'bg-red-100 text-red-700' },
};

const getStatusStyle = (status: string) => {
  const normalized = (status || '').toUpperCase();
  return STATUS_STYLES[normalized] ?? {
    label: status || 'Desconocido',
    className: 'bg-gray-100 text-gray-700',
  };
};

const formatInvoiceDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('es-SV');
};

export const Dashboard: React.FC = () => {
  const { user, token } = useAuthStore();
  const { clients, fetchClients } = useClientStore();
  const { products, fetchProducts, getLowStockProducts } = useProductStore();
  const [metrics, setMetrics] = useState<{ users?: number; clients?: number; products?: number; invoices?: number; salesThisMonth?: number }>({});
  const [clientInvoices, setClientInvoices] = useState<ClientInvoice[]>([]);
  const [clientInvoicesLoading, setClientInvoicesLoading] = useState(false);
  const [clientInvoicesError, setClientInvoicesError] = useState<string | null>(null);
  const [clientLinked, setClientLinked] = useState(true);
  const [monthlyBilling, setMonthlyBilling] = useState<number>(0);
  const [downloading, setDownloading] = useState(false);

  const apiBaseUrl = useMemo(
    () => import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:4000/api',
    []
  );
  const downloadTokenParam = useMemo(() => {
    const authToken = token || localStorage.getItem('auth-token') || '';
    return authToken ? `?token=${encodeURIComponent(authToken)}` : '';
  }, [token]);

  // Debug logs
  console.log('[DASHBOARD] Usuario actual:', user);
  console.log('[DASHBOARD] Rol del usuario:', user?.role);
  
  if (!user) {
    console.error('[DASHBOARD] No hay usuario autenticado');
    return <div>Cargando...</div>;
  }

  const loadDashboardMetrics = useCallback(async () => {
    try {
      const res = await apiFetch<{ users: number; clients: number; products: number; invoices: number; salesThisMonth: number }>('/dashboard/metrics');
      setMetrics(res);
    } catch {
      // Silent: algunos roles podrían no tener acceso
    }
  }, []);

  const loadMonthlyBillingMetrics = useCallback(async () => {
    try {
      const res = await apiFetch<{ period: string; total: number; currency: string }>('/invoices/metrics?period=month');
      setMonthlyBilling(res.total);
    } catch {
      // Silent: algunos roles podrían no tener acceso
    }
  }, []);

  const loadClientInvoices = useCallback(async () => {
    if (user?.role !== 'cliente') return;

    setClientInvoicesLoading(true);
    setClientInvoicesError(null);
    try {
      const res = await apiFetch<{ data: any[]; linked?: boolean }>('/portal/my/invoices');
      const normalized: ClientInvoice[] = (res.data || []).map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        issuedAt: invoice.issuedAt,
        createdAt: invoice.createdAt,
        status: invoice.status,
        total: Number(invoice.total ?? 0),
        type: invoice.type ?? null,
      }));

      setClientInvoices(normalized);
      setClientLinked(res.linked !== false);
    } catch (error) {
      setClientInvoices([]);
      setClientInvoicesError('No pudimos cargar tus facturas. Intenta de nuevo.');
      console.error('Error loading client invoices:', error);
    } finally {
      setClientInvoicesLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (!user) return;

    if (user.role === 'cliente') {
      loadClientInvoices();
      return;
    }

    if (hasPermission(user.role, 'clientes', 'read')) {
      fetchClients();
    }

    if (hasPermission(user.role, 'inventario', 'read')) {
      fetchProducts();
    }

    if (hasPermission(user.role, 'dashboard', 'read')) {
      loadDashboardMetrics();
      loadMonthlyBillingMetrics();
    }
  }, [
    user,
    fetchClients,
    fetchProducts,
    loadDashboardMetrics,
    loadMonthlyBillingMetrics,
    loadClientInvoices
  ]);

  const handleBackupDownload = async () => {
    try {
      setDownloading(true);
      const response = await fetch(`${apiBaseUrl}/admin/backup/invoices`, {
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
    monthlyRevenue: monthlyBilling > 0 ? monthlyBilling : (metrics.salesThisMonth ?? 0),
    invoicesThisMonth: metrics.invoices ?? 0,
    pendingInvoices: 0
  };
  
  // Get current month name in Spanish
  const currentMonth = new Date().toLocaleDateString('es-SV', { month: 'long', year: 'numeric' });

  const quickActions = user.role === 'cliente'
    ? [
        {
          title: 'Ver mis facturas',
          description: 'Descarga tus comprobantes en PDF',
          icon: FileText,
          href: '#mis-facturas',
          color: 'bg-blue-600 hover:bg-blue-700',
          module: 'dashboard',
          action: 'read' as const
        }
      ]
    : [
        {
          title: 'Nueva Factura',
          description: 'Crear factura electrónica o tradicional',
          icon: Plus,
          to: '/facturacion/nueva',
          color: 'bg-blue-500 hover:bg-blue-600',
          module: 'facturacion',
          action: 'create' as const
        },
        {
          title: 'Agregar Cliente',
          description: 'Registrar nuevo cliente',
          icon: Users,
          to: '/clientes/nuevo',
          color: 'bg-green-500 hover:bg-green-600',
          module: 'clientes',
          action: 'create' as const
        },
        {
          title: 'Gestionar Inventario',
          description: 'Actualizar productos y stock',
          icon: Package,
          to: '/inventario',
          color: 'bg-purple-500 hover:bg-purple-600',
          module: 'inventario',
          action: 'read' as const
        }
      ];

  const allowedQuickActions = quickActions.filter((action) =>
    hasPermission(user.role, action.module, action.action)
  );

  const moduleCards = user.role === 'cliente' ? [
    {
      title: 'Mis Facturas',
      description: 'Ver facturas emitidas',
      icon: FileText,
      to: '/dashboard#mis-facturas',
      count: clientInvoices.length, // Mostrar el número real de facturas del cliente
      color: 'text-purple-600 bg-purple-100',
      module: 'dashboard',
      action: 'read'
    }
  ] : [
    {
      title: 'Clientes',
      description: 'Gestionar base de clientes',
      icon: Users,
      to: '/clientes',
      count: dashboardValues.totalClients,
      color: 'text-blue-600 bg-blue-100',
      module: 'clientes',
      action: 'read'
    },
    {
      title: 'Inventario',
      description: 'Control de productos y stock',
      icon: Package,
      to: '/inventario',
      count: dashboardValues.totalProducts,
      color: 'text-green-600 bg-green-100',
      module: 'inventario',
      action: 'read'
    },
    {
      title: 'Facturación',
      description: 'Emitir facturas',
      icon: FileText,
      to: '/facturacion',
      count: dashboardValues.invoicesThisMonth,
      color: 'text-purple-600 bg-purple-100',
      module: 'facturacion',
      action: 'read'
    },
    {
      title: 'Historial de Ventas',
      description: 'Consultar ventas realizadas',
      icon: History,
      to: '/historial',
      count: dashboardValues.pendingInvoices,
      color: 'text-orange-600 bg-orange-100',
      module: 'historial',
      action: 'read'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className={`rounded-lg p-6 text-white ${
        user?.role === 'cliente'
          ? 'bg-gradient-to-r from-green-600 to-green-800'
          : 'bg-gradient-to-r from-blue-600 to-blue-800'
      }`}>
        <h1 className="text-2xl font-bold">
          {user?.role === 'cliente' ? `¡Hola, ${user?.name}!` : `¡Bienvenido, ${user?.name}!`}
        </h1>
        <p className="mt-2 opacity-90">
          {user?.role === 'cliente'
            ? 'Portal del Cliente - Gestiona tus facturas electrónicas'
            : `Sistema de Facturación EleCtroZ - Rol: ${user?.role === 'administrador' ? 'Administrador' : user?.role === 'vendedor' ? 'Vendedor' : user?.role === 'contador' ? 'Contador' : 'Auditor'}`
          }
        </p>
      </div>

      {/* Client Invoice Summary */}
      {user.role === 'cliente' && (
        <div id="mis-facturas" className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Mis Facturas</h2>
              <p className="text-sm text-gray-600">Consulta tus facturas emitidas y descarga los comprobantes en PDF.</p>
            </div>
            <button
              onClick={loadClientInvoices}
              disabled={clientInvoicesLoading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {clientInvoicesLoading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full mr-2"></span>
                  Actualizando...
                </>
              ) : (
                <>
                  <Download size={16} className="mr-2" />
                  Actualizar
                </>
              )}
            </button>
          </div>

          {clientInvoicesError && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {clientInvoicesError}
            </div>
          )}

          {clientInvoicesLoading ? (
            <div className="flex items-center justify-center py-10">
              <span className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mr-3"></span>
              <span className="text-sm text-gray-600">Cargando tus facturas...</span>
            </div>
          ) : clientInvoices.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <th className="px-4 py-3">Número</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-center">Descargar</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {clientInvoices.map((invoice) => {
                    const statusInfo = getStatusStyle(invoice.status);
                    const pdfUrl = `${apiBaseUrl}/dte/${invoice.id}/pdf${downloadTokenParam}`;
                    const invoiceDate = formatInvoiceDate(invoice.issuedAt || invoice.createdAt);
                    const totalDisplay = Number.isFinite(invoice.total)
                      ? invoice.total.toFixed(2)
                      : Number(invoice.total || 0).toFixed(2);

                    return (
                      <tr key={invoice.id} className="text-sm text-gray-700">
                        <td className="px-4 py-3 font-medium text-gray-900">{invoice.number}</td>
                        <td className="px-4 py-3">{invoiceDate}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">${totalDisplay}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Download size={14} className="mr-1.5" />
                            PDF
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-6 text-sm text-gray-500 text-center border border-dashed border-gray-200 rounded-lg py-6">
              {clientLinked
                ? 'Aún no tienes facturas emitidas en el sistema.'
                : 'Tu cuenta todavía no está vinculada a un cliente. Contacta al administrador para vincularla.'}
            </div>
          )}
        </div>
      )}

      {/* Metrics Cards - Only for non-customer users */}
      {user.role !== 'cliente' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Facturación del Mes</p>
              <p className="text-2xl font-bold text-green-600">
                ${dashboardValues.monthlyRevenue.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1 capitalize">{currentMonth}</p>
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
      )}

      {/* Alerts - Only for non-customer users */}
      {user.role !== 'cliente' && lowStockProducts.length > 0 && (
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {user.role === 'cliente' ? 'Mis Opciones' : 'Acciones Rápidas'}
          </h2>
          {allowedQuickActions.length > 0 ? (
            <div className="space-y-3">
              {allowedQuickActions.map((action) => {
                const key = action.to || action.href || action.title;
                const content = (
                  <>
                    <action.icon className="h-5 w-5 mr-3" />
                    <div>
                      <p className="font-medium">{action.title}</p>
                      <p className="text-sm opacity-90">{action.description}</p>
                    </div>
                  </>
                );

                if ('href' in action && action.href) {
                  return (
                    <a
                      key={key}
                      href={action.href}
                      className={`flex items-center p-3 rounded-lg ${action.color} text-white transition-colors`}
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <Link
                    key={key}
                    to={action.to!}
                    className={`flex items-center p-3 rounded-lg ${action.color} text-white transition-colors`}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No hay acciones disponibles.</p>
          )}
        </div>

        {/* Module Access */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {user.role === 'cliente' ? 'Mis Accesos' : 'Módulos del Sistema'}
          </h2>
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
