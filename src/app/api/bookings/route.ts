import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/server/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    console.log("Starting booking creation...");
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Request body:", body);
    const { lockerId, duration } = body;

    if (!lockerId || !duration) {
      console.log("Missing required fields:", { lockerId, duration });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if locker exists and is available
    console.log("Checking locker availability:", lockerId);
    const locker = await prisma.locker.findUnique({
      where: { id: lockerId },
      include: {
        location: true,
      },
    });

    console.log("Locker found:", locker);

    if (!locker) {
      console.log("Locker not found");
      return NextResponse.json({ error: "Locker not found" }, { status: 404 });
    }

    if (locker.status !== "AVAILABLE") {
      console.log("Locker not available");
      return NextResponse.json(
        { error: "Locker is not available" },
        { status: 400 }
      );
    }

    // Calculate booking times and amount
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
    const amount = duration * 5; // $5 per hour
    console.log("Creating booking with times:", { startTime, endTime, amount });

    try {
      // Start a transaction
      const result = await prisma.$transaction(async (tx) => {
        console.log("Starting transaction...");

        // Create the booking
        console.log("Creating booking...");
        const booking = await tx.booking.create({
          data: {
            startTime,
            endTime,
            locker: {
              connect: { id: lockerId },
            },
            user: {
              connect: { email: session.user!.email! },
            },
          },
        });

        console.log("Booking created:", booking);

        // Create payment record
        console.log("Creating payment record...");
        const payment = await tx.payment.create({
          data: {
            amount,
            status: "COMPLETED",
            booking: {
              connect: { id: booking.id },
            },
            user: {
              connect: { email: session.user!.email! },
            },
          },
        });

        console.log("Payment created:", payment);

        // Update locker status
        console.log("Updating locker status...");
        await tx.locker.update({
          where: { id: lockerId },
          data: { status: "OCCUPIED" },
        });

        console.log("Locker status updated");
        return { booking, payment };
      });

      console.log("Transaction completed successfully");
      return NextResponse.json(result);
    } catch (txError) {
      console.error("Transaction failed:", txError);
      if (txError instanceof Error) {
        console.error("Transaction error details:", txError.message);
        console.error("Transaction error stack:", txError.stack);
      }
      throw txError;
    }
  } catch (error) {
    console.error("Error in booking creation:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      {
        error: "Failed to create booking",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        user: {
          email: session.user.email,
        },
      },
      include: {
        locker: {
          include: {
            location: true,
          },
        },
        payment: true,
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("id");

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Check if the booking belongs to the user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.user.email !== session.user.email) {
      return NextResponse.json(
        { error: "Unauthorized to cancel this booking" },
        { status: 403 }
      );
    }

    // Check if the booking can be cancelled (e.g., not already started)
    if (new Date(booking.startTime) < new Date()) {
      return NextResponse.json(
        { error: "Cannot cancel an active or past booking" },
        { status: 400 }
      );
    }

    // Cancel the booking
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });

    // Update locker status
    await prisma.locker.update({
      where: { id: booking.lockerId },
      data: { status: "AVAILABLE" },
    });

    return NextResponse.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    console.log("Starting booking extension...");
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, additionalHours } = body;
    console.log("Extending booking:", { bookingId, additionalHours });

    if (!bookingId || !additionalHours) {
      console.log("Missing required fields");
      return NextResponse.json(
        { error: "Booking ID and additional hours are required" },
        { status: 400 }
      );
    }

    // Verify the booking belongs to the user and is still active
    console.log("Finding booking...");
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        user: {
          email: session.user.email,
        },
        endTime: {
          gt: new Date(), // Only allow extending active bookings
        },
      },
      include: {
        payment: true,
        locker: true,
      },
    });

    console.log("Booking found:", booking);

    if (!booking) {
      console.log("Booking not found or not active");
      return NextResponse.json(
        { error: "Active booking not found" },
        { status: 404 }
      );
    }

    // Calculate new end time and additional amount
    console.log("Current booking end time:", booking.endTime);
    const newEndTime = new Date(
      new Date(booking.endTime).getTime() + additionalHours * 60 * 60 * 1000
    );
    const additionalAmount = additionalHours * 5; // $5 per hour
    console.log("Calculated extension:", {
      currentEndTime: booking.endTime,
      newEndTime,
      additionalHours,
      additionalAmount,
    });

    try {
      // Start a transaction
      console.log("Starting transaction...");
      await prisma.$transaction(async (tx) => {
        // Update the booking end time
        console.log("Updating booking end time...");
        const updatedBooking = await tx.booking.update({
          where: { id: bookingId },
          data: { endTime: newEndTime },
        });
        console.log("Booking updated:", updatedBooking);

        // Update the existing payment with the additional amount
        console.log("Updating payment record...");
        const payment = await tx.payment.update({
          where: { bookingId: bookingId },
          data: {
            amount: {
              increment: additionalAmount,
            },
          },
        });
        console.log("Payment updated:", payment);

        // Update locker status to ensure it stays occupied
        console.log("Updating locker status...");
        const updatedLocker = await tx.locker.update({
          where: { id: booking.lockerId },
          data: { status: "OCCUPIED" },
        });
        console.log("Locker updated:", updatedLocker);
      });

      console.log("Transaction completed successfully");
      return NextResponse.json({ message: "Booking extended successfully" });
    } catch (txError) {
      console.error("Transaction failed:", txError);
      if (txError instanceof Error) {
        console.error("Transaction error details:", txError.message);
        console.error("Transaction error stack:", txError.stack);
      }
      throw txError;
    }
  } catch (error) {
    console.error("Error extending booking:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      {
        error: "Failed to extend booking",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
