import React from 'react';
import { X, FileText, User, CreditCard, AlertCircle } from 'lucide-react';
import { Client, InvoiceItem } from '../../types';

interface InvoicePreviewData {
  clientId: string;
  client?: Client;
  type: 'tradicional' | 'electronica';
  documentType?: 'FCF' | 'CCF';
  paymentMethod: string;
  notes?: string;
  items: InvoiceItem[];
}

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  invoiceData: InvoicePreviewData;
  isSubmitting?: boolean;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  invoiceData,
  isSubmitting = false,
}) => {
  if (!isOpen) return null;

  const { client, type, documentType, paymentMethod, notes, items } = invoiceData;

  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    const itemSubtotal = item.unitPrice * item.quantity - (item.discount || 0);
    return sum + itemSubtotal;
  }, 0);

  const taxTotal = items.reduce((sum, item) => {
    const itemSubtotal = item.unitPrice * item.quantity - (item.discount || 0);
    const itemTax = itemSubtotal * (item.taxRate / 100);
    return sum + itemTax;
  }, 0);

  const total = subtotal + taxTotal;

  // Determine document type display
  const docType = documentType || (type === 'electronica' ? 'FCF' : 'Tradicional');
  const isCCF = documentType === 'CCF';

  // Check if client has required fields for CCF
  const hasRequiredCCFFields = client?.nit && client?.nrc;
  const showCCFWarning = isCCF && !hasRequiredCCFFields;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Previsualización de Factura
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Document Type Badge */}
          <div className="flex items-center justify-between">
            <div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                type === 'electronica' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {type === 'electronica' ? '⚡ Electrónica' : '📄 Tradicional'}
              </span>
              {documentType && (
                <span className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  isCCF 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {documentType}
                </span>
              )}
            </div>
          </div>

          {/* CCF Warning */}
          {showCCFWarning && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Advertencia: Cliente sin datos fiscales completos
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Para emitir un CCF, el cliente debe tener NIT y NRC registrados.
                    La factura podría ser rechazada.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Client Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <User className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Información del Cliente</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="font-medium text-gray-900">{client?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ID Fiscal</p>
                <p className="font-medium text-gray-900">{client?.taxId || 'N/A'}</p>
              </div>
              {isCCF && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">NIT</p>
                    <p className="font-medium text-gray-900">{client?.nit || 'No registrado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">NRC</p>
                    <p className="font-medium text-gray-900">{client?.nrc || 'No registrado'}</p>
                  </div>
                  {client?.giro && (
                    <div>
                      <p className="text-sm text-gray-600">Giro</p>
                      <p className="font-medium text-gray-900">{client.giro}</p>
                    </div>
                  )}
                  {client?.direccionFiscal && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Dirección Fiscal</p>
                      <p className="font-medium text-gray-900">{client.direccionFiscal}</p>
                    </div>
                  )}
                </>
              )}
              {client?.email && (
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{client.email}</p>
                </div>
              )}
              {client?.phone && (
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium text-gray-900">{client.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Productos/Servicios</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cant.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P. Unit.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Desc.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IVA
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => {
                    const itemSubtotal = item.unitPrice * item.quantity - (item.discount || 0);
                    const itemTax = itemSubtotal * (item.taxRate / 100);
                    const itemTotal = itemSubtotal + itemTax;

                    return (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          ${item.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          ${(item.discount || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          ${itemSubtotal.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          ${itemTax.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          ${itemTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">IVA (13%):</span>
                <span className="font-medium text-gray-900">${taxTotal.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Total a Pagar:</span>
                  <span className="text-lg font-bold text-green-600">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="flex items-center space-x-2 text-sm">
            <CreditCard className="h-5 w-5 text-gray-600" />
            <span className="text-gray-600">Método de Pago:</span>
            <span className="font-medium text-gray-900">{paymentMethod}</span>
          </div>

          {/* Notes */}
          {notes && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Notas:</h3>
              <p className="text-sm text-gray-700 bg-gray-50 rounded p-3">{notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || showCCFWarning}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Emitiendo...
              </>
            ) : (
              <>
                <FileText size={16} className="mr-2" />
                Confirmar y Emitir
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

