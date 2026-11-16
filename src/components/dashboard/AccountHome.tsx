import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ProfileAvatarUpload } from "@/components/profile/ProfileAvatarUpload";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { formatCatalogPrice } from "@/lib/commerce/display-fx";
import { formatMoney } from "@/lib/commerce/split";

type AccountHomeProps = {
  displayName: string;
  username: string | null;
  imageUrl: string | null;
  wallet: { available: number; pending: number; lifetimeEarned: number };
  holdLabel: string;
  fxRate: number;
  purchaseCount: number;
  courseCount: number;
  unreadAvisos: number;
};

function Icon({
  children,
  className = "h-5 w-5",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </Icon>
  );
}

function ChevronIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M9 5l7 7-7 7" />
    </Icon>
  );
}

function WalletIcon() {
  return (
    <Icon>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h13A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-9Z" />
      <path d="M3 9h18" />
      <path d="M16 14h.01" />
    </Icon>
  );
}

function BagIcon() {
  return (
    <Icon>
      <path d="M6 8h12l-.8 11.2A2 2 0 0 1 15.21 21H8.79a2 2 0 0 1-1.99-1.8L6 8Z" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
    </Icon>
  );
}

function BookIcon() {
  return (
    <Icon>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H20v16H6.5A1.5 1.5 0 0 0 5 20.5V4.5Z" />
      <path d="M5 20.5A1.5 1.5 0 0 1 6.5 19H20" />
    </Icon>
  );
}

function PublishIcon() {
  return (
    <Icon>
      <path d="M12 16V5" />
      <path d="M7.5 9.5 12 5l4.5 4.5" />
      <path d="M5 19h14" />
    </Icon>
  );
}

function BellIcon() {
  return (
    <Icon>
      <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </Icon>
  );
}

const ACCESOS = [
  {
    href: "/orders",
    title: "Compras",
    hint: "Pedidos y cursos",
    chip: "bg-klik-cyan/15 text-klik-cyan",
    icon: <BagIcon />,
    countKey: "purchaseCount" as const,
  },
  {
    href: "/cursos",
    title: "Mis cursos",
    hint: "Lo que ya tienes",
    chip: "bg-klik-green/15 text-klik-green",
    icon: <BookIcon />,
    countKey: "courseCount" as const,
  },
  {
    href: "/publish",
    title: "Publicar",
    hint: "Sube un video",
    chip: "bg-[#7C3AED]/15 text-[#8B5CF6]",
    icon: <PublishIcon />,
    countKey: null,
  },
  {
    href: "/notifications",
    title: "Avisos",
    hint: "Notificaciones",
    chip: "bg-amber-400/15 text-amber-500",
    icon: <BellIcon />,
    countKey: "unreadAvisos" as const,
  },
];

