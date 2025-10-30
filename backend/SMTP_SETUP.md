# Configuración SMTP - EleCtroZ

## Paso 1: Crear archivo .env

Crea un archivo `.env` en la carpeta `backend` con el siguiente contenido:

```env
# Configuración de Base de Datos
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/billing_db?schema=public"

# Configuración de JWT
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# Configuración del Servidor
PORT=4000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"

# Configuración de Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=5000
LOGIN_RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX=200
MAX_LOGIN_ATTEMPTS=20
LOGIN_LOCKOUT_DURATION=900000

# Configuración de Sesión
SESSION_TIMEOUT=1800000

# ===== CONFIGURACIÓN SMTP =====
# Para Office 365 / Outlook.com
SMTP_HOST="smtp.office365.com"
SMTP_PORT=587

# ⚠️ IMPORTANTE: Reemplaza estos valores con tu información real
SMTP_USER="tu-email@outlook.com"
SMTP_PASS="tu-contraseña-de-aplicación"
SMTP_FROM="EleCtroZ <tu-email@outlook.com>"
```

## Paso 2: Configurar según tu proveedor de email

### Para Office 365 / Outlook.com (TLS - Recomendado):
```env
SMTP_HOST="smtp.office365.com"
SMTP_PORT=587
SMTP_USER="tu-email@outlook.com"
SMTP_PASS="tu-contraseña-de-aplicación"
SMTP_FROM="EleCtroZ <tu-email@outlook.com>"
```

### Para Office 365 / Outlook.com (SSL - Alternativo):
```env
SMTP_HOST="smtp.office365.com"
SMTP_PORT=465
SMTP_USER="tu-email@outlook.com"
SMTP_PASS="tu-contraseña-de-aplicación"
SMTP_FROM="EleCtroZ <tu-email@outlook.com>"
```

### Para Gmail (TLS - Recomendado):
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-contraseña-de-aplicación"
SMTP_FROM="EleCtroZ <tu-email@gmail.com>"
```

### Para Gmail (SSL - Alternativo):
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-contraseña-de-aplicación"
SMTP_FROM="EleCtroZ <tu-email@gmail.com>"
```

### Para otros proveedores:
```env
SMTP_HOST="smtp.tu-proveedor.com"
SMTP_PORT=587
SMTP_USER="tu-usuario"
SMTP_PASS="tu-contraseña"
SMTP_FROM="EleCtroZ <noreply@tu-dominio.com>"
```

## Paso 3: Configurar contraseñas de aplicación

### Para Office 365:
1. Ve a [account.microsoft.com](https://account.microsoft.com)
2. Inicia sesión con tu cuenta
3. Ve a **Seguridad** > **Opciones de seguridad adicionales**
4. En **Contraseñas de aplicación**, haz clic en **Crear una nueva contraseña de aplicación**
5. Selecciona **Correo** y copia la contraseña generada
6. Usa esta contraseña en `SMTP_PASS`

### Para Gmail:
1. Ve a [myaccount.google.com](https://myaccount.google.com)
2. Ve a **Seguridad** > **Verificación en 2 pasos** (debe estar activada)
3. Ve a **Contraseñas de aplicaciones**
4. Selecciona **Correo** y **Otro (nombre personalizado)**
5. Escribe "EleCtroZ" y genera la contraseña
6. Usa esta contraseña en `SMTP_PASS`

## Paso 4: Probar la configuración

1. Inicia el servidor backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Inicia el frontend:
   ```bash
   npm run dev
   ```

3. Ve a la aplicación y navega a **Test SMTP** en el menú
4. Haz clic en "Verificar Estado" para ver la configuración
5. Ingresa un email y haz clic en "Enviar Correo de Prueba"

## Solución de problemas

### Error: "Authentication failed"
- Verifica que el usuario y contraseña sean correctos
- Asegúrate de usar una contraseña de aplicación, no tu contraseña normal
- Verifica que la autenticación en 2 pasos esté activada (Gmail/Outlook)

### Error: "Connection timeout"
- Verifica que el host y puerto sean correctos
- Revisa tu firewall/antivirus
- Intenta con puerto 465 (SSL) en lugar de 587 (TLS)

### Error: "Self signed certificate"
- Esto es normal en desarrollo
- El sistema está configurado para aceptar certificados auto-firmados

## Variables de entorno completas

Aquí tienes todas las variables que necesitas en tu archivo `.env`:

```env
# Base de datos
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/billing_db?schema=public"

# JWT
JWT_SECRET="change-this-to-a-secure-random-string-at-least-32-chars"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# Servidor
PORT=4000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=5000
LOGIN_RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX=200
MAX_LOGIN_ATTEMPTS=20
LOGIN_LOCKOUT_DURATION=900000

# Sesión
SESSION_TIMEOUT=1800000

# SMTP
SMTP_HOST="smtp.office365.com"
SMTP_PORT=587
SMTP_USER="tu-email@outlook.com"
SMTP_PASS="tu-contraseña-de-aplicación"
SMTP_FROM="EleCtroZ <tu-email@outlook.com>"
```

## Funcionalidades de correo automático

### 📧 **Envío automático de facturas electrónicas**
- **Solo las facturas ELECTRÓNICAS** se envían automáticamente por correo
- Las facturas TRADICIONALES no se envían por email (solo se almacenan)
- **Para pruebas**: El correo se envía al mismo email configurado en `SMTP_USER`
- Incluye la factura como archivo adjunto (PDF simulado)
- El envío no bloquea la creación de la factura si falla

### 🔔 **Alertas de stock bajo**
- Se envían automáticamente cuando un producto tiene stock ≤ 5 unidades
- **Para pruebas**: Los correos se envían al email configurado en `SMTP_USER`
- Las notificaciones internas siguen apareciendo para todos los administradores
- Se envían tanto en revisiones masivas como cuando se detecta stock bajo individual

### 🧪 **Página de pruebas SMTP**
- Accesible desde el menú "Test SMTP" (solo administradores)
- Permite verificar la configuración SMTP
- Botón "Usar Email SMTP" para auto-llenar con tu email configurado
- Envía correos de prueba para verificar que todo funciona

## Notas importantes

- **Nunca** subas el archivo `.env` a Git (ya está en `.gitignore`)
- Usa contraseñas de aplicación, no tu contraseña personal
- El sistema funciona sin SMTP configurado, pero no enviará correos
- Los correos se usan para facturas electrónicas y alertas de stock
- **Para pruebas**: Todos los correos (facturas y alertas) se envían al email configurado en `SMTP_USER`
- **Importante**: Solo las facturas ELECTRÓNICAS se envían por correo, las TRADICIONALES no
- **Alertas**: Los correos de stock bajo se envían al `SMTP_USER`, pero las notificaciones internas siguen para todos los admins
