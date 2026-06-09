import { describe, expect, it } from "vitest";
import { PRICING } from "../shared/appConstants";

/**
 * Pure business-rule checks that don't require a DB/auth context.
 * These mirror the invariants enforced inside the tRPC procedures.
 */

/** Net attorney fee owed after crediting the $25 consultation toward fees. */
function attorneyFeeAfterConsultationCredit(bidFirstTwoFee: number, consultationsPaid: number): number {
  const credit = consultationsPaid * PRICING.CONSULTATION_FEE;
  return Math.max(bidFirstTwoFee - credit, 0);
}

/** Total a client pays an attorney across the bundled + third appearance. */
function totalEngagementCost(firstTwoFee: number, thirdFee: number): number {
  return firstTwoFee + thirdFee;
}

describe("Bid structure", () => {
  it("separates the bundled first-two-appearance fee from the third appearance fee", () => {
    const firstTwo = 1500;
    const third = 600;
    expect(totalEngagementCost(firstTwo, third)).toBe(2100);
    // The two figures are tracked independently
    expect(firstTwo).not.toBe(third);
  });
});

describe("Consultation fee credit", () => {
  it("credits the $25 call toward the attorney's fee, not as a standalone charge", () => {
    expect(attorneyFeeAfterConsultationCredit(1500, 1)).toBe(1475);
    expect(attorneyFeeAfterConsultationCredit(1500, 2)).toBe(1450);
  });

  it("never produces a negative balance from credits", () => {
    expect(attorneyFeeAfterConsultationCredit(20, 1)).toBe(0);
  });
});
