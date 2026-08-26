import type { PublicComment } from "@/lib/video/social";

async function readJson(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: response.ok, status: response.status, payload };
}

export async function apiToggleLike(videoId: string) {
  return readJson(await fetch(`/api/video/${videoId}/like`, { method: "POST" }));
}

export async function apiToggleFollow(handle: string) {
  return readJson(
    await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle }),
    }),
  );
}

export async function apiListComments(videoId: string) {
  return readJson(await fetch(`/api/video/${videoId}/comments`));
}

export async function apiAddComment(videoId: string, body: string) {
  return readJson(
    await fetch(`/api/video/${videoId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    }),
  );
}

export async function apiRegisterShare(videoId: string) {
  return readJson(await fetch(`/api/video/${videoId}/share`, { method: "POST" }));
}

export async function apiListFollowing() {
  return readJson(await fetch("/api/me/following"));
}

export function commentsFromPayload(payload: Record<string, unknown>): PublicComment[] {
  const rows = payload.comments;
  if (!Array.isArray(rows)) return [];
  return rows.filter((row): row is PublicComment => {
    if (!row || typeof row !== "object") return false;
    const item = row as PublicComment;
    return typeof item.id === "string" && typeof item.body === "string";
  });
}
