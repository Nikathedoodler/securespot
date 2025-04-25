import { createTRPCRouter } from "./trpc";
import { lockerRouter } from "./routers/locker";
import { adminRouter } from "./routers/admin";
import { bookingRouter } from "./routers/booking";

export const appRouter = createTRPCRouter({
  locker: lockerRouter,
  admin: adminRouter,
  booking: bookingRouter,
});

export type AppRouter = typeof appRouter;

export type RouterInputs = {
  [K in keyof AppRouter["_def"]["procedures"]]: AppRouter["_def"]["procedures"][K]["_def"]["_input_in"];
};

export type RouterOutputs = {
  [K in keyof AppRouter["_def"]["procedures"]]: AppRouter["_def"]["procedures"][K]["_def"]["_output_out"];
};
