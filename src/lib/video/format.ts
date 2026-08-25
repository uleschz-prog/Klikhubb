export function formatCount(value: number): string {
  if (value >= 10_000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")} mil`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(value);
}

export function formatTimecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  if (hours > 0) return `${String(hours).padStart(2, "0")}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

export function formatFeedDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" }).replace(".", "");
}

export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "K";
}
