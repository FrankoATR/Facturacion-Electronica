// Página de acceso no autorizado
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export const Unauthorized: React.FC = () => {
  const { user } = useAuthStore();

  const roleHome: Record<string, string> = {
    administrador: '/dashboard',
    vendedor: '/dashboard',
    contador: '/reportes',
    auditor: '/auditoria',
    cliente: '/portal'
  };

  const homePath = user ? roleHome[user.role] ?? '/dashboard' : '/login';
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Acceso No Autorizado
          </h1>
          
          <p className="text-gray-600 mb-8">
            No tienes permisos para acceder a esta sección. Contacta al administrador si necesitas acceso.
          </p>
          
          <Link
            to={homePath}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Ir a inicio
          </Link>
        </div>
      </div>
    </div>
  );
};