// TODO: validar vs PDF - Módulo de Gestión de Clientes
import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, UserCheck, UserX } from 'lucide-react';
import { useClientStore } from '../stores/clientStore';
import { useAuthStore } from '../stores/authStore';
import { hasPermission } from '../config/permissions';
import { showError, showSuccess } from '../lib/toast';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Client } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// SSDLC Touchpoint: Validación de entradas con esquemas Zod
const clientSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido').max(100, 'Nombre muy largo'),
  taxId: z.string().min(1, 'Identificador fiscal es requerido').regex(/^[0-9-]+$/, 'Formato inválido'),
  nit: z.string().optional(),
  nrc: z.string().optional().refine((val) => !val || /^[0-9-]+$/.test(val), 'Formato NRC inválido'),
  giro: z.string().optional(),
  actividadEconomica: z.string().optional(),
  direccionFiscal: z.string().optional(),
  email: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, 'Email inválido'),
  phone: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean()
});

type ClientForm = z.infer<typeof clientSchema>;

export const Clients: React.FC = () => {
  const { user } = useAuthStore();
  const { clients, loading, error, fetchClients, createClient, updateClient, deleteClient } = useClientStore();
  const [createdPassword, setCreatedPassword] = useState<{ email: string; tempPassword: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [clientType, setClientType] = useState<'natural' | 'juridica'>('natural');
  const itemsPerPage = 10;

  const canCreate = user && hasPermission(user.role, 'clientes', 'create');
  const canUpdate = user && hasPermission(user.role, 'clientes', 'update');
  const canDelete = user && hasPermission(user.role, 'clientes', 'delete');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      isActive: true
    }
  });

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Filtrar clientes por término de búsqueda
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.taxId.includes(searchTerm) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenModal = (client?: Client) => {
    setEditingClient(client || null);
    if (client) {
      // Determinar el tipo de cliente basado en si tiene NRC o giro
      const isJuridica = !!(client.nrc || client.giro || client.actividadEconomica);
      setClientType(isJuridica ? 'juridica' : 'natural');

      reset({
        name: client.name,
        taxId: client.taxId,
        nit: client.nit || '',
        nrc: client.nrc || '',
        giro: client.giro || '',
        actividadEconomica: client.actividadEconomica || '',
        direccionFiscal: client.direccionFiscal || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        isActive: client.isActive
      });
    } else {
      setClientType('natural');
      reset({
        name: '',
        taxId: '',
        nit: '',
        nrc: '',
        giro: '',
        actividadEconomica: '',
        direccionFiscal: '',
        email: '',
        phone: '',
        address: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    reset();
  };

  const onSubmit = async (data: ClientForm) => {
    try {
      setFormError(null);
      if (editingClient) {
        await updateClient(editingClient.id, data);
        showSuccess('Cliente actualizado exitosamente');
      } else {
        const creds = await createClient(data);
        if (creds) setCreatedPassword(creds);
        showSuccess('Cliente creado exitosamente');
      }
      handleCloseModal();
    } catch (error: any) {
      setFormError(error.message || 'Error al guardar cliente');
      // NO cerrar modal aquí
    }
  };

  const handleToggleStatus = async (client: Client) => {
    try {
      await updateClient(client.id, { isActive: !client.isActive });
      showSuccess(`Cliente ${!client.isActive ? 'activado' : 'desactivado'} exitosamente`);
    } catch (error: any) {
      showError('Error al cambiar estado del cliente');
    }
  };

  const handleDelete = async (client: Client) => {
    if (window.confirm(`⚠️ ATENCIÓN: ¿Está seguro de ELIMINAR PERMANENTEMENTE el cliente "${client.name}"?\n\nEsta acción NO eliminará sus facturas asociadas (sistema auditable), pero el cliente no podrá acceder al portal.\n\n¿Continuar?`)) {
      try {
        await deleteClient(client.id);
        showSuccess('Cliente eliminado exitosamente');
      } catch (error: any) {
        showError('Error al eliminar cliente');
      }
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Nombre/Razón Social',
      render: (client: Client) => (
        <div>
          <div className="font-medium text-gray-900">{client.name}</div>
          <div className="text-sm text-gray-500">{client.taxId}</div>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Contacto',
      render: (client: Client) => (
        <div>
          <div className="text-sm text-gray-900">{client.email}</div>
          <div className="text-sm text-gray-500">{client.phone}</div>
        </div>
      )
    },
    {
      key: 'address',
      header: 'Dirección',
      render: (client: Client) => (
        <div className="text-sm text-gray-900 max-w-xs truncate">{client.address}</div>
      )
    },
    {
      key: 'isActive',
      header: 'Estado',
      render: (client: Client) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          client.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {client.isActive ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (client: Client) => (
        <div className="flex space-x-2">
          <button
            onClick={() => setViewingClient(client)}
            className="text-blue-600 hover:text-blue-800"
            title="Ver detalle"
          >
            <Eye size={16} />
          </button>
          {canUpdate && (
            <>
              <button
                onClick={() => handleOpenModal(client)}
                className="text-green-600 hover:text-green-800"
                title="Editar"
              >
                <Edit size={16} />
              </button>
            </>
          )}
          {canDelete && (
            <button
              onClick={() => handleDelete(client)}
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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
          <p className="text-gray-600">Administra tu base de clientes</p>
        </div>
        {canCreate && (
          <Button onClick={() => handleOpenModal()}>
            <Plus size={16} className="mr-2" />
            Nuevo Cliente
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
              placeholder="Buscar por nombre, identificador o email..."
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
        data={paginatedClients}
        columns={columns}
        loading={loading}
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage
        }}
        emptyMessage="No se encontraron clientes"
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <p className="text-sm">{formError}</p>
            </div>
          )}

          {/* Selector de tipo de cliente */}
          <div className="border-b pb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Cliente
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setClientType('natural')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  clientType === 'natural'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">Persona Natural</div>
                <div className="text-xs mt-1">Consumidor final, DUI</div>
              </button>
              <button
                type="button"
                onClick={() => setClientType('juridica')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  clientType === 'juridica'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">Persona Jurídica</div>
                <div className="text-xs mt-1">Empresa, NIT, NRC</div>
              </button>
            </div>
          </div>

          {/* Campos comunes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={clientType === 'natural' ? 'Nombre Completo' : 'Razón Social'}
              {...register('name')}
              error={errors.name?.message}
              placeholder={clientType === 'natural' ? 'Juan Pérez' : 'Empresa S.A. de C.V.'}
            />
            <Input
              label={clientType === 'natural' ? 'DUI / NIT' : 'NIT'}
              {...register('taxId')}
              error={errors.taxId?.message}
              placeholder={clientType === 'natural' ? '01234567-8' : '0614-123456-001-1'}
            />
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="correo@ejemplo.com"
            />
            <Input
              label="Teléfono"
              {...register('phone')}
              error={errors.phone?.message}
              placeholder="2222-2222"
            />
          </div>

          <Input
            label="Dirección"
            {...register('address')}
            error={errors.address?.message}
            placeholder="Colonia Escalón, San Salvador"
          />

          {/* Campos adicionales para Persona Jurídica */}
          {clientType === 'juridica' && (
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Información Fiscal (Persona Jurídica)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="NIT (Número de Identificación Tributaria)"
                  {...register('nit')}
                  error={errors.nit?.message}
                  placeholder="0614-123456-001-1"
                  helpText="Requerido para Crédito Fiscal"
                />
                <Input
                  label="NRC (Número de Registro de Contribuyente)"
                  {...register('nrc')}
                  error={errors.nrc?.message}
                  placeholder="12345-6"
                  helpText="Requerido para Crédito Fiscal"
                />
                <Input
                  label="Giro Comercial"
                  {...register('giro')}
                  error={errors.giro?.message}
                  placeholder="Comercio al por menor"
                />
                <Input
                  label="Actividad Económica"
                  {...register('actividadEconomica')}
                  error={errors.actividadEconomica?.message}
                  placeholder="47110 - Venta al por menor"
                />
              </div>
              <Input
                label="Dirección Fiscal"
                {...register('direccionFiscal')}
                error={errors.direccionFiscal?.message}
                placeholder="Dirección registrada en hacienda"
              />
            </div>
          )}

          <div className="flex items-center pt-2">
            <input
              type="checkbox"
              id="isActive"
              {...register('isActive')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Cliente activo
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingClient ? 'Actualizar' : 'Crear'} Cliente
            </Button>
          </div>
        </form>
      </Modal>

      {/* Password reveal modal */}
      <Modal
        isOpen={!!createdPassword}
        onClose={() => setCreatedPassword(null)}
        title="Usuario de Portal creado"
        size="md"
      >
        {createdPassword && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">Comparte estas credenciales solo una vez con el cliente. Por seguridad, no se volverán a mostrar.</p>
            <div className="bg-gray-50 border rounded p-4 space-y-2">
              <div className="text-sm"><strong>Email:</strong> {createdPassword.email}</div>
              <div className="text-sm"><strong>Contraseña temporal:</strong> {createdPassword.tempPassword}</div>
            </div>
          </div>
        )}
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={!!viewingClient}
        onClose={() => setViewingClient(null)}
        title="Detalle del Cliente"
        size="lg"
      >
        {viewingClient && (
          <div className="space-y-4">
            {/* Tipo de Cliente */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Tipo: </span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                (viewingClient.nrc || viewingClient.giro)
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {(viewingClient.nrc || viewingClient.giro) ? 'Persona Jurídica' : 'Persona Natural'}
              </span>
            </div>

            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre/Razón Social</label>
                <p className="mt-1 text-sm text-gray-900">{viewingClient.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Identificador Fiscal (DUI/NIT)</label>
                <p className="mt-1 text-sm text-gray-900">{viewingClient.taxId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{viewingClient.email || 'No especificado'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <p className="mt-1 text-sm text-gray-900">{viewingClient.phone || 'No especificado'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Dirección</label>
              <p className="mt-1 text-sm text-gray-900">{viewingClient.address || 'No especificado'}</p>
            </div>

            {/* Información fiscal (si es persona jurídica) */}
            {(viewingClient.nit || viewingClient.nrc || viewingClient.giro || viewingClient.actividadEconomica || viewingClient.direccionFiscal) && (
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Información Fiscal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewingClient.nit && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">NIT</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingClient.nit}</p>
                    </div>
                  )}
                  {viewingClient.nrc && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">NRC</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingClient.nrc}</p>
                    </div>
                  )}
                  {viewingClient.giro && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Giro Comercial</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingClient.giro}</p>
                    </div>
                  )}
                  {viewingClient.actividadEconomica && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Actividad Económica</label>
                      <p className="mt-1 text-sm text-gray-900">{viewingClient.actividadEconomica}</p>
                    </div>
                  )}
                </div>
                {viewingClient.direccionFiscal && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dirección Fiscal</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingClient.direccionFiscal}</p>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  viewingClient.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {viewingClient.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Registro</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(viewingClient.createdAt).toLocaleDateString('es-SV', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};