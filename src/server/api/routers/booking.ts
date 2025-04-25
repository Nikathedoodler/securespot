import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const bookingRouter = createTRPCRouter({
  getUserBookings: protectedProcedure.query(async ({ ctx }) => {
    try {
      const bookings = await ctx.prisma.booking.findMany({
        where: {
          user: {
            email: ctx.session.user.email,
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

      return bookings;
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch bookings",
      });
    }
  }),

  cancelBooking: protectedProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get the booking
        const booking = await ctx.prisma.booking.findUnique({
          where: { id: input.bookingId },
          include: {
            user: true,
            locker: true,
            payment: {
              where: {
                status: "COMPLETED",
              },
            },
          },
        });

        if (!booking) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Booking not found",
          });
        }

        // Check if the booking belongs to the user
        if (booking.user.email !== ctx.session.user.email) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized to cancel this booking",
          });
        }

        // Check if the booking is already canceled
        if (booking.status === "CANCELED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Booking is already canceled",
          });
        }

        // Calculate refund amount based on time until booking starts
        const now = new Date();
        const startTime = new Date(booking.startTime);
        const hoursUntilStart =
          (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Calculate total amount paid
        const totalPaid = Array.isArray(booking.payment)
          ? booking.payment.reduce(
              (sum: number, p: Prisma.PaymentGetPayload<{}>) => sum + p.amount,
              0
            )
          : booking.payment?.amount ?? 0;

        let refundAmount = 0;
        // Full refund if canceled more than 24 hours before start
        if (hoursUntilStart > 24) {
          refundAmount = totalPaid;
        }
        // 50% refund if canceled between 12 and 24 hours before start
        else if (hoursUntilStart > 12) {
          refundAmount = totalPaid * 0.5;
        }
        // No refund if canceled less than 12 hours before start

        // Update booking and create refund in a transaction
        const updatedBooking = await ctx.prisma.$transaction(async (tx) => {
          // Update booking status
          const updated = await tx.booking.update({
            where: { id: input.bookingId },
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
                    id: input.bookingId,
                  },
                },
                user: {
                  connect: {
                    email: ctx.session.user.email,
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

        return {
          message: "Booking canceled successfully",
          booking: updatedBooking,
          refundAmount: refundAmount > 0 ? refundAmount : null,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error canceling booking:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel booking",
        });
      }
    }),
});
