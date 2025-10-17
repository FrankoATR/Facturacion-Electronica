# Guía de Contribución

## Sistema de Facturación

Este proyecto implementa un sistema de facturación completo basado en el documento "Plan de Implementación – Sistema de Facturación".

## Estructura del Proyecto

```
src/
├── components/
│   ├── common/          # Componentes reutilizables
│   └── layout/          # Layout y navegación
├── config/              # Configuraciones y permisos
├── pages/               # Páginas principales
├── stores/              # Estado global (Zustand)
├── types/               # Definiciones TypeScript
└── utils/               # Utilidades
```

## Desarrollo

### Requisitos
- Node.js 18+
- npm o yarn

### Instalación
```bash
npm install
npm run dev
```

### Scripts Disponibles
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run preview` - Preview del build
- `npm run lint` - Linting con ESLint

## Módulos Implementados

1. **Dashboard** - Resumen ejecutivo y métricas
2. **Gestión de Clientes** - CRUD completo de clientes
3. **Control de Inventario** - Gestión de productos y stock
4. **Facturación** - Emisión de facturas electrónicas y tradicionales
5. **Historial de Ventas** - Consulta y gestión de ventas

## Roles de Usuario

- **Administrador**: Acceso completo a todos los módulos
- **Vendedor**: Acceso limitado según permisos definidos

## Credenciales de Prueba

- **Admin**: admin@facturacion.com / 123456
- **Vendedor**: vendedor@facturacion.com / 123456

## Seguridad (SSDLC)

El proyecto implementa los Seven Touchpoints de seguridad:
- Control de acceso basado en roles (RBAC)
- Validación de entradas con Zod
- Sanitización básica de inputs
- Protección de rutas
- Manejo seguro de errores

## Tecnologías

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (estado global)
- React Hook Form + Zod
- React Router DOM
- Lucide React (iconos)