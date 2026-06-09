/**
 * Stripe test-mode helper.
 *
 * Uses the Stripe REST API directly via fetch so we don't depend on the
 * Stripe Node SDK being installed. Reads STRIPE_SECRET_KEY from the
 * environment (set via webdev_request_secrets). If the key is missing,
 * checkout creation throws a clear error.
 */

const STRIPE_API = "https://api.stripe.com/v1";

function getSecretKey(): string | undefined {
  return process.env.STRIPE_SECRET_KEY;
}

export function isStripeConfigured(): boolean {
  return Boolean(getSecretKey());
}

/** Encode a nested object into application/x-www-form-urlencoded for Stripe. */
function encodeForm(obj: Record<string, unknown>, prefix = ""): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (typeof value === "object" && !Array.isArray(value)) {
      parts.push(encodeForm(value as Record<string, unknown>, fullKey));
    } else if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        if (typeof item === "object") {
          parts.push(encodeForm(item as Record<string, unknown>, `${fullKey}[${idx}]`));
        } else {
          parts.push(`${encodeURIComponent(`${fullKey}[${idx}]`)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else {
      parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.filter(Boolean).join("&");
}

export type CheckoutLineItem = {
  name: string;
  description?: string;
  amountCents: number;
  quantity: number;
};

export type CreateCheckoutParams = {
  lineItems: CheckoutLineItem[];
  successUrl: string;
  cancelUrl: string;
  clientReferenceId?: string;
  metadata?: Record<string, string>;
  customerEmail?: string;
};

export type CheckoutSession = {
  id: string;
  url: string;
};

export async function createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutSession> {
  const key = getSecretKey();
  if (!key) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY (test mode).");
  }

  const form: Record<string, unknown> = {
    mode: "payment",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    line_items: params.lineItems.map((li) => ({
      quantity: li.quantity,
      price_data: {
        currency: "usd",
        unit_amount: li.amountCents,
        product_data: {
          name: li.name,
          ...(li.description ? { description: li.description } : {}),
        },
      },
    })),
  };
  if (params.clientReferenceId) form.client_reference_id = params.clientReferenceId;
  if (params.customerEmail) form.customer_email = params.customerEmail;
  if (params.metadata) form.metadata = params.metadata;

  const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: encodeForm(form),
  });

  const data = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!res.ok || !data.id || !data.url) {
    throw new Error(`Stripe checkout failed: ${data.error?.message ?? res.statusText}`);
  }
  return { id: data.id, url: data.url };
}

export async function retrieveCheckoutSession(sessionId: string): Promise<{
  id: string;
  payment_status: string;
  payment_intent?: string;
  status: string;
}> {
  const key = getSecretKey();
  if (!key) throw new Error("Stripe is not configured.");
  const res = await fetch(`${STRIPE_API}/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const data = (await res.json()) as {
    id: string;
    payment_status: string;
    payment_intent?: string;
    status: string;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(`Stripe session retrieve failed: ${data.error?.message ?? res.statusText}`);
  }
  return data;
}
