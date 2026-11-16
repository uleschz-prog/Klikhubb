import { z } from "zod";

export const payoutSchema = z.object({
  amount: z.number().positive().max(1_000_000).optional(),
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
