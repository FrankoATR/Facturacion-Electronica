# Sistema de Facturación EleCtroZ

## Descripción
Sistema completo de facturación electrónica desarrollado para El Salvador, con funcionalidades avanzadas de gestión empresarial, notificaciones automáticas y cumplimiento fiscal.

## Características Principales

### 🏢 Gestión Empresarial Completa
- **Facturación Electrónica**: Emisión de DTE (Documento Tributario Electrónico) según normativa salvadoreña
- **Gestión de Clientes**: CRUD completo con búsqueda por ID fiscal
- **Control de Inventario**: Gestión de productos con alertas de stock bajo
- **Gestión de Usuarios**: Sistema de roles con permisos granulares
- **Portal del Cliente**: Acceso directo para clientes a sus facturas

### 🔔 Sistema de Notificaciones
- **Alertas de Stock**: Notificaciones automáticas cuando el inventario está bajo
- **Notificaciones de Facturación**: Avisos de facturas emitidas y pagos recibidos
- **Correos Automáticos**: Envío de facturas PDF por email a clientes

### 📊 Reportes y Auditoría
- **Reportes de IVA**: Generación automática para cumplimiento fiscal
- **Bitácora de Auditoría**: Registro completo de todas las acciones del sistema
- **Backup de Datos**: Exportación manual de facturas en formato JSON

### 🛡️ Seguridad Avanzada
- **Autenticación JWT**: Tokens seguros con rotación automática
- **Rate Limiting**: Protección contra ataques DDoS
- **Auditoría Completa**: Registro de todas las acciones de usuarios
- **Validación Robusta**: Sanitización de entradas y validación de datos

## Arquitectura del Sistema

### Frontend (React + TypeScript)
- **React 18** con TypeScript y Vite
- **Zustand** para gestión de estado global
- **React Hook Form + Zod** para validación de formularios
- **Tailwind CSS** para estilos modernos
- **React Router** con protección por roles
- **React Toastify** para notificaciones

### Backend (Node.js + Express)
- **Express.js** con TypeScript
- **Prisma ORM** con PostgreSQL
- **JWT** para autenticación
- **Nodemailer** para envío de correos
- **node-cron** para tareas programadas
- **Helmet** para seguridad HTTP

### Base de Datos
- **PostgreSQL** como base de datos principal
- **Prisma** para migraciones y gestión de esquemas
- **Auditoría automática** en todas las tablas

## Roles de Usuario

### 👑 Administrador (ADMIN)
- Acceso completo a todos los módulos
- Gestión de usuarios y roles
- Configuración del sistema
- Portal de cliente (puede vincularse como cliente)
- Reportes y auditoría

### 💼 Vendedor (SELLER)
- Gestión de clientes
- Control de inventario (solo lectura)
- Emisión de facturas
- Historial de ventas

### 📊 Contador (ACCOUNTANT)
- Reportes de IVA
- Bitácora de auditoría
- Historial de ventas

### 🔍 Auditor (AUDITOR)
- Solo acceso a bitácora de auditoría

### 👤 Cliente (CUSTOMER)
- Portal del cliente
- Visualización de facturas

## Estructura del Proyecto

```
├── src/                          # Frontend React
│   ├── components/
│   │   ├── common/              # Componentes reutilizables
│   │   └── layout/              # Layout y navegación
│   ├── config/                  # Configuraciones y permisos
│   ├── pages/                   # Páginas principales
│   ├── stores/                  # Estado global (Zustand)
│   ├── types/                   # Definiciones TypeScript
│   └── lib/                     # Utilidades y helpers
├── backend/                     # Backend Node.js
│   ├── src/
│   │   ├── modules/             # Módulos del sistema
│   │   │   ├── auth/           # Autenticación
│   │   │   ├── clients/        # Gestión de clientes
│   │   │   ├── products/       # Control de inventario
│   │   │   ├── invoices/       # Facturación
│   │   │   ├── users/          # Gestión de usuarios
│   │   │   ├── notifications/  # Sistema de notificaciones
│   │   │   ├── email/          # Envío de correos
│   │   │   └── dte/            # Formato DTE
│   │   ├── web/                # Rutas y middleware
│   │   ├── common/             # Utilidades comunes
│   │   └── config/             # Configuraciones
│   ├── prisma/                 # Esquemas y migraciones
│   └── package.json
├── package.json                 # Frontend dependencies
└── README.md
```

## Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### Configuración del Backend

```bash
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Ejecutar migraciones
npx prisma migrate dev

# Iniciar servidor de desarrollo
npm run dev
```

### Configuración del Frontend

```bash
npm install
npm run dev
```

## Variables de Entorno

### Backend (.env)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/billing_db"
NODE_ENV=development
PORT=4000
JWT_SECRET=tu-jwt-secret-muy-seguro
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173

# SMTP para correos
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=tu-email@ejemplo.com
SMTP_PASS=tu-contraseña
SMTP_FROM="EleCtroZ <noreply@electroz.com>"

# Rate Limiting
RATE_LIMIT_MAX=5000
LOGIN_RATE_LIMIT_MAX=200
MAX_LOGIN_ATTEMPTS=20
```

## Scripts Disponibles

### Frontend
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
npm run lint         # Linting del código
```

