import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addAttorneyClientSlots,
  createBid,
  getAttorneyProfileByUserId,
  getCaseById,
  getExistingBid,
  listAvailableCases,
  listBidsByAttorney,
  listBidsForCase,
  listCaseDocuments,
  listConsultationsByAttorney,
  listCourtRecords,
  setUserRole,
  updateBidStatus,
  upsertAttorneyProfile,
} from "../db";
import { attorneyProcedure } from "../roleProcedures";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const attorneyRouter = router({
  /** Get the current user's attorney profile (null if not onboarded). */
  myProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getAttorneyProfileByUserId(ctx.user.id);
    return profile ?? null;
  }),

  /** Create or update attorney profile + credentials. */
  saveProfile: protectedProcedure
    .input(
      z.object({
        firmName: z.string().min(1),
        fullName: z.string().min(1),
        phone: z.string().optional(),
        bio: z.string().optional(),
        barNumber: z.string().min(1),
        barState: z.string().min(1),
        yearAdmitted: z.number().int().min(1950).max(new Date().getFullYear()),
        jurisdictions: z.array(z.string()).min(1),
        goodStandingCertified: z.boolean(),
        credentialFileKey: z.string().optional(),
        credentialFileUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.goodStandingCertified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You must certify good standing to practice before continuing.",
        });
      }
      // Mark the user as an attorney
      await setUserRole(ctx.user.id, "attorney");
      const profile = await upsertAttorneyProfile(ctx.user.id, {
        firmName: input.firmName,
        fullName: input.fullName,
        phone: input.phone,
        bio: input.bio,
        barNumber: input.barNumber,
        barState: input.barState,
        yearAdmitted: input.yearAdmitted,
        jurisdictions: input.jurisdictions,
        goodStandingCertified: input.goodStandingCertified,
        credentialFileKey: input.credentialFileKey,
        credentialFileUrl: input.credentialFileUrl,
        // In production this would be reviewed by staff; auto-verify in test mode
        verificationStatus: "verified",
      });
      return profile;
    }),

  /** List tenant cases available to bid on (with doc + record counts). */
  availableCases: attorneyProcedure.query(async ({ ctx }) => {
    const cases = await listAvailableCases();
    const jurisdictions = (ctx.attorney.jurisdictions ?? []) as string[];
    const enriched = await Promise.all(
      cases.map(async (c) => {
        const docs = await listCaseDocuments(c.id);
        const records = await listCourtRecords(c.id);
        const myBid = await getExistingBid(c.id, ctx.attorney.id);
        return {
          ...c,
          documentCount: docs.length,
          priorRecordCount: records.length,
          canBid: jurisdictions.includes(c.county),
          myBidId: myBid?.id ?? null,
          myBidStatus: myBid?.status ?? null,
        };
      }),
    );
    return enriched;
  }),

  /** Full detail of a case for an attorney (documents + CaseLink records). */
  caseDetail: attorneyProcedure
    .input(z.object({ caseId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const c = await getCaseById(input.caseId);
      if (!c) throw new TRPCError({ code: "NOT_FOUND", message: "Case not found" });
      const documents = await listCaseDocuments(c.id);
      const courtRecords = await listCourtRecords(c.id);
      const myBid = await getExistingBid(c.id, ctx.attorney.id);
      const jurisdictions = (ctx.attorney.jurisdictions ?? []) as string[];
      return {
        case: c,
        documents,
        courtRecords,
        myBid: myBid ?? null,
        canBid: jurisdictions.includes(c.county),
      };
    }),

  /** Submit a bid: bundled first-two-appearance fee + separate third-appearance fee. */
  submitBid: attorneyProcedure
    .input(
      z.object({
        caseId: z.number().int(),
        firstTwoFee: z.number().int().min(1).max(100000),
        thirdFee: z.number().int().min(1).max(100000),
        message: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const c = await getCaseById(input.caseId);
      if (!c) throw new TRPCError({ code: "NOT_FOUND", message: "Case not found" });

      // Jurisdiction gating: attorney must be licensed in the case county
      const jurisdictions = (ctx.attorney.jurisdictions ?? []) as string[];
      if (!jurisdictions.includes(c.county)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You are not certified to practice in ${c.county}. Update your credentials to bid on this case.`,
        });
      }

      // Must have purchased client slots (min 2) before bidding
      const remaining = ctx.attorney.clientSlotsPurchased - ctx.attorney.clientSlotsUsed;
      if (remaining <= 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You have no available client slots. Purchase client access to submit bids.",
        });
      }

      const existing = await getExistingBid(input.caseId, ctx.attorney.id);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "You have already bid on this case." });
      }

      const bid = await createBid({
        caseId: input.caseId,
        attorneyId: ctx.attorney.id,
        firstTwoFee: input.firstTwoFee,
        thirdFee: input.thirdFee,
        message: input.message,
        status: "submitted",
      });
      return bid;
    }),

  /** List the attorney's own bids with case context. */
  myBids: attorneyProcedure.query(async ({ ctx }) => {
    const myBids = await listBidsByAttorney(ctx.attorney.id);
    return Promise.all(
      myBids.map(async (b) => {
        const c = await getCaseById(b.caseId);
        return { ...b, case: c ?? null };
      }),
    );
  }),

  /** Withdraw a submitted bid. */
  withdrawBid: attorneyProcedure
    .input(z.object({ bidId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const bids = await listBidsByAttorney(ctx.attorney.id);
      const owned = bids.find((b) => b.id === input.bidId);
      if (!owned) throw new TRPCError({ code: "FORBIDDEN", message: "Not your bid." });
      await updateBidStatus(input.bidId, "withdrawn");
      return { success: true };
    }),

  /** Attorney's scheduled consultations. */
  myConsultations: attorneyProcedure.query(async ({ ctx }) => {
    return listConsultationsByAttorney(ctx.attorney.id);
  }),

  /** Grant client slots after a successful purchase (called by payment verify too). */
  _grantSlots: protectedProcedure
    .input(z.object({ slots: z.number().int().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const profile = await getAttorneyProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "No attorney profile" });
      await addAttorneyClientSlots(profile.id, input.slots);
      return { success: true };
    }),
});

export type AttorneyRouter = typeof attorneyRouter;
export const _publicAttorneyPing = publicProcedure;
export { listBidsForCase };
