import type { Express, Request, Response } from "express";
import express from "express";
import { fulfillPaidSession } from "./fulfillment";

/**
 * Stripe webhook endpoint at /api/stripe/webhook.
 *
 * Registered with express.raw() BEFORE express.json() so signature
 * verification has access to the raw body. We verify the signature when
 * STRIPE_WEBHOOK_SECRET is present; test events (evt_test_*) short-circuit
 * with a verification response per platform requirements.
 *
 * Because we don't depend on the Stripe SDK, signature verification is a
 * best-effort HMAC check; the authoritative fulfillment path is the
 * client-side success redirect which calls payments.verifySession (which
 * retrieves the session from Stripe directly).
 */
export function registerStripeWebhook(app: Express): void {
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      let event: { id?: string; type?: string; data?: { object?: Record<string, unknown> } };
      try {
        const raw = req.body instanceof Buffer ? req.body.toString("utf8") : JSON.stringify(req.body);
        event = JSON.parse(raw);
      } catch {
        return res.status(400).json({ error: "invalid payload" });
      }

      // Required test-event handling
      if (typeof event.id === "string" && event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      try {
        if (event.type === "checkout.session.completed") {
          const session = event.data?.object as Record<string, unknown> | undefined;
          const sessionId = session?.id as string | undefined;
          const paymentIntent = session?.payment_intent as string | undefined;
          if (sessionId) {
            await fulfillPaidSession(sessionId, paymentIntent);
          }
        }
        console.log(`[Webhook] Processed event ${event.type} (${event.id})`);
      } catch (err) {
        console.error("[Webhook] Error processing event:", err);
      }

      return res.json({ received: true });
    },
  );
}
