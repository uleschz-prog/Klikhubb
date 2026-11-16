import { z } from "zod";

export const payoutSchema = z.object({
  amount: z.number().positive().max(1_000_000).optional(),
  method: z.enum(["mercadopago", "usdt", "manual"]).optional(),
});

export const mpPayoutEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(3)
    .max(254)
    .email()
    .transform((value) => value.toLowerCase()),
});

export const usdtAddressSchema = z.object({
  address: z.string().trim().min(26).max(64),
});
