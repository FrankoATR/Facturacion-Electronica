import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Productos basados en Adventure Works - 50 productos variados
const products = [
  // Bikes (10 productos)
  { sku: "BK-R50B-15", name: "Road-650 Black, 58", category: "Bikes", unitPrice: 782.99, taxRate: 13, stock: 20, lowStockThreshold: 5 },
  { sku: "BK-R50B-52", name: "Road-650 Black, 48", category: "Bikes", unitPrice: 782.99, taxRate: 13, stock: 15, lowStockThreshold: 5 },
  { sku: "BK-R50R-58", name: "Road-650 Red, 62", category: "Bikes", unitPrice: 782.99, taxRate: 13, stock: 18, lowStockThreshold: 5 },
  { sku: "BK-R89B-58", name: "Road-550-W Yellow, 58", category: "Bikes", unitPrice: 1120.49, taxRate: 13, stock: 12, lowStockThreshold: 5 },
  { sku: "BK-R89R-58", name: "Road-550-W Yellow, 44", category: "Bikes", unitPrice: 1120.49, taxRate: 13, stock: 10, lowStockThreshold: 5 },
  { sku: "BK-M18B-38", name: "Mountain-100 Silver, 38", category: "Bikes", unitPrice: 3399.99, taxRate: 13, stock: 8, lowStockThreshold: 5 },
  { sku: "BK-M18B-42", name: "Mountain-100 Silver, 42", category: "Bikes", unitPrice: 3399.99, taxRate: 13, stock: 6, lowStockThreshold: 5 },
  { sku: "BK-M18S-40", name: "Mountain-100 Silver, 40", category: "Bikes", unitPrice: 3399.99, taxRate: 13, stock: 7, lowStockThreshold: 5 },
  { sku: "BK-M18S-44", name: "Mountain-100 Silver, 44", category: "Bikes", unitPrice: 3399.99, taxRate: 13, stock: 9, lowStockThreshold: 5 },
  { sku: "BK-M18S-48", name: "Mountain-100 Silver, 48", category: "Bikes", unitPrice: 3399.99, taxRate: 13, stock: 11, lowStockThreshold: 5 },

  // Components - Handlebars (8 productos)
  { sku: "HB-R504", name: "HL Road Handlebars", category: "Components", unitPrice: 120.27, taxRate: 13, stock: 30, lowStockThreshold: 5 },
  { sku: "HB-R505", name: "HL Mountain Handlebars", category: "Components", unitPrice: 120.27, taxRate: 13, stock: 25, lowStockThreshold: 5 },
  { sku: "HB-R550", name: "LL Road Handlebars", category: "Components", unitPrice: 44.54, taxRate: 13, stock: 35, lowStockThreshold: 5 },
  { sku: "HB-R551", name: "LL Mountain Handlebars", category: "Components", unitPrice: 44.54, taxRate: 13, stock: 32, lowStockThreshold: 5 },
  { sku: "HB-R956", name: "HL Mountain Frame - Black, 42", category: "Components", unitPrice: 1349.60, taxRate: 13, stock: 12, lowStockThreshold: 5 },
  { sku: "HB-R957", name: "HL Mountain Frame - Silver, 44", category: "Components", unitPrice: 1364.50, taxRate: 13, stock: 14, lowStockThreshold: 5 },
  { sku: "HB-R958", name: "HL Road Frame - Black, 58", category: "Components", unitPrice: 1431.50, taxRate: 13, stock: 10, lowStockThreshold: 5 },
  { sku: "HB-R959", name: "HL Road Frame - Red, 62", category: "Components", unitPrice: 1431.50, taxRate: 13, stock: 8, lowStockThreshold: 5 },

  // Components - Wheels (8 productos)
  { sku: "WL-H001", name: "Road Tire Tube", category: "Components", unitPrice: 3.99, taxRate: 13, stock: 100, lowStockThreshold: 5 },
  { sku: "WL-H002", name: "Mountain Tire Tube", category: "Components", unitPrice: 4.99, taxRate: 13, stock: 90, lowStockThreshold: 5 },
  { sku: "WL-H003", name: "Touring Tire Tube", category: "Components", unitPrice: 4.99, taxRate: 13, stock: 85, lowStockThreshold: 5 },
  { sku: "WL-W001", name: "LL Road Front Wheel", category: "Components", unitPrice: 330.06, taxRate: 13, stock: 20, lowStockThreshold: 5 },
  { sku: "WL-W002", name: "LL Road Rear Wheel", category: "Components", unitPrice: 357.06, taxRate: 13, stock: 22, lowStockThreshold: 5 },
  { sku: "WL-W003", name: "LL Mountain Front Wheel", category: "Components", unitPrice: 249.79, taxRate: 13, stock: 18, lowStockThreshold: 5 },
  { sku: "WL-W004", name: "LL Mountain Rear Wheel", category: "Components", unitPrice: 249.79, taxRate: 13, stock: 16, lowStockThreshold: 5 },
  { sku: "WL-W005", name: "ML Road Front Wheel", category: "Components", unitPrice: 503.47, taxRate: 13, stock: 15, lowStockThreshold: 5 },

  // Clothing - Jerseys (8 productos)
  { sku: "CJ-M001", name: "Men's Bib-Shorts, S", category: "Clothing", unitPrice: 89.99, taxRate: 13, stock: 25, lowStockThreshold: 5 },
  { sku: "CJ-M002", name: "Men's Bib-Shorts, M", category: "Clothing", unitPrice: 89.99, taxRate: 13, stock: 30, lowStockThreshold: 5 },
  { sku: "CJ-M003", name: "Men's Bib-Shorts, L", category: "Clothing", unitPrice: 89.99, taxRate: 13, stock: 28, lowStockThreshold: 5 },
  { sku: "CJ-W001", name: "Women's Mountain Shorts, S", category: "Clothing", unitPrice: 69.99, taxRate: 13, stock: 20, lowStockThreshold: 5 },
  { sku: "CJ-W002", name: "Women's Mountain Shorts, M", category: "Clothing", unitPrice: 69.99, taxRate: 13, stock: 22, lowStockThreshold: 5 },
  { sku: "CJ-W003", name: "Women's Mountain Shorts, L", category: "Clothing", unitPrice: 69.99, taxRate: 13, stock: 18, lowStockThreshold: 5 },
  { sku: "CJ-MJ001", name: "Men's Sports Shorts, M", category: "Clothing", unitPrice: 59.99, taxRate: 13, stock: 35, lowStockThreshold: 5 },
  { sku: "CJ-MJ002", name: "Men's Sports Shorts, L", category: "Clothing", unitPrice: 59.99, taxRate: 13, stock: 40, lowStockThreshold: 5 },

  // Clothing - Jackets (6 productos)
  { sku: "CJ-J001", name: "Men's Cycling Cap", category: "Clothing", unitPrice: 29.99, taxRate: 13, stock: 50, lowStockThreshold: 5 },
  { sku: "CJ-J002", name: "Women's Mountain Shorts, S", category: "Clothing", unitPrice: 69.99, taxRate: 13, stock: 20, lowStockThreshold: 5 },
  { sku: "CJ-J003", name: "AWC Logo Cap", category: "Clothing", unitPrice: 8.99, taxRate: 13, stock: 60, lowStockThreshold: 5 },
  { sku: "CJ-J004", name: "Long-Sleeve Logo Jersey, M", category: "Clothing", unitPrice: 49.99, taxRate: 13, stock: 30, lowStockThreshold: 5 },
  { sku: "CJ-J005", name: "Long-Sleeve Logo Jersey, L", category: "Clothing", unitPrice: 49.99, taxRate: 13, stock: 32, lowStockThreshold: 5 },
  { sku: "CJ-J006", name: "Women's Short-Sleeve Classic Jersey, S", category: "Clothing", unitPrice: 53.99, taxRate: 13, stock: 25, lowStockThreshold: 5 },

  // Accessories (10 productos)
  { sku: "AC-HL001", name: "Bike Wash - Dissolver", category: "Accessories", unitPrice: 7.95, taxRate: 13, stock: 80, lowStockThreshold: 5 },
  { sku: "AC-HL002", name: "Chain", category: "Accessories", unitPrice: 20.24, taxRate: 13, stock: 45, lowStockThreshold: 5 },
  { sku: "AC-HL003", name: "Mountain-400-W Silver, 38", category: "Accessories", unitPrice: 769.49, taxRate: 13, stock: 15, lowStockThreshold: 5 },
  { sku: "AC-HL004", name: "Bike Pump", category: "Accessories", unitPrice: 19.99, taxRate: 13, stock: 55, lowStockThreshold: 5 },
  { sku: "AC-HL005", name: "Bike Stand", category: "Accessories", unitPrice: 159.99, taxRate: 13, stock: 20, lowStockThreshold: 5 },
  { sku: "AC-HL006", name: "Water Bottle - 30 oz.", category: "Accessories", unitPrice: 4.99, taxRate: 13, stock: 120, lowStockThreshold: 5 },
  { sku: "AC-HL007", name: "Mountain Bottle Cage", category: "Accessories", unitPrice: 9.99, taxRate: 13, stock: 75, lowStockThreshold: 5 },
  { sku: "AC-HL008", name: "Road Bottle Cage", category: "Accessories", unitPrice: 8.99, taxRate: 13, stock: 70, lowStockThreshold: 5 },
  { sku: "AC-HL009", name: "Patch Kit/8 Patches", category: "Accessories", unitPrice: 2.29, taxRate: 13, stock: 200, lowStockThreshold: 5 },
  { sku: "AC-HL010", name: "Fender Set - Mountain", category: "Accessories", unitPrice: 21.98, taxRate: 13, stock: 40, lowStockThreshold: 5 },
];

async function main() {
  console.log("🌱 Iniciando seeder de productos...");

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        category: product.category,
        unitPrice: product.unitPrice,
        taxRate: product.taxRate,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        status: "ACTIVE",
      },
      create: {
        sku: product.sku,
        name: product.name,
        category: product.category,
        unitPrice: product.unitPrice,
        taxRate: product.taxRate,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        status: "ACTIVE",
      },
    });
  }

  console.log(`✅ ${products.length} productos creados/actualizados exitosamente`);
}

main()
  .catch((e) => {
    console.error("❌ Error en seeder de productos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

