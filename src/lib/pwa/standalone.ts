/** Utilidades para modo PWA / standalone (instalada en pantalla de inicio). */

export function isStandaloneDisplayMode() {
  if (typeof window === "undefined") return false;
  const standaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
  const fullscreenMedia = window.matchMedia("(display-mode: fullscreen)").matches;
  const iosStandalone = "standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return standaloneMedia || fullscreenMedia || iosStandalone;
}

export function isIosDevice() {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
}

export function isMobileUserAgent() {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent);
}
