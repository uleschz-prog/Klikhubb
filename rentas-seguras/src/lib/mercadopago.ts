import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { CONTRACT_CURRENCY, CONTRACT_PRICE_MXN } from "@/lib/constants";
import { getMercadoPagoAccessToken } from "@/lib/env";

export class MercadoPagoNotConfiguredError extends Error {
  constructor() {
    super(
      "Falta MERCADOPAGO_ACCESS_TOKEN. Configúralo en rentas-seguras/.env.local."
    );
    this.name = "MercadoPagoNotConfiguredError";
  }
}

function getClient() {
  const accessToken = getMercadoPagoAccessToken();
  if (!accessToken) {
    throw new MercadoPagoNotConfiguredError();
  }
  return new MercadoPagoConfig({ accessToken, options: { timeout: 8_000 } });
}

export async function createContractPreference(input: {
  userId: string;
  email?: string;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
  notificationUrl?: string;
}) {
  const client = getClient();
  const preference = new Preference(client);

  const result = await preference.create({
    body: {
      items: [
        {
          id: "contrato-arrendamiento",
          title: "Contrato de arrendamiento RentasSeguras MX",
          description:
            "Generación y descarga en PDF de contrato de arrendamiento residencial",
          quantity: 1,
          unit_price: CONTRACT_PRICE_MXN,
          currency_id: CONTRACT_CURRENCY,
        },
      ],
      payer: input.email ? { email: input.email } : undefined,
      back_urls: {
        success: input.successUrl,
        failure: input.failureUrl,
        pending: input.pendingUrl,
      },
      auto_return: "approved",
      statement_descriptor: "RENTASSEGURAS",
      external_reference: input.userId,
      metadata: {
        product: "lease_contract_pdf",
        amount_mxn: CONTRACT_PRICE_MXN,
        user_id: input.userId,
      },
      notification_url: input.notificationUrl,
    },
  });

  if (!result.id || !result.init_point) {
    throw new Error("MercadoPago no devolvió un Checkout válido.");
  }

  return {
    preferenceId: result.id,
    initPoint: result.init_point,
    sandboxInitPoint: result.sandbox_init_point ?? null,
  };
}

export type VerifiedPayment = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  externalReference: string | null;
};

export async function verifyApprovedContractPayment(
  paymentId: string
): Promise<VerifiedPayment | null> {
  const client = getClient();
  const payment = new Payment(client);
  const data = await payment.get({ id: paymentId });

  const amount = Number(data.transaction_amount ?? 0);
  const currency = String(data.currency_id ?? "");
  const status = String(data.status ?? "");

  if (
    status !== "approved" ||
    amount !== CONTRACT_PRICE_MXN ||
    currency !== CONTRACT_CURRENCY
  ) {
    return null;
  }

  return {
    id: String(data.id ?? paymentId),
    status,
    amount,
    currency,
    externalReference: data.external_reference ? String(data.external_reference) : null,
  };
}
