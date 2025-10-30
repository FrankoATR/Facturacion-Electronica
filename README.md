# Sistema de Facturación EleCtroZ

## Descripción
Sistema completo de facturación electrónica desarrollado para El Salvador, con funcionalidades avanzadas de gestión empresarial, notificaciones automáticas y cumplimiento fiscal.

## Características Principales

### 🏢 Gestión Empresarial Completa
- **Facturación Electrónica**: Emisión de DTE (Documento Tributario Electrónico) según normativa salvadoreña
  - Factura Normal (DTE tipo 01)
  - Crédito Fiscal / CCF (DTE tipo 03) - Requiere NRC del cliente
- **Facturación Tradicional**: Facturas en formato PDF profesional
- **Gestión de Clientes**: CRUD completo con búsqueda por ID fiscal
  - Soporte para NRC (Número de Registro de Contribuyente) para crédito fiscal
- **Control de Inventario**: Gestión de productos con alertas de stock bajo
  - Vista lista y vista grid con toggle
  - 50 productos de ejemplo basados en Adventure Works
- **Gestión de Usuarios**: Sistema de roles con permisos granulares
- **Portal del Cliente**: Acceso directo para clientes a sus facturas

### 🔔 Sistema de Notificaciones
- **Alertas de Stock**: Notificaciones automáticas cuando el inventario está bajo
- **Notificaciones de Facturación**: Avisos de facturas emitidas y pagos recibidos
- **Correos Automáticos**: Envío de facturas PDF por email al email real del cliente
  - Envío automático solo para facturas electrónicas
  - Validación de email del cliente antes de enviar

### 📊 Reportes y Auditoría
- **Dashboard Mensual**: Métricas de facturación del mes actual (no solo diarias)
- **Reportes de IVA**: Generación automática para cumplimiento fiscal
- **Bitácora de Auditoría**: Registro completo de todas las acciones del sistema
- **Backup de Datos**: Exportación manual de facturas en formato JSON
- **DTE con Firma Digital**: JSON completo con firma digital simulada (SHA256)

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

### Configuración Inicial Completa

#### (WSL bash) Inicialización rápida del proyecto

```bash
# 0) Abrir WSL bash y ubicarse en el directorio del proyecto
cd "/mnt/c/Users/[TU_USUARIO]/Desktop/PP2FDTE/Facturacion-Electronica/backend"

# 1) Configurar variables de entorno (.env)
# Crear archivo .env con la configuración de arriba

# 2) Instalar dependencias del backend
npm install

# 3) Generar cliente Prisma
npm run prisma:generate

# 4) Ejecutar migraciones de base de datos
npm run prisma:migrate

# 5) Ejecutar seeders para datos iniciales
npm run prisma:seed

# 6) Ejecutar backend en modo desarrollo
npm run dev

# (Opcional) Abrir Prisma Studio para ver la base de datos
npm run prisma:studio
```

#### 1. Configurar Base de Datos PostgreSQL

```bash
# Acceder a PostgreSQL (desde WSL o tu terminal)
sudo -u postgres psql

# Crear base de datos
CREATE DATABASE billing_db;

# Crear usuario (opcional)
CREATE USER billing_user WITH PASSWORD 'tu_contraseña_segura';
GRANT ALL PRIVILEGES ON DATABASE billing_db TO billing_user;

# Salir de PostgreSQL
\q
```

#### 2. Configurar Variables de Entorno

**Backend** (`backend/.env`):
```bash
cd backend
# Crear archivo .env con la configuración completa
```

Copia y pega esta configuración en `backend/.env`:
```env
# Configuración de entorno para el backend

# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/billing_db?schema=public"

# JWT Configuration
JWT_SECRET=tu-super-secreto-jwt-key-cambiar-en-produccion-minimo-32-caracteres
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=5000
LOGIN_RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX=200
MAX_LOGIN_ATTEMPTS=20
LOGIN_LOCKOUT_DURATION=900000

# Session Configuration
SESSION_TIMEOUT=1800000

# SMTP Configuration (Office 365)
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=tu-email@ejemplo.com
SMTP_PASS=tu-contraseña
SMTP_FROM=EleCtroZ <noreply@electroz.com>

# Email Sending (habilitar para envío de correos)
SEND_EMAILS=true
```

**Frontend** (`.env` en la raíz):
```bash
# Desde la raíz del proyecto
echo "VITE_API_URL=http://localhost:4000/api" > .env
```

O crea manualmente `.env` en la raíz con:
```env
VITE_API_URL=http://localhost:4000/api
```

#### 3. Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend (desde la raíz del proyecto)
cd ..
npm install
```

#### 4. Configurar Base de Datos y Ejecutar Migraciones

```bash
cd backend

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones (crea las tablas)
npx prisma migrate dev

