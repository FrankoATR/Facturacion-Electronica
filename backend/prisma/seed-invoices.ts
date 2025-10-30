import { PrismaClient, InvoiceType, InvoiceStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seeder de facturas con clientes dummy...");

  // Crear o obtener clientes dummy
  const dummyClients = [
    { name: "Cliente Dummy 1", taxId: "TAX-DUMMY-001", email: "dummy@gmail.com" },
    { name: "Cliente Dummy 2", taxId: "TAX-DUMMY-002", email: "dummy2@gmail.com" },
    { name: "Cliente Dummy 3", taxId: "TAX-DUMMY-003", email: "dummy3@gmail.com" },
  ];

  const clients = [];
  for (const clientData of dummyClients) {
    const client = await prisma.client.upsert({
      where: { taxId: clientData.taxId },
      update: {
        name: clientData.name,
        email: clientData.email,
        status: "ACTIVE",
      },
      create: {
        name: clientData.name,
        taxId: clientData.taxId,
        email: clientData.email,
        status: "ACTIVE",
      },
    });
    clients.push(client);
  }

  console.log(`✅ ${clients.length} clientes dummy creados/actualizados`);

  // Obtener algunos productos para las facturas
  const products = await prisma.product.findMany({ where: { status: "ACTIVE" }, take: 10 });
  if (products.length === 0) {
    console.error("❌ No hay productos en la base de datos. Ejecuta primero: npm run prisma:seed:products");
    return;
  }

  // Obtener un usuario admin para crear las facturas
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!adminUser) {
    console.error("❌ No hay usuario admin en la base de datos. Ejecuta primero: npm run prisma:seed");
    return;
  }

  // Obtener el próximo número de factura
  const invoiceCount = await prisma.invoice.count();
  
  // Crear facturas de ejemplo
  const invoicesToCreate = [
    // Cliente 1 - Facturas electrónicas
    {
      client: clients[0],
      type: InvoiceType.ELECTRONIC,
      items: [
        { product: products[0], quantity: 2, discount: 0 },
        { product: products[1], quantity: 1, discount: 5.00 },
      ],
    },
    {
      client: clients[0],
      type: InvoiceType.ELECTRONIC,
      items: [
        { product: products[2], quantity: 3, discount: 0 },
      ],
    },
    // Cliente 2 - Mix de facturas
    {
      client: clients[1],
      type: InvoiceType.ELECTRONIC,
      items: [
        { product: products[3], quantity: 1, discount: 0 },
        { product: products[4], quantity: 2, discount: 10.00 },
        { product: products[5], quantity: 1, discount: 0 },
      ],
    },
    {
      client: clients[1],
      type: InvoiceType.TRADITIONAL,
      items: [
        { product: products[6], quantity: 4, discount: 0 },
      ],
    },
    // Cliente 3 - Facturas tradicionales
    {
      client: clients[2],
      type: InvoiceType.TRADITIONAL,
      items: [
        { product: products[7], quantity: 2, discount: 15.00 },
        { product: products[8], quantity: 1, discount: 0 },
      ],
    },
    {
      client: clients[2],
      type: InvoiceType.TRADITIONAL,
      items: [
        { product: products[9], quantity: 3, discount: 0 },
      ],
    },
  ];

  let currentInvoiceNumber = invoiceCount + 1;

  for (const invoiceData of invoicesToCreate) {
    // Calcular totales
    let subtotal = 0;
    let taxTotal = 0;

    const items = invoiceData.items.map((item) => {
      const baseAmount = Number(item.product.unitPrice) * item.quantity;
      const discount = item.discount || 0;
      const itemSubtotal = baseAmount - discount;
      const itemTaxAmount = itemSubtotal * (Number(item.product.taxRate) / 100);
      const itemTotal = itemSubtotal + itemTaxAmount;

      subtotal += itemSubtotal;
      taxTotal += itemTaxAmount;

      return {
        productId: item.product.id,
        description: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.unitPrice,
        discount,
        taxRate: item.product.taxRate,
        subtotal: itemSubtotal,
        taxAmount: itemTaxAmount,
        total: itemTotal,
      };
    });

    const total = subtotal + taxTotal;
    const invoiceNumber = `INV-${String(currentInvoiceNumber).padStart(6, "0")}`;
    currentInvoiceNumber++;

    // Crear la factura con sus items
    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        clientId: invoiceData.client.id,
        type: invoiceData.type,
        status: InvoiceStatus.ISSUED,
        issuedAt: new Date(),
        subtotal,
        taxTotal,
        total,
        paymentMethod: "Efectivo",
        notes: `Factura de prueba para ${invoiceData.client.name}`,
        createdById: adminUser.id,
        items: {
          create: items,
        },
      },
      include: { items: true },
    });

    // Actualizar stock de productos (simular la venta)
    for (const item of invoiceData.items) {
      await prisma.product.update({
        where: { id: item.product.id },
        data: { stock: { decrement: item.quantity } },
      });

      // Crear movimiento de stock
      await prisma.stockMovement.create({
        data: {
          productId: item.product.id,
          quantity: item.quantity,
          type: "OUT",
          createdById: adminUser.id,
          invoiceId: invoice.id,
        },
      });
    }

    console.log(`✅ Factura ${invoiceNumber} creada para ${invoiceData.client.name} - Total: $${total.toFixed(2)}`);
  }

  console.log(`✅ ${invoicesToCreate.length} facturas creadas exitosamente`);
}

main()
  .catch((e) => {
    console.error("❌ Error en seeder de facturas:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

