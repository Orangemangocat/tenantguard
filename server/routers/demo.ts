import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  addAttorneyClientSlots,
  createBid,
  createCaseDocument,
  createClientCase,
  createCourtRecord,
  getAttorneyProfileByUserId,
  getCaseByClientUserId,
  listAvailableCases,
  listBidsForCase,
  setUserRole,
  upsertAttorneyProfile,
} from "../db";
import { PRIMARY_JURISDICTION } from "@shared/appConstants";
import { protectedProcedure, router } from "../_core/trpc";

/**
 * Demo helpers so the platform can be explored end-to-end without going
 * through Stripe checkout or staff credential review. These mutate ONLY the
 * currently-authenticated user's own records.
 */
export const demoRouter = router({
  /**
   * Turn the current user into a verified attorney with purchased client slots,
   * ready to browse and bid immediately.
   */
  becomeAttorney: protectedProcedure.mutation(async ({ ctx }) => {
    await setUserRole(ctx.user.id, "attorney");
    const existing = await getAttorneyProfileByUserId(ctx.user.id);
    const profile = await upsertAttorneyProfile(ctx.user.id, {
      firmName: existing?.firmName ?? "Demo Tenant Defense, PLLC",
      fullName: existing?.fullName ?? ctx.user.name ?? "Demo Attorney",
      phone: existing?.phone ?? "(615) 555-0142",
      bio:
        existing?.bio ??
        "Demo attorney profile auto-provisioned for testing. Focused on Davidson County eviction defense.",
      barNumber: existing?.barNumber ?? "TN-DEMO-0001",
      barState: existing?.barState ?? "TN",
      yearAdmitted: existing?.yearAdmitted ?? 2015,
      jurisdictions: [PRIMARY_JURISDICTION],
      goodStandingCertified: true,
      verificationStatus: "verified",
      onboardingComplete: true,
    });
    if (!profile) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create demo profile" });
    // Grant a few slots if they have none available
    const available = profile.clientSlotsPurchased - profile.clientSlotsUsed;
    if (available <= 0) {
      await addAttorneyClientSlots(profile.id, 5);
    }
    return { success: true, attorneyId: profile.id };
  }),

  /**
   * Turn the current user into a client with their own seeded case,
   * complete with documents, prior CaseLink records, and a few sample
   * attorney bids so the bid/messaging/consultation flows are populated.
   */
  becomeClientWithCase: protectedProcedure.mutation(async ({ ctx }) => {
    await setUserRole(ctx.user.id, "client");

    // If they already have a case, don't create a duplicate.
    const existingCases = await getCaseByClientUserId(ctx.user.id);
    if (existingCases.length > 0) {
      return { success: true, caseId: existingCases[0].id, created: false };
    }

    const tenantName = ctx.user.name ?? "Demo Tenant";
    const first = tenantName.split(" ")[0] ?? "Demo";
    const lastInitial = tenantName.split(" ")[1]?.[0] ?? "T";
    const created = await createClientCase({
      clientUserId: ctx.user.id,
      tenantName,
      displayName: `${first} ${lastInitial}.`,
      caseType: "Eviction - Non Payment",
      propertyAddress: "1500 Demonbreun St, Unit 312, Nashville, TN 37203",
      county: PRIMARY_JURISDICTION,
      state: "TN",
      monthlyRent: 1395,
      caseSummary:
        "Your demo case. Facing a non-payment detainer after a billing dispute over undisclosed fees. You have a strong payment history and documentation contesting the late charges.",
      landlordName: "Demonbreun Holdings LLC",
      hearingDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: "available",
      onboardingPaid: false,
    });
    if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create demo case" });

    // Documents
    const docs = [
      { title: "Residential Lease Agreement", docType: "Lease", description: "12-month lease, $1,395/mo. No late-fee schedule attached." },
      { title: "Detainer Warrant", docType: "Eviction Notice", description: "Non-payment detainer served this month." },
      { title: "Payment History", docType: "Payment Receipt", description: "Bank records showing on-time payments before the disputed charge." },
    ];
    for (const d of docs) {
      await createCaseDocument({ caseId: created.id, ...d });
    }

    // Prior CaseLink records — same landlord pattern
    await createCourtRecord({
      caseId: created.id,
      caseNumber: "24GT-7781",
      court: "Davidson County General Sessions Court",
      filingDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
      partyPlaintiff: "Demonbreun Holdings LLC",
      partyDefendant: "Prior tenant (same unit)",
      actionType: "Detainer Warrant (Non-Payment)",
      disposition: "Dismissed",
      outcome: "Same landlord filed and dismissed a prior non-payment action on this unit — supports a pattern-of-filing argument.",
    });

    return { success: true, caseId: created.id, created: true };
  }),

  /**
   * Populate the current client's case with a few demo attorney bids so the
   * client dashboard shows incoming bids to review, message, and schedule calls.
   */
  seedBidsForMyCase: protectedProcedure
    .input(z.object({ caseId: z.number().int() }).optional())
    .mutation(async ({ ctx, input }) => {
      const cases = await getCaseByClientUserId(ctx.user.id);
      const target = input?.caseId
        ? cases.find((c) => c.id === input.caseId)
        : cases[0];
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "No case to add bids to." });

      // Ensure at least one demo attorney profile exists to attribute bids to.
      // We create lightweight standalone attorney profiles (not tied to a login)
      // purely so the client can see realistic incoming bids.
      const existingBids = await listBidsForCase(target.id);
      if (existingBids.length > 0) {
        return { success: true, added: 0 };
      }

      const demoAttorneys = [
        {
          firmName: "Cumberland Tenant Law",
          fullName: "Alicia Hammond",
          bio: "12 years defending Davidson County tenants. Former legal aid attorney.",
          firstTwoFee: 600,
          thirdFee: 250,
          message:
            "I've handled dozens of non-payment detainers in General Sessions. The undisclosed late-fee issue is a strong defense — happy to fight this. Flat fee covers your first two appearances.",
        },
        {
          firmName: "Music City Housing Defense",
          fullName: "Darnell Carter",
          bio: "Housing-focused solo practice. Known for quick continuances and settlements.",
          firstTwoFee: 750,
          thirdFee: 300,
          message:
            "Given the prior dismissed filing by the same landlord, we have leverage. I can usually negotiate a payment plan that keeps an eviction off your record.",
        },
        {
          firmName: "Harpeth Legal Group",
          fullName: "Priya Nair",
          bio: "Boutique firm, aggressive on habitability and procedural defenses.",
          firstTwoFee: 550,
          thirdFee: 275,
          message:
            "I'd start by challenging the sufficiency of the detainer and the fee disclosures. Let's schedule a quick call to walk through your documents.",
        },
      ];

      let added = 0;
      for (const a of demoAttorneys) {
        const profile = await upsertAttorneyProfile(-1 * (added + 1000), {
          // userId is a synthetic negative number so it never collides with a
          // real Manus user; these profiles exist only to back demo bids.
          firmName: a.firmName,
          fullName: a.fullName,
          bio: a.bio,
          barNumber: `TN-DEMO-${1000 + added}`,
          barState: "TN",
          yearAdmitted: 2012 + added,
          jurisdictions: [PRIMARY_JURISDICTION],
          goodStandingCertified: true,
          verificationStatus: "verified",
          onboardingComplete: true,
        });
        if (!profile) continue;
        await createBid({
          caseId: target.id,
          attorneyId: profile.id,
          firstTwoFee: a.firstTwoFee,
          thirdFee: a.thirdFee,
          message: a.message,
          status: "submitted",
        });
        added++;
      }

      return { success: true, added };
    }),
});

export type DemoRouter = typeof demoRouter;
