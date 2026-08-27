"use client";

import { useState } from "react";
import type { CommunityPost } from "@/lib/community";
import { apiCreateCommunityPost, apiTogglePostLike, postFromPayload } from "@/lib/community-api";
import { formatCount, formatFeedDate } from "@/lib/video/format";

export function CommunityWall({
  slug,
  initialPosts,
}: {
  slug: string;
  initialPosts: CommunityPost[];
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const { ok, payload } = await apiCreateCommunityPost(slug, {
      body,
      title: title.trim() || undefined,
    });
    setSaving(false);
    if (!ok) {
      setError(typeof payload.error === "string" ? payload.error : "No se pudo publicar.");
      return;
    }
    const created = postFromPayload(payload);
    if (created) setPosts((current) => [created, ...current]);
    setTitle("");
    setBody("");
  }

  async function toggleLike(post: CommunityPost) {
    const nextLiked = !post.likedByMe;
    setPosts((current) =>
      current.map((item) =>
        item.id === post.id
          ? { ...item, likedByMe: nextLiked, likeCount: item.likeCount + (nextLiked ? 1 : -1) }
          : item,
      ),
    );
    const { ok, payload } = await apiTogglePostLike(post.id);
    if (!ok) {
      setPosts((current) =>
        current.map((item) =>
          item.id === post.id
            ? { ...item, likedByMe: post.likedByMe, likeCount: post.likeCount }
            : item,
        ),
      );
      return;
    }
    setPosts((current) =>
      current.map((item) =>
        item.id === post.id
          ? {
              ...item,
              likedByMe: payload.liked === true,
              likeCount: typeof payload.likeCount === "number" ? payload.likeCount : item.likeCount,
            }
          : item,
      ),
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <form onSubmit={onSubmit} className="rounded-2xl border border-klik-line bg-klik-card p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Nuevo post</p>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          placeholder="Título (opcional)"
          className="mt-3 min-h-11 w-full rounded-full border border-white/10 bg-black px-4 text-sm text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-klik-cyan"
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          required
          maxLength={2000}
          rows={4}
          placeholder="Escribe para tu gente. Wins, preguntas, lo que estás cerrando."
          className="mt-3 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-klik-cyan"
        />
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={saving || !body.trim()}
          className="mt-3 min-h-11 rounded-full bg-klik-green px-5 text-sm font-bold text-klik-black disabled:opacity-60"
        >
          {saving ? "Publicando…" : "Publicar"}
        </button>
      </form>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-white/10 px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-extrabold">Todavía no hay posts</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/50">Sé el primero. Un texto. Tu gente se queda.</p>
        </div>
      ) : (
        posts.map((post) => (
          <article key={post.id} className="rounded-2xl border border-klik-line bg-klik-card p-5">
            <p className="text-[11px] uppercase tracking-wider text-white/40">
              {post.authorName} · @{post.handle}
              {post.createdAt ? ` · ${formatFeedDate(post.createdAt)}` : ""}
            </p>
            {post.title ? <h2 className="mt-2 font-display text-lg font-bold">{post.title}</h2> : null}
            <p className={`whitespace-pre-wrap text-sm text-white/80 ${post.title ? "mt-2" : "mt-3"}`}>{post.body}</p>
            <button
              type="button"
              aria-label={post.likedByMe ? "Quitar like" : "Like"}
              onClick={() => void toggleLike(post)}
              className={`mt-4 text-sm font-semibold ${post.likedByMe ? "text-[#FE2C55]" : "text-klik-cyan"}`}
            >
              {post.likedByMe ? "Te gusta" : "Me gusta"} · {formatCount(post.likeCount)}
            </button>
          </article>
        ))
      )}
    </div>
  );
}
