"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FeedVideo } from "@/lib/video/types";
import { formatCount, formatFeedDate, formatTimecode } from "@/lib/video/format";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { Logo } from "@/components/brand/Logo";
import { PlatformNav } from "@/components/layout/PlatformNav";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { ThemeToggle } from "@/components/theme/ThemeProvider";
import { PriceTag } from "@/components/ui/PriceTag";
import { BuyDrawer, type BuyItem } from "@/components/commerce/BuyDrawer";
import {
  apiAddComment,
  apiListComments,
  apiRegisterShare,
  apiToggleFollow,
  apiToggleLike,
  apiToggleSave,
  commentsFromPayload,
} from "@/lib/video/social-api";
import type { PublicComment } from "@/lib/video/social";
import { YouTubeStage } from "@/components/video/YouTubeStage";
import { youtubeVideoId } from "@/lib/video/source";

type Panel = "none" | "comments" | "playlist";
type Menu = "none" | "speed" | "quality" | "volume";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export function FeedTheater({
  videos,
  initialId,
  signedIn = false,
  speiEnabled = false,
  buySlug,
  canceled = false,
  home = "shop",
  feedTab = "foryou",
  fxRate,
}: {
  videos: FeedVideo[];
  initialId?: string;
  signedIn?: boolean;
  speiEnabled?: boolean;
  buySlug?: string;
  canceled?: boolean;
  home?: "play" | "shop";
  feedTab?: "foryou" | "following" | "saved";
  fxRate?: number;
}) {
  const router = useRouter();
  const stage = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLVideoElement>(null);
  const startY = useRef<number | null>(null);
  const wheelLock = useRef(false);
  const basePath = home === "play" ? "/play" : "/feed";

  const clipHref = useCallback(
    (id: string, extra: Record<string, string> = {}) => {
      const params = new URLSearchParams({ v: id, ...extra });
      if (feedTab === "following") params.set("tab", "following");
      if (feedTab === "saved") params.set("tab", "saved");
      return `${basePath}?${params.toString()}`;
    },
    [basePath, feedTab],
  );

  const fromClip = initialId ? videos.findIndex((item) => item.id === initialId) : -1;
  const fromBuy = buySlug ? videos.findIndex((item) => item.product?.slug === buySlug) : -1;
  const startIndex = fromClip >= 0 ? fromClip : fromBuy >= 0 ? fromBuy : 0;
  const [index, setIndex] = useState(startIndex);
  const video = videos[index] ?? videos[0];
  const fromYouTube = Boolean(video.videoUrl && youtubeVideoId(video.videoUrl));

  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [speed, setSpeed] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [continuous, setContinuous] = useState(true);
  const [chrome, setChrome] = useState(true);
  const [liked, setLiked] = useState(Boolean(video.likedByMe));
  const [saved, setSaved] = useState(Boolean(video.savedByMe));
  const [followed, setFollowed] = useState(Boolean(video.followedByMe));
  const [panel, setPanel] = useState<Panel>("none");
  const [menu, setMenu] = useState<Menu>("none");
  const [toast, setToast] = useState("");
  const [likes, setLikes] = useState(video.likes);
  const [saves, setSaves] = useState(video.favorites);
  const [shares, setShares] = useState(video.shares);
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [commentCount, setCommentCount] = useState(video.comments);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const buyAlreadyOwned = Boolean(
    buySlug && videos.some((item) => item.product?.slug === buySlug && item.product.owned),
  );
  const [shopOpen, setShopOpen] = useState(Boolean(buySlug) && !buyAlreadyOwned);
  const [captionOpen, setCaptionOpen] = useState(false);

  const tags = useMemo(() => {
    const fromCaption = video.caption.match(/#([A-Za-z0-9_]+)/g)?.map((tag) => tag.slice(1)) ?? [];
    return fromCaption.length ? fromCaption : video.tags;
  }, [video]);

  const shopItem = useMemo((): BuyItem | null => {
    const source = video.product ? video : videos.find((item) => item.product?.slug === buySlug);
    if (!source?.product) return null;
    return {
      slug: source.product.slug,
      title: source.product.title,
      price: source.product.price,
      currency: source.product.currency,
      description: source.product.description,
      type: source.product.type,
      creatorName: source.creatorName,
      handle: source.handle,
      thumbnailUrl: source.thumbnailUrl,
    };
  }, [video, videos, buySlug]);

  const closeShop = useCallback(() => {
    setShopOpen(false);
    router.replace(clipHref(video.id), { scroll: false });
  }, [clipHref, router, video.id]);

  useEffect(() => {
    if (!buyAlreadyOwned || !buySlug) return;
    router.replace(`/learn/${encodeURIComponent(buySlug)}`);
  }, [buyAlreadyOwned, buySlug, router]);

  function openShop() {
    if (!video.product) return;
    if (video.product.owned) {
      router.push(`/learn/${encodeURIComponent(video.product.slug)}`);
      return;
    }
    setPanel("none");
    setShopOpen(true);
    router.replace(clipHref(video.id, { buy: video.product.slug }), { scroll: false });
  }

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(videos.length - 1, next));
      if (clamped === index) return;
      setIndex(clamped);
      setDraft("");
      setPanel("none");
      setMenu("none");
      setShopOpen(false);
      router.replace(clipHref(videos[clamped].id), { scroll: false });
    },
    [clipHref, index, router, videos],
  );

  useEffect(() => {
    setLikes(video.likes);
    setSaves(video.favorites);
    setShares(video.shares);
    setLiked(Boolean(video.likedByMe));
    setSaved(Boolean(video.savedByMe));
    setFollowed(Boolean(video.followedByMe));
    setCommentCount(video.comments);
    setComments([]);
    setCommentsLoaded(false);
    setDraft("");
    setCurrent(0);
    setDuration(0);
    setCaptionOpen(false);
  }, [video]);

  useEffect(() => {
    if (panel !== "comments" || commentsLoaded) return;
    let cancelled = false;
    void apiListComments(video.id).then(({ payload }) => {
      if (cancelled) return;
      setComments(commentsFromPayload(payload));
      if (typeof payload.commentCount === "number") setCommentCount(payload.commentCount);
      setCommentsLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [panel, video.id, commentsLoaded]);

  useEffect(() => {
    const node = media.current;
    if (!node) return;
    node.muted = muted;
    node.volume = volume;
    node.playbackRate = speed;
    node.loop = !continuous;
    if (playing) void node.play().catch(() => setPlaying(false));
    else node.pause();
  }, [video.id, muted, volume, speed, continuous, playing]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (event.key === "ArrowDown" || event.key === "j") {
        event.preventDefault();
        go(index + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        go(index - 1);
      } else if (event.key === " ") {
        event.preventDefault();
        setPlaying((value) => !value);
      } else if (event.key === "m") {
        setMuted((value) => !value);
      } else if (event.key === "f") {
        void toggleFullscreen();
      } else if (event.key === "c") {
        setChrome((value) => !value);
      } else if (event.key === "Escape") {
        setPanel("none");
        setMenu("none");
        setShopOpen(false);
        setChrome(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  function showToast(message: string) {
    setToast(message);
  }

  function togglePlay() {
    if (muted) {
      setMuted(false);
      setPlaying(true);
      return;
    }
    setPlaying((value) => !value);
  }

  function enableAudio() {
    setMuted(false);
    setVolume((value) => (value === 0 ? 0.8 : value));
    setPlaying(true);
  }

  function seekRatio(ratio: number) {
    const node = media.current;
    if (!node || !Number.isFinite(node.duration)) return;
    node.currentTime = Math.min(node.duration, Math.max(0, ratio * node.duration));
  }

  async function toggleFullscreen() {
    const node = stage.current;
    if (!node) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await node.requestFullscreen().catch(() => undefined);
  }

  async function togglePip() {
    const node = media.current;
    if (!node) return;
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      return;
    }
    if (typeof node.requestPictureInPicture === "function") {
      await node.requestPictureInPicture().catch(() => showToast("Tu navegador no permite mini reproductor."));
    }
  }

  async function shareVideo() {
    const url = `${window.location.origin}${clipHref(video.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: video.title, text: video.caption, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast("Enlace copiado.");
      }
      setShares((value) => value + 1);
      void apiRegisterShare(video.id).then(({ ok, payload }) => {
        if (ok && typeof payload.shareCount === "number") setShares(payload.shareCount);
      });
    } catch {
      await navigator.clipboard.writeText(url);
      showToast("Enlace copiado.");
      setShares((value) => value + 1);
      void apiRegisterShare(video.id).then(({ ok, payload }) => {
        if (ok && typeof payload.shareCount === "number") setShares(payload.shareCount);
      });
    }
  }

  function loginForClip() {
    router.push(`/login?callbackUrl=${encodeURIComponent(clipHref(video.id))}`);
  }

  async function toggleLike() {
    if (!signedIn) {
      loginForClip();
      return;
    }
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikes((count) => count + (nextLiked ? 1 : -1));
    const { ok, status, payload } = await apiToggleLike(video.id);
    if (status === 401) {
      setLiked(!nextLiked);
      setLikes((count) => count + (nextLiked ? -1 : 1));
      loginForClip();
      return;
    }
    if (!ok) {
      setLiked(!nextLiked);
      setLikes((count) => count + (nextLiked ? -1 : 1));
      showToast(typeof payload.error === "string" ? payload.error : "No se pudo guardar el like.");
      return;
    }
    if (typeof payload.likeCount === "number") setLikes(payload.likeCount);
    if (typeof payload.liked === "boolean") setLiked(payload.liked);
  }

  async function onFollow() {
    if (!signedIn) {
      loginForClip();
      return;
    }
    const next = !followed;
    setFollowed(next);
    const { ok, status, payload } = await apiToggleFollow(video.handle);
    if (status === 401) {
      setFollowed(!next);
      loginForClip();
      return;
    }
    if (!ok) {
      setFollowed(!next);
      showToast(typeof payload.error === "string" ? payload.error : "No se pudo actualizar el follow.");
      return;
    }
    const following = payload.following === true;
    setFollowed(following);
    showToast(following ? `Sigues a @${video.handle}` : `Dejaste de seguir a @${video.handle}`);
  }

  async function toggleSave() {
    if (!signedIn) {
      loginForClip();
      return;
    }
    const nextSaved = !saved;
    setSaved(nextSaved);
    setSaves((count) => count + (nextSaved ? 1 : -1));
    const { ok, status, payload } = await apiToggleSave(video.id);
    if (status === 401) {
      setSaved(!nextSaved);
      setSaves((count) => count + (nextSaved ? -1 : 1));
      loginForClip();
      return;
    }
    if (!ok) {
      setSaved(!nextSaved);
      setSaves((count) => count + (nextSaved ? -1 : 1));
      showToast(typeof payload.error === "string" ? payload.error : "No se pudo guardar el clip.");
      return;
    }
    if (typeof payload.saveCount === "number") setSaves(payload.saveCount);
    if (typeof payload.saved === "boolean") setSaved(payload.saved);
    showToast(payload.saved === true ? "Guardado." : "Quitado de guardados.");
  }

  function onWheel(event: React.WheelEvent) {
    if (Math.abs(event.deltaY) < 40) return;
    if (wheelLock.current) return;
    wheelLock.current = true;
    go(index + (event.deltaY > 0 ? 1 : -1));
    window.setTimeout(() => {
      wheelLock.current = false;
    }, 700);
  }

  const hidden = !chrome;
  const commentsTotal = commentCount;

  return (
    <div
      ref={stage}
      className="theme-media relative h-[100dvh] overflow-hidden bg-black text-white"
      onWheel={onWheel}
      onTouchStart={(event) => {
        startY.current = event.touches[0]?.clientY ?? null;
      }}
      onTouchEnd={(event) => {
        if (startY.current == null) return;
        const delta = startY.current - (event.changedTouches[0]?.clientY ?? startY.current);
        startY.current = null;
        if (Math.abs(delta) < 56) return;
        go(index + (delta > 0 ? 1 : -1));
      }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${video.gradient}`} />
      {video.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={video.thumbnailUrl} alt="" className="feed-media-backdrop" />
      ) : null}
      {video.videoUrl && fromYouTube ? (
        <YouTubeStage
          url={video.videoUrl}
          playing={playing}
          muted={muted}
          title={video.title}
          className="absolute inset-0 h-full w-full"
          onTime={setCurrent}
          onDuration={setDuration}
          onEnded={() => {
            if (continuous && index < videos.length - 1) go(index + 1);
          }}
        />
      ) : video.videoUrl ? (
        <video
          ref={media}
          key={video.id}
          className="absolute inset-0 h-full w-full object-contain"
          src={video.videoUrl}
          poster={video.thumbnailUrl ?? undefined}
          autoPlay
          muted={muted}
          playsInline
          preload="auto"
          disablePictureInPicture
          onClick={() => {
            if (muted) enableAudio();
            else togglePlay();
          }}
          onDoubleClick={toggleLike}
          onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
          onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            if (continuous && index < videos.length - 1) {
              go(index + 1);
              return;
            }
            const node = media.current;
            if (!node) return;
            node.currentTime = 0;
            void node.play().catch(() => undefined);
          }}
        />
      ) : null}
      {fromYouTube && chrome ? (
        <button
          type="button"
          className="absolute inset-0 z-[15] cursor-pointer bg-transparent"
          aria-label={playing ? "Pausa" : "Reproducir"}
          onClick={() => {
            if (muted) enableAudio();
            else togglePlay();
          }}
          onDoubleClick={toggleLike}
        />
      ) : null}

      {muted && chrome ? (
        <button
          type="button"
          onClick={enableAudio}
          className="overlay-chip overlay-label absolute left-1/2 top-[42%] z-[18] flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold md:hidden"
        >
          <VolumePulseIcon />
          Toca para audio
        </button>
      ) : null}

      {!hidden ? (
        <>
          <div className="overlay-vignette-top pointer-events-none absolute inset-x-0 top-0 z-20 h-36" />
          <div className="overlay-vignette-right pointer-events-none absolute inset-y-0 right-0 z-20 w-28 md:w-36" />
          <div className="overlay-vignette-bottom pointer-events-none absolute inset-x-0 bottom-0 z-20 h-56 md:h-48" />
          <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:p-4 md:pt-[max(1rem,env(safe-area-inset-top))]">
            <div className="flex items-start justify-between gap-3">
              <div className="pointer-events-auto flex items-center gap-2">
                <div className="overlay-chip inline-flex items-center rounded-full px-2.5 py-1.5">
                  <Logo href={basePath} className="text-white" markClassName="h-8 w-8" />
                </div>
                <div className="hidden md:block">
                  <FeedTabs home={home} feedTab={feedTab} signedIn={signedIn} />
                </div>
              </div>
              <div className="pointer-events-auto hidden md:block">
                <div className="overlay-chip flex items-center gap-2 rounded-full py-1 pl-4 pr-1.5">
                  <PlatformNav variant="media" />
                  <MuteChip muted={muted} volume={volume} onEnable={enableAudio} onMute={() => setMuted(true)} />
                  <ThemeToggle tone="media" />
                </div>
              </div>
              <div className="pointer-events-auto flex items-center gap-2 md:hidden">
                <MuteChip muted={muted} volume={volume} onEnable={enableAudio} onMute={() => setMuted(true)} />
                <div className="overlay-chip rounded-full p-0.5">
                  <ThemeToggle tone="media" />
                </div>
              </div>
            </div>
            <div className="pointer-events-auto flex justify-center md:hidden">
              <FeedTabs home={home} feedTab={feedTab} signedIn={signedIn} />
            </div>
          </header>

          <aside className="absolute right-2 z-30 flex max-h-[calc(100dvh-11rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col items-center gap-3 overflow-y-auto overscroll-contain pb-1 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] max-md:bottom-[calc(5rem+env(safe-area-inset-bottom))] max-md:top-auto md:right-6 md:top-1/2 md:max-h-[min(36rem,calc(100dvh-8rem))] md:-translate-y-1/2 md:gap-3.5 md:overflow-visible [&::-webkit-scrollbar]:hidden">
            <div className="hidden md:contents">
              <NavArrow label="Anterior" disabled={index === 0} onClick={() => go(index - 1)}>
                <ChevronUp />
              </NavArrow>
              <NavArrow label="Siguiente" disabled={index === videos.length - 1} onClick={() => go(index + 1)}>
                <ChevronDown />
              </NavArrow>
            </div>
            <button
              type="button"
              onClick={() => void onFollow()}
              className="relative mt-2 mb-1 overflow-visible"
              aria-label={followed ? "Siguiendo" : "Seguir"}
            >
              <UserAvatar
                name={video.creatorName}
                imageUrl={video.creatorImage}
                size="lg"
                className="ring-2 ring-white shadow-[0_0_0_3px_rgba(0,0,0,0.45)]"
              />
              <span
                className={`absolute -bottom-1 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full text-sm font-bold ${
                  followed ? "bg-white text-klik-black" : "bg-klik-green text-klik-black"
                }`}
              >
                {followed ? "✓" : "+"}
              </span>
            </button>
            <Link
              href={`/u/${video.handle}`}
              className="overlay-label overlay-meta mt-1.5 max-w-[4.75rem] truncate text-center text-[11px] font-semibold hover:text-klik-green"
            >
              @{video.handle}
            </Link>
            <RailAction
              active={liked}
              label={formatCount(likes)}
              ariaLabel={liked ? "Quitar like" : "Like"}
              onClick={() => void toggleLike()}
            >
              <HeartIcon filled={liked} />
            </RailAction>
            <RailAction label={formatCount(commentsTotal)} onClick={() => setPanel(panel === "comments" ? "none" : "comments")}>
              <CommentIcon />
            </RailAction>
            <RailAction
              active={saved}
              label={formatCount(saves)}
              ariaLabel={saved ? "Quitar de guardados" : "Guardar"}
              onClick={() => void toggleSave()}
            >
              <StarIcon filled={saved} />
            </RailAction>
            <RailAction label={formatCount(shares)} onClick={() => void shareVideo()}>
              <ShareIcon />
            </RailAction>
            {video.product ? (
              <RailAction label={video.product.owned ? "Continuar" : "Curso"} onClick={openShop}>
                <BagIcon />
              </RailAction>
            ) : null}
            <Link
              href={home === "play" ? "/publish?lane=play" : "/publish"}
              aria-label={home === "play" ? "Subir un video" : "Publicar y vender"}
              className="mt-0.5 flex flex-col items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-klik-green text-2xl font-light leading-none text-klik-black shadow-[0_8px_24px_rgba(48,209,88,0.38)] md:h-[3.25rem] md:w-[3.25rem] md:text-3xl">
                +
              </span>
              <span className="overlay-label text-[11px] font-semibold">Subir</span>
            </Link>
          </aside>

          <div className="absolute bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-3 z-20 max-w-[calc(100%-6.5rem)] md:bottom-20 md:left-8 md:max-w-[min(36rem,calc(100%-8rem))]">
            <CaptionCard
              video={video}
              tags={tags}
              fxRate={fxRate}
              shopOpen={shopOpen}
              expanded={captionOpen}
              onToggle={() => setCaptionOpen((value) => !value)}
              onOpenShop={openShop}
            />
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setChrome(true)}
          className="absolute inset-0 z-20 cursor-pointer"
          aria-label="Mostrar controles"
        />
      )}

      <div className={`absolute inset-x-0 bottom-14 z-30 md:bottom-0 ${hidden ? "pointer-events-none opacity-0" : "opacity-100"}`}>
        <button
          type="button"
          className="group relative block h-6 w-full px-3 md:px-4"
          aria-label="Barra de progreso"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const pad = 12;
            seekRatio((event.clientX - rect.left - pad) / Math.max(1, rect.width - pad * 2));
          }}
        >
          <span className="overlay-progress-track absolute inset-x-3 top-1/2 h-1.5 -translate-y-1/2 rounded-full md:inset-x-4" />
          <span
            className="overlay-progress-fill absolute left-3 top-1/2 h-1.5 -translate-y-1/2 rounded-full md:left-4"
            style={{ width: duration ? `calc((100% - 1.5rem) * ${current / duration})` : "0%" }}
          />
          <span
            className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-klik-green shadow-[0_0_10px_rgba(48,209,88,0.7)] ring-2 ring-black/40"
            style={{ left: duration ? `calc(0.75rem + (100% - 1.5rem) * ${current / duration} - 0.4375rem)` : "0.75rem" }}
          />
        </button>
        <div className="overlay-bar hidden items-center gap-2 px-4 py-2.5 md:flex">
          <button type="button" onClick={togglePlay} className="p-1" aria-label={playing ? "Pausar" : "Reproducir"}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <p className="min-w-[7.5rem] font-mono text-xs tabular-nums text-white/80" aria-live="off">
            {formatTimecode(current)} / {formatTimecode(duration)}
          </p>
          <div className="flex-1" />
          <div className="relative">
            <IconBtn
              label={speed === 1 ? "Velocidad normal" : `Velocidad ${speed} por uno`}
              onClick={() => setMenu(menu === "speed" ? "none" : "speed")}
            >
              <span className="min-w-[1.75rem] text-center text-[11px] font-semibold">{speed === 1 ? "1x" : `${speed}x`}</span>
            </IconBtn>
            {menu === "speed" ? (
              <MenuCard>
                {SPEEDS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setSpeed(value);
                      setMenu("none");
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm ${
                      speed === value ? "text-klik-green" : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {value === 1 ? "Normal" : `${value}x`}
                  </button>
                ))}
              </MenuCard>
            ) : null}
          </div>
          <IconBtn
            label={continuous ? "Desactivar reproducción continua" : "Activar reproducción continua"}
            onClick={() => setContinuous((value) => !value)}
          >
            <LoopIcon active={continuous} />
          </IconBtn>
          <IconBtn label="Modo cine, ocultar controles" onClick={() => setChrome(false)}>
            <CinemaIcon />
          </IconBtn>
          <IconBtn label="Lista de videos" onClick={() => setPanel(panel === "playlist" ? "none" : "playlist")}>
            <ListIcon />
          </IconBtn>
          <IconBtn label="Mini reproductor" onClick={() => void togglePip()}>
            <PipIcon />
          </IconBtn>
          <div className="relative">
            <IconBtn
              label={muted ? "Activar sonido" : "Ajustar volumen"}
              onClick={() => setMenu(menu === "volume" ? "none" : "volume")}
            >
              {muted || volume === 0 ? <MuteIcon /> : <VolumeIcon />}
            </IconBtn>
            {menu === "volume" ? (
              <div className="absolute bottom-10 left-1/2 flex h-28 -translate-x-1/2 items-center rounded-md bg-black/80 px-3 py-2">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  aria-label="Volumen"
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setVolume(next);
                    setMuted(next === 0);
                  }}
                  className="h-24 w-4 cursor-pointer appearance-none bg-transparent"
                  style={{ writingMode: "vertical-lr", direction: "rtl" }}
                />
              </div>
            ) : null}
          </div>
          <IconBtn label="Pantalla completa" onClick={() => void toggleFullscreen()}>
            <ExpandIcon />
          </IconBtn>
        </div>
      </div>

      {panel === "comments" ? (
        <SidePanel title={`Comentarios · ${commentsTotal}`} onClose={() => setPanel("none")}>
          {comments.length === 0 ? (
            <p className="text-sm text-white/50">Aún no hay comentarios. El primero abre la conversación.</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((item) => (
                <li key={item.id} className="rounded-xl bg-white/5 px-3 py-2 text-sm text-white/80">
                  <p className="text-[11px] font-semibold text-white/45">@{item.handle}</p>
                  <p className="mt-1">{item.body}</p>
                </li>
              ))}
            </ul>
          )}
          <form
            className="mt-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const text = draft.trim();
              if (!text) return;
              if (!signedIn) {
                loginForClip();
                return;
              }
              void apiAddComment(video.id, text).then(({ ok, status, payload }) => {
                if (status === 401) {
                  loginForClip();
                  return;
                }
                if (!ok) {
                  showToast(typeof payload.error === "string" ? payload.error : "No se pudo comentar.");
                  return;
                }
                const created = payload.comment as PublicComment | undefined;
                if (created?.id) setComments((list) => [...list, created]);
                if (typeof payload.commentCount === "number") setCommentCount(payload.commentCount);
                else setCommentCount((value) => value + 1);
                setDraft("");
              });
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Escribe un comentario"
              className="min-h-11 flex-1 rounded-full border border-white/15 bg-black/40 px-4 text-sm outline-none ring-klik-green focus:ring-2"
            />
            <button type="submit" className="rounded-full bg-klik-green px-4 text-sm font-bold text-klik-black">
              Enviar
            </button>
          </form>
        </SidePanel>
      ) : null}

      {panel === "playlist" ? (
        <SidePanel title="Siguiente en el feed" onClose={() => setPanel("none")}>
          <ul className="space-y-2">
            {videos.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    go(i);
                    setPanel("none");
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                    i === index ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10"
                  }`}
                >
                  <span className="block font-semibold">@{item.handle}</span>
                  <span className="line-clamp-2 text-xs text-white/55">{item.caption}</span>
                </button>
              </li>
            ))}
          </ul>
        </SidePanel>
      ) : null}


      <BuyDrawer
        open={shopOpen}
        onClose={closeShop}
        item={shopItem}
        signedIn={signedIn}
        speiEnabled={speiEnabled}
        loginHref={`/login?callbackUrl=${encodeURIComponent(clipHref(video.id, video.product ? { buy: video.product.slug } : {}))}`}
        cancelPath={clipHref(video.id, video.product ? { buy: video.product.slug } : {})}
        canceled={canceled}
        fxRate={fxRate}
      />

      {toast ? (
        <p className="overlay-chip overlay-label absolute left-1/2 top-20 z-40 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-semibold">
          {toast}
        </p>
      ) : null}

      {!hidden ? <MobileTabBar variant="media" /> : null}
    </div>
  );
}


const FEED_TABS = [
  { id: "foryou" as const, label: "Para ti" },
  { id: "following" as const, label: "Siguiendo" },
  { id: "saved" as const, label: "Guardados" },
];

function FeedTabs({
  home,
  feedTab,
  signedIn,
}: {
  home: "play" | "shop";
  feedTab: "foryou" | "following" | "saved";
  signedIn: boolean;
}) {
  const base = home === "play" ? "/play" : "/feed";
  return (
    <nav aria-label="Filtro del feed" className="overlay-chip flex items-center rounded-full p-0.5">
      {FEED_TABS.map((tab) => {
        const href =
          tab.id === "foryou"
            ? base
            : tab.id === "saved" && !signedIn
              ? `/login?callbackUrl=${encodeURIComponent(`${base}?tab=saved`)}`
              : `${base}?tab=${tab.id}`;
        const current = feedTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`overlay-tab rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide transition md:px-3 md:text-xs ${
              current ? "text-klik-green" : "text-white/70 hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MuteChip({
  muted,
  volume,
  onEnable,
  onMute,
}: {
  muted: boolean;
  volume: number;
  onEnable: () => void;
  onMute: () => void;
}) {
  const silent = muted || volume === 0;
  return (
    <button
      type="button"
      onClick={() => (silent ? onEnable() : onMute())}
      aria-label={silent ? "Activar audio" : "Silenciar"}
      className="overlay-chip overlay-icon flex h-10 w-10 items-center justify-center rounded-full text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green"
    >
      {silent ? <RailMuteIcon /> : <RailVolumeIcon />}
    </button>
  );
}

const CAPTION_LIMIT = 120;

function CaptionCard({
  video,
  tags,
  fxRate,
  shopOpen,
  expanded,
  onToggle,
  onOpenShop,
}: {
  video: FeedVideo;
  tags: string[];
  fxRate?: number;
  shopOpen: boolean;
  expanded: boolean;
  onToggle: () => void;
  onOpenShop: () => void;
}) {
  const captionBody =
    video.caption.replace(/#[A-Za-z0-9_]+/g, " ").replace(/\s+/g, " ").trim() || video.title;
  const long = captionBody.length > CAPTION_LIMIT;
  const shown = !long || expanded ? captionBody : `${captionBody.slice(0, CAPTION_LIMIT).trim()}…`;
  const course = (video.product?.type ?? "").toUpperCase() === "COURSE";
  const ctaLabel = video.product?.owned ? "Continuar" : course ? "Ver curso" : "Ver producto";

  return (
    <div className="overlay-caption-plate rounded-3xl px-3.5 py-3 md:px-4 md:py-3.5">
      <div className="flex items-start gap-3">
        <Link href={`/u/${video.handle}`} className="shrink-0" aria-label={`Perfil de @${video.handle}`}>
          <UserAvatar name={video.creatorName} imageUrl={video.creatorImage} size="md" className="ring-1 ring-white/30" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="overlay-label truncate text-sm font-bold leading-5">{video.creatorName}</p>
          <p className="overlay-label mt-0.5 text-[12px] font-medium text-white/80">
            @{video.handle}
            {video.publishedAt ? <span className="font-normal text-white/70"> · {formatFeedDate(video.publishedAt)}</span> : null}
          </p>
        </div>
      </div>
      <p className="overlay-label mt-2.5 text-[15px] leading-6">
        {shown}
        {long ? (
          <button
            type="button"
            onClick={onToggle}
            className="ml-1 font-semibold text-klik-green underline-offset-2 hover:underline"
          >
            {expanded ? "menos" : "más"}
          </button>
        ) : null}
      </p>
      {tags.length ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className="overlay-hashtag">
              #{tag}
            </Link>
          ))}
        </div>
      ) : null}
      {video.product && !shopOpen ? (
        <button
          type="button"
          onClick={onOpenShop}
          className="mt-3 flex w-full max-w-full items-center justify-between gap-2 rounded-full bg-klik-green px-4 py-2.5 text-sm font-bold text-klik-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span className="truncate">{ctaLabel}</span>
          {video.product.owned ? null : (
            <span className="rounded-full bg-black/15 px-2.5 py-0.5 text-left">
              <PriceTag
                amount={video.product.price}
                currency={video.product.currency}
                fx={fxRate}
                size="sm"
                compact
                align="right"
              />
            </span>
          )}
        </button>
      ) : null}
    </div>
  );
}

