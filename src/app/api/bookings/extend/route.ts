import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, additionalHours } = await req.json();
    if (!bookingId || !additionalHours) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const newEndTime = new Date(booking.endTime);
    newEndTime.setHours(newEndTime.getHours() + Number(additionalHours));

    await prisma.booking.update({
      where: { id: bookingId },
      data: { endTime: newEndTime },
    });

    return NextResponse.json({ message: "Booking extended successfully" });
  } catch (error) {
    console.error("Error extending booking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
