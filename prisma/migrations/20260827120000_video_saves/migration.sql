-- AlterTable
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "saveCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE IF NOT EXISTS "video_saves" (
    "videoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_saves_pkey" PRIMARY KEY ("videoId","userId")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "video_saves_userId_createdAt_idx" ON "video_saves"("userId", "createdAt" DESC);

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "video_saves" ADD CONSTRAINT "video_saves_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "video_saves" ADD CONSTRAINT "video_saves_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
