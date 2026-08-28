#!/usr/bin/env node
/**
 * Envía un evento firmado al webhook de producción para verificar el whsec_.
 * Uso: node scripts/test-webhook-signature.mjs <whsec_> [url]
 */
import Stripe from "stripe";

const secret = process.argv[2]?.trim();
const url = (process.argv[3] ?? "https://qlyk.vercel.app/api/webhooks/stripe").trim();

if (!secret?.startsWith("whsec_")) {
  console.error("Uso: node scripts/test-webhook-signature.mjs whsec_xxx [url]");
  process.exit(1);
}

const payload = JSON.stringify({
  id: "evt_test_webhook_probe",
  object: "event",
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_probe",
      object: "checkout.session",
      payment_status: "unpaid",
    },
  },
});

const header = Stripe.webhooks.generateTestHeaderString({
  payload,
  secret,
});

const response = await fetch(url, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "stripe-signature": header,
  },
  body: payload,
});

const body = await response.text();
console.log("Status:", response.status);
console.log("Body:", body);

process.exit(response.ok ? 0 : 1);
