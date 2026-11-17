import Link from "next/link";
import { PlatformShell } from "@/components/layout/PlatformShell";

export function FeedEmptyState({
  titleShell = "Inicio",
  kicker,
  title,
  body,
  actionHref,
  actionLabel,
}: {
  titleShell?: string;
  kicker: string;
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <PlatformShell title={titleShell} flush>
      <div className="flex h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-6 text-center">
        <p className="page-kicker">{kicker}</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-foreground/60">{body}</p>
        <Link href={actionHref} className="btn-primary mt-6 inline-flex min-h-11 items-center rounded-full px-6 text-sm font-bold">
          {actionLabel}
        </Link>
      </div>
    </PlatformShell>
  );
}
