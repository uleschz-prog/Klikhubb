import { z } from "zod";

export const publishVideoSchema = z
  .object({
    title: z.string().trim().max(120).optional(),
    caption: z.string().trim().min(1).max(500),
    videoUrl: z.string().trim().url().max(2000).optional(),
    productSlug: z.string().trim().max(80).optional(),
  })
  .refine((value) => Boolean(value.videoUrl), { message: "Falta el video.", path: ["videoUrl"] });
