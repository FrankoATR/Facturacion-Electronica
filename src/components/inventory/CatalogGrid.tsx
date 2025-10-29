import React from 'react';
import { Edit, AlertTriangle, Package } from 'lucide-react';
import { Product } from '../../types';

interface CatalogGridProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  onStockEdit?: (product: Product) => void;
  canUpdate?: boolean;
}

export const CatalogGrid: React.FC<CatalogGridProps> = ({
  products,
  onEdit,
  onStockEdit,
  canUpdate = false,
}) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay productos</h3>
        <p className="mt-1 text-sm text-gray-500">
          No se encontraron productos con los filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200 overflow-hidden"
        >
          {/* Product Image Placeholder */}
          <div className="h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
            <Package className="h-20 w-20 text-blue-300" />
          </div>

          {/* Product Info */}
          <div className="p-4">
            {/* Category Badge */}
            <div className="mb-2">
              <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                {product.category}
              </span>
            </div>

            {/* Product Name */}
            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[3.5rem]">
              {product.name}
            </h3>

            {/* SKU */}
            <p className="text-sm text-gray-500 mb-3">
              SKU: {product.sku}
            </p>

            {/* Price */}
            <div className="mb-3">
              <span className="text-2xl font-bold text-gray-900">
                ${product.unitPrice.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500 ml-1">
                + {product.taxRate}% IVA
              </span>
            </div>

            {/* Stock */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Stock:</span>
                <span
                  className={`text-sm font-bold ${
                    product.stock <= 5
                      ? 'text-red-600'
                      : product.stock <= 10
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}
                >
                  {product.stock} unidades
                </span>
              </div>
              {product.stock <= 5 && (
                <AlertTriangle size={18} className="text-red-500" title="Stock crítico" />
              )}
            </div>

            {/* Low Stock Badge */}
            {product.stock <= 5 && (
              <div className="mb-3">
                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full">
                  <AlertTriangle size={12} className="mr-1" />
                  Stock Bajo
                </span>
              </div>
            )}

            {/* Status Badge */}
            <div className="mb-4">
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  product.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {product.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            {/* Actions */}
            {canUpdate && (
              <div className="flex space-x-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => onEdit?.(product)}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit size={14} className="mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => onStockEdit?.(product)}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Package size={14} className="mr-1" />
                  Ajustar Stock
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

