import Image, { type ImageProps } from "next/image";

const ALLOWED_HOSTS = [
  /(?:^|\.)public\.blob\.vercel-storage\.com$/i,
  /(?:^|\.)blob\.vercel-storage\.com$/i,
  /(?:^|\.)image\.mux\.com$/i,
  /(?:^|\.)i\.ytimg\.com$/i,
  /(?:^|\.)ytimg\.com$/i,
  /(?:^|\.)googleusercontent\.com$/i,
];

function isOptimizedSrc(src: string) {
  if (src.startsWith("/")) return true;
  try {
    return ALLOWED_HOSTS.some((pattern) => pattern.test(new URL(src).hostname));
  } catch {
    return false;
  }
}

/**
 * next/image para Blob/Mux/avatares; si el host no está en remotePatterns,
 * cae a <img> para no romper la página.
 */
export function RemoteImage({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  fill = true,
  priority,
  style,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  fill?: boolean;
  priority?: boolean;
  style?: ImageProps["style"];
}) {
  if (!src) return null;
  if (!isOptimizedSrc(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={className} style={style} />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={className}
      style={style}
    />
  );
}
