import { z } from "zod";

export const followSchema = z.object({
  handle: z.string().trim().min(1).max(40),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export const communityPostSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  title: z.string().trim().max(200).optional(),
});