# Ejecutar seeders para datos iniciales
npm run prisma:seed              # Usuarios iniciales y cliente demo
npm run prisma:seed:products     # 50 productos basados en Adventure Works
npm run prisma:seed:invoices     # Facturas de prueba con clientes dummy
```

#### 5. Iniciar el Proyecto

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

El backend estará disponible en: `http://localhost:4000`

**Terminal 2 - Frontend:**
```bash
# Desde la raíz del proyecto
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

### Credenciales de Acceso Iniciales

Una vez ejecutados los seeders, podrás acceder con:

- **Email**: `admin@example.com`
- **Contraseña**: `admin1234`

## Variables de Entorno

### Backend (backend/.env)
```env
# Configuración de entorno para el backend

# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/billing_db?schema=public"

# JWT Configuration
JWT_SECRET=tu-super-secreto-jwt-key-cambiar-en-produccion-minimo-32-caracteres
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=5000
LOGIN_RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX=200
MAX_LOGIN_ATTEMPTS=20
LOGIN_LOCKOUT_DURATION=900000

# Session Configuration
SESSION_TIMEOUT=1800000

# SMTP Configuration (Office 365)
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=tu-email@ejemplo.com
SMTP_PASS=tu-contraseña
SMTP_FROM=EleCtroZ <noreply@electroz.com>

# Email Sending (habilitar para envío de correos)
SEND_EMAILS=true
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000/api
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
npm run dev                    # Servidor de desarrollo
npm run build                  # Build para producción
npm run start                  # Servidor de producción
npm run prisma:migrate         # Ejecutar migraciones
npm run prisma:generate        # Generar cliente Prisma
npm run prisma:seed            # Ejecutar seeder principal (usuarios y cliente demo)
npm run prisma:seed:products   # Ejecutar seeder de productos (50 productos)
npm run prisma:seed:invoices   # Ejecutar seeder de facturas (facturas de prueba)
npm run prisma:studio          # Abrir Prisma Studio (GUI para la BD)
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
- [x] **Crédito Fiscal**: Soporte completo para CCF (Comprobante de Crédito Fiscal) - tipo DTE 03
  - Requiere NRC (Número de Registro de Contribuyente) del cliente
  - Validación automática antes de emitir
  - Generación de JSON DTE con tipo de documento "03"
- [x] **Búsqueda de Clientes**: Por ID fiscal (NIT/DUI) y nombre
- [x] **Descuentos por Producto**: Aplicación de descuentos en items individuales
- [x] **Cálculo Automático**: IVA del 13% según normativa salvadoreña
- [x] **Envío de Correos**: Facturas PDF enviadas automáticamente a email real del cliente
- [x] **Previsualización de Factura**: Vista previa completa antes de emitir
- [x] **Anulación de DTE**: Anulación con observación obligatoria (no eliminación) para mejor control contable

### ✅ Gestión de Usuarios y Permisos
- [x] **Sistema de Roles**: ADMIN, SELLER, ACCOUNTANT, AUDITOR, CUSTOMER
- [x] **Gestión de Usuarios**: CRUD completo por administradores
- [x] **Control de Acceso**: Permisos granulares por módulo y acción
- [x] **Portal del Cliente**: Administradores pueden vincularse como clientes

### ✅ Gestión de Clientes Mejorada
- [x] **Campo NRC**: Soporte para Número de Registro de Contribuyente
  - Requerido para emitir crédito fiscal
  - Validación de formato
  - Campo opcional para facturas normales

### ✅ Control de Inventario Avanzado
- [x] **Gestión de Productos**: CRUD completo con SKU único
- [x] **Control de Stock**: Ajustes manuales y automáticos
- [x] **Alertas de Stock Bajo**: Notificaciones automáticas (umbral: 5 unidades)
- [x] **Reportes de Stock**: Monitoreo diario automático
- [x] **Vista Grid del Inventario**: Toggle entre vista lista y grid con cards visuales
  - Vista lista tradicional para datos detallados
  - Vista grid con cards para navegación visual rápida
  - Paginación para ambas vistas

### ✅ Sistema de Notificaciones
- [x] **Notificaciones en Tiempo Real**: Bell icon con contador de no leídas
- [x] **Alertas de Stock**: Notificaciones automáticas a administradores
- [x] **Notificaciones de Facturación**: Avisos de facturas emitidas
- [x] **Correos SMTP**: Envío automático con Office365

### ✅ DTE (Documento Tributario Electrónico)
- [x] **JSON DTE Completo**: Generación según normativa salvadoreña
  - Formato oficial con todos los campos requeridos
  - Soporte para Factura Normal (tipo 01) y Crédito Fiscal (tipo 03)
  - **Firma Digital Simulada**: Incluye sello digital SHA256, certificado simulado y fecha de firma
  - Estructura completa de emisor, receptor, cuerpo documento y resumen
