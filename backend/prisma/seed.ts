import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@example.com";
  const sellerEmail = "seller@example.com";

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

  // eslint-disable-next-line no-console
  console.log({ admin: admin.email, seller: seller.email });
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


