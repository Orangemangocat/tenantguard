import { describe, expect, it } from "vitest";
import {
  PRICING,
  attorneyPurchaseTotal,
  normalizeAttorneyQuantity,
  JURISDICTIONS,
  PRIMARY_JURISDICTION,
} from "../shared/appConstants";

describe("TenantGuard pricing", () => {
  it("uses the agreed price points", () => {
    expect(PRICING.CLIENT_ONBOARDING).toBe(250);
    expect(PRICING.ATTORNEY_PER_CLIENT).toBe(100);
    expect(PRICING.ATTORNEY_MIN_CLIENTS).toBe(2);
    expect(PRICING.CONSULTATION_FEE).toBe(25);
    expect(PRICING.CONSULTATION_MINUTES).toBe(30);
  });

  it("enforces the 2-client minimum purchase for attorneys", () => {
    // Requesting fewer than the minimum still charges for the minimum
    expect(attorneyPurchaseTotal(1)).toBe(200);
    expect(attorneyPurchaseTotal(0)).toBe(200);
    expect(attorneyPurchaseTotal(2)).toBe(200);
    // Above the minimum scales linearly at $100/client
    expect(attorneyPurchaseTotal(3)).toBe(300);
    expect(attorneyPurchaseTotal(5)).toBe(500);
  });

  it("normalizes requested attorney quantity to the minimum floor", () => {
    expect(normalizeAttorneyQuantity(1)).toBe(2);
    expect(normalizeAttorneyQuantity(2)).toBe(2);
    expect(normalizeAttorneyQuantity(4)).toBe(4);
    expect(normalizeAttorneyQuantity(3.9)).toBe(3);
    expect(normalizeAttorneyQuantity(NaN)).toBe(2);
  });
});

describe("Jurisdictions", () => {
  it("includes Davidson County, TN as the primary launch market", () => {
    expect(PRIMARY_JURISDICTION).toBe("Davidson County, TN");
    expect(JURISDICTIONS).toContain("Davidson County, TN");
  });
});
