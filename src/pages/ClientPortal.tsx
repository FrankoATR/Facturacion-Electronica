import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { Link2, Unlink, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

interface ClientLink {
  linked: boolean;
  clientId: string | null;
  client: {
    id: string;
    name: string;
    taxId: string;
    email: string;
  } | null;
}

interface AvailableClient {
  id: string;
  name: string;
  taxId: string;
  email: string | null;
  users: Array<{ id: string; name: string }>;
}

export const ClientPortal: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [linkStatus, setLinkStatus] = useState<ClientLink | null>(null);
  const [availableClients, setAvailableClients] = useState<AvailableClient[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuthStore();

  const isAdmin = user?.role === 'administrador';

  const loadLinkStatus = async () => {
    try {
      const res = await apiFetch<ClientLink>(`/portal/my/client-link`);
      setLinkStatus(res);
    } catch (error) {
      console.error('Error loading link status:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      const res = await apiFetch<{ data: any[]; linked: boolean }>(`/portal/my/invoices`);
      setInvoices(res.data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const loadAvailableClients = async () => {
    if (!isAdmin) return;
    try {
      const res = await apiFetch<{ data: AvailableClient[] }>(`/portal/available-clients`);
      setAvailableClients(res.data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  useEffect(() => {
    loadLinkStatus();
    loadInvoices();
    if (isAdmin) {
      loadAvailableClients();
    }
  }, [isAdmin]);

  const handleLinkClient = async () => {
    if (!selectedClient) return;
    
    try {
      setLoading(true);
      setError(null);
      await apiFetch(`/portal/link-client/${selectedClient}`, {
        method: 'POST',
      });
      
      await loadLinkStatus();
      await loadInvoices();
      setShowLinkModal(false);
      setSelectedClient('');
    } catch (err: any) {
      setError(err.message || 'Error al vincular cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkClient = async () => {
    if (!confirm('¿Está seguro de desvincular su cuenta de cliente?')) return;
    
    try {
      setLoading(true);
      setError(null);
      await apiFetch(`/portal/unlink-client`, {
        method: 'POST',
      });
      
      await loadLinkStatus();
      await loadInvoices();
    } catch (err: any) {
      setError(err.message || 'Error al desvincular cuenta');
    } finally {
      setLoading(false);
    }
  };

  const downloadJson = async (id: string) => {
    const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
    window.open(`${base}/dte/${id}/json?token=${token ?? ''}`, '_blank');
  };

  const downloadPdf = async (id: string) => {
    try {
      const res = await apiFetch<{ data: any }>(`/portal/my/invoices/${id}/dte`);
      if (res?.data?.ackUrl) {
        window.open(res.data.ackUrl, '_blank');
      } else {
        const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
        window.open(`${base}/dte/${id}/pdf?token=${token ?? ''}`, '_blank');
      }
    } catch (error) {
      const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
      window.open(`${base}/dte/${id}/pdf?token=${token ?? ''}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portal del Cliente</h1>
          <p className="text-gray-600">Acceda a sus facturas y documentos electrónicos</p>
        </div>
      </div>

      {/* Link Status Card (Solo para Administradores) */}
      {isAdmin && (
        <div className={`rounded-lg p-6 ${linkStatus?.linked ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {linkStatus?.linked ? (
                <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
              ) : (
                <AlertCircle className="h-6 w-6 text-yellow-600 mt-1" />
              )}
              <div>
                <h3 className={`text-lg font-semibold ${linkStatus?.linked ? 'text-green-900' : 'text-yellow-900'}`}>
                  {linkStatus?.linked ? 'Cuenta Vinculada' : 'Cuenta No Vinculada'}
                </h3>
                {linkStatus?.linked && linkStatus.client ? (
                  <div className="mt-2 text-sm">
                    <p className="text-green-800">
                      <strong>Cliente:</strong> {linkStatus.client.name}
                    </p>
                    <p className="text-green-800">
                      <strong>NIT:</strong> {linkStatus.client.taxId}
                    </p>
                    {linkStatus.client.email && (
                      <p className="text-green-800">
                        <strong>Email:</strong> {linkStatus.client.email}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-yellow-800">
                    Para ver sus facturas como cliente, vincule su cuenta de administrador con un registro de cliente existente.
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2">
              {linkStatus?.linked ? (
                <Button
                  variant="secondary"
                  onClick={handleUnlinkClient}
                  disabled={loading}
                >
                  <Unlink size={16} className="mr-2" />
                  Desvincular
                </Button>
              ) : (
                <Button
                  onClick={() => setShowLinkModal(true)}
                  disabled={loading}
                >
                  <Link2 size={16} className="mr-2" />
                  Vincular Cuenta
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Invoices Table */}
      {linkStatus?.linked ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Mis Facturas</h2>
            <p className="text-sm text-gray-600">
              {invoices.length} factura{invoices.length !== 1 ? 's' : ''} encontrada{invoices.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descargar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No se encontraron facturas
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{inv.number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          inv.type === 'ELECTRONIC' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {inv.type === 'ELECTRONIC' ? 'Electrónica' : 'Tradicional'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${Number(inv.total).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          inv.status === 'ISSUED' ? 'bg-green-100 text-green-800' : 
                          inv.status === 'CANCELED' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {inv.status === 'ISSUED' ? 'Emitida' : 
                           inv.status === 'CANCELED' ? 'Cancelada' : 
                           'Borrador'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => downloadJson(inv.id)}
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                            title="Descargar JSON"
                          >
                            <Download size={16} className="inline mr-1" />
                            JSON
                          </button>
                          <button
                            onClick={() => downloadPdf(inv.id)}
                            className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
                            title="Descargar PDF"
                          >
                            <Download size={16} className="inline mr-1" />
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isAdmin ? 'Vincule su Cuenta' : 'Sin Facturas'}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {isAdmin 
              ? 'Para acceder a sus facturas como cliente, vincule su cuenta de administrador con un registro de cliente.'
              : 'No hay facturas disponibles para mostrar.'}
          </p>
        </div>
      )}

      {/* Link Modal */}
      {isAdmin && (
        <Modal
          isOpen={showLinkModal}
          onClose={() => {
            setShowLinkModal(false);
            setSelectedClient('');
            setError(null);
          }}
          title="Vincular Cuenta con Cliente"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Seleccione el cliente que desea vincular con su cuenta de administrador.
              Podrá acceder a todas las facturas emitidas a ese cliente.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Cliente
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Seleccione un cliente --</option>
                {availableClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.taxId} - {client.name}
                    {client.users.length > 0 && ` (Vinculado: ${client.users[0].name})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Solo puede vincular su cuenta a un cliente que no esté ya vinculado a otro usuario.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowLinkModal(false);
                  setSelectedClient('');
                  setError(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleLinkClient}
                disabled={!selectedClient || loading}
                loading={loading}
              >
                <Link2 size={16} className="mr-2" />
                Vincular
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};


