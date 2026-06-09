import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  attorneyProfiles,
  bids,
  caseDocuments,
  chatIntakes,
  clientCases,
  consultations,
  courtRecords,
  messages,
  payments,
  users,
  type InsertAttorneyProfile,
  type InsertBid,
  type InsertCaseDocument,
  type InsertChatIntake,
  type InsertClientCase,
  type InsertConsultation,
  type InsertCourtRecord,
  type InsertMessage,
  type InsertPayment,
  type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

/* ----------------------------- Users ----------------------------- */

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await requireDb();
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function setUserRole(userId: number, role: "user" | "admin" | "attorney" | "client") {
  const db = await requireDb();
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

/* ----------------------- Attorney Profiles ----------------------- */

export async function getAttorneyProfileByUserId(userId: number) {
  const db = await requireDb();
  const result = await db.select().from(attorneyProfiles).where(eq(attorneyProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAttorneyProfileById(id: number) {
  const db = await requireDb();
  const result = await db.select().from(attorneyProfiles).where(eq(attorneyProfiles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertAttorneyProfile(userId: number, data: Partial<InsertAttorneyProfile>) {
  const db = await requireDb();
  const existing = await getAttorneyProfileByUserId(userId);
  if (existing) {
    await db.update(attorneyProfiles).set(data).where(eq(attorneyProfiles.userId, userId));
    return getAttorneyProfileByUserId(userId);
  }
  await db.insert(attorneyProfiles).values({ userId, ...data });
  return getAttorneyProfileByUserId(userId);
}

export async function addAttorneyClientSlots(attorneyId: number, slots: number) {
  const db = await requireDb();
  const profile = await getAttorneyProfileById(attorneyId);
  if (!profile) throw new Error("Attorney profile not found");
  await db
    .update(attorneyProfiles)
    .set({ clientSlotsPurchased: profile.clientSlotsPurchased + slots })
    .where(eq(attorneyProfiles.id, attorneyId));
}

/* --------------------------- Client Cases ------------------------ */

export async function listAvailableCases() {
  const db = await requireDb();
  return db
    .select()
    .from(clientCases)
    .where(inArray(clientCases.status, ["available", "bidding"]))
    .orderBy(desc(clientCases.createdAt));
}

export async function getCaseById(id: number) {
  const db = await requireDb();
  const result = await db.select().from(clientCases).where(eq(clientCases.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCaseByClientUserId(clientUserId: number) {
  const db = await requireDb();
  const result = await db
    .select()
    .from(clientCases)
    .where(eq(clientCases.clientUserId, clientUserId))
    .orderBy(desc(clientCases.createdAt));
  return result;
}

export async function createClientCase(data: InsertClientCase) {
  const db = await requireDb();
  const [res] = await db.insert(clientCases).values(data).$returningId();
  return getCaseById(res.id);
}

export async function updateCaseStatus(caseId: number, status: "available" | "bidding" | "represented" | "closed", attorneyId?: number) {
  const db = await requireDb();
  const set: Record<string, unknown> = { status };
  if (attorneyId !== undefined) set.representedByAttorneyId = attorneyId;
  await db.update(clientCases).set(set).where(eq(clientCases.id, caseId));
}

export async function setCaseOnboardingPaid(caseId: number, paid: boolean) {
  const db = await requireDb();
  await db.update(clientCases).set({ onboardingPaid: paid }).where(eq(clientCases.id, caseId));
}

/* -------------------------- Documents ---------------------------- */

export async function listCaseDocuments(caseId: number) {
  const db = await requireDb();
  return db.select().from(caseDocuments).where(eq(caseDocuments.caseId, caseId)).orderBy(desc(caseDocuments.createdAt));
}

export async function createCaseDocument(data: InsertCaseDocument) {
  const db = await requireDb();
  await db.insert(caseDocuments).values(data);
}

/* ------------------------ Court Records -------------------------- */

export async function listCourtRecords(caseId: number) {
  const db = await requireDb();
  return db.select().from(courtRecords).where(eq(courtRecords.caseId, caseId)).orderBy(desc(courtRecords.filingDate));
}

export async function createCourtRecord(data: InsertCourtRecord) {
  const db = await requireDb();
  await db.insert(courtRecords).values(data);
}

/* ----------------------------- Bids ------------------------------ */

export async function listBidsForCase(caseId: number) {
  const db = await requireDb();
  return db.select().from(bids).where(eq(bids.caseId, caseId)).orderBy(desc(bids.createdAt));
}

export async function listBidsByAttorney(attorneyId: number) {
  const db = await requireDb();
  return db.select().from(bids).where(eq(bids.attorneyId, attorneyId)).orderBy(desc(bids.createdAt));
}

export async function getBidById(id: number) {
  const db = await requireDb();
  const result = await db.select().from(bids).where(eq(bids.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getExistingBid(caseId: number, attorneyId: number) {
  const db = await requireDb();
  const result = await db
    .select()
    .from(bids)
    .where(and(eq(bids.caseId, caseId), eq(bids.attorneyId, attorneyId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createBid(data: InsertBid) {
  const db = await requireDb();
  const [res] = await db.insert(bids).values(data).$returningId();
  return getBidById(res.id);
}

export async function updateBidStatus(bidId: number, status: "submitted" | "viewed" | "accepted" | "declined" | "withdrawn") {
  const db = await requireDb();
  await db.update(bids).set({ status }).where(eq(bids.id, bidId));
}

export async function declineOtherBids(caseId: number, acceptedBidId: number) {
  const db = await requireDb();
  await db
    .update(bids)
    .set({ status: "declined" })
    .where(and(eq(bids.caseId, caseId), ne(bids.id, acceptedBidId)));
}

/* --------------------------- Messages ---------------------------- */

export async function listMessagesForBid(bidId: number) {
  const db = await requireDb();
  return db.select().from(messages).where(eq(messages.bidId, bidId)).orderBy(messages.createdAt);
}

export async function createMessage(data: InsertMessage) {
  const db = await requireDb();
  const [res] = await db.insert(messages).values(data).$returningId();
  const result = await db.select().from(messages).where(eq(messages.id, res.id)).limit(1);
  return result[0];
}

/* ------------------------ Consultations -------------------------- */

export async function listConsultationsByClient(clientUserId: number) {
  const db = await requireDb();
  return db.select().from(consultations).where(eq(consultations.clientUserId, clientUserId)).orderBy(desc(consultations.scheduledAt));
}

export async function listConsultationsByAttorney(attorneyId: number) {
  const db = await requireDb();
  return db.select().from(consultations).where(eq(consultations.attorneyId, attorneyId)).orderBy(desc(consultations.scheduledAt));
}

export async function getConsultationById(id: number) {
  const db = await requireDb();
  const result = await db.select().from(consultations).where(eq(consultations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createConsultation(data: InsertConsultation) {
  const db = await requireDb();
  const [res] = await db.insert(consultations).values(data).$returningId();
  return getConsultationById(res.id);
}

export async function updateConsultationStatus(id: number, status: "pending_payment" | "scheduled" | "completed" | "cancelled", paymentId?: number) {
  const db = await requireDb();
  const set: Record<string, unknown> = { status };
  if (paymentId !== undefined) set.paymentId = paymentId;
  await db.update(consultations).set(set).where(eq(consultations.id, id));
}

/* ---------------------------- Payments --------------------------- */

export async function createPayment(data: InsertPayment) {
  const db = await requireDb();
  const [res] = await db.insert(payments).values(data).$returningId();
  const result = await db.select().from(payments).where(eq(payments.id, res.id)).limit(1);
  return result[0];
}

export async function getPaymentById(id: number) {
  const db = await requireDb();
  const result = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPaymentBySessionId(sessionId: string) {
  const db = await requireDb();
  const result = await db.select().from(payments).where(eq(payments.stripeSessionId, sessionId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePaymentStatus(id: number, status: "pending" | "paid" | "failed" | "refunded", paymentIntentId?: string) {
  const db = await requireDb();
  const set: Record<string, unknown> = { status };
  if (paymentIntentId !== undefined) set.stripePaymentIntentId = paymentIntentId;
  await db.update(payments).set(set).where(eq(payments.id, id));
}

export async function listPaymentsByUser(userId: number) {
  const db = await requireDb();
  return db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
}

/* -------------------------- Chat Intakes ------------------------- */

export async function createChatIntake(data: InsertChatIntake) {
  const db = await requireDb();
  const [res] = await db.insert(chatIntakes).values(data).$returningId();
  const result = await db.select().from(chatIntakes).where(eq(chatIntakes.id, res.id)).limit(1);
  return result[0];
}

export async function listChatIntakes() {
  const db = await requireDb();
  return db.select().from(chatIntakes).orderBy(desc(chatIntakes.createdAt));
}

/* ----------------------------- Seed ------------------------------ */

export async function countCases() {
  const db = await requireDb();
  const rows = await db.select().from(clientCases);
  return rows.length;
}
