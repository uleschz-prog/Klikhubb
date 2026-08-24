type LogoMarkProps = {
  className?: string;
  framed?: boolean;
};

/** K mínima: video + un clic. */
export function LogoMark({ className = "h-8 w-8", framed = false }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-hidden>
      {framed ? <rect width="64" height="64" rx="16" fill="#050505" /> : null}
      <path
        d="M24 29 L53 9"
        fill="none"
        stroke="#00F0FF"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M24 35 L53 55"
        fill="none"
        stroke="#00F0FF"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <rect x="11" y="6" width="14" height="52" rx="2.5" fill="#00F0FF" />
      <circle cx="25" cy="32" r="13.5" fill="#050505" />
      <path d="M20.6 26.5 L30.8 32 L20.6 37.5 Z" fill="#00F0FF" />
    </svg>
  );
}
