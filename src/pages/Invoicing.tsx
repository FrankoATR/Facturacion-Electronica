// TODO: validar vs PDF - Módulo de Facturación (electrónica y tradicional)
import React, { useEffect, useState } from 'react';
import { Plus, Search, FileText, Download, Eye, X } from 'lucide-react';
import { useInvoiceStore } from '../stores/invoiceStore';
import { useClientStore } from '../stores/clientStore';
import { useProductStore } from '../stores/productStore';
import { useAuthStore } from '../stores/authStore';
import { hasPermission } from '../config/permissions';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Invoice, InvoiceItem, Client, Product } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// SSDLC Touchpoint: Validación de entradas para facturación
const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Cliente es requerido'),
  type: z.enum(['tradicional', 'electronica']),
  paymentMethod: z.string().min(1, 'Método de pago es requerido'),
  notes: z.string().optional()
});

type InvoiceForm = z.infer<typeof invoiceSchema>;

export const Invoicing: React.FC = () => {
  const { user } = useAuthStore();
  const { invoices, currentInvoice, loading, error, fetchInvoices, createInvoice, setCurrentInvoice, addItemToCurrentInvoice, removeItemFromCurrentInvoice, updateItemInCurrentInvoice } = useInvoiceStore();
  const { clients, fetchClients } = useClientStore();
  const { products, fetchProducts } = useProductStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const canCreate = user && hasPermission(user.role, 'facturacion', 'create');
  const canUpdate = user && hasPermission(user.role, 'facturacion', 'update');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      type: 'electronica',
      paymentMethod: 'Efectivo'
    }
  });

  const selectedClientId = watch('clientId');

  useEffect(() => {
    fetchInvoices();
    fetchClients();
    fetchProducts();
  }, [fetchInvoices, fetchClients, fetchProducts]);

  // Filtrar facturas
  const filteredInvoices = invoices.filter(invoice => {
    const client = clients.find(c => c.id === invoice.clientId);
    const clientName = client?.name || '';
    return invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
           clientName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Paginación
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenCreateModal = () => {
    // Crear nueva factura en borrador
    const newInvoice: Invoice = {
      id: 'temp',
      clientId: '',
      number: 'BORRADOR',
      type: 'electronica',
      status: 'borrador',
      items: [],
      subtotal: 0,
      totalTax: 0,
      total: 0,
      paymentMethod: 'Efectivo',
      notes: '',
      issuedBy: user?.id || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setCurrentInvoice(newInvoice);
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCurrentInvoice(null);
    reset();
  };

  const handleAddItem = () => {
    if (!selectedProduct || !currentInvoice) return;

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    // SSDLC Touchpoint: Validación de negocio - stock suficiente
    if (product.stock < itemQuantity) {
      alert('Stock insuficiente');
      return;
    }

    const subtotal = itemQuantity * product.unitPrice;
    const taxAmount = subtotal * (product.taxRate / 100);
    const total = subtotal + taxAmount;

    const newItem: Omit<InvoiceItem, 'id'> = {
      productId: product.id,
      quantity: itemQuantity,
      unitPrice: product.unitPrice,
      taxRate: product.taxRate,
      subtotal,
      taxAmount,
      total
    };

    addItemToCurrentInvoice(newItem);
    setSelectedProduct('');
    setItemQuantity(1);
  };

  const handleRemoveItem = (itemId: string) => {
    removeItemFromCurrentInvoice(itemId);
  };

  const onSubmit = async (data: InvoiceForm) => {
    if (!currentInvoice || currentInvoice.items.length === 0) {
      alert('Debe agregar al menos un item a la factura');
      return;
    }

    try {
      const invoiceData = {
        ...currentInvoice,
        ...data,
        status: 'emitida' as const,
        issuedAt: new Date()
      };

      await createInvoice(invoiceData);
      handleCloseCreateModal();
    } catch (error) {
      console.error('Error al crear factura:', error);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Cliente no encontrado';
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Producto no encontrado';
  };

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
        <div className="font-medium text-gray-900">${invoice.total.toFixed(2)}</div>
      )
    },
    {
      key: 'status',
      header: 'Estado',
      render: (invoice: Invoice) => {
        const statusColors = {
          borrador: 'bg-gray-100 text-gray-800',
          emitida: 'bg-green-100 text-green-800',
          anulada: 'bg-red-100 text-red-800'
        };
        
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[invoice.status]}`}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'issuedAt',
      header: 'Fecha',
      render: (invoice: Invoice) => (
        <div className="text-sm text-gray-900">
          {invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : '-'}
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
            title="Ver detalle"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => window.print()}
            className="text-green-600 hover:text-green-800"
            title="Imprimir"
          >
            <Download size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
          <p className="text-gray-600">Emisión de facturas electrónicas y tradicionales</p>
        </div>
        {canCreate && (
          <Button onClick={handleOpenCreateModal}>
            <Plus size={16} className="mr-2" />
            Nueva Factura
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por número o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
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
        emptyMessage="No se encontraron facturas"
      />

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title="Nueva Factura"
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Cliente</label>
              <select
                {...register('clientId')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
              {errors.clientId && (
                <p className="mt-1 text-sm text-red-600">{errors.clientId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Factura</label>
              <select
                {...register('type')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="electronica">Electrónica</option>
                <option value="tradicional">Tradicional</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Método de Pago</label>
              <select
                {...register('paymentMethod')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Add Items */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Items de la Factura</h3>
            
            <div className="flex items-end space-x-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Producto</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar producto</option>
                  {products.filter(p => p.isActive && p.stock > 0).map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ${product.unitPrice} (Stock: {product.stock})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(Number(e.target.value))}
                  className="mt-1 block w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <Button
                type="button"
                onClick={handleAddItem}
                disabled={!selectedProduct}
              >
                Agregar
              </Button>
            </div>

            {/* Items Table */}
            {currentInvoice && currentInvoice.items.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-sm font-medium text-gray-700">
                      <th className="pb-2">Producto</th>
                      <th className="pb-2">Cantidad</th>
                      <th className="pb-2">Precio Unit.</th>
                      <th className="pb-2">Subtotal</th>
                      <th className="pb-2">Impuesto</th>
                      <th className="pb-2">Total</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInvoice.items.map((item) => (
                      <tr key={item.id} className="text-sm">
                        <td className="py-2">{getProductName(item.productId)}</td>
                        <td className="py-2">{item.quantity}</td>
                        <td className="py-2">${item.unitPrice.toFixed(2)}</td>
                        <td className="py-2">${item.subtotal.toFixed(2)}</td>
                        <td className="py-2">${item.taxAmount.toFixed(2)}</td>
                        <td className="py-2 font-medium">${item.total.toFixed(2)}</td>
                        <td className="py-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t">
                    <tr className="font-medium">
                      <td colSpan={3} className="py-2 text-right">Totales:</td>
                      <td className="py-2">${currentInvoice.subtotal.toFixed(2)}</td>
                      <td className="py-2">${currentInvoice.totalTax.toFixed(2)}</td>
                      <td className="py-2 text-lg">${currentInvoice.total.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Notas</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseCreateModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Emitir Factura
            </Button>
          </div>
        </form>
      </Modal>

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
                  Fecha: {viewingInvoice.issuedAt ? new Date(viewingInvoice.issuedAt).toLocaleDateString() : '-'}
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
          </div>
        )}
      </Modal>
    </div>
  );
};