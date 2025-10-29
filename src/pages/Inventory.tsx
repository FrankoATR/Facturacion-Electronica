// TODO: validar vs PDF - Módulo de Control de Inventario
import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, Grid3x3, List } from 'lucide-react';
import { useProductStore } from '../stores/productStore';
import { useAuthStore } from '../stores/authStore';
import { hasPermission } from '../config/permissions';
import { showError, showSuccess } from '../lib/toast';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { CatalogGrid } from '../components/inventory/CatalogGrid';
import { Product } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// SSDLC Touchpoint: Validación de entradas para productos
const productSchema = z.object({
  sku: z.string().min(1, 'SKU es requerido').max(50, 'SKU muy largo'),
  name: z.string().min(1, 'Nombre es requerido').max(100, 'Nombre muy largo'),
  category: z.string().min(1, 'Categoría es requerida'),
  unitPrice: z.number().min(0.01, 'Precio debe ser mayor a 0'),
  taxRate: z.number().min(0, 'Tasa de impuesto inválida').max(100, 'Tasa de impuesto inválida'),
  stock: z.number().min(0, 'Stock no puede ser negativo'),
  isActive: z.boolean()
});

type ProductForm = z.infer<typeof productSchema>;

type ViewMode = 'table' | 'grid';

export const Inventory: React.FC = () => {
  const { user } = useAuthStore();
  const { products, loading, error, fetchProducts, createProduct, updateProduct, updateStock, deleteProduct, getLowStockProducts } = useProductStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockEditingId, setStockEditingId] = useState<string | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'table' ? 10 : 12;

  const canCreate = user && hasPermission(user.role, 'inventario', 'create');
  const canUpdate = user && hasPermission(user.role, 'inventario', 'update');
  const canDelete = user && hasPermission(user.role, 'inventario', 'delete');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      isActive: true,
      taxRate: 21 // IVA por defecto
    }
  });

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const lowStockProducts = getLowStockProducts();
  const categories = [...new Set(products.map(p => p.category))];

  // Filtrar y ordenar productos
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return b.unitPrice - a.unitPrice;
        case 'stock':
          return a.stock - b.stock;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenModal = (product?: Product) => {
    setEditingProduct(product || null);
    if (product) {
      reset({
        sku: product.sku,
        name: product.name,
        category: product.category,
        unitPrice: product.unitPrice,
        taxRate: product.taxRate,
        stock: product.stock,
        isActive: product.isActive
      });
    } else {
      reset({
        sku: '',
        name: '',
        category: '',
        unitPrice: 0,
        taxRate: 21,
        stock: 0,
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    reset();
  };

  const onSubmit = async (data: ProductForm) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        showSuccess('Producto actualizado exitosamente');
      } else {
        await createProduct(data);
        showSuccess('Producto creado exitosamente');
      }
      handleCloseModal();
    } catch (error: any) {
      if (error.message?.includes('SKU')) {
        showError(error.message);
      } else if (error.message?.includes('email')) {
        showError('Error: El email ya está en uso. Por favor use un email diferente.');
      } else {
        showError(error.message || 'Error al guardar producto. Verifique los datos e intente nuevamente.');
      }
    }
  };

  const handleStockEdit = (product: Product) => {
    setStockEditingId(product.id);
    setNewStock(product.stock);
  };

  const handleStockSave = async (productId: string) => {
    if (newStock < 0) {
      showError('El stock debe ser un número positivo');
      return;
    }

    try {
      await updateStock(productId, newStock);
      showSuccess('Stock actualizado exitosamente');
      setStockEditingId(null);
    } catch (error: any) {
      showError(error.message || 'Error al actualizar stock. Intente nuevamente.');
    }
  };

  const handleStockCancel = () => {
    setStockEditingId(null);
    setNewStock(0);
  };

  const handleDelete = async (product: Product) => {
    if (window.confirm(`⚠️ ATENCIÓN: ¿Está seguro de ELIMINAR PERMANENTEMENTE el producto "${product.name}"?\n\nEsta acción eliminará el producto del sistema y no se podrá deshacer.\n\n¿Continuar?`)) {
      try {
        await deleteProduct(product.id);
        showSuccess('Producto eliminado exitosamente');
      } catch (error: any) {
        showError(error.message || 'Error al eliminar producto. Intente nuevamente.');
      }
    }
  };

  const columns = [
    {
      key: 'sku',
      header: 'Producto',
      render: (product: Product) => (
        <div>
          <div className="font-medium text-gray-900">{product.name}</div>
          <div className="text-sm text-gray-500">SKU: {product.sku}</div>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Categoría',
      render: (product: Product) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {product.category}
        </span>
      )
    },
    {
      key: 'unitPrice',
      header: 'Precio',
      render: (product: Product) => (
        <div>
          <div className="font-medium text-gray-900">${product.unitPrice.toFixed(2)}</div>
          <div className="text-sm text-gray-500">IVA: {product.taxRate}%</div>
        </div>
      )
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (product: Product) => (
        <div className="flex items-center space-x-2">
          {stockEditingId === product.id ? (
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(Number(e.target.value))}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                min="0"
              />
              <button
                onClick={() => handleStockSave(product.id)}
                className="text-green-600 hover:text-green-800"
                title="Guardar"
              >
                ✓
              </button>
              <button
                onClick={handleStockCancel}
                className="text-red-600 hover:text-red-800"
                title="Cancelar"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className={`font-medium ${product.stock <= 10 ? 'text-red-600' : 'text-gray-900'}`}>
                {product.stock}
              </span>
              {product.stock <= 10 && (
                <AlertTriangle size={16} className="text-red-500" title="Stock bajo" />
              )}
              {canUpdate && (
                <button
                  onClick={() => handleStockEdit(product)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Editar stock"
                >
                  <Edit size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'isActive',
      header: 'Estado',
      render: (product: Product) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          product.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {product.isActive ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (product: Product) => (
        <div className="flex space-x-2">
          {canUpdate && (
            <button
              onClick={() => handleOpenModal(product)}
              className="text-green-600 hover:text-green-800"
              title="Editar"
            >
              <Edit size={16} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDelete(product)}
              className="text-red-600 hover:text-red-800"
              title="Eliminar"
            >
              <Trash2 size={16} />
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
          <h1 className="text-2xl font-bold text-gray-900">Control de Inventario</h1>
          <p className="text-gray-600">Gestiona productos y stock</p>
        </div>
        {canCreate && (
          <Button onClick={() => handleOpenModal()}>
            <Plus size={16} className="mr-2" />
            Nuevo Producto
          </Button>
        )}
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Alerta de Stock Bajo
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                {lowStockProducts.length} producto(s) con stock bajo (≤10 unidades):
                {' '}
                {lowStockProducts.map(p => p.name).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex items-center space-x-4 flex-1 w-full">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por nombre o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas las categorías</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'stock')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="name">Ordenar por Nombre</option>
            <option value="price">Ordenar por Precio</option>
            <option value="stock">Ordenar por Stock</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center px-3 py-2 rounded-md transition-colors ${
              viewMode === 'table'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Vista de tabla"
          >
            <List size={18} />
            <span className="ml-2 text-sm font-medium hidden sm:inline">Tabla</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center px-3 py-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Vista de cuadrícula"
          >
            <Grid3x3 size={18} />
            <span className="ml-2 text-sm font-medium hidden sm:inline">Cuadrícula</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Content - Table or Grid */}
      {viewMode === 'table' ? (
        <DataTable
          data={paginatedProducts}
          columns={columns}
          loading={loading}
          pagination={{
            currentPage,
            totalPages,
            onPageChange: setCurrentPage
          }}
          emptyMessage="No se encontraron productos"
        />
      ) : (
        <>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <CatalogGrid
              products={paginatedProducts}
              onEdit={handleOpenModal}
              onStockEdit={handleStockEdit}
              canUpdate={canUpdate}
            />
          )}
          
          {/* Pagination for Grid View */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="SKU"
              {...register('sku')}
              error={errors.sku?.message}
              placeholder="PROD-001"
            />
            <Input
              label="Nombre del Producto"
              {...register('name')}
              error={errors.name?.message}
            />
            <Input
              label="Categoría"
              {...register('category')}
              error={errors.category?.message}
            />
            <Input
              label="Precio Unitario"
              type="number"
              step="0.01"
              {...register('unitPrice', { valueAsNumber: true })}
              error={errors.unitPrice?.message}
            />
            <Input
              label="Tasa de Impuesto (%)"
              type="number"
              step="0.1"
              {...register('taxRate', { valueAsNumber: true })}
              error={errors.taxRate?.message}
            />
            <Input
              label="Stock Inicial"
              type="number"
              {...register('stock', { valueAsNumber: true })}
              error={errors.stock?.message}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              {...register('isActive')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Producto activo
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingProduct ? 'Actualizar' : 'Crear'} Producto
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};