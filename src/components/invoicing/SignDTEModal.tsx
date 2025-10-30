import React, { useState } from 'react';
import { X, Shield, Lock, FileCheck, AlertCircle } from 'lucide-react';
import { Invoice } from '../../types';
import { apiFetch } from '../../lib/api';
import { showSuccess, showError } from '../../lib/toast';

interface SignDTEModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSuccess: () => void;
}

export const SignDTEModal: React.FC<SignDTEModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}) => {
  const [isSigning, setIsSigning] = useState(false);
  const [dtePreview, setDtePreview] = useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const loadPreview = async () => {
    if (!invoice) return;
    setIsLoadingPreview(true);
    setPreviewError(null);
    try {
      const response = await apiFetch<any>(`/dte/preview/${invoice.id}`, {
        method: 'POST',
      });
      setDtePreview(response.dte);
    } catch (error: any) {
      const msg = error?.message || 'Error al cargar preview del DTE';
      setPreviewError(msg);
      showError('Error al cargar preview del DTE');
      console.error('[DTE] Preview error:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  React.useEffect(() => {
    if (!isOpen || !invoice) {
      setDtePreview(null);
      setPreviewError(null);
      return;
    }

    loadPreview();
  }, [isOpen, invoice?.id]);

  if (!isOpen || !invoice) return null;

  const handleSign = async () => {
    if (!invoice) return;

    setIsSigning(true);
    try {
      await apiFetch(`/dte/sign/${invoice.id}`, {
        method: 'POST',
      });

      showSuccess('DTE firmado exitosamente con AES-256-GCM');
      onSuccess();
      onClose();
    } catch (error: any) {
      showError(error.message || 'Error al firmar el DTE');
      console.error(error);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Firmar Documento Tributario Electrónico
              </h2>
              <p className="text-sm text-gray-600">Factura {invoice.number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSigning}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Lock className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Firma Electrónica Segura</p>
                <p>
                  Este documento será firmado usando <strong>AES-256-GCM</strong>, un algoritmo de 
                  encriptación de grado militar. La firma garantiza la integridad y autenticidad del DTE.
                </p>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Detalles de la Factura</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Número:</span>
                <span className="ml-2 font-medium text-gray-900">{invoice.number}</span>
              </div>
              <div>
                <span className="text-gray-600">Total:</span>
                  <span className="ml-2 font-medium text-gray-900">${Number(invoice.total || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Tipo:</span>
                <span className="ml-2 font-medium text-gray-900">{invoice.type}</span>
              </div>
              <div>
                <span className="text-gray-600">Estado:</span>
                <span className="ml-2 font-medium text-gray-900">{invoice.status}</span>
              </div>
            </div>
          </div>

          {/* DTE Preview */}
          {isLoadingPreview ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Generando preview del DTE...</span>
            </div>
          ) : dtePreview ? (
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-mono">DTE JSON Preview</span>
                <FileCheck className="h-4 w-4 text-green-400" />
              </div>
              <pre className="text-xs text-green-400 font-mono overflow-x-auto">
                {JSON.stringify(dtePreview, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
              <p className="font-medium mb-1">No se pudo cargar la previsualización del DTE.</p>
              {previewError && (
                <p className="mb-1">Detalle: {previewError}</p>
              )}
              <p>Revisa tu conexión con el backend y que tu sesión esté activa.</p>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={loadPreview}
                  className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Importante</p>
                <p>
                  Una vez firmado el DTE, la factura quedará en estado <strong>ISSUED</strong> y 
                  solo podrá ser anulada (no modificada). Asegúrate de que todos los datos sean correctos.
                </p>
              </div>
            </div>
          </div>

          {/* Signature Process */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Proceso de Firma</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mr-3">
                  1
                </div>
                <span>Generación del JSON DTE según formato oficial</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mr-3">
                  2
                </div>
                <span>Cálculo del hash SHA-256 del documento</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mr-3">
                  3
                </div>
                <span>Encriptación con AES-256-GCM</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mr-3">
                  4
                </div>
                <span>Generación de código de control único</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mr-3">
                  5
                </div>
                <span>Almacenamiento seguro en base de datos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSigning}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSign}
            disabled={isSigning || isLoadingPreview || !dtePreview}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSigning ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Firmando DTE...
              </>
            ) : (
              <>
                <Shield size={16} className="mr-2" />
                Firmar con AES-256-GCM
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

