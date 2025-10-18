# 🚀 Instrucciones de Ejecución - Sistema de Facturación Electrónica

## 📋 Requisitos Previos

- **Node.js** v18+ instalado
- **PostgreSQL** instalado y corriendo
- **WSL** (Windows Subsystem for Linux) si estás en Windows
- Usuario PostgreSQL con permisos (por defecto: `postgres` / `postgres`)

## 🔧 Configuración Inicial (Primera vez)

### 1. Clonar o Ubicar el Proyecto

```bash
cd "/mnt/c/Users/luism/Desktop/REPO PP2/Facturacion-Electronica"
```

### 2. Configurar el Backend

#### 2.1 Instalar Dependencias del Backend

```bash
cd backend
npm install
```

#### 2.2 Crear Archivo de Configuración `.env`

Crear el archivo `backend/.env` con el siguiente contenido:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/billing_db?schema=public"
JWT_SECRET="mi-super-secreto-jwt-para-desarrollo-local-12345678901234567890"
PORT=4000
NODE_ENV=development
```

**Nota:** Ajusta `DATABASE_URL` según tu configuración de PostgreSQL.

#### 2.3 Generar Cliente de Prisma

```bash
npm run prisma:generate
```

#### 2.4 Ejecutar Migraciones de Base de Datos

```bash
npm run prisma:migrate
```

Este comando creará:
- La base de datos `billing_db`
- Todas las tablas del esquema
- Los índices y relaciones

#### 2.5 Poblar Base de Datos (Seeder)

```bash
npm run prisma:seed
```

Esto creará los siguientes usuarios de prueba:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@example.com | admin1234 |
| Vendedor | seller@example.com | seller1234 |
| Contador | accountant@example.com | accountant1234 |
| Auditor | auditor@example.com | auditor1234 |
| Cliente | customer@example.com | customer1234 |

### 3. Configurar el Frontend

#### 3.1 Volver al Directorio Raíz

```bash
cd ..
```

#### 3.2 Instalar Dependencias del Frontend

```bash
npm install
```

#### 3.3 Crear Archivo de Configuración `.env`

Crear el archivo `.env` en la raíz del proyecto con:

```env
VITE_API_URL=http://localhost:4000/api
```

## ▶️ Ejecutar el Proyecto

### Opción 1: Ejecutar Backend y Frontend por Separado

#### Terminal 1 - Backend:

```bash
cd backend
npm run dev
```

Verás:
```
╔══════════════════════════════════════════════════════════╗
║  🚀 API Server Running on http://localhost:4000        ║
║  🔒 Environment: development                           ║
║  🛡️  Security Features Enabled                          ║
╚══════════════════════════════════════════════════════════╝
```

#### Terminal 2 - Frontend:

```bash
npm run dev
```

Verás:
```
VITE v5.4.8  ready in XXXXms
➜  Local:   http://localhost:5173/
```

### Opción 2: Comando Único en WSL (Recomendado)

**Terminal 1 - Backend:**
```bash
bash -c 'cd /mnt/c/Users/luism/Desktop/REPO\ PP2/Facturacion-Electronica/backend && npm run dev'
```

**Terminal 2 - Frontend:**
```bash
bash -c 'cd /mnt/c/Users/luism/Desktop/REPO\ PP2/Facturacion-Electronica && npm run dev'
```

## 🌐 Acceder al Sistema

1. **Abrir navegador** en: http://localhost:5173
2. **Iniciar sesión** con alguna de las credenciales de prueba
3. **Explorar los módulos**:
   - Dashboard
   - Gestión de Clientes
   - Control de Inventario
   - Facturación (Electrónica y Tradicional)
   - Historial de Ventas
   - Reportes de IVA
   - Bitácora de Auditoría
   - Portal del Cliente

## 🔍 Verificar que Todo Funciona

### Verificar Backend
```bash
curl http://localhost:4000/health
```

Respuesta esperada:
```json
{"status":"ok","timestamp":"...","uptime":...}
```

### Verificar Frontend
Abrir en navegador: http://localhost:5173

## 🛑 Detener los Servidores

Presionar `Ctrl + C` en cada terminal donde estén corriendo los servidores.

## 📊 Logs de Seguridad

Es **normal** ver logs como estos antes de iniciar sesión:

```
[SECURITY LOW] UNAUTHORIZED_ACCESS {
  user: 'anonymous',
  ip: '::1',
  endpoint: 'GET /',
  details: { reason: 'invalid signature' }
}
```

Son parte del sistema de auditoría y demuestran que la seguridad está funcionando correctamente. Una vez que inicies sesión, estos errores desaparecerán.

## 🔄 Comandos de Mantenimiento

### Resetear Base de Datos
```bash
cd backend
npm run prisma:migrate -- reset
npm run prisma:seed
```

### Regenerar Cliente Prisma (después de cambios en schema)
```bash
cd backend
npm run prisma:generate
```

### Crear Nueva Migración
```bash
cd backend
npm run prisma:migrate -- --name nombre_de_migracion
```

## 🐛 Solución de Problemas

### Error: "Cannot find module '@prisma/client'"
```bash
cd backend
npm run prisma:generate
```

### Error: "Port 4000 already in use"
Detener el proceso que usa el puerto o cambiar `PORT` en `backend/.env`

### Error: "Port 5173 already in use"
Vite automáticamente usará el siguiente puerto disponible (5174, 5175, etc.)

### Error de Conexión a PostgreSQL
1. Verificar que PostgreSQL está corriendo
2. Revisar credenciales en `backend/.env`
3. Verificar que la base de datos existe

## 📦 Estructura del Proyecto

```
Facturacion-Electronica/
├── backend/                 # API REST con Express + Prisma
│   ├── prisma/             # Schema y migraciones
│   ├── src/                # Código fuente
│   ├── .env               # Configuración (NO versionar)
│   └── package.json
├── src/                    # Frontend React + TypeScript
├── .env                   # Configuración frontend (NO versionar)
└── package.json
```

## 🔐 Características de Seguridad Implementadas

- ✅ JWT Authentication con Token Rotation
- ✅ Brute Force Protection
- ✅ Rate Limiting
- ✅ Input Sanitization (XSS, SQL Injection)
- ✅ Security Headers (Helmet + Custom)
- ✅ CORS Configurado
- ✅ Session Timeout & Activity Tracking
- ✅ Security Event Logging
- ✅ Audit Trail con Hashing Encadenado
- ✅ RBAC (Control de Acceso Basado en Roles)

## 📝 Notas Importantes

1. **NO versionar archivos `.env`** - Contienen información sensible
2. **Cambiar `JWT_SECRET`** en producción por uno seguro (mínimo 32 caracteres)
3. **Los logs de seguridad** son normales y muestran que el sistema está protegido
4. **Primera ejecución** puede tardar más mientras se instalan dependencias
5. **PostgreSQL debe estar corriendo** antes de iniciar el backend

## 🆘 Contacto y Soporte

Para problemas o preguntas, revisar:
- `SEGURIDAD-Y-CIBERSEGURIDAD.md` - Documentación de seguridad
- `README.md` - Documentación general del proyecto
- `DEPLOYMENT.md` - Guía de despliegue en producción

---

**Última actualización:** 18 de Octubre de 2025  
**Versión del Sistema:** 1.0.0

