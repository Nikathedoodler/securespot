import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateAdmin() {
  try {
    // Delete the old admin account
    await prisma.user
      .delete({
        where: {
          email: "admin@securespot.com",
        },
      })
      .catch(() => console.log("Old admin account not found"));

    // Update your Google account to have admin role
    const updatedUser = await prisma.user.update({
      where: {
        email: "kakulia.nika@gmail.com",
      },
      data: {
        role: "ADMIN",
      },
    });

    console.log("Successfully updated admin user:", updatedUser);
  } catch (error) {
    console.error("Error updating admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdmin();
