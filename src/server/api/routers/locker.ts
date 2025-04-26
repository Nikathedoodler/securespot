import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { LockerStatus } from "@prisma/client";

export const lockerRouter = createTRPCRouter({
  getLockers: publicProcedure.query(async ({ ctx }) => {
    try {
      // 1. Find expired bookings (endTime < now, not already CANCELED or EXPIRED)
      const now = new Date();
      const expiredBookings = await ctx.prisma.booking.findMany({
        where: {
          endTime: { lt: now },
          status: { notIn: ["CANCELED", "EXPIRED"] },
        },
      });

      // 2. For each expired booking, set status to EXPIRED and locker to AVAILABLE
      for (const booking of expiredBookings) {
        await ctx.prisma.booking.update({
          where: { id: booking.id },
          data: { status: "EXPIRED" },
        });
        await ctx.prisma.locker.update({
          where: { id: booking.lockerId },
          data: { status: LockerStatus.AVAILABLE },
        });
      }

      // 3. Return lockers as usual
      return await ctx.prisma.locker.findMany({
        include: {
          location: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
    } catch (error) {
      console.error("Error fetching lockers:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch lockers",
      });
    }
  }),

  bookLocker: protectedProcedure
    .input(z.object({ lockerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const locker = await ctx.prisma.locker.findUnique({
          where: { id: input.lockerId },
        });

        if (!locker || locker.status !== LockerStatus.AVAILABLE) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Locker is not available",
          });
        }

        const booking = await ctx.prisma.booking.create({
          data: {
            userId: ctx.session.user.id,
            lockerId: input.lockerId,
            startTime: new Date(),
            endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
            status: "ACTIVE",
          },
        });

        await ctx.prisma.locker.update({
          where: { id: input.lockerId },
          data: { status: LockerStatus.OCCUPIED },
        });

        return booking;
      } catch (error) {
        console.error("Error booking locker:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to book locker",
        });
      }
    }),
});
