import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { Search, Filter, Download, FileText, Package, Users, DollarSign, Settings } from 'lucide-react';
import { Button } from '../components/common/Button';

interface AuditLog {
  id: string;
  createdAt: string;
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string;
  payload: any;
  actor?: {
    name: string;
    email: string;
  };
}

export const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntity, setFilterEntity] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ data: AuditLog[] }>(`/audit/logs`);
      setLogs(res.data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const getActionIcon = (action: string) => {
    if (action.includes('CREATE') || action.includes('ISSUED')) return '➕';
    if (action.includes('UPDATE')) return '✏️';
    if (action.includes('DELETE') || action.includes('CANCEL')) return '🗑️';
    if (action.includes('LOGIN')) return '🔐';
    return '📝';
  };

  const getEntityIcon = (entity: string) => {
    switch (entity.toLowerCase()) {
      case 'invoice': return <FileText size={16} className="text-blue-600" />;
      case 'product': return <Package size={16} className="text-green-600" />;
      case 'client': return <Users size={16} className="text-purple-600" />;
      case 'payment': return <DollarSign size={16} className="text-yellow-600" />;
      case 'user': return <Users size={16} className="text-red-600" />;
      default: return <Settings size={16} className="text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('ISSUED')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETE') || action.includes('CANCEL')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getActionDescription = (log: AuditLog) => {
    const actorName = log.actor?.name || 'Sistema';
    
    switch (log.action) {
      case 'INVOICE_ISSUED':
        return `${actorName} emitió factura ${log.payload?.number}`;
      case 'PRODUCT_CREATED':
        return `${actorName} creó producto ${log.payload?.name}`;
      case 'PRODUCT_UPDATED':
        return `${actorName} actualizó producto`;
      case 'CLIENT_CREATED':
        return `${actorName} creó cliente ${log.payload?.name}`;
      case 'USER_LOGIN':
        return `${actorName} inició sesión`;
      default:
        return `${actorName} - ${log.action}`;
    }
  };

  const exportToCSV = () => {
    const headers = ['Fecha', 'Usuario', 'Acción', 'Entidad', 'Descripción'];
    const rows = filteredLogs.map(log => [
      new Date(log.createdAt).toLocaleString(),
      log.actor?.name || 'Sistema',
      log.action,
      log.entity,
      getActionDescription(log)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Filtrar logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getActionDescription(log).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEntity = filterEntity === 'all' || log.entity.toLowerCase() === filterEntity.toLowerCase();
    const matchesAction = filterAction === 'all' || log.action.toLowerCase().includes(filterAction.toLowerCase());
    
    return matchesSearch && matchesEntity && matchesAction;
  });

  // Paginación
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Obtener entidades y acciones únicas para filtros
  const uniqueEntities = ['all', ...Array.from(new Set(logs.map(l => l.entity)))];
  const uniqueActions = ['all', ...Array.from(new Set(logs.map(l => l.action.split('_')[0])))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bitácora de Auditoría</h1>
          <p className="text-gray-600">Registro inmutable de todas las operaciones del sistema</p>
        </div>
        <Button onClick={exportToCSV} variant="secondary">
          <Download size={16} className="mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar en registros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entidad</label>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {uniqueEntities.map(entity => (
                <option key={entity} value={entity}>
                  {entity === 'all' ? 'Todas' : entity}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {uniqueActions.map(action => (
                <option key={action} value={action}>
                  {action === 'all' ? 'Todas' : action}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de logs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha y Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No se encontraron registros
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users size={16} className="text-gray-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-gray-900 font-medium">
                            {log.actor?.name || 'Sistema'}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {log.actor?.email || 'Automático'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        <span className="mr-1">{getActionIcon(log.action)}</span>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        {getEntityIcon(log.entity)}
                        <span className="ml-2 text-gray-900">{log.entity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {getActionDescription(log)}
                      {log.payload && Object.keys(log.payload).length > 0 && (
                        <details className="mt-1 text-xs text-gray-500">
                          <summary className="cursor-pointer hover:text-gray-700">Ver detalles</summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded overflow-x-auto">
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> de{' '}
                  <span className="font-medium">{filteredLogs.length}</span> registros
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resumen */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Esta bitácora es inmutable y registra todas las operaciones del sistema.
          Los registros incluyen: creación de facturas, movimientos de inventario, cambios de usuarios,
          inicios de sesión y todas las operaciones críticas del sistema.
        </p>
      </div>
    </div>
  );
};


