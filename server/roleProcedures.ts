import { TRPCError } from "@trpc/server";
import { getAttorneyProfileByUserId } from "./db";
import { protectedProcedure } from "./_core/trpc";

/**
 * Procedure that requires the authenticated user to have an attorney profile.
 * Injects `ctx.attorney` (the attorney profile row).
 */
export const attorneyProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const profile = await getAttorneyProfileByUserId(ctx.user.id);
  if (!profile) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Attorney profile required. Please complete attorney onboarding first.",
    });
  }
  return next({ ctx: { ...ctx, attorney: profile } });
});
