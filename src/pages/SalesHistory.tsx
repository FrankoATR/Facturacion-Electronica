// TODO: validar vs PDF - Módulo de Historial de Ventas
import React, { useEffect, useState } from 'react';
import { Search, Filter, Eye, Copy, Calendar, Download } from 'lucide-react';
import { useInvoiceStore } from '../stores/invoiceStore';
import { useClientStore } from '../stores/clientStore';
import { useAuthStore } from '../stores/authStore';
import { hasPermission } from '../config/permissions';
import { Button } from '../components/common/Button';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Invoice } from '../types';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const SalesHistory: React.FC = () => {
  const { user, token } = useAuthStore();
  const { invoices, loading, error, fetchInvoices, createInvoice } = useInvoiceStore();
  const { clients, fetchClients } = useClientStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const canCreate = user && hasPermission(user.role, 'facturacion', 'create');

  useEffect(() => {
    fetchInvoices();
    fetchClients();
  }, [fetchInvoices, fetchClients]);

  // Filtrar facturas emitidas
  const emittedInvoices = invoices.filter(invoice => invoice.status === 'emitida');

  // Aplicar filtros
  const filteredInvoices = emittedInvoices.filter(invoice => {
    const client = clients.find(c => c.id === invoice.clientId);
    const clientName = client?.name || '';
    const invoiceDate = invoice.issuedAt ? new Date(invoice.issuedAt) : null;
    
    const matchesSearch = invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || invoice.status === statusFilter;
    const matchesType = !typeFilter || invoice.type === typeFilter;
    const matchesClient = !clientFilter || invoice.clientId === clientFilter;
    
    const matchesDateRange = !invoiceDate || (
      invoiceDate >= new Date(dateFrom) && invoiceDate <= new Date(dateTo + 'T23:59:59')
    );

    return matchesSearch && matchesStatus && matchesType && matchesClient && matchesDateRange;
  });

  // Paginación
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Métricas del período
  const periodMetrics = {
    totalInvoices: filteredInvoices.length,
    totalRevenue: filteredInvoices.reduce((sum, inv) => sum + inv.total, 0),
    averageTicket: filteredInvoices.length > 0 ? filteredInvoices.reduce((sum, inv) => sum + inv.total, 0) / filteredInvoices.length : 0,
    electronicInvoices: filteredInvoices.filter(inv => inv.type === 'electronica').length
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const handleCloneInvoice = async (invoice: Invoice) => {
    if (!canCreate) return;

    const clonedInvoice = {
      ...invoice,
      status: 'borrador' as const,
      number: 'BORRADOR',
      issuedAt: undefined
    };

    try {
      await createInvoice(clonedInvoice);
      alert('Factura clonada como borrador exitosamente');
    } catch (error) {
      console.error('Error al clonar factura:', error);
    }
  };

  const handleExportCSV = () => {
    const csvData = filteredInvoices.map(invoice => {
      const client = clients.find(c => c.id === invoice.clientId);
      return {
        Numero: invoice.number,
        Cliente: client?.name || '',
        Tipo: invoice.type,
        Estado: invoice.status,
        Subtotal: invoice.subtotal,
        Impuestos: invoice.totalTax,
        Total: invoice.total,
        'Metodo de Pago': invoice.paymentMethod,
        Fecha: invoice.issuedAt ? format(new Date(invoice.issuedAt), 'dd/MM/yyyy') : ''
      };
    });

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial-ventas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleQuickDateFilter = (months: number) => {
    const endDate = new Date();
    const startDate = subMonths(endDate, months);
    setDateFrom(format(startOfMonth(startDate), 'yyyy-MM-dd'));
    setDateTo(format(endOfMonth(endDate), 'yyyy-MM-dd'));
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Cliente no encontrado';
  };

  const getProductName = (productId: string) => 'Producto';

  const columns = [
    {
      key: 'number',
      header: 'Número',
      render: (invoice: Invoice) => (
        <div>
          <div className="font-medium text-gray-900">{invoice.number}</div>
          <div className="text-sm text-gray-500">{invoice.type}</div>
        </div>
      )
    },
    {
      key: 'client',
      header: 'Cliente',
      render: (invoice: Invoice) => (
        <div className="text-sm text-gray-900">{getClientName(invoice.clientId)}</div>
      )
    },
    {
      key: 'total',
      header: 'Total',
      render: (invoice: Invoice) => (
        <div>
          <div className="font-medium text-gray-900">${invoice.total.toFixed(2)}</div>
          <div className="text-sm text-gray-500">IVA: ${invoice.totalTax.toFixed(2)}</div>
        </div>
      )
    },
    {
      key: 'paymentMethod',
      header: 'Pago',
      render: (invoice: Invoice) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {invoice.paymentMethod}
        </span>
      )
    },
    {
      key: 'issuedAt',
      header: 'Fecha',
      render: (invoice: Invoice) => (
        <div className="text-sm text-gray-900">
          {invoice.issuedAt ? format(new Date(invoice.issuedAt), 'dd/MM/yyyy HH:mm') : '-'}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (invoice: Invoice) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewInvoice(invoice)}
            className="text-blue-600 hover:text-blue-800"
            title="Ver/Descargar DTE"
          >
            <Eye size={16} />
          </button>
          {canCreate && (
            <button
              onClick={() => handleCloneInvoice(invoice)}
              className="text-purple-600 hover:text-purple-800"
              title="Clonar como borrador"
            >
              <Copy size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Ventas</h1>
          <p className="text-gray-600">Consulta y gestión de ventas realizadas</p>
        </div>
        <Button onClick={handleExportCSV} variant="secondary">
          <Download size={16} className="mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-600">Total Facturas</div>
          <div className="text-2xl font-bold text-gray-900">{periodMetrics.totalInvoices}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-600">Ingresos Totales</div>
          <div className="text-2xl font-bold text-green-600">${periodMetrics.totalRevenue.toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-600">Ticket Promedio</div>
          <div className="text-2xl font-bold text-blue-600">${periodMetrics.averageTicket.toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-600">Facturas Electrónicas</div>
          <div className="text-2xl font-bold text-purple-600">{periodMetrics.electronicInvoices}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
          <div className="flex space-x-2">
            <Button size="sm" variant="ghost" onClick={() => handleQuickDateFilter(1)}>
              Último mes
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleQuickDateFilter(3)}>
              3 meses
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleQuickDateFilter(6)}>
              6 meses
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los clientes</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los tipos</option>
            <option value="electronica">Electrónica</option>
            <option value="tradicional">Tradicional</option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <Button
            variant="secondary"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setTypeFilter('');
              setClientFilter('');
              setDateFrom(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
              setDateTo(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
            }}
          >
            Limpiar
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Table */}
      <DataTable
        data={paginatedInvoices}
        columns={columns}
        loading={loading}
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage
        }}
        emptyMessage="No se encontraron ventas en el período seleccionado"
      />

      {/* View Invoice Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Factura ${viewingInvoice?.number}`}
        size="xl"
      >
        {viewingInvoice && (
          <div className="space-y-6">
            {/* Invoice Header */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Información del Cliente</h3>
                <p className="text-sm text-gray-600">Cliente: {getClientName(viewingInvoice.clientId)}</p>
                <p className="text-sm text-gray-600">Tipo: {viewingInvoice.type}</p>
                <p className="text-sm text-gray-600">Método de Pago: {viewingInvoice.paymentMethod}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Información de la Factura</h3>
                <p className="text-sm text-gray-600">Número: {viewingInvoice.number}</p>
                <p className="text-sm text-gray-600">Estado: {viewingInvoice.status}</p>
                <p className="text-sm text-gray-600">
                  Fecha: {viewingInvoice.issuedAt ? format(new Date(viewingInvoice.issuedAt), 'dd/MM/yyyy HH:mm') : '-'}
                </p>
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Items</h3>
              <table className="min-w-full bg-gray-50 rounded-lg">
                <thead>
                  <tr className="text-left text-sm font-medium text-gray-700">
                    <th className="p-3">Producto</th>
                    <th className="p-3">Cantidad</th>
                    <th className="p-3">Precio Unit.</th>
                    <th className="p-3">Subtotal</th>
                    <th className="p-3">Impuesto</th>
                    <th className="p-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingInvoice.items.map((item) => (
                    <tr key={item.id} className="text-sm border-t">
                      <td className="p-3">{getProductName(item.productId)}</td>
                      <td className="p-3">{item.quantity}</td>
                      <td className="p-3">${item.unitPrice.toFixed(2)}</td>
                      <td className="p-3">${item.subtotal.toFixed(2)}</td>
                      <td className="p-3">${item.taxAmount.toFixed(2)}</td>
                      <td className="p-3 font-medium">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2">
                  <tr className="font-medium text-lg">
                    <td colSpan={3} className="p-3 text-right">Total General:</td>
                    <td className="p-3">${viewingInvoice.subtotal.toFixed(2)}</td>
                    <td className="p-3">${viewingInvoice.totalTax.toFixed(2)}</td>
                    <td className="p-3">${viewingInvoice.total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Notes */}
            {viewingInvoice.notes && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Notas</h3>
                <p className="text-sm text-gray-600">{viewingInvoice.notes}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <a
                href={`${import.meta.env.VITE_API_URL?.replace(/\/$/, '')}/dte/${viewingInvoice.id}/json?token=${token ?? ''}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200"
              >
                Descargar JSON
              </a>
              <a
                href={`${import.meta.env.VITE_API_URL?.replace(/\/$/, '')}/dte/${viewingInvoice.id}/pdf?token=${token ?? ''}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Descargar PDF
              </a>
              {canCreate && (
                <Button onClick={() => handleCloneInvoice(viewingInvoice)}>
                  <Copy size={16} className="mr-2" />
                  Clonar como Borrador
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};