import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { handleStripeWebhook } from "@/server/billing/stripe";
import { isDomainError } from "@/server/errors";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  try {
    const res = await handleStripeWebhook(body, signature);
    return NextResponse.json({ received: true, duplicate: res.duplicate });
  } catch (err) {
    if (err instanceof Stripe.errors.StripeSignatureVerificationError || (isDomainError(err) && (err.code === "signature" || err.code === "payments_off"))) {
      return NextResponse.json({ error: "Semnătură invalidă" }, { status: 400 });
    }
    if (err instanceof Error && err.message.includes("STRIPE_WEBHOOK_SECRET")) {
      return NextResponse.json({ error: "Webhook neconfigurat" }, { status: 400 });
    }
    console.error("[stripe:webhook]", err);
    return NextResponse.json({ error: "Eroare la procesare" }, { status: 500 });
  }
}