- [x] **PDF Profesional**: Facturas con formato mejorado y legible
  - Diseño moderno y profesional
  - Información completa y bien estructurada
  - Compatible con estándares de facturación

### ✅ Dashboard y Reportes
- [x] **Dashboard Principal**: Métricas clave del negocio
  - **Facturación del Mes**: Muestra la facturación total del mes actual (no solo diaria)
  - Total de clientes activos
  - Total de productos activos
  - Facturas emitidas en el mes
  - Facturas pendientes

### ✅ Auditoría y Reportes
- [x] **Bitácora Completa**: Registro de todas las acciones del sistema
- [x] **Reportes de IVA**: Generación automática para cumplimiento fiscal
- [x] **Backup de Datos**: Exportación manual de facturas en JSON
- [x] **Filtros Avanzados**: Búsqueda por fecha, usuario, entidad y acción
- [x] **Anulación con Observación**: DTE se anulan (no se eliminan) con motivo obligatorio

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

## 🆕 Últimas Actualizaciones y Mejoras

### ✅ Correcciones Críticas (2025)
- **🔧 Problemas de Tipos TypeScript**: Solucionados errores de importación de tipos Express
- **🗄️ Configuración de Base de Datos**: Archivo `.env` completo con todas las variables necesarias
- **🔐 Autenticación Mejorada**: Protección contra brute force y gestión de sesiones
- **📧 Sistema de Correos**: Configuración completa de SMTP con Office 365
- **🎯 Flujo de Facturación**: Corrección del proceso DRAFT → ISSUED con generación correcta de DTE
- **🛡️ Seguridad Avanzada**: Headers de seguridad, sanitización de inputs y rate limiting
- **📱 UI/UX Mejorada**: Previsualización de facturas y manejo de errores

### 🚀 Características Técnicas Implementadas
- **DTE Generation**: Creación automática de Documentos Tributarios Electrónicos
- **PDF Generation**: Facturas profesionales con formato EleCtroZ
- **Email Notifications**: Envío automático de facturas por correo
- **Stock Monitoring**: Alertas automáticas de inventario bajo
- **Audit Logging**: Registro completo de todas las operaciones
- **Role-based Access**: Control granular de permisos por módulo
- **Real-time Updates**: Actualización automática de datos en la interfaz

### 📊 Estado del Sistema
- ✅ **Backend**: 100% funcional con Express + TypeScript + Prisma
- ✅ **Frontend**: 100% funcional con React + Zustand + Tailwind
- ✅ **Base de Datos**: PostgreSQL con migraciones y seeders completos
- ✅ **Seguridad**: Autenticación JWT + protección avanzada
- ✅ **Documentación**: DTE según normativa salvadoreña

### 🎯 Próximos Pasos
- Configurar credenciales SMTP reales para envío de correos
- Implementar firma digital avanzada para DTE
- Agregar reportes avanzados de IVA y ventas
- Implementar integración con bancos para pagos

## 🔧 Solución de Problemas

### Error: "Cannot find module '../types/express'"
**Solución**: Los tipos globales se cargan automáticamente. No es necesario importar archivos `.d.ts`.

### Error: "PrismaClientConstructorValidationError: Invalid value undefined for datasource"
**Solución**: Verificar que el archivo `backend/.env` existe y contiene `DATABASE_URL` correcta.

### Error: "Authentication unsuccessful, the user credentials were incorrect"
**Solución**: Configurar credenciales SMTP reales en `backend/.env`:
```env
SMTP_USER=tu-email@outlook.com
SMTP_PASS=tu-contraseña-real
```

### Error: "Invoice must be issued before generating DTE"
**Solución**: Este error ya fue corregido. El flujo DRAFT → ISSUED ahora funciona correctamente.

### Base de datos no se conecta
**Solución**: Verificar que PostgreSQL esté corriendo:
```bash
sudo service postgresql status
sudo -u postgres psql -c "SELECT version();"
```

### Usuario admin no puede acceder
**Solución**: El usuario puede estar bloqueado. Ejecutar en backend:
```bash
node -e "const { bruteForceProtection } = require('./dist/middleware/brute-force'); bruteForceProtection.unblock('admin@example.com');"
```

### Puerto 4000 ya está en uso
**Solución**: Matar el proceso que usa el puerto:
```bash
sudo lsof -ti:4000 | xargs kill -9
```

---

**Desarrollado para EleCtroZ** - Sistema de Facturación Electrónica para El Salvador
**Versión**: 2.0.0 - Actualizado: Octubre 2025