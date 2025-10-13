// TODO: validar vs PDF - Configuración de permisos por rol según backlog
import { RolePermissions } from '../types';

export const ROLE_PERMISSIONS: RolePermissions = {
  administrador: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'clientes', actions: ['read', 'create', 'update', 'delete'] },
    { module: 'inventario', actions: ['read', 'create', 'update', 'delete'] },
    { module: 'facturacion', actions: ['read', 'create', 'update', 'delete'] },
    { module: 'historial', actions: ['read', 'create', 'update', 'delete'] }
  ],
  vendedor: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'clientes', actions: ['read', 'create', 'update'] },
    { module: 'inventario', actions: ['read'] },
    { module: 'facturacion', actions: ['read', 'create', 'update'] },
    { module: 'historial', actions: ['read'] }
  ]
};

export function hasPermission(
  userRole: 'administrador' | 'vendedor',
  module: string,
  action: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  const modulePermission = permissions.find(p => p.module === module);
  return modulePermission?.actions.includes(action as any) || false;
}