import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    // Only allow specific email to make this change initially
    if (userEmail !== "kakulia.nika@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update the user role to ADMIN
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: { role: UserRole.ADMIN },
    });

    return NextResponse.json({
      message: "Role updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}
