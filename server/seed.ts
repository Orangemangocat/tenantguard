import { countCases, createCaseDocument, createClientCase, createCourtRecord } from "./db";

type SeedDoc = { title: string; docType: string; description: string };
type SeedRecord = {
  caseNumber: string;
  court: string;
  filingDate: Date;
  partyPlaintiff: string;
  partyDefendant: string;
  actionType: string;
  disposition: string;
  outcome: string;
};
type SeedCase = {
  tenantName: string;
  displayName: string;
  caseType: string;
  propertyAddress: string;
  county: string;
  state: string;
  monthlyRent: number;
  caseSummary: string;
  landlordName: string;
  hearingDaysFromNow: number;
  documents: SeedDoc[];
  courtRecords: SeedRecord[];
};

const daysFromNow = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

const SEED_CASES: SeedCase[] = [
  {
    tenantName: "Maria Gonzalez",
    displayName: "Maria G.",
    caseType: "Eviction - Non Payment",
    propertyAddress: "1423 Dickerson Pike, Unit 4B, Nashville, TN 37207",
    county: "Davidson County, TN",
    state: "TN",
    monthlyRent: 1250,
    caseSummary:
      "Single mother of two facing a detainer warrant for non-payment after a temporary job loss. She has since regained employment and can resume payments. Landlord refused a payment plan. Tenant disputes $180 in late fees that were never disclosed in the lease.",
    landlordName: "Ridgecrest Property Holdings LLC",
    hearingDaysFromNow: 9,
    documents: [
      { title: "Residential Lease Agreement", docType: "Lease", description: "12-month lease signed Mar 2024, $1,250/mo. No late-fee schedule attached." },
      { title: "Detainer Warrant", docType: "Eviction Notice", description: "Detainer warrant served for non-payment of April and May rent." },
      { title: "Payment History (Bank Records)", docType: "Payment Receipt", description: "Bank statements showing 13 consecutive on-time payments before the gap." },
      { title: "Termination Letter from Employer", docType: "Supporting Evidence", description: "Confirms temporary layoff that caused the missed payments." },
    ],
    courtRecords: [
      {
        caseNumber: "23GT-4471",
        court: "Davidson County General Sessions Court",
        filingDate: daysAgo(420),
        partyPlaintiff: "Ridgecrest Property Holdings LLC",
        partyDefendant: "Maria Gonzalez",
        actionType: "Detainer Warrant (Non-Payment)",
        disposition: "Dismissed",
        outcome: "Prior 2023 action by the SAME landlord against this tenant was dismissed after tenant cured the balance. Establishes a pattern of aggressive filing.",
      },
      {
        caseNumber: "22GT-9920",
        court: "Davidson County General Sessions Court",
        filingDate: daysAgo(700),
        partyPlaintiff: "Ridgecrest Property Holdings LLC",
        partyDefendant: "Daniel Pruitt (prior tenant, same unit)",
        actionType: "Detainer Warrant (Non-Payment)",
        disposition: "Judgment for Plaintiff",
        outcome: "Same landlord, same unit, repeated filings — relevant to a pattern-of-practice argument.",
      },
    ],
  },
  {
    tenantName: "James Whitfield",
    displayName: "James W.",
    caseType: "Eviction - Lease Violation",
    propertyAddress: "905 Gallatin Ave, Unit 2, Nashville, TN 37206",
    county: "Davidson County, TN",
    state: "TN",
    monthlyRent: 1600,
    caseSummary:
      "Tenant accused of an unauthorized occupant (his adult son recovering from surgery). Lease language is ambiguous about guests vs. occupants. Tenant has a spotless 4-year payment record and seeks to avoid an eviction on his record.",
    landlordName: "East Nash Rentals Inc.",
    hearingDaysFromNow: 14,
    documents: [
      { title: "Residential Lease Agreement", docType: "Lease", description: "Lease with ambiguous 'guest' clause; no defined occupancy limit." },
      { title: "Notice to Cure or Quit", docType: "Eviction Notice", description: "14-day notice alleging unauthorized occupant." },
      { title: "Medical Documentation", docType: "Supporting Evidence", description: "Hospital discharge papers for tenant's son showing temporary recovery stay." },
    ],
    courtRecords: [
      {
        caseNumber: "24GT-1180",
        court: "Davidson County General Sessions Court",
        filingDate: daysAgo(120),
        partyPlaintiff: "East Nash Rentals Inc.",
        partyDefendant: "Sandra Mills (different tenant)",
        actionType: "Detainer Warrant (Lease Violation)",
        disposition: "Settled",
        outcome: "Same landlord has filed lease-violation actions against multiple tenants in this building in the past year.",
      },
    ],
  },
  {
    tenantName: "Aisha Bello",
    displayName: "Aisha B.",
    caseType: "Habitability / Repairs",
    propertyAddress: "212 Antioch Pike, Unit 7C, Nashville, TN 37211",
    county: "Davidson County, TN",
    state: "TN",
    monthlyRent: 1100,
    caseSummary:
      "Tenant withheld partial rent after months of unaddressed mold and a non-functioning furnace through winter. Landlord responded with a non-payment detainer. Strong habitability counterclaim with photo evidence and code-violation report.",
    landlordName: "Pike Avenue Management",
    hearingDaysFromNow: 6,
    documents: [
      { title: "Residential Lease Agreement", docType: "Lease", description: "Standard 12-month lease, landlord responsible for HVAC and structural repairs." },
      { title: "Detainer Warrant", docType: "Eviction Notice", description: "Non-payment detainer for two months of withheld rent." },
      { title: "Code Violation Report", docType: "Supporting Evidence", description: "Metro Codes inspection citing mold and inoperable furnace." },
      { title: "Repair Request Emails", docType: "Correspondence", description: "Five documented repair requests over four months with no response." },
      { title: "Photographic Evidence", docType: "Supporting Evidence", description: "Dated photos of mold growth and broken furnace." },
    ],
    courtRecords: [
      {
        caseNumber: "21GT-3344",
        court: "Davidson County General Sessions Court",
        filingDate: daysAgo(950),
        partyPlaintiff: "Pike Avenue Management",
        partyDefendant: "Aisha Bello",
        actionType: "Detainer Warrant (Non-Payment)",
        disposition: "Dismissed",
        outcome: "Earlier action by the same landlord against this tenant was dismissed; supports retaliation argument.",
      },
    ],
  },
  {
    tenantName: "Robert Tran",
    displayName: "Robert T.",
    caseType: "Holdover Proceeding",
    propertyAddress: "3300 Nolensville Pike, Unit 11, Nashville, TN 37211",
    county: "Davidson County, TN",
    state: "TN",
    monthlyRent: 1450,
    caseSummary:
      "Month-to-month tenant served a 30-day notice that may not comply with TN notice requirements. Tenant needs time to relocate and is contesting the sufficiency of the notice and improperly withheld security deposit.",
    landlordName: "Southside Holdings LLC",
    hearingDaysFromNow: 11,
    documents: [
      { title: "Month-to-Month Agreement", docType: "Lease", description: "Converted to month-to-month after initial term." },
      { title: "30-Day Notice to Vacate", docType: "Eviction Notice", description: "Notice with a potentially defective service date." },
      { title: "Security Deposit Receipt", docType: "Payment Receipt", description: "$1,450 deposit paid at move-in; not yet returned." },
    ],
    courtRecords: [],
  },
  {
    tenantName: "Deja Coleman",
    displayName: "Deja C.",
    caseType: "Illegal Lockout",
    propertyAddress: "78 Lafayette St, Unit 1A, Nashville, TN 37210",
    county: "Davidson County, TN",
    state: "TN",
    monthlyRent: 980,
    caseSummary:
      "Landlord changed the locks and removed tenant's belongings without a court order — a self-help eviction prohibited under TN law. Tenant seeks emergency restoration of possession and damages.",
    landlordName: "Lafayette Street Properties",
    hearingDaysFromNow: 3,
    documents: [
      { title: "Residential Lease Agreement", docType: "Lease", description: "Active lease through end of year." },
      { title: "Photos of Changed Locks", docType: "Supporting Evidence", description: "Time-stamped photos of new locks and removed belongings." },
      { title: "Police Report", docType: "Supporting Evidence", description: "Report filed documenting the lockout." },
      { title: "Text Messages from Landlord", docType: "Correspondence", description: "Landlord admitting to changing the locks." },
    ],
    courtRecords: [
      {
        caseNumber: "24GT-5567",
        court: "Davidson County General Sessions Court",
        filingDate: daysAgo(60),
        partyPlaintiff: "Lafayette Street Properties",
        partyDefendant: "Marcus Webb (different tenant, same complex)",
        actionType: "Detainer Warrant (Non-Payment)",
        disposition: "Judgment for Plaintiff",
        outcome: "Same landlord has a history of aggressive and sometimes extra-judicial removal practices.",
      },
    ],
  },
  {
    tenantName: "Olivia Park",
    displayName: "Olivia P.",
    caseType: "Eviction - Nuisance",
    propertyAddress: "560 Murfreesboro Pike, Unit 9, Nashville, TN 37210",
    county: "Davidson County, TN",
    state: "TN",
    monthlyRent: 1320,
    caseSummary:
      "Tenant accused of nuisance based on noise complaints that appear to originate from a neighboring unit. Tenant has counter-documentation and witness statements. Seeks to avoid eviction and clear her rental record.",
    landlordName: "Gateway Residential Group",
    hearingDaysFromNow: 18,
    documents: [
      { title: "Residential Lease Agreement", docType: "Lease", description: "Standard 12-month lease." },
      { title: "Nuisance Notice", docType: "Eviction Notice", description: "Notice citing repeated noise complaints." },
      { title: "Witness Statements", docType: "Supporting Evidence", description: "Two neighbors attest the noise came from a different unit." },
    ],
    courtRecords: [],
  },
];

