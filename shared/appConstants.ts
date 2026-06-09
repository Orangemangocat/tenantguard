/**
 * Shared business constants for TenantGuard Attorney Portal.
 * All amounts are in whole US dollars.
 */

export const PRICING = {
  /** Client onboarding fee to be matched with attorneys */
  CLIENT_ONBOARDING: 250,
  /** Attorney pays this per client slot purchased */
  ATTORNEY_PER_CLIENT: 100,
  /** Minimum number of client slots an attorney must purchase initially */
  ATTORNEY_MIN_CLIENTS: 2,
  /** 30-minute consultation call fee (credited toward attorney fees) */
  CONSULTATION_FEE: 25,
  CONSULTATION_MINUTES: 30,
} as const;

/** Compute attorney purchase total enforcing the 2-client minimum. */
export function attorneyPurchaseTotal(quantity: number): number {
  const qty = Math.max(quantity, PRICING.ATTORNEY_MIN_CLIENTS);
  return qty * PRICING.ATTORNEY_PER_CLIENT;
}

/** Normalize requested attorney client quantity to enforce minimum. */
export function normalizeAttorneyQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return PRICING.ATTORNEY_MIN_CLIENTS;
  return Math.max(Math.floor(quantity), PRICING.ATTORNEY_MIN_CLIENTS);
}

/**
 * Counties / jurisdictions an attorney can certify to practice in.
 * Davidson County (TN) is the primary launch market.
 */
export const JURISDICTIONS = [
  "Davidson County, TN",
  "Williamson County, TN",
  "Rutherford County, TN",
  "Wilson County, TN",
  "Sumner County, TN",
  "Shelby County, TN",
  "Knox County, TN",
  "Hamilton County, TN",
] as const;

export type Jurisdiction = (typeof JURISDICTIONS)[number];

export const PRIMARY_JURISDICTION = "Davidson County, TN";

export const CASE_TYPES = [
  "Eviction - Non Payment",
  "Eviction - Lease Violation",
  "Holdover Proceeding",
  "Eviction - Nuisance",
  "Illegal Lockout",
  "Habitability / Repairs",
] as const;

export const CONTACT_REASONS = [
  "I have questions before signing up",
  "There is an issue with my existing case",
  "I would like to know the status of my case",
  "I want to talk to an attorney",
  "Other",
] as const;