### Backend
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run start        # Servidor de producción
npm run prisma:migrate    # Ejecutar migraciones
npm run prisma:generate   # Generar cliente Prisma
npm run prisma:studio     # Abrir Prisma Studio
```

## Credenciales de Acceso

### Administrador Principal
- **Email**: `admin@example.com`
- **Contraseña**: `admin1234`

### Usuarios de Prueba
Los usuarios adicionales se pueden crear desde el módulo de "Gestión de Usuarios" (solo administradores).

## Funcionalidades Implementadas

### ✅ Sistema Completo de Facturación
- [x] **Facturación Electrónica**: Emisión de DTE según normativa salvadoreña
- [x] **Facturación Tradicional**: Facturas en formato PDF profesional
- [x] **Búsqueda de Clientes**: Por ID fiscal (NIT/DUI) y nombre
- [x] **Descuentos por Producto**: Aplicación de descuentos en items individuales
- [x] **Cálculo Automático**: IVA del 13% según normativa salvadoreña
- [x] **Envío de Correos**: Facturas PDF enviadas automáticamente a clientes

### ✅ Gestión de Usuarios y Permisos
- [x] **Sistema de Roles**: ADMIN, SELLER, ACCOUNTANT, AUDITOR, CUSTOMER
- [x] **Gestión de Usuarios**: CRUD completo por administradores
- [x] **Control de Acceso**: Permisos granulares por módulo y acción
- [x] **Portal del Cliente**: Administradores pueden vincularse como clientes

### ✅ Control de Inventario Avanzado
- [x] **Gestión de Productos**: CRUD completo con SKU único
- [x] **Control de Stock**: Ajustes manuales y automáticos
- [x] **Alertas de Stock Bajo**: Notificaciones automáticas (umbral: 5 unidades)
- [x] **Reportes de Stock**: Monitoreo diario automático

### ✅ Sistema de Notificaciones
- [x] **Notificaciones en Tiempo Real**: Bell icon con contador de no leídas
- [x] **Alertas de Stock**: Notificaciones automáticas a administradores
- [x] **Notificaciones de Facturación**: Avisos de facturas emitidas
- [x] **Correos SMTP**: Envío automático con Office365

### ✅ Auditoría y Reportes
- [x] **Bitácora Completa**: Registro de todas las acciones del sistema
- [x] **Reportes de IVA**: Generación automática para cumplimiento fiscal
- [x] **Backup de Datos**: Exportación manual de facturas en JSON
- [x] **Filtros Avanzados**: Búsqueda por fecha, usuario, entidad y acción

### ✅ Seguridad y Performance
- [x] **Autenticación JWT**: Tokens seguros con rotación automática
- [x] **Rate Limiting**: Protección contra ataques DDoS (5000 req/15min)
- [x] **Validación Robusta**: Sanitización de entradas y validación de datos
- [x] **Auditoría de Seguridad**: Registro de intentos de acceso y acciones

## Características Técnicas Avanzadas

### 🔧 Tecnologías Implementadas
- **Frontend**: React 18 + TypeScript + Vite + Zustand + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Autenticación**: JWT con refresh tokens
- **Base de Datos**: PostgreSQL con auditoría automática
- **Email**: Nodemailer con Office365 SMTP
- **Tareas Programadas**: node-cron para monitoreo de stock
- **Notificaciones**: Sistema en tiempo real con React Toastify

### 🛡️ Seguridad Implementada
- **Control de Acceso**: RBAC (Role-Based Access Control)
- **Rate Limiting**: Protección contra ataques DDoS
- **Sanitización**: Validación y sanitización de todas las entradas
- **Auditoría**: Registro completo de acciones y accesos
- **Headers de Seguridad**: Helmet.js para protección HTTP
- **CORS**: Configuración segura para desarrollo y producción

### 📊 Funcionalidades de Negocio
- **DTE El Salvador**: Formato JSON según normativa fiscal
- **IVA Automático**: Cálculo del 13% según legislación salvadoreña
- **Stock Management**: Control automático con alertas
- **Backup Manual**: Exportación de datos en formato JSON
- **Portal Cliente**: Acceso directo para clientes a sus facturas

## Configuración de Producción

### Variables de Entorno Requeridas
```env
# Base de Datos
DATABASE_URL="postgresql://usuario:contraseña@host:puerto/bd"

# JWT
JWT_SECRET="clave-secreta-muy-segura-minimo-32-caracteres"
JWT_EXPIRES_IN="24h"

# SMTP (Opcional)
SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_USER="tu-email@empresa.com"
SMTP_PASS="tu-contraseña"

# Rate Limiting
RATE_LIMIT_MAX=5000
LOGIN_RATE_LIMIT_MAX=200
MAX_LOGIN_ATTEMPTS=20
```

### Comandos de Despliegue
```bash
# Backend
cd backend
npm install
npx prisma migrate deploy
npm run build
npm start

# Frontend
npm install
npm run build
# Servir archivos estáticos con nginx/apache
```

## Soporte y Mantenimiento

### Monitoreo
- **Logs de Auditoría**: Todas las acciones se registran automáticamente
- **Alertas de Stock**: Notificaciones automáticas diarias
- **Rate Limiting**: Protección automática contra abuso
- **Health Checks**: Endpoints para monitoreo del sistema

### Backup y Recuperación
- **Backup Manual**: Exportación de facturas desde el dashboard
- **Migraciones**: Prisma maneja las migraciones de base de datos
- **Auditoría**: Registro completo para recuperación forense

---

**Desarrollado para EleCtroZ** - Sistema de Facturación Electrónica para El Salvador