export async function seedDemoData(force = false): Promise<{ seeded: boolean; cases: number }> {
  const existing = await countCases();
  if (existing > 0 && !force) {
    return { seeded: false, cases: existing };
  }

  let created = 0;
  for (const sc of SEED_CASES) {
    const created_case = await createClientCase({
      tenantName: sc.tenantName,
      displayName: sc.displayName,
      caseType: sc.caseType,
      propertyAddress: sc.propertyAddress,
      county: sc.county,
      state: sc.state,
      monthlyRent: sc.monthlyRent,
      caseSummary: sc.caseSummary,
      landlordName: sc.landlordName,
      hearingDate: daysFromNow(sc.hearingDaysFromNow),
      status: "available",
      onboardingPaid: true,
    });
    if (!created_case) continue;
    created++;
    for (const doc of sc.documents) {
      await createCaseDocument({
        caseId: created_case.id,
        title: doc.title,
        docType: doc.docType,
        description: doc.description,
      });
    }
    for (const rec of sc.courtRecords) {
      await createCourtRecord({
        caseId: created_case.id,
        caseNumber: rec.caseNumber,
        court: rec.court,
        filingDate: rec.filingDate,
        partyPlaintiff: rec.partyPlaintiff,
        partyDefendant: rec.partyDefendant,
        actionType: rec.actionType,
        disposition: rec.disposition,
        outcome: rec.outcome,
      });
    }
  }
  return { seeded: true, cases: created };
}
