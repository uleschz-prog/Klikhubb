"use client";

import { useEffect, useState } from "react";
import type { FeedVideo } from "@/lib/video/types";
import { ExploreHome } from "@/components/explore/ExploreHome";
import { FeedTheater } from "@/components/video/FeedTheater";

export function FeedEntry({
  videos,
  clipId,
  tab,
  signedIn,
  stripeEnabled,
  buySlug,
  canceled,
}: {
  videos: FeedVideo[];
  clipId?: string;
  tab: "foryou" | "following";
  signedIn: boolean;
  stripeEnabled: boolean;
  buySlug?: string;
  canceled?: boolean;
}) {
  const [desktop, setDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktop(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  if (desktop === null) {
    return <div className="min-h-[100dvh] bg-[#0a0a0d]" aria-hidden />;
  }

  const theaterVideos =
    tab === "following" && !clipId ? videos.filter((video) => video.followedByMe) : videos;

  if (clipId || buySlug || !desktop) {
    if (!clipId && !buySlug && tab === "following" && theaterVideos.length === 0) {
      return <ExploreHome videos={videos} tab={tab} signedIn={signedIn} />;
    }
    return (
      <FeedTheater
        home="shop"
        videos={theaterVideos}
        initialId={clipId}
        signedIn={signedIn}
        stripeEnabled={stripeEnabled}
        buySlug={buySlug}
        canceled={canceled}
      />
    );
  }

  return <ExploreHome videos={videos} tab={tab} signedIn={signedIn} />;
}
