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
    const { lockerId, startTime, endTime } = body;

    if (!lockerId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Locker ID, start time, and end time are required" },
        { status: 400 }
      );
    }

    // Validate times
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start < now) {
      return NextResponse.json(
        { error: "Start time must be in the future" },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Calculate duration in hours
    const durationHours = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    );
    if (durationHours < 1 || durationHours > 24) {
      return NextResponse.json(
        { error: "Booking duration must be between 1 and 24 hours" },
        { status: 400 }
      );
    }

    // Check if locker exists and is available
    const locker = await prisma.locker.findUnique({
      where: { id: lockerId },
    });

    if (!locker) {
      return NextResponse.json({ error: "Locker not found" }, { status: 404 });
    }

    if (locker.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Locker is not available" },
        { status: 400 }
      );
    }

    // Check for overlapping bookings
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        lockerId,
        status: "ACTIVE",
        OR: [
          {
            AND: [{ startTime: { lte: start } }, { endTime: { gt: start } }],
          },
          {
            AND: [{ startTime: { lt: end } }, { endTime: { gte: end } }],
          },
        ],
      },
    });

    if (overlappingBooking) {
      return NextResponse.json(
        { error: "Locker is already booked for this time period" },
        { status: 400 }
      );
    }

    // Calculate cost ($5 per hour)
    const cost = durationHours * 5;

    // Create booking and payment in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Create the booking
      const newBooking = await tx.booking.create({
        data: {
          startTime: start,
          endTime: end,
          status: "ACTIVE",
          user: {
            connect: {
              email: userEmail,
            },
          },
          locker: {
            connect: {
              id: lockerId,
            },
          },
        },
      });

      // Create payment record
      await tx.payment.create({
        data: {
          amount: cost,
          status: "COMPLETED",
          booking: {
            connect: {
              id: newBooking.id,
            },
          },
          user: {
            connect: {
              email: userEmail,
            },
          },
        },
      });

      // Update locker status
      await tx.locker.update({
        where: { id: lockerId },
        data: { status: "OCCUPIED" },
      });

      return newBooking;
    });

    return NextResponse.json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
