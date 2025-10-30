// TODO: validar vs PDF - Módulo de Facturación (electrónica y tradicional)
import React, { useEffect, useState } from 'react';
<<<<<<< HEAD
import { Plus, Search, FileText, Eye, X, XCircle, Shield } from 'lucide-react';
=======
import { Plus, Search, FileText, Eye, X, Trash2, Printer } from 'lucide-react';
>>>>>>> baaeab5 (feat: Implementación completa de mejoras y nuevas funcionalidades del sistema)
import { useInvoiceStore } from '../stores/invoiceStore';
import { useClientStore } from '../stores/clientStore';
import { useProductStore } from '../stores/productStore';
import { useAuthStore } from '../stores/authStore';
import { hasPermission } from '../config/permissions';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { ClientAutocomplete } from '../components/common/ClientAutocomplete';
import { InvoicePreviewModal } from '../components/invoicing/InvoicePreviewModal';
import { AnnulInvoiceModal } from '../components/invoicing/AnnulInvoiceModal';
import { SignDTEModal } from '../components/invoicing/SignDTEModal';
import { DTEStatusBadge } from '../components/invoicing/DTEStatusBadge';
import { Invoice, InvoiceItem, Client, Product } from '../types';
import { apiFetch } from '../lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { showError, showSuccess } from '../lib/toast';

// SSDLC Touchpoint: Validación de entradas para facturación
const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Cliente es requerido'),
  type: z.enum(['tradicional', 'electronica', 'credito_fiscal']),
  paymentMethod: z.string().min(1, 'Método de pago es requerido'),
  notes: z.string().optional()
});

type InvoiceForm = z.infer<typeof invoiceSchema>;

export const Invoicing: React.FC = () => {
  const { user, token } = useAuthStore();
  const { invoices, currentInvoice, loading, error, fetchInvoices, createInvoice, setCurrentInvoice, addItemToCurrentInvoice, removeItemFromCurrentInvoice, updateItemInCurrentInvoice, updateInvoice } = useInvoiceStore();
  const { clients, fetchClients } = useClientStore();
  const { products, fetchProducts } = useProductStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAnnulModalOpen, setIsAnnulModalOpen] = useState(false);
  const [isSignDTEModalOpen, setIsSignDTEModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
<<<<<<< HEAD
  const [annullingInvoice, setAnnullingInvoice] = useState<Invoice | null>(null);
  const [signingInvoice, setSigningInvoice] = useState<Invoice | null>(null);
=======
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState<Invoice | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
>>>>>>> baaeab5 (feat: Implementación completa de mejoras y nuevas funcionalidades del sistema)
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemDiscount, setItemDiscount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [pendingInvoiceData, setPendingInvoiceData] = useState<any>(null);
  const [isAnnulling, setIsAnnulling] = useState(false);
  const itemsPerPage = 10;

  const canCreate = user && hasPermission(user.role, 'facturacion', 'create');
  const canUpdate = user && hasPermission(user.role, 'facturacion', 'update');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      type: 'electronica',
      paymentMethod: 'Efectivo'
    }
  });

  const watchedClientId = watch('clientId');

  useEffect(() => {
    fetchInvoices();
    fetchClients();
    fetchProducts();
  }, [fetchInvoices, fetchClients, fetchProducts]);

  // Resetear cantidad cuando se cambie de producto
  useEffect(() => {
    if (selectedProduct) {
      const product = products.find(p => p.id === selectedProduct);
      const alreadyAddedQuantity = currentInvoice?.items
        .filter(item => item.productId === selectedProduct)
        .reduce((total, item) => total + item.quantity, 0) || 0;
      const maxQuantity = product ? product.stock - alreadyAddedQuantity : 1;
      
      // Si la cantidad actual excede el máximo disponible, resetear a 1 o al máximo
      if (itemQuantity > maxQuantity) {
        setItemQuantity(Math.max(1, Math.min(maxQuantity, 1)));
      }
    }
  }, [selectedProduct, currentInvoice?.items, products, itemQuantity]);

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
      status: 'draft',
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
    setSelectedClientId('');
    reset();
  };

  const handleAddItem = () => {
    if (!selectedProduct || !currentInvoice) return;

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    // Calcular cantidad ya agregada de este producto en la factura actual
    const alreadyAddedQuantity = currentInvoice.items
      .filter(item => item.productId === selectedProduct)
      .reduce((total, item) => total + item.quantity, 0);

    // SSDLC Touchpoint: Validación de negocio - stock suficiente considerando items ya agregados
    const totalQuantityNeeded = alreadyAddedQuantity + itemQuantity;
    if (totalQuantityNeeded > product.stock) {
      const availableQuantity = product.stock - alreadyAddedQuantity;
      if (availableQuantity <= 0) {
        showError(`No hay stock disponible para ${product.name}. Ya se agregaron ${alreadyAddedQuantity} unidades.`);
      } else {
        showError(`Stock insuficiente para ${product.name}. Disponible: ${availableQuantity} unidades (ya agregadas: ${alreadyAddedQuantity})`);
      }
      return;
    }

    const baseAmount = itemQuantity * product.unitPrice;
    const discount = itemDiscount || 0;
    
    // Validar que el descuento no sea mayor que el monto base
    if (discount > baseAmount) {
      showError('El descuento no puede ser mayor que el monto total del producto');
      return;
    }
    
    const subtotal = baseAmount - discount;
    const taxAmount = subtotal * (product.taxRate / 100);
    const total = subtotal + taxAmount;

    const newItem: Omit<InvoiceItem, 'id'> = {
      productId: product.id,
      quantity: itemQuantity,
      unitPrice: product.unitPrice,
      discount,
      taxRate: product.taxRate,
      subtotal,
      taxAmount,
      total
    };

    addItemToCurrentInvoice(newItem);
    setSelectedProduct('');
    setItemQuantity(1);
    setItemDiscount(0);
  };

  const handleRemoveItem = (itemId: string) => {
    removeItemFromCurrentInvoice(itemId);
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    // También actualizar el formulario
    if (clientId) {
      setValue('clientId', clientId);
    } else {
      setValue('clientId', '');
    }
  };

  const onSubmit = async (data: InvoiceForm) => {
    if (!currentInvoice || currentInvoice.items.length === 0) {
      showError('Debe agregar al menos un item a la factura');
      return;
    }

    // Prepare invoice data and show preview
    const invoiceData = {
      ...currentInvoice,
      ...data,
      status: 'draft' as const,
      issuedAt: undefined,
    };

    setPendingInvoiceData(invoiceData);
    setIsPreviewModalOpen(true);
  };

  const handleConfirmInvoice = async () => {
    if (!pendingInvoiceData) return;

    try {
      await createInvoice(pendingInvoiceData);
      showSuccess('Factura creada en borrador');
      setIsPreviewModalOpen(false);
      handleCloseCreateModal();
      setPendingInvoiceData(null);
    } catch (error: any) {
      console.error('Error al crear factura:', error);
      const errorMessage = error.message || 'Error al crear factura';
      showError(`Error al crear factura: ${errorMessage}`);
    }
  };

  const handleClosePreview = () => {
    setIsPreviewModalOpen(false);
    // Don't clear pendingInvoiceData in case user wants to edit and try again
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice);
    setIsViewModalOpen(true);
  };

