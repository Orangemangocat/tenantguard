import { describe, expect, it } from "vitest";
import { PRIMARY_JURISDICTION, normalizeAttorneyQuantity, attorneyPurchaseTotal, PRICING } from "../shared/appConstants";

/**
 * Pure checks for the credential-gating + purchase rules that back the
 * attorney onboarding and bidding procedures.
 */

/** An attorney may only bid on a case in a county they have certified. */
function canBidOnCase(attorneyJurisdictions: string[], caseCounty: string, verified: boolean): boolean {
  return verified && attorneyJurisdictions.includes(caseCounty);
}

describe("Attorney credential gating", () => {
  it("allows bidding only when verified and licensed in the case county", () => {
    expect(canBidOnCase([PRIMARY_JURISDICTION], PRIMARY_JURISDICTION, true)).toBe(true);
  });

  it("blocks bidding when not verified", () => {
    expect(canBidOnCase([PRIMARY_JURISDICTION], PRIMARY_JURISDICTION, false)).toBe(false);
  });

  it("blocks bidding when the attorney is not licensed in the case county", () => {
    expect(canBidOnCase(["Shelby County, TN"], PRIMARY_JURISDICTION, true)).toBe(false);
  });
});

describe("Attorney purchase minimum", () => {
  it("enforces the 2-client minimum purchase", () => {
    expect(normalizeAttorneyQuantity(1)).toBe(PRICING.ATTORNEY_MIN_CLIENTS);
    expect(normalizeAttorneyQuantity(0)).toBe(PRICING.ATTORNEY_MIN_CLIENTS);
    expect(normalizeAttorneyQuantity(5)).toBe(5);
  });

  it("computes purchase totals at $100/client respecting the minimum", () => {
    expect(attorneyPurchaseTotal(1)).toBe(200);
    expect(attorneyPurchaseTotal(2)).toBe(200);
    expect(attorneyPurchaseTotal(4)).toBe(400);
  });
});
