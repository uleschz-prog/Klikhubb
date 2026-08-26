import { z } from "zod";

export const publishOfferSchema = z.object({
  title: z.string().trim().min(2).max(80),
  price: z.coerce.number().positive().max(100_000),
  type: z.enum(["COURSE", "MEMBERSHIP", "DIGITAL"]),
  description: z.string().trim().max(500).optional(),
});

export const publishVideoSchema = z
  .object({
    title: z.string().trim().max(120).optional(),
    caption: z.string().trim().min(1).max(500),
    videoUrl: z.string().trim().min(8).max(2000).optional(),
    productSlug: z.string().trim().max(80).optional(),
    offer: publishOfferSchema.optional(),
  })
  .refine((value) => Boolean(value.videoUrl), { message: "Falta el video.", path: ["videoUrl"] })
  .refine((value) => !(value.offer && value.productSlug), {
    message: "Elige un producto nuevo o uno que ya tienes, no los dos.",
    path: ["offer"],
  });
