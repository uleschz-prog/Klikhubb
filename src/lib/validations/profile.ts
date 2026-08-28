import { z } from "zod";

export const avatarUpdateSchema = z.object({
  imageUrl: z
    .union([
      z
        .string()
        .trim()
        .url()
        .max(2048)
        .refine((value) => value.startsWith("https://"), {
          message: "La foto debe ser una URL segura (https).",
        }),
      z.null(),
    ])
    .optional(),
});
