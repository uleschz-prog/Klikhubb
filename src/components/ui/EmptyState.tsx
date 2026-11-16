import Link from "next/link";

export function EmptyState({
  kicker,
  title,
  body,
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel,
}: {
  kicker?: string;
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="rounded-3xl border border-klik-line bg-klik-card px-6 py-16 text-center">
      {kicker ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">{kicker}</p>
      ) : null}
      <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-foreground">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-foreground/55">{body}</p>
      {actionHref && actionLabel ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href={actionHref} className="btn-primary inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold">
            {actionLabel}
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="inline-flex min-h-11 items-center rounded-full border border-klik-line px-5 text-sm font-semibold text-foreground"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
