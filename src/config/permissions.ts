// TODO: validar vs PDF - Configuración de permisos por rol según backlog
import { RolePermissions } from '../types';

export const ROLE_PERMISSIONS: RolePermissions = {
  administrador: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'clientes', actions: ['read', 'create', 'update', 'delete'] },
    { module: 'inventario', actions: ['read', 'create', 'update', 'delete'] },
    { module: 'facturacion', actions: ['read', 'create', 'update', 'delete'] },
    { module: 'historial', actions: ['read', 'create', 'update', 'delete'] },
    { module: 'reportes', actions: ['read'] },
    { module: 'auditoria', actions: ['read'] },
    { module: 'portal', actions: ['read'] }
  ],
  vendedor: [
    { module: 'dashboard', actions: ['read'] },
    { module: 'clientes', actions: ['read', 'create', 'update'] },
    { module: 'inventario', actions: ['read'] },
    { module: 'facturacion', actions: ['read', 'create', 'update'] },
    { module: 'historial', actions: ['read'] }
  ],
  contador: [
    { module: 'reportes', actions: ['read'] },
    { module: 'auditoria', actions: ['read'] },
    { module: 'historial', actions: ['read'] }
  ],
  auditor: [
    { module: 'auditoria', actions: ['read'] }
  ],
  cliente: [
    { module: 'portal', actions: ['read'] }
  ]
};

export function hasPermission(
  userRole: 'administrador' | 'vendedor' | 'contador' | 'auditor' | 'cliente',
  module: string,
  action: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  const modulePermission = permissions.find(p => p.module === module);
  return modulePermission?.actions.includes(action as any) || false;
}