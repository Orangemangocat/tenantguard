import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createMessage,
  getAttorneyProfileByUserId,
  getBidById,
  getCaseById,
  listCourtRecords,
  listMessagesForBid,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

/**
 * Shared procedures available to both attorneys and clients.
 * Includes CaseLink court records access and the messaging thread
 * (attorney side; client side lives in clientRouter).
 */
export const sharedRouter = router({
  /** CaseLink: prior court actions for a case. Both roles can read. */
  courtRecords: protectedProcedure
    .input(z.object({ caseId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const c = await getCaseById(input.caseId);
      if (!c) throw new TRPCError({ code: "NOT_FOUND", message: "Case not found" });

      // Access control: the owning client, or an attorney, may view.
      const isOwningClient = c.clientUserId === ctx.user.id;
      const attorneyProfile = await getAttorneyProfileByUserId(ctx.user.id);
      const isAttorney = Boolean(attorneyProfile);
      if (!isOwningClient && !isAttorney && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not permitted to view these records." });
      }
      const records = await listCourtRecords(input.caseId);
      return { case: { id: c.id, landlordName: c.landlordName, displayName: c.displayName }, records };
    }),

  /** Attorney reads a message thread for one of their bids. */
  attorneyMessages: protectedProcedure
    .input(z.object({ bidId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const profile = await getAttorneyProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "Attorney only." });
      const bid = await getBidById(input.bidId);
      if (!bid || bid.attorneyId !== profile.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your bid." });
      }
      return listMessagesForBid(input.bidId);
    }),

  /** Attorney replies in a message thread. */
  attorneySendMessage: protectedProcedure
    .input(z.object({ bidId: z.number().int(), body: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getAttorneyProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "Attorney only." });
      const bid = await getBidById(input.bidId);
      if (!bid || bid.attorneyId !== profile.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your bid." });
      }
      return createMessage({
        bidId: bid.id,
        caseId: bid.caseId,
        senderUserId: ctx.user.id,
        senderRole: "attorney",
        body: input.body,
      });
    }),
});

export type SharedRouter = typeof sharedRouter;
