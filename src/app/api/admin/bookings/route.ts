import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { prisma } from "@/server/db";
import { NextResponse } from "next/server";

// GET all bookings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const bookings = await prisma.booking.findMany({
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        locker: {
          select: {
            size: true,
            location: {
              select: {
                name: true,
              },
            },
          },
        },
        payment: {
          select: {
            amount: true,
            status: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
