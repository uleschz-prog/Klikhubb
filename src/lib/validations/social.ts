import { z } from "zod";

export const followSchema = z.object({
  handle: z.string().trim().min(1).max(40),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});
