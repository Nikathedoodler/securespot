import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get total users
    const totalUsers = await prisma.user.count();

    // Get active lockers (not in maintenance and not occupied by active bookings)
    const now = new Date();
    const activeLockers = await prisma.locker.count({
      where: {
        AND: [
          { status: { not: "MAINTENANCE" } },
          {
            OR: [
              { status: "AVAILABLE" },
              {
                bookings: {
                  none: {
                    status: "ACTIVE",
                    endTime: { gt: now },
                  },
                },
              },
            ],
          },
        ],
      },
    });

    // Get active bookings (not completed or cancelled)
    const activeBookings = await prisma.booking.count({
      where: {
        status: "ACTIVE",
        endTime: { gt: now },
      },
    });

    // Calculate total revenue from completed payments
    const totalRevenue = await prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: "COMPLETED",
      },
    });

    return NextResponse.json({
      totalUsers,
      activeLockers,
      activeBookings,
      totalRevenue: totalRevenue._sum.amount || 0,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
