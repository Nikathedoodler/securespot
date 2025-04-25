// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.locker.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  // Create an admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@securespot.com",
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // Create Central Station with exactly 9 lockers
  const centralStation = await prisma.location.create({
    data: {
      name: "Central Station",
      address: "123 Main Street",
      city: "New York",
      country: "USA",
      lat: 40.7128,
      lng: -74.006,
      lockers: {
        create: [
          { size: "SMALL", status: "AVAILABLE" },
          { size: "SMALL", status: "AVAILABLE" },
          { size: "SMALL", status: "AVAILABLE" },
          { size: "MEDIUM", status: "AVAILABLE" },
          { size: "MEDIUM", status: "AVAILABLE" },
          { size: "MEDIUM", status: "AVAILABLE" },
          { size: "LARGE", status: "AVAILABLE" },
          { size: "LARGE", status: "AVAILABLE" },
          { size: "LARGE", status: "AVAILABLE" },
        ],
      },
    },
  });

  console.log("Database has been reset and seeded with exactly 9 lockers. 🌱");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
