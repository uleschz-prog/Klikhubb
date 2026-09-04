"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FeedVideo } from "@/lib/video/types";
import { formatCount, formatFeedDate, formatTimecode } from "@/lib/video/format";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { LogoMark } from "@/components/brand/LogoMark";
import { PlatformNav } from "@/components/layout/PlatformNav";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { formatProductPrice } from "@/lib/commerce/billing";
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

type Panel = "none" | "comments" | "playlist" | "more";
type Menu = "none" | "speed" | "quality" | "volume";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export function FeedTheater({
  videos,
  initialId,
  signedIn = false,
  manualPaymentsEnabled = false,
  buySlug,
  canceled = false,
  home = "shop",
  feedTab = "foryou",
}: {
  videos: FeedVideo[];
  initialId?: string;
  signedIn?: boolean;
  manualPaymentsEnabled?: boolean;
  buySlug?: string;
  canceled?: boolean;
  home?: "play" | "shop";
  feedTab?: "foryou" | "following" | "saved";
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
    [basePath, feedTab, home],
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
  const [listening, setListening] = useState(false);
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
  const [shopOpen, setShopOpen] = useState(Boolean(buySlug));

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

  function openShop() {
    if (!video.product) return;
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
      className="relative h-[100dvh] overflow-hidden bg-black text-white"
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
          className="absolute inset-0 h-full w-full object-cover"
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
          className="absolute left-1/2 top-[42%] z-[18] flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/70 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur md:hidden"
        >
          <VolumePulseIcon />
          Toca para audio
        </button>
      ) : null}

      {!hidden ? (
        <>
          <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <div className="pointer-events-auto flex items-center gap-3">
              <Link href={basePath} className="flex items-center gap-2" aria-label="Qlyk">
                <LogoMark className="h-8 w-8 drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]" />
              </Link>
            </div>
            <nav className="pointer-events-auto absolute left-1/2 top-[max(0.85rem,env(safe-area-inset-top))] flex -translate-x-1/2 items-center gap-3 text-[12px] font-semibold sm:gap-4 sm:text-[13px]">
              <Link
                href="/play"
                className={home === "play" && feedTab === "foryou" ? "text-white" : "text-white/50"}
              >
                Play
              </Link>
              <Link
                href="/play?tab=following"
                className={home === "play" && feedTab === "following" ? "text-white" : "text-white/50"}
              >
                Siguiendo
              </Link>
              <Link
                href="/play?tab=saved"
                className={home === "play" && feedTab === "saved" ? "text-white" : "text-white/50"}
              >
                Guardados
              </Link>
              <Link href="/feed" className={home === "shop" ? "text-white" : "text-white/50"}>
                Tienda
              </Link>
            </nav>
            <div className="pointer-events-auto hidden md:block">
              <PlatformNav />
            </div>
          </header>

          <aside className="absolute right-2 z-30 flex max-h-[calc(100dvh-11rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col items-center gap-2 overflow-y-auto overscroll-contain pb-1 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] max-md:bottom-[calc(4.75rem+env(safe-area-inset-bottom))] max-md:top-auto md:right-8 md:top-[12%] md:max-h-none md:gap-4 md:overflow-visible [&::-webkit-scrollbar]:hidden">
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
              <UserAvatar name={video.creatorName} imageUrl={video.creatorImage} size="lg" />
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
              className="mt-2 max-w-[4.5rem] truncate text-center text-[10px] font-semibold text-white/80 hover:text-klik-cyan"
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
            <RailAction
              active={!muted}
              label={muted ? "Sin audio" : "Audio"}
              ariaLabel={muted ? "Activar audio" : "Silenciar"}
              onClick={() => {
                if (muted) enableAudio();
                else setMuted(true);
              }}
              compact
            >
              {muted || volume === 0 ? <RailMuteIcon /> : <RailVolumeIcon />}
            </RailAction>
            <RailAction
              active={listening}
              label="Escuchar"
              onClick={() => {
                setListening((value) => !value);
                enableAudio();
                showToast(listening ? "Volviste al video." : "Modo escuchar activo.");
              }}
              compact
            >
              <HeadphonesIcon />
            </RailAction>
            <RailAction label="Más" onClick={() => setPanel(panel === "more" ? "none" : "more")}>
              <DotsIcon />
            </RailAction>
            {video.product ? (
              <RailAction label="Comprar" onClick={openShop}>
                <BagIcon />
              </RailAction>
            ) : null}
          </aside>

          <div className="absolute bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-3 z-20 max-w-[calc(100%-4.75rem)] md:bottom-16 md:left-8 md:max-w-[min(42rem,calc(100%-7.5rem))]">
            <p className="text-sm font-semibold text-white drop-shadow">
              @{video.handle}
              {video.publishedAt ? <span className="font-normal text-white/70"> · {formatFeedDate(video.publishedAt)}</span> : null}
            </p>
            <p className="mt-2 text-[15px] leading-6 text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)]">{video.caption}</p>
            {tags.length ? (
              <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[13px] font-medium text-white/90">
                {tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </p>
            ) : null}
            {video.product && !shopOpen ? (
              <button
                type="button"
                onClick={openShop}
                className="mt-3 inline-flex items-center gap-2 rounded-md bg-white/12 px-3 py-1.5 text-[12px] font-medium text-white/90 backdrop-blur"
              >
                <CollectionIcon />
                Serie · {video.product.title}
              </button>
            ) : !video.product ? (
              <p className="mt-3 text-[11px] text-white/40">Feed · Qlyk</p>
            ) : null}
            {video.product && !shopOpen ? (
              <button
                type="button"
                onClick={openShop}
                className="mt-3 flex max-w-sm items-center justify-between gap-3 rounded-full bg-klik-green px-4 py-2.5 text-sm font-bold text-klik-black"
              >
                <span>Llevar {video.product.title}</span>
                <span className="rounded-full bg-black/15 px-2.5 py-0.5 text-xs">
                  {formatProductPrice(video.product.price, video.product.currency)}
                </span>
              </button>
            ) : null}
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
          className="group relative block h-5 w-full"
          aria-label="Barra de progreso"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            seekRatio((event.clientX - rect.left) / rect.width);
          }}
        >
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/25 group-hover:h-1" />
          <span
            className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-white group-hover:h-1"
            style={{ width: duration ? `${(current / duration) * 100}%` : "0%" }}
          />
        </button>
        <div className="hidden items-center gap-3 bg-black/55 px-4 py-2 backdrop-blur-sm md:flex">
          <button type="button" onClick={togglePlay} className="p-1" aria-label={playing ? "Pausa" : "Reproducir"}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <p className="min-w-[7.5rem] font-mono text-xs text-white/80">
            {formatTimecode(current)} / {formatTimecode(duration)}
          </p>
          <div className="flex-1" />
          <label className="flex items-center gap-2 text-xs text-white/80">
            <span
              className={`relative h-5 w-9 rounded-full ${continuous ? "bg-[#FE2C55]" : "bg-white/25"}`}
            >
              <input
                type="checkbox"
                className="peer sr-only"
                checked={continuous}
                onChange={(event) => setContinuous(event.target.checked)}
              />
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                  continuous ? "left-4" : "left-0.5"
                }`}
              />
            </span>
            Continuo
          </label>
          <BarButton onClick={() => setChrome((value) => !value)}>Limpiar</BarButton>
          <div className="relative">
            <BarButton onClick={() => setMenu(menu === "quality" ? "none" : "quality")}>Auto</BarButton>
            {menu === "quality" ? (
              <MenuCard>
                <p className="px-3 py-2 text-xs text-white/50">Una calidad · Auto</p>
              </MenuCard>
            ) : null}
          </div>
          <div className="relative">
            <BarButton onClick={() => setMenu(menu === "speed" ? "none" : "speed")}>Velocidad</BarButton>
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
                      speed === value ? "text-klik-cyan" : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {value === 1 ? "Normal" : `${value}x`}
                  </button>
                ))}
              </MenuCard>
            ) : null}
          </div>
          <IconBtn label="Lista" onClick={() => setPanel(panel === "playlist" ? "none" : "playlist")}>
            <ListIcon />
          </IconBtn>
          <IconBtn label="Mini reproductor" onClick={() => void togglePip()}>
            <PipIcon />
          </IconBtn>
          <div className="relative">
            <IconBtn
              label={muted ? "Silencio" : "Volumen"}
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
              className="min-h-11 flex-1 rounded-full border border-white/15 bg-black/40 px-4 text-sm outline-none ring-klik-cyan focus:ring-2"
            />
            <button type="submit" className="rounded-full bg-klik-cyan px-4 text-sm font-bold text-klik-black">
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

      {panel === "more" ? (
        <SidePanel title="Más" onClose={() => setPanel("none")}>
          <button type="button" className="block w-full rounded-xl px-3 py-3 text-left text-sm hover:bg-white/10" onClick={() => void shareVideo()}>
            Copiar enlace
          </button>
          <Link href="/community" className="block rounded-xl px-3 py-3 text-sm hover:bg-white/10">
            Ir a la comunidad
          </Link>
          <Link href="/publish" className="block rounded-xl px-3 py-3 text-sm hover:bg-white/10">
            Publicar el tuyo
          </Link>
          <button
            type="button"
            className="block w-full rounded-xl px-3 py-3 text-left text-sm text-white/55 hover:bg-white/10"
            onClick={() => {
              showToast("Recibido. Lo revisamos.");
              setPanel("none");
            }}
          >
            Reportar
          </button>
        </SidePanel>
      ) : null}

      <BuyDrawer
        open={shopOpen}
        onClose={closeShop}
        item={shopItem}
        signedIn={signedIn}
        manualPaymentsEnabled={manualPaymentsEnabled}
        loginHref={`/login?callbackUrl=${encodeURIComponent(clipHref(video.id, video.product ? { buy: video.product.slug } : {}))}`}
        cancelPath={clipHref(video.id, video.product ? { buy: video.product.slug } : {})}
        canceled={canceled}
      />

      {toast ? (
        <p className="absolute left-1/2 top-20 z-40 -translate-x-1/2 rounded-full bg-black/75 px-4 py-2 text-xs text-white">
          {toast}
        </p>
      ) : null}

      <Link
        href={home === "play" ? "/publish?lane=play" : "/publish"}
        aria-label={home === "play" ? "Subir un clip" : "Publicar y vender"}
        className="absolute bottom-[calc(4.85rem+env(safe-area-inset-bottom))] right-2 z-40 flex h-12 w-12 items-center justify-center rounded-2xl bg-klik-green text-2xl font-light leading-none text-klik-black shadow-[0_8px_28px_rgba(0,255,65,0.35)] md:bottom-8 md:right-8 md:h-14 md:w-14 md:text-3xl"
      >
        +
      </Link>
          {!hidden ? <MobileTabBar /> : null}
    </div>
  );
}

function RailAction({
  label,
  children,
  onClick,
  active,
  ariaLabel,
  compact,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  ariaLabel?: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 overflow-visible ${compact ? "w-11 md:w-12" : "w-11 md:w-12"}`}
    >
      <span
        className={`flex items-center justify-center overflow-visible ${
          compact ? "h-10 w-10 md:h-12 md:w-12" : "h-10 w-10 md:h-12 md:w-12"
        } ${active ? "text-[#FE2C55]" : "text-white"}`}
      >
        {children}
      </span>
      <span className="max-w-[3.25rem] truncate text-center text-[10px] font-medium leading-tight text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.85)] md:text-[11px]">
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
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-25"
    >
      {children}
    </button>
  );
}

function BarButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="px-2 py-1 text-xs text-white/85 hover:text-white">
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
    <div className="absolute inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-neutral-950/95 p-5 shadow-2xl ring-1 ring-white/10 backdrop-blur-md">
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
    <svg viewBox="0 0 24 24" className={`h-9 w-9 overflow-visible ${filled ? "fill-[#FE2C55]" : "fill-white"}`} aria-hidden>
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
    <svg viewBox="0 0 24 24" className={`h-9 w-9 overflow-visible ${filled ? "fill-[#FE2C55]" : "fill-white"}`} aria-hidden>
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
function HeadphonesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9 overflow-visible fill-none stroke-white" strokeWidth="1.8" aria-hidden>
      <path d="M4 13a8 8 0 0 1 16 0v6h-4v-5h4M4 19h4v-5H4z" />
    </svg>
  );
}
function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9 overflow-visible fill-white" aria-hidden>
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
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
function CollectionIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
      <path d="M4 7h16v12H4zM8 7V5h8v2" />
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
