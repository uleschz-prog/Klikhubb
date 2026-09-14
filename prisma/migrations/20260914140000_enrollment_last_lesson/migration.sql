-- Remember the last lesson a student opened so Academy can resume.
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "lastLessonId" TEXT;
