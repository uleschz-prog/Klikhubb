import { z } from "zod";

export const payoutSchema = z.object({
  amount: z.number().positive().max(1_000_000).optional(),
});
