// TODO: validar vs PDF - Configuración de permisos por rol según backlog
import { RolePermissions } from '../types';

export const ROLE_PERMISSIONS: RolePermissions = {
  ADMIN: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'clientes', actions: ['read', 'create', 'update', 'delete'] },
    { module: 'inventario', actions: ['read', 'create', 'update', 'delete'] },
    { module: 'facturacion', actions: ['read', 'create', 'update', 'delete'] },
    { module: 'historial', actions: ['read', 'create', 'update', 'delete'] },
    { module: 'reportes', actions: ['read'] },
    { module: 'auditoria', actions: ['read'] },
    { module: 'portal', actions: ['read'] },
    { module: 'usuarios', actions: ['read', 'create', 'update', 'delete'] }
  ],
  SELLER: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'clientes', actions: ['read', 'create', 'update'] },
    { module: 'inventario', actions: ['read'] },
    { module: 'facturacion', actions: ['read', 'create', 'update'] },
    { module: 'historial', actions: ['read'] }
  ],
  ACCOUNTANT: [
    { module: 'reportes', actions: ['read'] },
    { module: 'auditoria', actions: ['read'] },
    { module: 'historial', actions: ['read'] }
  ],
  AUDITOR: [
    { module: 'auditoria', actions: ['read'] }
  ],
  CUSTOMER: [
    { module: 'portal', actions: ['read'] }
  ]
};

export function hasPermission(
  userRole: 'ADMIN' | 'SELLER' | 'ACCOUNTANT' | 'AUDITOR' | 'CUSTOMER',
  module: string,
  action: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  const modulePermission = permissions.find(p => p.module === module);
  return modulePermission?.actions.includes(action as any) || false;
}