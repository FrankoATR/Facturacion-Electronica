// TODO: validar vs PDF - Tipos base del sistema
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'administrador' | 'vendedor' | 'contador' | 'auditor' | 'cliente';
  isActive: boolean;
  createdAt: Date;
}

export interface Client {
  id: string;
  name: string;
  taxId: string; // Identificador fiscal
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unitPrice: number;
  taxRate: number; // Impuesto aplicable (porcentaje)
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  number: string;
  type: 'TRADITIONAL' | 'ELECTRONIC' | 'tradicional' | 'electronica';
  status: 'DRAFT' | 'ISSUED' | 'CANCELED' | 'borrador' | 'emitida' | 'anulada';
  items: InvoiceItem[];
  subtotal: number;
  totalTax: number;
  total: number;
  paymentMethod: string;
  notes: string;
  issuedBy: string; // User ID
  issuedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesRecord extends Invoice {
  client: Client;
  issuer: User;
}

// SSDLC Touchpoint: Definición de permisos por rol
export interface Permission {
  module: 'clientes' | 'inventario' | 'facturacion' | 'historial' | 'dashboard' | 'reportes' | 'auditoria' | 'portal';
  actions: ('read' | 'create' | 'update' | 'delete')[];
}

export interface RolePermissions {
  administrador: Permission[];
  vendedor: Permission[];
  contador: Permission[];
  auditor: Permission[];
  cliente: Permission[];
}