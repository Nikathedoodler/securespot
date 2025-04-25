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
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
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
        { error: "Unauthorized to cancel this booking" },
        { status: 403 }
      );
    }

    // Check if the booking is already canceled
    if (booking.status === "CANCELED") {
      return NextResponse.json(
        { error: "Booking is already canceled" },
        { status: 400 }
      );
    }

    // Calculate refund amount based on time until booking starts
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const hoursUntilStart =
      (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Get total amount paid
    const totalPaid = await prisma.payment.aggregate({
      where: {
        booking: { id: bookingId },
        status: "COMPLETED",
      },
      _sum: {
        amount: true,
      },
    });

    let refundAmount = 0;
    // Full refund if canceled more than 24 hours before start
    if (hoursUntilStart > 24) {
      refundAmount = totalPaid._sum.amount || 0;
    }
    // 50% refund if canceled between 12 and 24 hours before start
    else if (hoursUntilStart > 12) {
      refundAmount = (totalPaid._sum.amount || 0) * 0.5;
    }
    // No refund if canceled less than 12 hours before start

    // Update booking and create refund in a transaction
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELED",
        },
      });

      // Create refund record if applicable
      if (refundAmount > 0) {
        await tx.payment.create({
          data: {
            amount: -refundAmount, // Negative amount for refund
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
      }

      // Update locker status if the booking was current or future
      if (booking.endTime > now) {
        await tx.locker.update({
          where: { id: booking.locker.id },
          data: { status: "AVAILABLE" },
        });
      }

      return updated;
    });

    return NextResponse.json({
      message: "Booking canceled successfully",
      booking: updatedBooking,
      refundAmount: refundAmount > 0 ? refundAmount : null,
    });
  } catch (error) {
    console.error("Error canceling booking:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
