# Guía de Despliegue - Sistema de Facturación

## Despliegue Local

### Requisitos
- Node.js 18 o superior
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/EverthMartinez3002/Frontend_PP2.git
cd Frontend_PP2

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## Despliegue en Producción

### Netlify
1. Conectar repositorio de GitHub
2. Configurar build command: `npm run build`
3. Configurar publish directory: `dist`
4. Deploy automático en cada push

### Vercel
1. Importar proyecto desde GitHub
2. Configuración automática detectada
3. Deploy automático configurado

### GitHub Pages
```bash
# Build del proyecto
npm run build

# Configurar en Settings > Pages
# Source: Deploy from a branch
# Branch: gh-pages (crear si no existe)
```

## Variables de Entorno

Para producción, configurar:
```env
VITE_APP_TITLE=Sistema de Facturación
VITE_API_URL=https://api.tu-dominio.com
```

## Configuración de Servidor

### Nginx
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/sistema-facturacion/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Apache
```apache
<VirtualHost *:80>
    ServerName tu-dominio.com
    DocumentRoot /var/www/sistema-facturacion/dist
    
    <Directory /var/www/sistema-facturacion/dist>
        Options -Indexes
        AllowOverride All
        Require all granted
    </Directory>
    
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</VirtualHost>
```

## Monitoreo y Logs

### Configuración de Analytics
- Google Analytics
- Hotjar para UX
- Sentry para error tracking

### Performance
- Lighthouse CI
- Web Vitals monitoring
- Bundle analyzer

## Seguridad en Producción

### Headers de Seguridad
```
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### HTTPS
- Certificado SSL/TLS obligatorio
- Redirect HTTP a HTTPS
- HSTS headers

## Backup y Recuperación

### Base de Datos (cuando se integre)
- Backup automático diario
- Retention de 30 días
- Pruebas de restauración mensuales

### Código
- Repositorio Git como backup
- Tags para releases
- Branches de desarrollo y producción