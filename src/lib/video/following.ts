const KEY = "qlyk-following";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function write(handles: string[]) {
  window.localStorage.setItem(KEY, JSON.stringify(handles));
}

export function listFollowing(): string[] {
  return read();
}

export function isFollowing(handle: string): boolean {
  return read().includes(handle);
}

export function toggleFollow(handle: string): boolean {
  const current = read();
  const next = current.includes(handle) ? current.filter((item) => item !== handle) : [...current, handle];
  write(next);
  return next.includes(handle);
}