export function AccountHome({
  displayName,
  username,
  imageUrl,
  wallet,
  holdLabel,
  fxRate,
  purchaseCount,
  courseCount,
  unreadAvisos,
}: AccountHomeProps) {
  const counts = { purchaseCount, courseCount, unreadAvisos };
  const mxnAvailable = formatCatalogPrice(wallet.available, "USD", fxRate);
  const mxnLabel = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(mxnAvailable.amountMxn);
  const total = Math.max(0, wallet.available) + Math.max(0, wallet.pending);
  const heldPct = total > 0 ? Math.min(100, Math.round((Math.max(0, wallet.pending) / total) * 100)) : 0;
  const profileHref = username ? `/u/${username}` : null;

  return (
    <div className="space-y-6">
      <header
        id="perfil"
        className="dash-rise relative rounded-3xl border border-klik-line p-5 shadow-sm md:p-6"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden>
          <div className="absolute inset-0 bg-klik-card/80 backdrop-blur-xl" />
          <div className="dash-aurora" />
        </div>
        <div className="relative flex items-center gap-3 sm:gap-4">
          <div className="shrink-0 rounded-full bg-gradient-to-br from-klik-green/80 via-klik-pastel/40 to-klik-cyan/70 p-[2px] shadow-[0_0_24px_-6px_rgba(48,209,88,0.7)]">
            <UserAvatar
              name={displayName}
              imageUrl={imageUrl}
              size="lg"
              className="!h-16 !w-16 !text-lg ring-0 md:!h-20 md:!w-20 md:!text-xl"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white/55">Hola</p>
            <h1 className="mt-0.5 truncate font-display text-2xl font-extrabold tracking-tight md:text-3xl">
              {displayName}
            </h1>
            <div className="mt-2 flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              {username ? (
                <span className="rounded-full bg-black/20 px-2.5 py-1 text-xs font-medium text-white/60">
                  @{username}
                </span>
              ) : null}
              {profileHref ? (
                <Link
                  href={profileHref}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-klik-line bg-klik-card/80 px-3 text-sm font-semibold text-klik-cyan transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Ver perfil
                  <ChevronIcon className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <section className="dash-rise dash-rise-1 dash-money-glow relative overflow-hidden rounded-3xl p-px">
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-klik-green via-klik-pastel/40 to-klik-cyan"
          aria-hidden
        />
        <div className="relative rounded-[1.4rem] bg-klik-card/95 p-5 backdrop-blur-xl md:p-6">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Tu dinero</p>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-klik-green/15 text-klik-green">
              <WalletIcon />
            </span>
          </div>

          <p className="mt-3 font-display text-4xl font-extrabold tracking-tight text-klik-green md:text-5xl">
            {formatMoney(wallet.available)}
          </p>
          <p className="mt-1 text-sm text-white/50">Disponible para retirar</p>
          <p className="mt-1 text-sm font-semibold text-white/80">
            ≈ {mxnLabel}
            <span className="ml-1 text-xs font-medium text-white/45">
              {mxnAvailable.approximate ? "aprox. · cambio de referencia" : "MXN"}
            </span>
          </p>

          <div className="dash-held-row mt-5 rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="dash-held-label inline-flex min-h-11 items-center gap-2">
                <span className="dash-held-icon inline-flex h-8 w-8 items-center justify-center rounded-full bg-klik-cyan/15 text-klik-cyan">
                  <ClockIcon className="h-4 w-4" />
                </span>
                En espera ({holdLabel})
              </span>
              <span className="dash-held-amount font-semibold text-klik-cyan">{formatMoney(wallet.pending)}</span>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-label="Saldo en espera de 24 horas"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={heldPct}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-klik-cyan to-klik-green transition-[width] duration-500"
                style={{ width: `${heldPct}%` }}
              />
            </div>
            <p className="dash-held-hint mt-2 text-xs">
              {wallet.pending > 0
                ? "Este saldo se libera cuando pasa la ventana de espera."
                : "Todavía no hay saldo en espera."}
            </p>
          </div>

          {wallet.lifetimeEarned > 0 ? (
            <p className="mt-3 text-xs text-white/40">
              Ganado en total: {formatMoney(wallet.lifetimeEarned)}
            </p>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/wallet"
              className="dash-cta-shine inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-klik-green px-6 text-sm font-bold text-klik-black shadow-[0_10px_24px_-10px_rgba(48,209,88,0.85)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_-10px_rgba(48,209,88,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Abrir monedero
            </Link>
            <Link
              href="/wallet#movimientos"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-klik-line bg-transparent px-5 text-sm font-semibold text-white/80 transition hover:-translate-y-0.5 hover:border-klik-cyan/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Ver movimientos
            </Link>
          </div>
          <p className="mt-3 text-center text-xs leading-relaxed text-white/40">
            Cuando tengas saldo disponible, pide el retiro en el monedero. Por ahora el equipo lo deposita a mano.
          </p>
        </div>
      </section>

      <section className="dash-rise dash-rise-2">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Accesos</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {ACCESOS.map((item) => {
            const count = item.countKey ? counts[item.countKey] : 0;
            const showBadge = Boolean(item.countKey) && count > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex min-h-[7.5rem] flex-col rounded-2xl border border-klik-line bg-klik-card p-4 transition hover:-translate-y-1 hover:border-klik-cyan/40 hover:shadow-[0_16px_30px_-18px_rgba(10,132,255,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${item.chip}`}>
                    {item.icon}
                  </span>
                  <span className="flex items-center gap-1">
                    {showBadge ? (
                      <span className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-klik-green px-1.5 text-[11px] font-bold text-klik-black">
                        {count > 99 ? "99+" : count}
                      </span>
                    ) : null}
                    <ChevronIcon className="h-4 w-4 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-klik-cyan" />
                  </span>
                </div>
                <p className="mt-3 font-display text-lg font-bold leading-tight">{item.title}</p>
                <p className="mt-1 text-xs text-white/45">{item.hint}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function AccountSettingsCard({
  displayName,
  imageUrl,
}: {
  displayName: string;
  imageUrl: string | null;
}) {
  return (
    <section className="dash-rise dash-rise-3 rounded-3xl border border-klik-line bg-klik-card p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Tu perfil</p>
      <div className="mt-4">
        <ProfileAvatarUpload name={displayName} imageUrl={imageUrl} compact />
      </div>
      <div className="mt-5 border-t border-klik-line pt-4">
        <LogoutButton className="inline-flex min-h-11 items-center rounded-full border border-klik-line px-4 text-sm font-medium text-white/55 transition hover:border-red-400/30 hover:bg-red-500/5 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green focus-visible:ring-offset-2 focus-visible:ring-offset-background" />
      </div>
    </section>
  );
}

export function AccountCreateSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="dash-rise dash-rise-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Crear</p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/studio"
          className="inline-flex min-h-12 items-center rounded-full bg-klik-cyan px-6 text-sm font-bold text-klik-black shadow-[0_10px_22px_-12px_rgba(10,132,255,0.8)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Crear curso
        </Link>
        <Link
          href="/publish"
          className="inline-flex min-h-12 items-center rounded-full border border-klik-line px-6 text-sm font-bold text-foreground transition hover:-translate-y-0.5 hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Publicar video
        </Link>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AccountAdminSection() {
  const links = [
    { href: "/admin/users", label: "Usuarios y red" },
    { href: "/admin/setup", label: "Setup" },
    { href: "/admin/payments", label: "Pagos" },
    { href: "/admin/creator-plans", label: "Planes" },
    { href: "/admin/payouts", label: "Retiros" },
  ];

  return (
    <section className="dash-admin dash-rise dash-rise-5 rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4">
      <p className="dash-admin-kicker text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Admin</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="dash-admin-chip inline-flex min-h-11 items-center rounded-full border border-amber-400/20 bg-black/10 px-3 text-sm font-semibold text-klik-cyan transition hover:-translate-y-0.5 hover:border-klik-cyan/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-klik-green focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
