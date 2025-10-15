import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@example.com";
  const sellerEmail = "seller@example.com";
  const accountantEmail = "accountant@example.com";
  const auditorEmail = "auditor@example.com";
  const customerEmail = "customer@example.com";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      role: Role.ADMIN,
      passwordHash: await hashPassword("admin1234"),
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: sellerEmail },
    update: {},
    create: {
      email: sellerEmail,
      name: "Seller",
      role: Role.SELLER,
      passwordHash: await hashPassword("seller1234"),
    },
  });

  const accountant = await prisma.user.upsert({
    where: { email: accountantEmail },
    update: {},
    create: {
      email: accountantEmail,
      name: "Accountant",
      role: Role.ACCOUNTANT,
      passwordHash: await hashPassword("accountant1234"),
    },
  });

  const auditor = await prisma.user.upsert({
    where: { email: auditorEmail },
    update: {},
    create: {
      email: auditorEmail,
      name: "Auditor",
      role: Role.AUDITOR,
      passwordHash: await hashPassword("auditor1234"),
    },
  });

  // Create a sample client and link a CUSTOMER user to it
  const sampleClient = await prisma.client.upsert({
    where: { taxId: "TAX-0001" },
    update: {},
    create: {
      name: "Cliente Demo",
      taxId: "TAX-0001",
      email: "cliente@demo.com",
      status: "ACTIVE",
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    update: {},
    create: {
      email: customerEmail,
      name: "Customer",
      role: Role.CUSTOMER,
      clientId: sampleClient.id,
      passwordHash: await hashPassword("customer1234"),
    },
  });

  // eslint-disable-next-line no-console
  console.log({ admin: admin.email, seller: seller.email, accountant: accountant.email, auditor: auditor.email, customer: customer.email, client: sampleClient.taxId });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


