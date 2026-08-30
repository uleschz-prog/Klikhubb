import type { FeedVideo } from "@/lib/video/types";

export type MockProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
};

/** Fallback vacío: la plataforma ya no muestra contenido ficticio. */
export const mockVideos: FeedVideo[] = [];

export const mockLeaderboard: { rank: number; name: string; handle: string; points: number; earnings: number }[] =
  [];

export const mockCourses: { slug: string; title: string; price: number; students: number }[] = [];
