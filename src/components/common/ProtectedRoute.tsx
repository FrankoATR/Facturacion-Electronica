// SSDLC Touchpoint: Control de acceso basado en roles
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { hasPermission } from '../../config/permissions';
import { NavigateFunction, useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModule?: string;
  requiredAction?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredModule,
  requiredAction = 'read'
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const roleHome: Record<string, string> = {
    administrador: '/dashboard',
    vendedor: '/dashboard',
    contador: '/reportes',
    auditor: '/auditoria',
    cliente: '/portal'
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredModule && user && !hasPermission(user.role, requiredModule, requiredAction)) {
    // En vez de dejar al usuario en un callejón sin salida, redirige a su home
    return <Navigate to={roleHome[user.role] ?? '/unauthorized'} replace />;
  }

  return <>{children}</>;
};