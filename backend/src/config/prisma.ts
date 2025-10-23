import { PrismaClient } from "@prisma/client";

// Ensure a single PrismaClient instance across hot-reloads in dev
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Configuración para mejorar la estabilidad
    errorFormat: 'pretty',
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handlers
process.on('beforeExit', async () => {
  console.log('🔄 Cerrando conexión a la base de datos...');
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  console.log('🔄 Cerrando conexión a la base de datos...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Cerrando conexión a la base de datos...');
  await prisma.$disconnect();
  process.exit(0);
});


