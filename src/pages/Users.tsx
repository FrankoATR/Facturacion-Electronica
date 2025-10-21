import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Check, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { hasPermission } from '../config/permissions';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { apiFetch } from '../lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

const userSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(3, 'Nombre debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['SELLER', 'ACCOUNTANT', 'AUDITOR']),
});

type UserForm = z.infer<typeof userSchema>;

export const Users: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const canCreate = currentUser && currentUser.role === 'administrador';
  const canUpdate = currentUser && currentUser.role === 'administrador';
  const canDelete = currentUser && currentUser.role === 'administrador';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch<{ data: User[] }>('/users');
      setUsers(response.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: UserForm) => {
    try {
      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      await fetchUsers();
      setIsCreateModalOpen(false);
      reset();
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario');
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      await apiFetch(`/users/${userId}/toggle`, {
        method: 'PATCH',
      });
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Error al cambiar estado del usuario');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return;
    
    try {
      await apiFetch(`/users/${userId}`, {
        method: 'DELETE',
      });
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar usuario');
    }
  };

  // Filtrar usuarios
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getRoleName = (role: string) => {
    const roles: { [key: string]: string } = {
      ADMIN: 'Administrador',
      SELLER: 'Vendedor',
      ACCOUNTANT: 'Contador',
      AUDITOR: 'Auditor',
    };
    return roles[role] || role;
  };

  const columns = [
    {
      key: 'name',
      header: 'Nombre',
      render: (user: User) => (
        <div>
          <div className="font-medium text-gray-900">{user.name}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Rol',
      render: (user: User) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {getRoleName(user.role)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Estado',
      render: (user: User) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {user.isActive ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      key: 'lastLogin',
      header: 'Último Acceso',
      render: (user: User) => (
        <div className="text-sm text-gray-900">
          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Nunca'}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (user: User) => (
        <div className="flex space-x-2">
          {canUpdate && (
            <button
              onClick={() => handleToggleStatus(user.id, user.isActive)}
              className={`p-1 rounded ${
                user.isActive ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'
              }`}
              title={user.isActive ? 'Desactivar' : 'Activar'}
            >
              {user.isActive ? <X size={16} /> : <Check size={16} />}
            </button>
          )}
          {canDelete && user.id !== currentUser?.id && (
            <button
              onClick={() => handleDelete(user.id)}
              className="p-1 text-red-600 hover:text-red-800"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  if (!canCreate) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          No tiene permisos para acceder a esta página
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administrar usuarios del sistema</p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} className="mr-2" />
            Nuevo Usuario
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
              placeholder="Buscar por nombre o email..."
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
        data={paginatedUsers}
        columns={columns}
        loading={loading}
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage
        }}
        emptyMessage="No se encontraron usuarios"
      />

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          reset();
        }}
        title="Crear Nuevo Usuario"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
            <input
              {...register('name')}
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Juan Pérez"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              {...register('email')}
              type="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="usuario@ejemplo.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              {...register('password')}
              type="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Rol</label>
            <select
              {...register('role')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="SELLER">Vendedor (solo puede crear clientes)</option>
              <option value="ACCOUNTANT">Contador (acceso a reportes y auditoría)</option>
              <option value="AUDITOR">Auditor (solo acceso a auditoría)</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Los vendedores solo pueden crear y gestionar clientes.
              Los contadores tienen acceso a reportes y auditoría.
              Los auditores solo pueden ver la bitácora de auditoría.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateModalOpen(false);
                reset();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Crear Usuario
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

