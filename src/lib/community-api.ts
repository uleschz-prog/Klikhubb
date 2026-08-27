import type { CommunityPost } from "@/lib/community";

async function readJson(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: response.ok, status: response.status, payload };
}

export async function apiCreateCommunityPost(slug: string, input: { body: string; title?: string }) {
  return readJson(
    await fetch(`/api/community/${slug}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function apiTogglePostLike(postId: string) {
  return readJson(await fetch(`/api/community/posts/${postId}/like`, { method: "POST" }));
}

export function postFromPayload(payload: Record<string, unknown>): CommunityPost | null {
  if (typeof payload.id !== "string" || typeof payload.body !== "string") return null;
  return {
    id: payload.id,
    title: typeof payload.title === "string" ? payload.title : null,
    body: payload.body,
    likeCount: typeof payload.likeCount === "number" ? payload.likeCount : 0,
    likedByMe: payload.likedByMe === true,
    authorName: typeof payload.authorName === "string" ? payload.authorName : "Miembro",
    handle: typeof payload.handle === "string" ? payload.handle : "qlyk",
    createdAt: typeof payload.createdAt === "string" ? payload.createdAt : new Date().toISOString(),
  };
}