<<<<<<< HEAD
  const handleOpenAnnulModal = (invoice: Invoice) => {
    setAnnullingInvoice(invoice);
    setIsAnnulModalOpen(true);
  };

  const handleCloseAnnulModal = () => {
    setIsAnnulModalOpen(false);
    setAnnullingInvoice(null);
  };

  const handleConfirmAnnul = async (reason: string) => {
    if (!annullingInvoice) return;

    setIsAnnulling(true);
    try {
      await apiFetch(`/dte/annul/${annullingInvoice.id}`, {
        method: 'POST',
        body: { reason },
      });
      
      showSuccess('Factura cancelada exitosamente');
      handleCloseAnnulModal();
      await fetchInvoices(); // Refresh the list
    } catch (error: any) {
      console.error('Error al anular factura:', error);
      const errorMessage = error.message || 'Error al anular factura';
      showError(`Error: ${errorMessage}`);
    } finally {
      setIsAnnulling(false);
    }
  };

  const handleOpenSignDTEModal = (invoice: Invoice) => {
    setSigningInvoice(invoice);
    setIsSignDTEModalOpen(true);
  };

  const handleCloseSignDTEModal = () => {
    setIsSignDTEModalOpen(false);
    setSigningInvoice(null);
  };

  const handleSignDTESuccess = async () => {
    await fetchInvoices(); // Refresh the list
  };

=======
  const handleOpenCancelModal = (invoice: Invoice) => {
    setInvoiceToCancel(invoice);
    setCancellationReason('');
    setIsCancelModalOpen(true);
  };

  const handleCancelInvoice = async () => {
    if (!invoiceToCancel || !cancellationReason.trim()) {
      showError('La observación es obligatoria para anular una factura');
      return;
    }

    try {
      await updateInvoice(invoiceToCancel.id, { 
        status: 'anulada' as any, 
        cancellationReason: cancellationReason.trim() 
      });
      showSuccess('Factura anulada exitosamente');
      setIsCancelModalOpen(false);
      setInvoiceToCancel(null);
      setCancellationReason('');
      fetchInvoices();
    } catch (error: any) {
      showError(error.message || 'Error al anular factura');
    }
  };

