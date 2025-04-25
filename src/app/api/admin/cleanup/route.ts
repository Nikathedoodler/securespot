import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find all expired bookings that are still marked as ACTIVE
    const expiredBookings = await prisma.booking.findMany({
      where: {
        endTime: {
          lt: now,
        },
        status: "ACTIVE",
      },
      include: {
        locker: true,
      },
    });

    // Update each expired booking and its locker
    for (const booking of expiredBookings) {
      await prisma.$transaction([
        // Update booking status to COMPLETED
        prisma.booking.update({
          where: { id: booking.id },
          data: { status: "COMPLETED" },
        }),
        // Update locker status to AVAILABLE
        prisma.locker.update({
          where: { id: booking.lockerId },
          data: { status: "AVAILABLE" },
        }),
      ]);
    }

    return NextResponse.json({
      message: "Cleanup completed successfully",
      updatedBookings: expiredBookings.length,
    });
  } catch (error) {
    console.error("Error during cleanup:", error);
    return NextResponse.json(
      { error: "Failed to perform cleanup" },
      { status: 500 }
    );
  }
}
