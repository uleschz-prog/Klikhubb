import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Mínimo 3 caracteres.")
  .max(20, "Máximo 20 caracteres.")
  .regex(/^[a-z0-9_]+$/, "Solo letras minúsculas, números y _.");

export const registerSchema = z.object({
  email: z.string().trim().min(3).max(320).email(),
  username: usernameSchema,
  password: z.string().min(8).max(72),
  displayName: z.string().trim().min(2).max(80),
  intent: z.enum(["CREATOR", "ENTREPRENEUR", "BOTH"]).default("BOTH"),
  referralCode: z.string().trim().max(40).optional().or(z.literal("")),
  locale: z.string().trim().min(2).max(10).default("es"),
  timezone: z.string().trim().min(2).max(64).optional(),
  acceptTerms: z.literal(true, {
    message: "Debes aceptar los términos para crear tu cuenta.",
  }),
});

export const checkoutSchema = z.object({
  slug: z.string().trim().min(2).max(120),
  cancelPath: z
    .string()
    .trim()
    .max(300)
    .optional()
    .refine((value) => !value || (value.startsWith("/") && !value.startsWith("//") && !value.includes("://")), {
      message: "Ruta inválida",
    }),
});
