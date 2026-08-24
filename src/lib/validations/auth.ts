import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().min(3).max(320).email(),
  password: z.string().min(8).max(72),
  displayName: z.string().trim().min(2).max(80),
  intent: z.enum(["CREATOR", "ENTREPRENEUR", "BOTH"]).default("BOTH"),
  referralCode: z.string().trim().max(40).optional().or(z.literal("")),
});

export const checkoutSchema = z.object({
  slug: z.string().trim().min(2).max(120),
});
