import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { UserRole } from "@prisma/client";

const isAdmin = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.session?.user?.role !== UserRole.ADMIN) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next();
});

export const adminRouter = createTRPCRouter({
  getStats: isAdmin.query(async ({ ctx }) => {
    const [totalUsers, totalLocations, activeBookings] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.location.count(),
      ctx.prisma.booking.count({
        where: { status: "ACTIVE" },
      }),
    ]);

    return {
      totalUsers,
      totalLocations,
      activeBookings,
    };
  }),

  getUsers: isAdmin.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }),

  getLocations: isAdmin.query(async ({ ctx }) => {
    return ctx.prisma.location.findMany({
      select: {
        id: true,
        name: true,
        address: true,
      },
    });
  }),

  updateUserRole: isAdmin
    .input(
      z.object({
        userId: z.string(),
        role: z.nativeEnum(UserRole),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });
    }),

  deleteLocation: isAdmin
    .input(
      z.object({
        locationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.location.delete({
        where: { id: input.locationId },
      });
    }),
});
