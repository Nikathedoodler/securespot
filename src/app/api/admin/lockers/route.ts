import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { prisma } from "@/server/db";
import { NextResponse } from "next/server";

// GET all lockers
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const lockers = await prisma.locker.findMany({
      select: {
        id: true,
        size: true,
        status: true,
        location: {
          select: {
            name: true,
            address: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(lockers);
  } catch (error) {
    console.error("Error fetching lockers:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PATCH update locker status
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { lockerId, status } = await request.json();

    if (!lockerId || !status) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const updatedLocker = await prisma.locker.update({
      where: { id: lockerId },
      data: { status },
      select: {
        id: true,
        size: true,
        status: true,
        location: {
          select: {
            name: true,
            address: true,
          },
        },
        createdAt: true,
      },
    });

    return NextResponse.json(updatedLocker);
  } catch (error) {
    console.error("Error updating locker:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
