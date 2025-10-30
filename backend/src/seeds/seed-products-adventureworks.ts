import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// AdventureWorks-inspired product data
const products = [
  // Bikes - Mountain
  { sku: "BK-M18S-38", name: "Mountain-200 Silver, 38", category: "Bikes - Mountain", unitPrice: 2319.99, stock: 15, taxRate: 13.00 },
  { sku: "BK-M18S-42", name: "Mountain-200 Silver, 42", category: "Bikes - Mountain", unitPrice: 2319.99, stock: 12, taxRate: 13.00 },
  { sku: "BK-M18S-46", name: "Mountain-200 Silver, 46", category: "Bikes - Mountain", unitPrice: 2319.99, stock: 8, taxRate: 13.00 },
  { sku: "BK-M18B-38", name: "Mountain-200 Black, 38", category: "Bikes - Mountain", unitPrice: 2294.99, stock: 10, taxRate: 13.00 },
  { sku: "BK-M18B-42", name: "Mountain-200 Black, 42", category: "Bikes - Mountain", unitPrice: 2294.99, stock: 14, taxRate: 13.00 },
  { sku: "BK-M18B-46", name: "Mountain-200 Black, 46", category: "Bikes - Mountain", unitPrice: 2294.99, stock: 7, taxRate: 13.00 },
  { sku: "BK-M38S-38", name: "Mountain-300 Silver, 38", category: "Bikes - Mountain", unitPrice: 1079.99, stock: 20, taxRate: 13.00 },
  { sku: "BK-M38S-42", name: "Mountain-300 Silver, 42", category: "Bikes - Mountain", unitPrice: 1079.99, stock: 18, taxRate: 13.00 },
  { sku: "BK-M38B-38", name: "Mountain-300 Black, 38", category: "Bikes - Mountain", unitPrice: 1079.99, stock: 16, taxRate: 13.00 },
  { sku: "BK-M38B-42", name: "Mountain-300 Black, 42", category: "Bikes - Mountain", unitPrice: 1079.99, stock: 22, taxRate: 13.00 },
  
  // Bikes - Road
  { sku: "BK-R19B-44", name: "Road-150 Red, 44", category: "Bikes - Road", unitPrice: 3578.27, stock: 5, taxRate: 13.00 },
  { sku: "BK-R19B-48", name: "Road-150 Red, 48", category: "Bikes - Road", unitPrice: 3578.27, stock: 4, taxRate: 13.00 },
  { sku: "BK-R19B-52", name: "Road-150 Red, 52", category: "Bikes - Road", unitPrice: 3578.27, stock: 6, taxRate: 13.00 },
  { sku: "BK-R19B-56", name: "Road-150 Red, 56", category: "Bikes - Road", unitPrice: 3578.27, stock: 3, taxRate: 13.00 },
  { sku: "BK-R68R-44", name: "Road-350-W Yellow, 44", category: "Bikes - Road", unitPrice: 1700.99, stock: 12, taxRate: 13.00 },
  { sku: "BK-R68R-48", name: "Road-350-W Yellow, 48", category: "Bikes - Road", unitPrice: 1700.99, stock: 11, taxRate: 13.00 },
  { sku: "BK-R68Y-42", name: "Road-350-W Yellow, 42", category: "Bikes - Road", unitPrice: 1700.99, stock: 9, taxRate: 13.00 },
  { sku: "BK-R68Y-48", name: "Road-350-W Yellow, 48", category: "Bikes - Road", unitPrice: 1700.99, stock: 13, taxRate: 13.00 },
  
  // Bikes - Touring
  { sku: "BK-T79U-46", name: "Touring-1000 Blue, 46", category: "Bikes - Touring", unitPrice: 2384.07, stock: 8, taxRate: 13.00 },
  { sku: "BK-T79U-50", name: "Touring-1000 Blue, 50", category: "Bikes - Touring", unitPrice: 2384.07, stock: 7, taxRate: 13.00 },
  { sku: "BK-T79U-54", name: "Touring-1000 Blue, 54", category: "Bikes - Touring", unitPrice: 2384.07, stock: 6, taxRate: 13.00 },
  { sku: "BK-T79Y-46", name: "Touring-1000 Yellow, 46", category: "Bikes - Touring", unitPrice: 2384.07, stock: 10, taxRate: 13.00 },
  { sku: "BK-T79Y-50", name: "Touring-1000 Yellow, 50", category: "Bikes - Touring", unitPrice: 2384.07, stock: 9, taxRate: 13.00 },
  { sku: "BK-T44U-60", name: "Touring-2000 Blue, 60", category: "Bikes - Touring", unitPrice: 1214.85, stock: 15, taxRate: 13.00 },
  
  // Components - Wheels
  { sku: "WH-001", name: "HL Mountain Front Wheel", category: "Components - Wheels", unitPrice: 209.99, stock: 35, taxRate: 13.00 },
  { sku: "WH-002", name: "HL Mountain Rear Wheel", category: "Components - Wheels", unitPrice: 209.99, stock: 32, taxRate: 13.00 },
  { sku: "WH-003", name: "HL Road Front Wheel", category: "Components - Wheels", unitPrice: 229.99, stock: 28, taxRate: 13.00 },
  { sku: "WH-004", name: "HL Road Rear Wheel", category: "Components - Wheels", unitPrice: 229.99, stock: 30, taxRate: 13.00 },
  { sku: "WH-005", name: "ML Mountain Front Wheel", category: "Components - Wheels", unitPrice: 299.99, stock: 25, taxRate: 13.00 },
  { sku: "WH-006", name: "ML Mountain Rear Wheel", category: "Components - Wheels", unitPrice: 299.99, stock: 24, taxRate: 13.00 },
  { sku: "WH-007", name: "ML Road Front Wheel", category: "Components - Wheels", unitPrice: 319.99, stock: 22, taxRate: 13.00 },
  { sku: "WH-008", name: "ML Road Rear Wheel", category: "Components - Wheels", unitPrice: 319.99, stock: 20, taxRate: 13.00 },
  
  // Components - Brakes
  { sku: "BR-001", name: "Front Brakes", category: "Components - Brakes", unitPrice: 106.50, stock: 45, taxRate: 13.00 },
  { sku: "BR-002", name: "Rear Brakes", category: "Components - Brakes", unitPrice: 106.50, stock: 42, taxRate: 13.00 },
  { sku: "BR-003", name: "HL Mountain Front Brake", category: "Components - Brakes", unitPrice: 89.99, stock: 38, taxRate: 13.00 },
  { sku: "BR-004", name: "HL Mountain Rear Brake", category: "Components - Brakes", unitPrice: 89.99, stock: 40, taxRate: 13.00 },
  { sku: "BR-005", name: "ML Road Front Brake", category: "Components - Brakes", unitPrice: 129.99, stock: 30, taxRate: 13.00 },
  { sku: "BR-006", name: "ML Road Rear Brake", category: "Components - Brakes", unitPrice: 129.99, stock: 28, taxRate: 13.00 },
  
  // Components - Chains
  { sku: "CH-001", name: "Chain", category: "Components - Chains", unitPrice: 20.24, stock: 80, taxRate: 13.00 },
  { sku: "CH-002", name: "Chain Stays", category: "Components - Chains", unitPrice: 28.99, stock: 65, taxRate: 13.00 },
  { sku: "CH-003", name: "HL Mountain Chain", category: "Components - Chains", unitPrice: 35.99, stock: 55, taxRate: 13.00 },
  { sku: "CH-004", name: "ML Road Chain", category: "Components - Chains", unitPrice: 45.99, stock: 50, taxRate: 13.00 },
  
  // Accessories - Helmets
  { sku: "HL-H001", name: "Sport-100 Helmet, Red", category: "Accessories - Helmets", unitPrice: 34.99, stock: 60, taxRate: 13.00 },
  { sku: "HL-H002", name: "Sport-100 Helmet, Blue", category: "Accessories - Helmets", unitPrice: 34.99, stock: 58, taxRate: 13.00 },
  { sku: "HL-H003", name: "Sport-100 Helmet, Black", category: "Accessories - Helmets", unitPrice: 34.99, stock: 62, taxRate: 13.00 },
  { sku: "HL-H004", name: "Mountain Bike Socks, M", category: "Accessories - Helmets", unitPrice: 9.50, stock: 100, taxRate: 13.00 },
  { sku: "HL-H005", name: "Mountain Bike Socks, L", category: "Accessories - Helmets", unitPrice: 9.50, stock: 95, taxRate: 13.00 },
  
  // Accessories - Bottles
  { sku: "AC-B001", name: "Water Bottle - 30 oz.", category: "Accessories - Bottles", unitPrice: 4.99, stock: 150, taxRate: 13.00 },
  { sku: "AC-B002", name: "Mountain Bottle Cage", category: "Accessories - Bottles", unitPrice: 9.99, stock: 120, taxRate: 13.00 },
  { sku: "AC-B003", name: "Road Bottle Cage", category: "Accessories - Bottles", unitPrice: 8.99, stock: 110, taxRate: 13.00 },
  { sku: "AC-B004", name: "Hydration Pack - 70 oz.", category: "Accessories - Bottles", unitPrice: 54.99, stock: 40, taxRate: 13.00 },
  
  // Accessories - Locks
  { sku: "AC-L001", name: "Cable Lock", category: "Accessories - Locks", unitPrice: 25.00, stock: 75, taxRate: 13.00 },
  { sku: "AC-L002", name: "U-Lock", category: "Accessories - Locks", unitPrice: 49.99, stock: 50, taxRate: 13.00 },
  { sku: "AC-L003", name: "Chain Lock", category: "Accessories - Locks", unitPrice: 39.99, stock: 45, taxRate: 13.00 },
  
  // Accessories - Lights
  { sku: "AC-LT01", name: "Headlights - Dual-Beam", category: "Accessories - Lights", unitPrice: 44.99, stock: 55, taxRate: 13.00 },
  { sku: "AC-LT02", name: "Taillights - Battery-Powered", category: "Accessories - Lights", unitPrice: 13.99, stock: 70, taxRate: 13.00 },
  { sku: "AC-LT03", name: "Front Light", category: "Accessories - Lights", unitPrice: 29.99, stock: 60, taxRate: 13.00 },
  { sku: "AC-LT04", name: "Rear Light", category: "Accessories - Lights", unitPrice: 19.99, stock: 65, taxRate: 13.00 },
  
  // Clothing - Jerseys
  { sku: "CL-J001-S", name: "Long-Sleeve Logo Jersey, S", category: "Clothing - Jerseys", unitPrice: 49.99, stock: 30, taxRate: 13.00 },
  { sku: "CL-J001-M", name: "Long-Sleeve Logo Jersey, M", category: "Clothing - Jerseys", unitPrice: 49.99, stock: 35, taxRate: 13.00 },
  { sku: "CL-J001-L", name: "Long-Sleeve Logo Jersey, L", category: "Clothing - Jerseys", unitPrice: 49.99, stock: 32, taxRate: 13.00 },
  { sku: "CL-J001-XL", name: "Long-Sleeve Logo Jersey, XL", category: "Clothing - Jerseys", unitPrice: 49.99, stock: 28, taxRate: 13.00 },
  { sku: "CL-J002-S", name: "Short-Sleeve Classic Jersey, S", category: "Clothing - Jerseys", unitPrice: 53.99, stock: 40, taxRate: 13.00 },
  { sku: "CL-J002-M", name: "Short-Sleeve Classic Jersey, M", category: "Clothing - Jerseys", unitPrice: 53.99, stock: 42, taxRate: 13.00 },
  { sku: "CL-J002-L", name: "Short-Sleeve Classic Jersey, L", category: "Clothing - Jerseys", unitPrice: 53.99, stock: 38, taxRate: 13.00 },
  { sku: "CL-J002-XL", name: "Short-Sleeve Classic Jersey, XL", category: "Clothing - Jerseys", unitPrice: 53.99, stock: 35, taxRate: 13.00 },
  
  // Clothing - Shorts
  { sku: "CL-S001-S", name: "Men's Bib-Shorts, S", category: "Clothing - Shorts", unitPrice: 89.99, stock: 25, taxRate: 13.00 },
  { sku: "CL-S001-M", name: "Men's Bib-Shorts, M", category: "Clothing - Shorts", unitPrice: 89.99, stock: 28, taxRate: 13.00 },
  { sku: "CL-S001-L", name: "Men's Bib-Shorts, L", category: "Clothing - Shorts", unitPrice: 89.99, stock: 22, taxRate: 13.00 },
  { sku: "CL-S002-S", name: "Women's Mountain Shorts, S", category: "Clothing - Shorts", unitPrice: 69.99, stock: 30, taxRate: 13.00 },
  { sku: "CL-S002-M", name: "Women's Mountain Shorts, M", category: "Clothing - Shorts", unitPrice: 69.99, stock: 32, taxRate: 13.00 },
  { sku: "CL-S002-L", name: "Women's Mountain Shorts, L", category: "Clothing - Shorts", unitPrice: 69.99, stock: 27, taxRate: 13.00 },
  
  // Clothing - Gloves
  { sku: "CL-G001-S", name: "Full-Finger Gloves, S", category: "Clothing - Gloves", unitPrice: 37.99, stock: 45, taxRate: 13.00 },
  { sku: "CL-G001-M", name: "Full-Finger Gloves, M", category: "Clothing - Gloves", unitPrice: 37.99, stock: 50, taxRate: 13.00 },
  { sku: "CL-G001-L", name: "Full-Finger Gloves, L", category: "Clothing - Gloves", unitPrice: 37.99, stock: 42, taxRate: 13.00 },
  { sku: "CL-G002-S", name: "Half-Finger Gloves, S", category: "Clothing - Gloves", unitPrice: 24.49, stock: 55, taxRate: 13.00 },
  { sku: "CL-G002-M", name: "Half-Finger Gloves, M", category: "Clothing - Gloves", unitPrice: 24.49, stock: 58, taxRate: 13.00 },
  { sku: "CL-G002-L", name: "Half-Finger Gloves, L", category: "Clothing - Gloves", unitPrice: 24.49, stock: 52, taxRate: 13.00 },
  
  // Additional accessories
  { sku: "AC-P001", name: "Patch Kit/8 Patches", category: "Accessories - Maintenance", unitPrice: 2.29, stock: 200, taxRate: 13.00 },
  { sku: "AC-P002", name: "Tire Pump", category: "Accessories - Maintenance", unitPrice: 18.99, stock: 80, taxRate: 13.00 },
  { sku: "AC-P003", name: "Mini Pump", category: "Accessories - Maintenance", unitPrice: 12.99, stock: 90, taxRate: 13.00 },
  { sku: "AC-P004", name: "Multi-Tool", category: "Accessories - Maintenance", unitPrice: 24.99, stock: 70, taxRate: 13.00 },
  { sku: "AC-P005", name: "Bike Wash - Dissolver", category: "Accessories - Maintenance", unitPrice: 7.95, stock: 100, taxRate: 13.00 },
];

async function seedProducts() {
  console.log("🌱 Starting AdventureWorks product seeding...");
  
  let created = 0;
  let updated = 0;
  
  for (const product of products) {
    try {
      const result = await prisma.product.upsert({
        where: { sku: product.sku },
        create: {
          ...product,
          lowStockThreshold: 5,
          status: "ACTIVE",
        },
        update: {
          ...product,
        },
      });
      
      if (result.createdAt === result.updatedAt) {
        created++;
      } else {
        updated++;
      }
    } catch (error: any) {
      console.error(`❌ Error upserting product ${product.sku}:`, error.message);
    }
  }
  
  console.log(`✅ Product seeding complete!`);
  console.log(`   - Created: ${created} products`);
  console.log(`   - Updated: ${updated} products`);
  console.log(`   - Total: ${products.length} products processed`);
}

// Run the seeder
seedProducts()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

