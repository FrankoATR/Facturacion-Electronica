// Script de diagnóstico para probar el login
const fetch = require('node-fetch');

async function testLogin() {
  console.log('🔍 Diagnóstico de Login\n');
  
  const baseUrl = 'http://localhost:4000/api';
  const credentials = {
    email: 'admin@example.com',
    password: 'admin1234'
  };
  
  console.log('1️⃣ Verificando que el servidor esté corriendo...');
  try {
    const healthCheck = await fetch(`${baseUrl}/auth/me`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`   Status: ${healthCheck.status} (401 es esperado sin token)`);
    console.log('   ✅ Servidor está respondiendo\n');
  } catch (error) {
    console.error('   ❌ Servidor NO está corriendo:', error.message);
    console.error('   → Ejecuta: cd backend && npm run dev\n');
    return;
  }
  
  console.log('2️⃣ Intentando login...');
  console.log(`   URL: ${baseUrl}/auth/login`);
  console.log(`   Email: ${credentials.email}`);
  console.log(`   Password: ${credentials.password}\n`);
  
  try {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('   Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n   ✅ LOGIN EXITOSO!');
      console.log(`   Token: ${data.token.substring(0, 30)}...`);
      console.log(`   Usuario: ${data.user.name} (${data.user.role})`);
    } else {
      console.log('\n   ❌ LOGIN FALLÓ');
      
      if (response.status === 401) {
        console.log('\n   Posibles causas:');
        console.log('   1. Credenciales incorrectas');
        console.log('   2. Usuario no existe en la BD');
        console.log('   3. Usuario está inactivo (isActive = false)');
        console.log('   4. Hash de contraseña no coincide');
        console.log('\n   Soluciones:');
        console.log('   → Ejecuta: cd backend && npm run prisma:seed');
        console.log('   → Verifica que PostgreSQL esté corriendo');
        console.log('   → Verifica DATABASE_URL en .env');
      } else if (response.status === 429) {
        console.log('\n   ⚠️ Demasiados intentos fallidos');
        console.log('   → Espera 5 minutos o reinicia el backend');
      }
    }
  } catch (error) {
    console.error('\n   ❌ Error al hacer la petición:', error.message);
  }
}

testLogin();

