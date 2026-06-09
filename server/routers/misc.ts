import { z } from "zod";
import { createChatIntake, listChatIntakes } from "../db";
import { seedDemoData } from "../seed";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";

export const miscRouter = router({
  /** Submit an unmanned chat intake (multi-step widget). Public. */
  submitChatIntake: publicProcedure
    .input(
      z.object({
        name: z.string().max(255).optional(),
        email: z.string().email().optional(),
        contactReason: z.string().max(255).optional(),
        message: z.string().max(4000).optional(),
        transcript: z
          .array(z.object({ role: z.string(), text: z.string(), at: z.number() }))
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const intake = await createChatIntake({
        name: input.name,
        email: input.email,
        contactReason: input.contactReason,
        message: input.message,
        transcript: input.transcript,
        status: "new",
      });
      // Best-effort owner notification
      try {
        await notifyOwner({
          title: "New TenantGuard chat intake",
          content: `From ${input.name ?? "anonymous"} (${input.email ?? "no email"}): ${input.message ?? input.contactReason ?? ""}`,
        });
      } catch {
        // ignore notification failures
      }
      return { id: intake.id };
    }),

  /** Admin: list chat intakes. */
  listChatIntakes: adminProcedure.query(async () => {
    return listChatIntakes();
  }),

  /** Seed demo data. Public but idempotent (only seeds when empty). */
  ensureSeed: publicProcedure.mutation(async () => {
    return seedDemoData(false);
  }),

  /** Admin: force re-seed. */
  forceSeed: adminProcedure.mutation(async () => {
    return seedDemoData(true);
  }),
});

export type MiscRouter = typeof miscRouter;