>>>>>>> baaeab5 (feat: Implementación completa de mejoras y nuevas funcionalidades del sistema)
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
      render: (invoice: Invoice) => (
        <DTEStatusBadge 
          status={invoice.status as any} 
          hasDTESignature={!!invoice.dteSignature}
        />
      )
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
<<<<<<< HEAD
      render: (invoice: Invoice) => {
        const statusNormalized = (invoice.status || '').toString().toLowerCase();
        const hasSignature = !!invoice.dteSignature;
        const canSign = (statusNormalized === 'draft' || statusNormalized === 'borrador') && !hasSignature && canUpdate;
        const canAnnul = (statusNormalized === 'emmited' || statusNormalized === 'issued' || statusNormalized === 'emitida') && hasSignature && canUpdate;

        return (
          <div className="flex space-x-2">
            {hasSignature && (
              <button
                onClick={() => handleViewInvoice(invoice)}
                className="text-blue-600 hover:text-blue-800"
                title="Ver/Descargar DTE"
              >
                <Eye size={16} />
              </button>
            )}
            {canSign && (
              <button
                onClick={() => handleOpenSignDTEModal(invoice)}
                className="text-green-600 hover:text-green-800"
                title="Firmar DTE"
              >
                <Shield size={16} />
              </button>
            )}
            {canAnnul && (
              <button
                onClick={() => handleOpenAnnulModal(invoice)}
                className="text-red-600 hover:text-red-800"
                title="Cancelar DTE"
              >
                <XCircle size={16} />
              </button>
            )}
          </div>
        );
      }
=======
      render: (invoice: Invoice) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewInvoice(invoice)}
            className="text-blue-600 hover:text-blue-800"
            title="Ver/Descargar DTE"
          >
            <Eye size={16} />
          </button>
          {canUpdate && invoice.status !== 'anulada' && invoice.status !== 'CANCELED' && (
            <button
              onClick={() => handleOpenCancelModal(invoice)}
              className="text-red-600 hover:text-red-800"
              title="Anular Factura"
            >
              <Trash2 size={16} />
            </button>
          )}
          </div>
      )
>>>>>>> baaeab5 (feat: Implementación completa de mejoras y nuevas funcionalidades del sistema)
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <ClientAutocomplete
                clients={clients}
                selectedClientId={selectedClientId}
                onClientSelect={handleClientSelect}
                placeholder="Buscar por identificador fiscal..."
                error={errors.clientId?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Factura</label>
              <select
                {...register('type')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="electronica">Electrónica</option>
                <option value="tradicional">Tradicional</option>
                <option value="credito_fiscal">Crédito Fiscal</option>
              </select>
              {watch('type') === 'credito_fiscal' && (
                <p className="mt-1 text-xs text-amber-600">
                  ⚠️ El cliente debe tener NRC registrado para emitir crédito fiscal
                </p>
              )}
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
                  {products.filter(p => p.isActive && p.stock > 0).map(product => {
                    // Calcular stock disponible considerando items ya agregados
                    const alreadyAddedQuantity = currentInvoice?.items
                      .filter(item => item.productId === product.id)
                      .reduce((total, item) => total + item.quantity, 0) || 0;
                    const availableStock = product.stock - alreadyAddedQuantity;
                    
                    return (
                      <option key={product.id} value={product.id} disabled={availableStock <= 0}>
                        {product.name} - ${product.unitPrice} (Disponible: {availableStock})
                        {alreadyAddedQuantity > 0 && ` [Ya agregadas: ${alreadyAddedQuantity}]`}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                {(() => {
                  const product = products.find(p => p.id === selectedProduct);
                  const alreadyAddedQuantity = currentInvoice?.items
                    .filter(item => item.productId === selectedProduct)
                    .reduce((total, item) => total + item.quantity, 0) || 0;
                  const maxQuantity = product ? product.stock - alreadyAddedQuantity : 1;
                  
                  return (
                    <input
                      type="number"
                      min="1"
                      max={maxQuantity > 0 ? maxQuantity : 1}
                      value={itemQuantity}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value <= maxQuantity) {
                          setItemQuantity(value);
                        }
                      }}
                      className="mt-1 block w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      disabled={!selectedProduct || maxQuantity <= 0}
                    />
                  );
                })()}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Descuento ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemDiscount}
                  onChange={(e) => setItemDiscount(Number(e.target.value))}
                  className="mt-1 block w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
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
                      <th className="pb-2">Cant.</th>
                      <th className="pb-2">P. Unit.</th>
                      <th className="pb-2">Desc.</th>
                      <th className="pb-2">Subtotal</th>
                      <th className="pb-2">IVA</th>
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
                        <td className="py-2">{item.discount ? `-$${item.discount.toFixed(2)}` : '-'}</td>
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
                      <td colSpan={4} className="py-2 text-right">Totales:</td>
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
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (currentInvoice && currentInvoice.items.length > 0) {
                  setIsPreviewModalOpen(true);
                } else {
                  showError('Debe agregar al menos un item a la factura para previsualizar');
                }
              }}
              disabled={!currentInvoice || currentInvoice.items.length === 0}
            >
              <Eye size={16} className="mr-2" />
              Previsualizar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              <Eye size={16} className="mr-2" />
              Previsualizar
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

            {/* Actions to download DTE JSON/PDF */}
            <div className="flex justify-end space-x-3">
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

