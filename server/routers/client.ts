import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { PRICING } from "@shared/appConstants";
import {
  createConsultation,
  createMessage,
  declineOtherBids,
  getAttorneyProfileById,
  getBidById,
  getCaseById,
  getCaseByClientUserId,
  listBidsForCase,
  listCaseDocuments,
  listConsultationsByClient,
  listCourtRecords,
  listMessagesForBid,
  setUserRole,
  updateBidStatus,
  updateCaseStatus,
  createClientCase,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

/** Helper: ensure the user owns the case tied to a bid. */
async function assertClientOwnsBid(userId: number, bidId: number) {
  const bid = await getBidById(bidId);
  if (!bid) throw new TRPCError({ code: "NOT_FOUND", message: "Bid not found" });
  const c = await getCaseById(bid.caseId);
  if (!c || c.clientUserId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not your case." });
  }
  return { bid, case: c };
}

export const clientRouter = router({
  /** Client's own cases. */
  myCases: protectedProcedure.query(async ({ ctx }) => {
    return getCaseByClientUserId(ctx.user.id);
  }),

  /** Create a tenant case (client onboarding intake). */
  createCase: protectedProcedure
    .input(
      z.object({
        tenantName: z.string().min(1),
        caseType: z.string().min(1),
        propertyAddress: z.string().min(1),
        county: z.string().min(1),
        state: z.string().min(1),
        monthlyRent: z.number().int().min(0).optional(),
        caseSummary: z.string().min(1),
        landlordName: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await setUserRole(ctx.user.id, "client");
      const displayName =
        input.tenantName.split(" ")[0] + " " + (input.tenantName.split(" ")[1]?.[0] ?? "") + ".";
      const created = await createClientCase({
        clientUserId: ctx.user.id,
        tenantName: input.tenantName,
        displayName,
        caseType: input.caseType,
        propertyAddress: input.propertyAddress,
        county: input.county,
        state: input.state,
        monthlyRent: input.monthlyRent,
        caseSummary: input.caseSummary,
        landlordName: input.landlordName,
        status: "available",
        onboardingPaid: false,
      });
      return created;
    }),

  /** Detail of a client's case including bids + court records. */
  caseDetail: protectedProcedure
    .input(z.object({ caseId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const c = await getCaseById(input.caseId);
      if (!c || c.clientUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your case." });
      }
      const documents = await listCaseDocuments(c.id);
      const courtRecords = await listCourtRecords(c.id);
      const rawBids = await listBidsForCase(c.id);
      const bids = await Promise.all(
        rawBids
          .filter((b) => b.status !== "withdrawn")
          .map(async (b) => {
            const attorney = await getAttorneyProfileById(b.attorneyId);
            return {
              ...b,
              attorney: attorney
                ? {
                    id: attorney.id,
                    firmName: attorney.firmName,
                    fullName: attorney.fullName,
                    bio: attorney.bio,
                    barState: attorney.barState,
                    yearAdmitted: attorney.yearAdmitted,
                    verificationStatus: attorney.verificationStatus,
                  }
                : null,
            };
          }),
      );
      return { case: c, documents, courtRecords, bids };
    }),

  /** Mark a bid as viewed (when client opens it). */
  markBidViewed: protectedProcedure
    .input(z.object({ bidId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { bid } = await assertClientOwnsBid(ctx.user.id, input.bidId);
      if (bid.status === "submitted") await updateBidStatus(bid.id, "viewed");
      return { success: true };
    }),

  /** Accept a bid → case becomes represented, other bids declined. */
  acceptBid: protectedProcedure
    .input(z.object({ bidId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { bid, case: c } = await assertClientOwnsBid(ctx.user.id, input.bidId);
      await updateBidStatus(bid.id, "accepted");
      await declineOtherBids(c.id, bid.id);
      await updateCaseStatus(c.id, "represented", bid.attorneyId);
      return { success: true };
    }),

  /** Decline a bid. */
  declineBid: protectedProcedure
    .input(z.object({ bidId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { bid } = await assertClientOwnsBid(ctx.user.id, input.bidId);
      await updateBidStatus(bid.id, "declined");
      return { success: true };
    }),

  /** Thread of messages for a bid. */
  messages: protectedProcedure
    .input(z.object({ bidId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      await assertClientOwnsBid(ctx.user.id, input.bidId);
      return listMessagesForBid(input.bidId);
    }),

  /** Client sends a follow-up question to the bidding attorney. */
  sendMessage: protectedProcedure
    .input(z.object({ bidId: z.number().int(), body: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const { bid } = await assertClientOwnsBid(ctx.user.id, input.bidId);
      const msg = await createMessage({
        bidId: bid.id,
        caseId: bid.caseId,
        senderUserId: ctx.user.id,
        senderRole: "client",
        body: input.body,
      });
      return msg;
    }),

  /** Client's consultations. */
  myConsultations: protectedProcedure.query(async ({ ctx }) => {
    return listConsultationsByClient(ctx.user.id);
  }),

  /**
   * Create a pending consultation (payment handled separately).
   * Fee is credited toward attorney fees.
   */
  requestConsultation: protectedProcedure
    .input(
      z.object({
        bidId: z.number().int(),
        scheduledAt: z.number(), // epoch ms
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { bid } = await assertClientOwnsBid(ctx.user.id, input.bidId);
      const consult = await createConsultation({
        bidId: bid.id,
        caseId: bid.caseId,
        clientUserId: ctx.user.id,
        attorneyId: bid.attorneyId,
        scheduledAt: new Date(input.scheduledAt),
        durationMinutes: PRICING.CONSULTATION_MINUTES,
        feeAmount: PRICING.CONSULTATION_FEE,
        creditedToFees: true,
        status: "pending_payment",
      });
      return consult;
    }),
});

export type ClientRouter = typeof clientRouter;
