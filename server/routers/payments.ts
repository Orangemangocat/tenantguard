import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { PRICING, attorneyPurchaseTotal, normalizeAttorneyQuantity } from "@shared/appConstants";
import {
  createPayment,
  getAttorneyProfileByUserId,
  getCaseById,
  getConsultationById,
  getPaymentById,
  getPaymentBySessionId,
  listPaymentsByUser,
} from "../db";
import { createCheckoutSession, isStripeConfigured, retrieveCheckoutSession } from "../stripe";
import { fulfillPaidSession } from "../fulfillment";
import { protectedProcedure, router } from "../_core/trpc";

export const paymentsRouter = router({
  /** Whether Stripe is configured (test mode). */
  status: protectedProcedure.query(() => ({ configured: isStripeConfigured() })),

  /** History of the current user's payments. */
  myPayments: protectedProcedure.query(async ({ ctx }) => {
    return listPaymentsByUser(ctx.user.id);
  }),

  /**
   * Client onboarding payment ($250). Ties payment to a specific case.
   */
  startClientOnboarding: protectedProcedure
    .input(z.object({ caseId: z.number().int(), origin: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      if (!isStripeConfigured()) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Stripe is not configured yet." });
      }
      const c = await getCaseById(input.caseId);
      if (!c || c.clientUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your case." });
      }
      const payment = await createPayment({
        userId: ctx.user.id,
        kind: "client_onboarding",
        amount: PRICING.CLIENT_ONBOARDING,
        quantity: 1,
        status: "pending",
        metadata: { caseId: input.caseId },
      });
      const session = await createCheckoutSession({
        lineItems: [
          {
            name: "TenantGuard Client Onboarding",
            description: "One-time fee to be matched with a vetted eviction-defense attorney.",
            amountCents: PRICING.CLIENT_ONBOARDING * 100,
            quantity: 1,
          },
        ],
        successUrl: `${input.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&pid=${payment.id}`,
        cancelUrl: `${input.origin}/client/case/${input.caseId}?canceled=1`,
        clientReferenceId: String(payment.id),
        customerEmail: ctx.user.email ?? undefined,
        metadata: { paymentId: String(payment.id), kind: "client_onboarding", caseId: String(input.caseId) },
      });
      await setSession(payment.id, session.id);
      return { url: session.url, paymentId: payment.id };
    }),

  /**
   * Attorney client-access purchase ($100/client, min 2).
   */
  startAttorneyPurchase: protectedProcedure
    .input(z.object({ quantity: z.number().int().min(1), origin: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      if (!isStripeConfigured()) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Stripe is not configured yet." });
      }
      const profile = await getAttorneyProfileByUserId(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "FORBIDDEN", message: "Complete attorney onboarding first." });
      const qty = normalizeAttorneyQuantity(input.quantity);
      const total = attorneyPurchaseTotal(qty);
      const payment = await createPayment({
        userId: ctx.user.id,
        kind: "attorney_clients",
        amount: total,
        quantity: qty,
        status: "pending",
        metadata: { attorneyId: profile.id },
      });
      const session = await createCheckoutSession({
        lineItems: [
          {
            name: "TenantGuard Client Access",
            description: `Access to ${qty} tenant client${qty > 1 ? "s" : ""} ($${PRICING.ATTORNEY_PER_CLIENT} each, ${PRICING.ATTORNEY_MIN_CLIENTS}-client minimum).`,
            amountCents: PRICING.ATTORNEY_PER_CLIENT * 100,
            quantity: qty,
          },
        ],
        successUrl: `${input.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&pid=${payment.id}`,
        cancelUrl: `${input.origin}/attorney/billing?canceled=1`,
        clientReferenceId: String(payment.id),
        customerEmail: ctx.user.email ?? undefined,
        metadata: { paymentId: String(payment.id), kind: "attorney_clients", quantity: String(qty) },
      });
      await setSession(payment.id, session.id);
      return { url: session.url, paymentId: payment.id, quantity: qty, total };
    }),

  /**
   * Consultation payment ($25, credited toward attorney fees).
   */
  startConsultationPayment: protectedProcedure
    .input(z.object({ consultationId: z.number().int(), origin: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      if (!isStripeConfigured()) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Stripe is not configured yet." });
      }
      const consult = await getConsultationById(input.consultationId);
      if (!consult || consult.clientUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your consultation." });
      }
      const payment = await createPayment({
        userId: ctx.user.id,
        kind: "consultation",
        amount: PRICING.CONSULTATION_FEE,
        quantity: 1,
        status: "pending",
        metadata: { consultationId: input.consultationId },
      });
      const session = await createCheckoutSession({
        lineItems: [
          {
            name: "30-Minute Attorney Consultation",
            description: "Credited toward your attorney's representation fees.",
            amountCents: PRICING.CONSULTATION_FEE * 100,
            quantity: 1,
          },
        ],
        successUrl: `${input.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&pid=${payment.id}`,
        cancelUrl: `${input.origin}/client?canceled=1`,
        clientReferenceId: String(payment.id),
        customerEmail: ctx.user.email ?? undefined,
        metadata: { paymentId: String(payment.id), kind: "consultation", consultationId: String(input.consultationId) },
      });
      await setSession(payment.id, session.id);
      return { url: session.url, paymentId: payment.id };
    }),

  /**
   * Verify a checkout session after redirect and apply business effects.
   * Idempotent: re-running on an already-paid payment is a no-op.
   */
  verifySession: protectedProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const payment = await getPaymentBySessionId(input.sessionId);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found." });
      if (payment.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your payment." });
      }
      if (payment.status === "paid") {
        return { status: "paid", kind: payment.kind, alreadyApplied: true };
      }
      const session = await retrieveCheckoutSession(input.sessionId);
      if (session.payment_status !== "paid") {
        return { status: session.payment_status, kind: payment.kind, alreadyApplied: false };
      }
      const result = await fulfillPaidSession(input.sessionId, session.payment_intent);
      return { status: "paid", kind: payment.kind, alreadyApplied: result.alreadyApplied ?? false };
    }),
});

/** Persist the stripe session id onto a payment row. */
async function setSession(paymentId: number, sessionId: string) {
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) return;
  const { payments } = await import("../../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  await db.update(payments).set({ stripeSessionId: sessionId }).where(eq(payments.id, paymentId));
}

export type PaymentsRouter = typeof paymentsRouter;
export { getPaymentById };
