// SSDLC Touchpoint: Control de acceso basado en roles
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { hasPermission } from '../../config/permissions';

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

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredModule && user && !hasPermission(user.role, requiredModule, requiredAction)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};