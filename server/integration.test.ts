import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";

/**
 * Live-DB integration smoke test. Exercises the real demo provisioning,
 * bidding, and bid-viewing code paths through the tRPC routers using a
 * forged authenticated context. Skips automatically if no DATABASE_URL.
 */

function makeCtx(userId: number, openId: string, role: "user" | "attorney" | "client" | "admin", name: string): TrpcContext {
  return {
    user: {
      id: userId,
      openId,
      email: `${openId}@example.com`,
      name,
      loginMethod: "manus",
      role: role as "user" | "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: { origin: "https://test.local" } } as TrpcContext["req"],
    res: { clearCookie: () => {}, cookie: () => {} } as unknown as TrpcContext["res"],
  } as TrpcContext;
}

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("portal integration (live DB)", () => {
  it("provisions a demo attorney with usable slots", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();

    // Use a high synthetic user id unlikely to collide with real users.
    const ctx = makeCtx(990001, "test-attorney-990001", "user", "Test Attorney");

    // Ensure this user row exists so FK-free helpers behave.
    await db!.execute(
      `INSERT INTO users (id, openId, name, email, role) VALUES (990001, 'test-attorney-990001', 'Test Attorney', 'ta@example.com', 'user')
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    );

    const caller = appRouter.createCaller(ctx);
    const res = await caller.demo.becomeAttorney();
    expect(res.success).toBe(true);
    expect(res.attorneyId).toBeGreaterThan(0);

    // Attorney should now be able to list available cases (6 seeded).
    const cases = await caller.attorney.availableCases();
    expect(Array.isArray(cases)).toBe(true);
    expect(cases.length).toBeGreaterThanOrEqual(1);
  });

  it("provisions a demo client case with documents, court records, and bids", async () => {
    const db = await getDb();
    const ctx = makeCtx(990002, "test-client-990002", "user", "Test Client");
    await db!.execute(
      `INSERT INTO users (id, openId, name, email, role) VALUES (990002, 'test-client-990002', 'Test Client', 'tc@example.com', 'user')
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    );

    const caller = appRouter.createCaller(ctx);
    const caseRes = await caller.demo.becomeClientWithCase();
    expect(caseRes.success).toBe(true);
    expect(caseRes.caseId).toBeGreaterThan(0);

    const bidRes = await caller.demo.seedBidsForMyCase({ caseId: caseRes.caseId });
    expect(bidRes.success).toBe(true);

    // Client dashboard should surface the case and its bids.
    const myCases = await caller.clientPortal.myCases();
    expect(myCases.length).toBeGreaterThanOrEqual(1);

    const detail = await caller.clientPortal.caseDetail({ caseId: caseRes.caseId });
    expect(detail.case.id).toBe(caseRes.caseId);
    expect(detail.documents.length).toBeGreaterThanOrEqual(1);
    expect(detail.courtRecords.length).toBeGreaterThanOrEqual(1);
    expect(detail.bids.length).toBeGreaterThanOrEqual(1);
    // Each bid must distinguish first-two fee from third-appearance fee.
    for (const b of detail.bids) {
      expect(b.firstTwoFee).toBeGreaterThan(0);
      expect(b.thirdFee).toBeGreaterThan(0);
    }
  });
});
