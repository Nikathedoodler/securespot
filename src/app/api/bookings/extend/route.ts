import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, additionalHours } = body;

    if (!bookingId || !additionalHours) {
      return NextResponse.json(
        { error: "Booking ID and additional hours are required" },
        { status: 400 }
      );
    }

    // Validate additional hours
    if (additionalHours < 1 || additionalHours > 24) {
      return NextResponse.json(
        { error: "Additional hours must be between 1 and 24" },
        { status: 400 }
      );
    }

    // Get the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        locker: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if the booking belongs to the user
    if (booking.user.email !== userEmail) {
      return NextResponse.json(
        { error: "Unauthorized to extend this booking" },
        { status: 403 }
      );
    }

    // Check if the booking is active
    const now = new Date();
    const endTime = new Date(booking.endTime);
    if (endTime < now) {
      return NextResponse.json(
        { error: "Cannot extend an expired booking" },
        { status: 400 }
      );
    }

    // Calculate new end time
    const newEndTime = new Date(endTime);
    newEndTime.setHours(newEndTime.getHours() + additionalHours);

    // Calculate additional cost ($5 per hour)
    const additionalCost = additionalHours * 5;

    // Update the booking and create a new payment record
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Update booking end time
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          endTime: newEndTime,
        },
      });

      // Create payment record
      await tx.payment.create({
        data: {
          amount: additionalCost,
          status: "COMPLETED",
          booking: {
            connect: {
              id: bookingId,
            },
          },
          user: {
            connect: {
              email: userEmail,
            },
          },
        },
      });

      return updated;
    });

    return NextResponse.json({
      message: "Booking extended successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error extending booking:", error);
    return NextResponse.json(
      { error: "Failed to extend booking" },
      { status: 500 }
    );
  }
}
