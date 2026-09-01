import { z } from "zod";

export const createCourseSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(4000).optional(),
  price: z.coerce.number().positive().max(100_000),
  level: z.string().trim().max(40).optional(),
  billing: z.literal("ONE_TIME").optional(),
});

export const updateCourseSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(4000).optional(),
  price: z.coerce.number().positive().max(100_000).optional(),
  level: z.string().trim().max(40).nullable().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
  billing: z.literal("ONE_TIME").optional(),
});

export const createModuleSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

export const updateModuleSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  sortOrder: z.coerce.number().int().min(0).max(10_000).optional(),
});

export const createLessonSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    content: z.string().trim().max(20_000).optional(),
    videoUrl: z.string().trim().min(8).max(2000).optional(),
    resourceUrl: z.string().trim().url().max(2000).optional(),
    resourceName: z.string().trim().max(200).optional(),
    isFreePreview: z.boolean().optional(),
    publishToFeed: z.boolean().optional(),
  })
  .refine(
    (value) => Boolean(value.videoUrl || value.content || value.resourceUrl),
    { message: "Agrega un video, texto o archivo.", path: ["videoUrl"] },
  );

export const updateLessonSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  content: z.string().trim().max(20_000).nullable().optional(),
  videoUrl: z.string().trim().min(8).max(2000).nullable().optional(),
  resourceUrl: z.string().trim().url().max(2000).nullable().optional(),
  resourceName: z.string().trim().max(200).nullable().optional(),
  isFreePreview: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(10_000).optional(),
});