<<<<<<< HEAD
      {/* Invoice Preview Modal */}
      {pendingInvoiceData && (
        <InvoicePreviewModal
          isOpen={isPreviewModalOpen}
          onClose={handleClosePreview}
          onConfirm={handleConfirmInvoice}
          invoiceData={{
            clientId: pendingInvoiceData.clientId,
            client: clients.find(c => c.id === pendingInvoiceData.clientId),
            type: pendingInvoiceData.type,
            documentType: pendingInvoiceData.documentType,
            paymentMethod: pendingInvoiceData.paymentMethod,
            notes: pendingInvoiceData.notes,
            items: pendingInvoiceData.items || []
          }}
          isSubmitting={loading}
        />
      )}

      {/* Annul Invoice Modal */}
      <AnnulInvoiceModal
        isOpen={isAnnulModalOpen}
        onClose={handleCloseAnnulModal}
        onConfirm={handleConfirmAnnul}
        invoice={annullingInvoice}
        isSubmitting={isAnnulling}
      />

      {/* Sign DTE Modal */}
      <SignDTEModal
        isOpen={isSignDTEModalOpen}
        onClose={handleCloseSignDTEModal}
        invoice={signingInvoice}
        onSuccess={handleSignDTESuccess}
      />
=======
      {/* Cancel Invoice Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setInvoiceToCancel(null);
          setCancellationReason('');
        }}
        title={`Anular Factura ${invoiceToCancel?.number}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Atención:</strong> Al anular esta factura, se restaurará el stock de los productos y se registrará una observación contable. Esta acción no se puede deshacer.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observación <span className="text-red-500">*</span>
            </label>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese el motivo de la anulación de la factura..."
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Este motivo será registrado en el sistema contable y visible en la bitácora de auditoría.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCancelModalOpen(false);
                setInvoiceToCancel(null);
                setCancellationReason('');
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCancelInvoice}
              disabled={!cancellationReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              Anular Factura
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Invoice Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Previsualización de Factura"
        size="xl"
      >
        {currentInvoice && (
          <div className="space-y-6">
            {/* Header de la factura */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg text-center">
              <h2 className="text-2xl font-bold mb-2">⚡ EleCtroZ</h2>
              <p className="text-sm opacity-90">EleCtroZ S.A. DE C.V.</p>
              <p className="text-xs mt-1 opacity-80">NIT: 0614-031289-001-9 | NRC: 12345-6</p>
            </div>

            {/* Información de la factura */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 border-b pb-2">Cliente</h3>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Nombre:</span> {getClientName(watchedClientId || selectedClientId)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Tipo:</span> {
                    watch('type') === 'electronica' ? 'Electrónica' : 
                    watch('type') === 'credito_fiscal' ? 'Crédito Fiscal' : 
                    'Tradicional'
                  }
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Método de Pago:</span> {watch('paymentMethod') || 'Efectivo'}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 border-b pb-2">Factura</h3>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Número:</span> BORRADOR
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Fecha:</span> {new Date().toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Hora:</span> {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>

            {/* Tabla de items */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">
                Detalle de Productos/Servicios
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">No.</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Descripción</th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700">Cant.</th>
                      <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold text-gray-700">P. Unit.</th>
                      <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold text-gray-700">Desc.</th>
                      <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold text-gray-700">Subtotal</th>
                      <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold text-gray-700">IVA</th>
                      <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInvoice.items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2 text-sm">{idx + 1}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{getProductName(item.productId)}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-center">{item.quantity}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-right">${item.unitPrice.toFixed(2)}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-right">
                          {item.discount > 0 ? `-$${item.discount.toFixed(2)}` : '$0.00'}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-right">${item.subtotal.toFixed(2)}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-right">${item.taxAmount.toFixed(2)}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-right font-medium">${item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totales */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm font-medium">${currentInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">IVA (13%):</span>
                    <span className="text-sm font-medium">${currentInvoice.totalTax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-orange-600">TOTAL A PAGAR:</span>
                      <span className="text-lg font-bold text-orange-600">${currentInvoice.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notas si hay */}
            {watch('notes') && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Notas:</h4>
                <p className="text-sm text-gray-600">{watch('notes')}</p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button variant="secondary" onClick={() => setIsPreviewModalOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
>>>>>>> baaeab5 (feat: Implementación completa de mejoras y nuevas funcionalidades del sistema)
    </div>
  );
};