function RailAction({
  label,
  children,
  onClick,
  active,
  ariaLabel,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="flex w-12 flex-col items-center gap-1 overflow-visible focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green"
    >
      <span
        className={`overlay-chip overlay-icon flex h-12 w-12 items-center justify-center rounded-full ${
          active ? "overlay-chip-active" : "text-white"
        }`}
      >
        {children}
      </span>
      <span className="overlay-label text-center text-[11px] font-semibold leading-tight tabular-nums md:text-xs">
        {label}
      </span>
    </button>
  );
}

function NavArrow({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="overlay-chip overlay-icon flex h-9 w-9 items-center justify-center rounded-full text-white disabled:opacity-25"
    >
      {children}
    </button>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="p-1.5 text-white/85 hover:text-white">
      {children}
    </button>
  );
}

function MenuCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute bottom-9 right-0 z-40 min-w-[8rem] overflow-hidden rounded-md bg-black/90 py-1 shadow-xl ring-1 ring-white/10">
      {children}
    </div>
  );
}

function SidePanel({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="absolute inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-black/80 p-5 shadow-2xl backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <button type="button" onClick={onClose} className="text-sm text-white/50">
          Cerrar
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-9 w-9 overflow-visible ${filled ? "fill-current" : "fill-white"}`} aria-hidden>
      <path d="M12 20.25S4.5 15.3 3.2 10.4C2.4 7.5 4.1 5 6.8 5c1.7 0 3.1 1 3.7 2.3C11.1 6 12.5 5 14.2 5c2.7 0 4.4 2.5 3.6 5.4C16.5 15.3 12 20.25 12 20.25z" />
    </svg>
  );
}
function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9 overflow-visible fill-white" aria-hidden>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H10l-5 4v-4.2A2.5 2.5 0 0 1 4 13.5z" />
    </svg>
  );
}
function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-9 w-9 overflow-visible ${filled ? "fill-current" : "fill-white"}`} aria-hidden>
      <path d="M12 3.6 14.4 9l6 .7-4.5 4.1 1.3 5.9L12 16.8 6.8 19.7 8.1 13.8 3.6 9.7 9.6 9z" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9 overflow-visible fill-white" aria-hidden>
      <path d="M14 4.5 21 12l-7 7.5V15c-6 0-9 2-11 6 1-7 5-11 11-11z" />
    </svg>
  );
}
function ChevronUp() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
      <path d="M6 14l6-6 6 6" />
    </svg>
  );
}
function ChevronDown() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
      <path d="M6 10l6 6 6-6" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
      <path d="M8 5v14l12-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
      <path d="M7 5h4v14H7zm6 0h4v14h-4z" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-white" strokeWidth="1.8">
      <path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
    </svg>
  );
}
function PipIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-white" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <rect x="12" y="11" width="7" height="6" rx="1" />
    </svg>
  );
}
function VolumePulseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-white" strokeWidth="1.8" aria-hidden>
      <path d="M4 10h4l5-4v12l-5-4H4z" />
      <path d="M15 9.5a4 4 0 0 1 0 5" />
      <path d="M17.5 7a7 7 0 0 1 0 10" />
    </svg>
  );
}
function RailVolumeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white" aria-hidden>
      <path d="M4 9h4l5-4v14l-5-4H4zm11 1.5a4 4 0 0 1 0 3" />
    </svg>
  );
}
function RailMuteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-white" strokeWidth="1.8" aria-hidden>
      <path d="M4 9h4l5-4v14l-5-4H4zM16 9l5 6M21 9l-5 6" />
    </svg>
  );
}
function VolumeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
      <path d="M4 9h4l5-4v14l-5-4H4zm11 1.5a4 4 0 0 1 0 3" />
    </svg>
  );
}
function MuteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-white" strokeWidth="1.8">
      <path d="M4 9h4l5-4v14l-5-4H4zM16 9l5 6M21 9l-5 6" />
    </svg>
  );
}
function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-white" strokeWidth="1.8">
      <path d="M4 10V4h6M20 14v6h-6M20 10V4h-6M4 14v6h6" />
    </svg>
  );
}

function LoopIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 fill-none ${active ? "stroke-klik-green" : "stroke-white"}`} strokeWidth="1.8" aria-hidden>
      <path d="M7 7h9a4 4 0 0 1 0 8h-1M17 17H8a4 4 0 0 1 0-8h1" />
      <path d="M7 7 9.5 4.5M7 7 9.5 9.5M17 17 14.5 14.5M17 17 14.5 19.5" />
    </svg>
  );
}
function CinemaIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-white" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M8 6v12M16 6v12" />
    </svg>
  );
}
function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9 overflow-visible fill-none stroke-white" strokeWidth="1.7">
      <path d="M6 8h12l-1 12H7L6 8zM9 8V6.5A3 3 0 0 1 12 3.5 3 3 0 0 1 15 6.5V8" />
    </svg>
  );
}
