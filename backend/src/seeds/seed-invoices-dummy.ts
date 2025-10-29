import { PrismaClient, DocumentType } from "@prisma/client";

const prisma = new PrismaClient();

// Dummy clients for testing
const dummyClients = [
  {
    email: "dummy@gmail.com",
    name: "Comercial La Esperanza S.A. de C.V.",
    taxId: "0614-120589-001-3",
    nit: "0614-120589-001-3",
    nrc: "12345-7",
    giro: "Comercio al por menor",
    actividadEconomica: "Venta de productos electrónicos",
    direccionFiscal: "Col. Escalón, Calle Principal #123, San Salvador",
    phone: "+503 2222-3333",
    address: "Col. Escalón, San Salvador",
  },
  {
    email: "dummy2@gmail.com",
    name: "Distribuidora El Progreso S.A. de C.V.",
    taxId: "0614-230690-102-5",
    nit: "0614-230690-102-5",
    nrc: "23456-8",
    giro: "Distribución mayorista",
    actividadEconomica: "Distribución de productos deportivos",
    direccionFiscal: "Zona Industrial, Bodega 45, Soyapango",
    phone: "+503 2333-4444",
    address: "Zona Industrial, Soyapango",
  },
  {
    email: "dummy3@gmail.com",
    name: "Servicios Técnicos del Este S.A. de C.V.",
    taxId: "0614-340791-203-7",
    nit: "0614-340791-203-7",
    nrc: "34567-9",
    giro: "Servicios técnicos",
    actividadEconomica: "Reparación y mantenimiento de bicicletas",
    direccionFiscal: "Blvd. del Hipódromo #789, San Salvador",
    phone: "+503 2444-5555",
    address: "Blvd. del Hipódromo, San Salvador",
  },
];

// Helper to get random element from array
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to get random integer between min and max (inclusive)
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to get random date in the last N days
function randomDateInLastDays(days: number): Date {
  const now = new Date();
  const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime);
}

async function seedInvoices() {
  console.log("🌱 Starting dummy invoice seeding...");
  
  // First, ensure clients exist
  console.log("📝 Creating/updating dummy clients...");
  const clients = [];
  for (const clientData of dummyClients) {
    const client = await prisma.client.upsert({
      where: { taxId: clientData.taxId },
      create: {
        ...clientData,
        status: "ACTIVE",
      },
      update: {
        ...clientData,
      },
    });
    clients.push(client);
    console.log(`   ✓ Client: ${client.name}`);
  }
  
  // Get all products for invoice items
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    take: 50, // Use first 50 products
  });
  
  if (products.length === 0) {
    console.error("❌ No products found! Please run seed-products-adventureworks.ts first.");
    return;
  }
  
  console.log(`📦 Found ${products.length} products to use in invoices`);
  
  // Generate invoices
  const invoiceCount = randomInt(20, 30);
  console.log(`📄 Generating ${invoiceCount} invoices...`);
  
  let created = 0;
  const paymentMethods = ["Efectivo", "Tarjeta", "Transferencia"];
  const documentTypes: DocumentType[] = ["FCF", "CCF"];
  
  for (let i = 0; i < invoiceCount; i++) {
    try {
      const client = randomElement(clients);
      const documentType = randomElement(documentTypes);
      const itemCount = randomInt(1, 5);
      const issuedAt = randomDateInLastDays(90); // Last 3 months
      
      // Generate invoice number
      const invoiceNumber = `INV-${String(Date.now() + i).slice(-8)}`;
      
      // Select random products for this invoice
      const selectedProducts = [];
      for (let j = 0; j < itemCount; j++) {
        selectedProducts.push(randomElement(products));
      }
      
      // Calculate totals
      const items = selectedProducts.map((product, idx) => {
        const quantity = randomInt(1, 3);
        const unitPrice = Number(product.unitPrice);
        const discount = Math.random() > 0.7 ? randomInt(5, 20) : 0; // 30% chance of discount
        const taxRate = Number(product.taxRate);
        
        const baseAmount = unitPrice * quantity;
        const subtotal = baseAmount - discount;
        const taxAmount = (subtotal * taxRate) / 100;
        const total = subtotal + taxAmount;
        
        return {
          productId: product.id,
          description: product.name,
          quantity,
          unitPrice,
          discount,
          taxRate,
          subtotal,
          taxAmount,
          total,
        };
      });
      
      const invoiceSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const invoiceTaxTotal = items.reduce((sum, item) => sum + item.taxAmount, 0);
      const invoiceTotal = invoiceSubtotal + invoiceTaxTotal;
      
      // Create invoice
      const invoice = await prisma.invoice.create({
        data: {
          number: invoiceNumber,
          type: "ELECTRONIC",
          documentType,
          status: "ISSUED",
          clientId: client.id,
          issuedAt,
          paymentMethod: randomElement(paymentMethods),
          notes: Math.random() > 0.5 ? "Gracias por su compra" : null,
          subtotal: invoiceSubtotal,
          taxTotal: invoiceTaxTotal,
          total: invoiceTotal,
          paidTotal: invoiceTotal,
          balance: 0,
          items: {
            create: items,
          },
        },
      });
      
      created++;
      
      if (created % 5 === 0) {
        console.log(`   ✓ Created ${created}/${invoiceCount} invoices...`);
      }
    } catch (error: any) {
      console.error(`❌ Error creating invoice ${i + 1}:`, error.message);
    }
  }
  
  console.log(`✅ Invoice seeding complete!`);
  console.log(`   - Created: ${created} invoices`);
  console.log(`   - Clients: ${clients.length}`);
  console.log(`   - Date range: Last 90 days`);
  console.log(`   - Document types: FCF and CCF mix`);
}

// Run the seeder
seedInvoices()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

