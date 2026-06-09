import {
  addAttorneyClientSlots,
  getAttorneyProfileByUserId,
  getPaymentBySessionId,
  setCaseOnboardingPaid,
  updateConsultationStatus,
  updatePaymentStatus,
} from "./db";

/**
 * Apply the business side-effects of a paid checkout session.
 * Shared by the client-side verifySession path and the Stripe webhook so
 * fulfillment logic lives in exactly one place. Idempotent: a payment that
 * is already "paid" is skipped.
 */
export async function fulfillPaidSession(
  sessionId: string,
  paymentIntentId?: string,
): Promise<{ applied: boolean; kind?: string; alreadyApplied?: boolean }> {
  const payment = await getPaymentBySessionId(sessionId);
  if (!payment) return { applied: false };
  if (payment.status === "paid") {
    return { applied: false, kind: payment.kind, alreadyApplied: true };
  }

  await updatePaymentStatus(payment.id, "paid", paymentIntentId);

  const meta = (payment.metadata ?? {}) as Record<string, unknown>;
  if (payment.kind === "client_onboarding") {
    const caseId = Number(meta.caseId);
    if (caseId) await setCaseOnboardingPaid(caseId, true);
  } else if (payment.kind === "attorney_clients") {
    const profile = await getAttorneyProfileByUserId(payment.userId);
    if (profile) await addAttorneyClientSlots(profile.id, payment.quantity);
  } else if (payment.kind === "consultation") {
    const consultationId = Number(meta.consultationId);
    if (consultationId) await updateConsultationStatus(consultationId, "scheduled", payment.id);
  }
  return { applied: true, kind: payment.kind, alreadyApplied: false };
}
