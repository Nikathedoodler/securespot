import { prisma } from "../server/db";

async function checkAdmin() {
  const admin = await prisma.user.findUnique({
    where: {
      email: "admin@securespot.com",
    },
  });

  console.log("Admin user:", admin);
}

checkAdmin()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
