"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FeedVideo } from "@/lib/video/types";
import { apiListFollowing } from "@/lib/video/social-api";
import { Logo } from "@/components/brand/Logo";
import { VideoCard } from "@/components/explore/VideoCard";

const NAV = [
  { href: "/play", label: "Play", icon: "play" },
  { href: "/feed", tab: "foryou" as const, label: "Para ti", icon: "spark" },
  { href: "/feed?tab=following", tab: "following" as const, label: "Siguiendo", icon: "follow" },
  { href: "/feed?tab=saved", tab: "saved" as const, label: "Guardados", icon: "star" },
  { href: "/marketplace", label: "Marketplace", icon: "bag" },
  { href: "/academy", label: "Academy", icon: "book" },
  { href: "/community", label: "Comunidad", icon: "people" },
  { href: "/dashboard", label: "Hub", icon: "hub" },
];

export function ExploreHome({
  videos,
  tab = "foryou",
  signedIn,
}: {
  videos: FeedVideo[];
  tab?: "foryou" | "following" | "saved";
  signedIn: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("todo");
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    if (!signedIn) {
      setFollowing([]);
      return;
    }
    void apiListFollowing().then(({ ok, payload }) => {
      if (!ok || !Array.isArray(payload.handles)) return;
      setFollowing(payload.handles.filter((item): item is string => typeof item === "string"));
    });
  }, [signedIn]);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    videos.forEach((video) => {
      video.tags.forEach((item) => counts.set(item, (counts.get(item) ?? 0) + 1));
    });
    return ["todo", ...Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([name]) => name)];
  }, [videos]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return videos.filter((video) => {
      if (tab === "following" && !following.includes(video.handle)) return false;
      if (tab === "saved" && !video.savedByMe) return false;
      if (tag !== "todo" && !video.tags.includes(tag)) return false;
      if (!needle) return true;
      return (
        video.caption.toLowerCase().includes(needle) ||
        video.title.toLowerCase().includes(needle) ||
        video.handle.toLowerCase().includes(needle) ||
        video.creatorName.toLowerCase().includes(needle) ||
        video.tags.some((item) => item.toLowerCase().includes(needle))
      );
    });
  }, [videos, tab, following, tag, query]);

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0d] text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[220px] flex-col bg-[#0a0a0d] px-4 py-5 md:flex">
        <Logo href="/feed" />
        <Link
          href="/publish"
          className="mt-6 flex min-h-11 items-center justify-center rounded-full bg-klik-green text-sm font-bold text-klik-black"
        >
          Publicar
        </Link>
        <nav className="mt-6 space-y-1">
          {NAV.map((item) => {
            const isCurrent =
              item.href === "/play"
                ? false
                : item.tab != null && item.tab === tab;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  isCurrent ? "bg-white/8 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <NavIcon name={item.icon} active={isCurrent} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto px-2 text-[11px] leading-5 text-white/30">
          Video, academia y cobro. Un clic.
        </p>
      </aside>

      <div className="md:pl-[220px]">
        <header className="sticky top-0 z-20 flex items-center gap-3 bg-[#0a0a0d]/92 px-4 py-3 backdrop-blur md:px-8">
          <div className="md:hidden">
            <Logo href="/feed" />
          </div>
          <form
            className="mx-auto flex h-11 w-full max-w-xl items-center rounded-full bg-white/8 px-4 ring-1 ring-white/10 focus-within:ring-klik-cyan"
            action="/search"
            method="get"
            onSubmit={(event) => {
              const value = query.trim();
              if (value.length >= 2) {
                event.preventDefault();
                router.push(`/search?q=${encodeURIComponent(value)}`);
              }
            }}
          >
            <input
              name="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar creadores, cursos o videos"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
            <SearchIcon />
          </form>
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/publish"
              aria-label="Publicar"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white/70 hover:bg-white/8 hover:text-white"
            >
              <UploadIcon />
            </Link>
            {signedIn ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
              >
                Hub
              </Link>
            ) : (
              <Link
                href="/login?callbackUrl=/feed"
                className="rounded-full bg-klik-cyan px-4 py-2 text-xs font-bold uppercase tracking-wider text-klik-black"
              >
                Entrar
              </Link>
            )}
          </div>
        </header>

        <div className="px-4 py-5 md:px-8">
          <div className="flex gap-2 overflow-x-auto pb-4">
            {tags.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTag(item)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                  tag === item ? "bg-white text-klik-black" : "bg-white/8 text-white/70 hover:bg-white/12"
                }`}
              >
                {item === "todo" ? "Todo" : item}
              </button>
            ))}
          </div>

          {tab === "following" && following.length === 0 ? (
            <div className="rounded-2xl border border-white/10 px-6 py-16 text-center">
              <h1 className="font-display text-2xl font-extrabold">
                {signedIn ? "Todavía no sigues a nadie" : "Entra para ver a quién sigues"}
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm text-white/50">
                {signedIn
                  ? "Entra a un video y toca el + bajo el avatar. Quien sigas aparece aquí."
                  : "El follow se guarda en tu cuenta. Entra y toca el + en un clip."}
              </p>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    signedIn ? "/feed" : `/login?callbackUrl=${encodeURIComponent("/feed?tab=following")}`,
                  )
                }
                className="mt-6 rounded-full bg-klik-green px-5 py-2.5 text-sm font-bold text-klik-black"
              >
                {signedIn ? "Ir a Para ti" : "Entrar"}
              </button>
            </div>
          ) : tab === "saved" && visible.length === 0 ? (
            <div className="rounded-2xl border border-white/10 px-6 py-16 text-center">
              <h1 className="font-display text-2xl font-extrabold">
                {signedIn ? "Todavía no guardas nada" : "Entra para ver tus guardados"}
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm text-white/50">
                {signedIn
                  ? "En un clip, toca la estrella. Aquí se queda aunque recargues."
                  : "La estrella se guarda en tu cuenta. Entra y toca la estrella en un clip."}
              </p>
              <button
                type="button"
                onClick={() =>
                  router.push(signedIn ? "/feed" : `/login?callbackUrl=${encodeURIComponent("/feed?tab=saved")}`)
                }
                className="mt-6 rounded-full bg-klik-green px-5 py-2.5 text-sm font-bold text-klik-black"
              >
                {signedIn ? "Ir a Para ti" : "Entrar"}
              </button>
            </div>
          ) : visible.length === 0 ? (
            <p className="py-16 text-center text-sm text-white/45">Nada coincide con esa búsqueda.</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 xl:grid-cols-3">
              {visible.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? "#00F0FF" : "currentColor";
  if (name === "play") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill={active ? "#00F0FF" : "none"} stroke={stroke} strokeWidth="1.8">
        <rect x="7" y="3" width="10" height="18" rx="3" />
        <path d="M10.5 10.5l4 2.5-4 2.5z" fill={active ? "#050505" : "currentColor"} stroke="none" />
      </svg>
    );
  }
  if (name === "spark") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill={active ? "#00F0FF" : "none"} stroke={stroke} strokeWidth="1.8">
        <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" />
      </svg>
    );
  }
  if (name === "follow") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.8">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 19c.8-3.2 3-5 6.5-5s5.7 1.8 6.5 5" />
      </svg>
    );
  }
  if (name === "star") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill={active ? "#00F0FF" : "none"} stroke={stroke} strokeWidth="1.8">
        <path d="M12 3.6l2.3 4.8 5.3.7-3.8 3.7.9 5.3L12 15.8 7.3 18.1l.9-5.3-3.8-3.7 5.3-.7z" />
      </svg>
    );
  }
  if (name === "bag") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.8">
        <path d="M6 8h12l-1 12H7L6 8zM9 8V6.5A3 3 0 0 1 12 3.5 3 3 0 0 1 15 6.5V8" />
      </svg>
    );
  }
  if (name === "book") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.8">
        <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5z" />
      </svg>
    );
  }
  if (name === "people") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.8">
        <circle cx="9" cy="8" r="2.6" />
        <circle cx="16" cy="9" r="2.2" />
        <path d="M4 19c.6-2.8 2.4-4.2 5-4.2s4.4 1.4 5 4.2M14 19c.3-1.8 1.3-3 3.2-3 1.8 0 2.8 1 3.2 3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.8">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-white/50" fill="none" strokeWidth="1.8" aria-hidden>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}
