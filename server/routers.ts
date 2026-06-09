import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { attorneyRouter } from "./routers/attorney";
import { clientRouter } from "./routers/client";
import { sharedRouter } from "./routers/shared";
import { paymentsRouter } from "./routers/payments";
import { miscRouter } from "./routers/misc";
import { demoRouter } from "./routers/demo";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  attorney: attorneyRouter,
  clientPortal: clientRouter,
  shared: sharedRouter,
  payments: paymentsRouter,
  misc: miscRouter,
  demo: demoRouter,
});

export type AppRouter = typeof appRouter;
