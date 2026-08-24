import { z } from "zod";

export const waitlistSchema = z.object({
  email: z.string().trim().min(3).max(320).email(),
  intent: z.enum(["CREATOR", "ENTREPRENEUR", "BOTH"]).default("BOTH"),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
