-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "VideoLane" AS ENUM ('PLAY', 'SHOP');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "lane" "VideoLane" NOT NULL DEFAULT 'SHOP';

-- Backfill entertainment clips (no attached product)
UPDATE "videos" SET "lane" = 'PLAY'
WHERE id NOT IN (SELECT "videoId" FROM "video_products");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "videos_lane_feed_idx" ON "videos"("status", "lane", "publishedAt" DESC);
