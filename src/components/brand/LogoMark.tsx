type LogoMarkProps = {
  className?: string;
  framed?: boolean;
};

/** Q de Qlyk: anillo de video, play adentro, cola de un clic. Azul de los botones de la landing. */
export function LogoMark({ className = "h-8 w-8", framed = false }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-hidden>
      {framed ? <rect width="64" height="64" rx="16" fill="currentColor" className="text-[#050505]" /> : null}
      <g transform="translate(2.4 2.4)" opacity="0.45">
        <circle cx="30" cy="30" r="16.2" fill="none" stroke="var(--l-accent)" strokeWidth="6.2" />
        <path d="M41.2 41.2 L52 52" fill="none" stroke="var(--l-accent)" strokeWidth="6.2" strokeLinecap="round" />
      </g>
      <circle cx="30" cy="30" r="16.2" fill="none" stroke="var(--l-accent)" strokeWidth="6.2" />
      <path d="M41.2 41.2 L52 52" fill="none" stroke="var(--l-accent)" strokeWidth="6.2" strokeLinecap="round" />
      <circle cx="30" cy="30" r="12.4" className="logo-play-disc" />
      <path d="M25.2 23.8 L39.4 30 L25.2 36.2 Z" fill="var(--l-accent)" />
    </svg>
  );
}
