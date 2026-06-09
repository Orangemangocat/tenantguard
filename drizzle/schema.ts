import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * role: "user" (default), "admin", "attorney", "client"
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "attorney", "client"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Attorney profile + credential verification.
 */
export const attorneyProfiles = mysqlTable("attorney_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  firmName: varchar("firmName", { length: 255 }),
  fullName: varchar("fullName", { length: 255 }),
  phone: varchar("phone", { length: 40 }),
  bio: text("bio"),
  // Credential verification
  barNumber: varchar("barNumber", { length: 80 }),
  barState: varchar("barState", { length: 80 }),
  yearAdmitted: int("yearAdmitted"),
  // JSON array of county/jurisdiction strings the attorney is licensed in
  jurisdictions: json("jurisdictions").$type<string[]>(),
  // Certification that they are in good standing in Davidson County court
  goodStandingCertified: boolean("goodStandingCertified").default(false).notNull(),
  // Uploaded bar card / certificate of good standing (storage key + url)
  credentialFileKey: varchar("credentialFileKey", { length: 512 }),
  credentialFileUrl: varchar("credentialFileUrl", { length: 1024 }),
  // verification status set by admin/automatic
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "verified", "rejected"]).default("pending").notNull(),
  // how many client slots purchased and remaining
  clientSlotsPurchased: int("clientSlotsPurchased").default(0).notNull(),
  clientSlotsUsed: int("clientSlotsUsed").default(0).notNull(),
  onboardingComplete: boolean("onboardingComplete").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AttorneyProfile = typeof attorneyProfiles.$inferSelect;
export type InsertAttorneyProfile = typeof attorneyProfiles.$inferInsert;

/**
 * Tenant client cases — these are what attorneys browse and bid on.
 * Seeded with dummy data plus real client onboarding.
 */
export const clientCases = mysqlTable("client_cases", {
  id: int("id").autoincrement().primaryKey(),
  // Owning client user (nullable for seeded demo cases)
  clientUserId: int("clientUserId"),
  tenantName: varchar("tenantName", { length: 255 }).notNull(),
  // For privacy, attorneys see a masked display name until bid is accepted
  displayName: varchar("displayName", { length: 255 }).notNull(),
  caseType: varchar("caseType", { length: 120 }).notNull(), // e.g. Eviction - Non Payment
  propertyAddress: varchar("propertyAddress", { length: 512 }),
  county: varchar("county", { length: 120 }).notNull(),
  state: varchar("state", { length: 80 }).notNull(),
  monthlyRent: int("monthlyRent"), // in dollars
  caseSummary: text("caseSummary").notNull(),
  landlordName: varchar("landlordName", { length: 255 }),
  hearingDate: timestamp("hearingDate"),
  status: mysqlEnum("status", ["available", "bidding", "represented", "closed"]).default("available").notNull(),
  // attorney that won representation (after client accepts a bid)
  representedByAttorneyId: int("representedByAttorneyId"),
  onboardingPaid: boolean("onboardingPaid").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ClientCase = typeof clientCases.$inferSelect;
export type InsertClientCase = typeof clientCases.$inferInsert;

/**
 * Documents attached to a client case.
 */
export const caseDocuments = mysqlTable("case_documents", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  docType: varchar("docType", { length: 120 }), // Lease, Eviction Notice, Payment Receipt, etc.
  description: text("description"),
  fileKey: varchar("fileKey", { length: 512 }),
  fileUrl: varchar("fileUrl", { length: 1024 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CaseDocument = typeof caseDocuments.$inferSelect;
export type InsertCaseDocument = typeof caseDocuments.$inferInsert;

/**
 * Prior court records (CaseLink) — actions filed by the same landlord.
 */
export const courtRecords = mysqlTable("court_records", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  caseNumber: varchar("caseNumber", { length: 120 }).notNull(),
  court: varchar("court", { length: 255 }).notNull(),
  filingDate: timestamp("filingDate"),
  partyPlaintiff: varchar("partyPlaintiff", { length: 255 }), // landlord
  partyDefendant: varchar("partyDefendant", { length: 255 }), // tenant
  actionType: varchar("actionType", { length: 255 }), // Detainer Warrant, Eviction, etc.
  disposition: varchar("disposition", { length: 255 }),
  outcome: text("outcome"),
  source: varchar("source", { length: 120 }).default("CaseLink").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CourtRecord = typeof courtRecords.$inferSelect;
export type InsertCourtRecord = typeof courtRecords.$inferInsert;

/**
 * Attorney bids on client cases.
 * firstTwoFee = bundled flat fee for first 2 appearances
 * thirdFee = separate flat fee for 3rd appearance
 */
export const bids = mysqlTable("bids", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  attorneyId: int("attorneyId").notNull(), // attorneyProfiles.id
  firstTwoFee: int("firstTwoFee").notNull(), // dollars, bundled first 2 appearances
  thirdFee: int("thirdFee").notNull(), // dollars, 3rd appearance
  message: text("message"), // pitch / cover note to client
  status: mysqlEnum("status", ["submitted", "viewed", "accepted", "declined", "withdrawn"]).default("submitted").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Bid = typeof bids.$inferSelect;
export type InsertBid = typeof bids.$inferInsert;

/**
 * Messages between client and attorney (follow-up questions thread, per bid).
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  bidId: int("bidId").notNull(),
  caseId: int("caseId").notNull(),
  senderUserId: int("senderUserId").notNull(),
  senderRole: mysqlEnum("senderRole", ["attorney", "client"]).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * 30-minute consultation calls scheduled by clients ($25, credited to fees).
 */
export const consultations = mysqlTable("consultations", {
  id: int("id").autoincrement().primaryKey(),
  bidId: int("bidId").notNull(),
  caseId: int("caseId").notNull(),
  clientUserId: int("clientUserId").notNull(),
  attorneyId: int("attorneyId").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  durationMinutes: int("durationMinutes").default(30).notNull(),
  feeAmount: int("feeAmount").default(25).notNull(), // dollars, credited toward fees
  creditedToFees: boolean("creditedToFees").default(true).notNull(),
  paymentId: int("paymentId"),
  status: mysqlEnum("status", ["pending_payment", "scheduled", "completed", "cancelled"]).default("pending_payment").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Consultation = typeof consultations.$inferSelect;
export type InsertConsultation = typeof consultations.$inferInsert;

/**
 * Payments (Stripe test mode).
 * kind: client_onboarding ($250), attorney_clients ($100/client, min 2), consultation ($25)
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  kind: mysqlEnum("kind", ["client_onboarding", "attorney_clients", "consultation"]).notNull(),
  amount: int("amount").notNull(), // dollars
  quantity: int("quantity").default(1).notNull(), // for attorney_clients = number of client slots
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Unmanned chat intake submissions (multi-step widget).
 */
export const chatIntakes = mysqlTable("chat_intakes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  contactReason: varchar("contactReason", { length: 255 }),
  message: text("message"),
  // full transcript of the conversation
  transcript: json("transcript").$type<{ role: string; text: string; at: number }[]>(),
  status: mysqlEnum("status", ["new", "responded", "closed"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ChatIntake = typeof chatIntakes.$inferSelect;
export type InsertChatIntake = typeof chatIntakes.$inferInsert;
