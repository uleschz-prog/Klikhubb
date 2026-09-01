"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatProductPrice } from "@/lib/commerce/billing";
import { CheckoutForm } from "@/components/commerce/CheckoutForm";

export type BuyItem = {
  slug: string;
  title: string;
  price: number;
  currency: string;
  description?: string | null;
  type?: string | null;
  creatorName?: string;
  handle?: string;
  thumbnailUrl?: string | null;
};

const TYPE_LABEL: Record<string, string> = {
  COURSE: "Academia",
  MEMBERSHIP: "Membresía",
  DIGITAL: "Digital",
  PHYSICAL: "Físico",
};

export function BuyDrawer({
  open,
  onClose,
  item,
  signedIn,
  manualPaymentsEnabled,
  loginHref,
  cancelPath,
  canceled,
}: {
  open: boolean;
  onClose: () => void;
  item: BuyItem | null;
  signedIn: boolean;
  manualPaymentsEnabled: boolean;
  loginHref: string;
  cancelPath?: string;
  canceled?: boolean;
}) {
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!open) {
      setPaid(false);
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    setPaid(false);
  }, [item?.slug]);

  if (!open || !item) return null;

  const kind = item.type ? TYPE_LABEL[item.type] ?? item.type : "Producto";

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar compra"
        className="fixed inset-0 z-[55]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="buy-drawer-title"
        className="qlyk-buy-drawer fixed inset-y-0 right-0 z-[60] flex w-[min(92vw,440px)]"
      >
        <div className="w-10 shrink-0 bg-gradient-to-r from-transparent to-[rgba(10,10,12,0.82)]" aria-hidden />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[rgba(10,10,12,0.82)] backdrop-blur-2xl backdrop-saturate-150">
        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">Comprar</p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-lg leading-none text-white/70 hover:bg-white/14 hover:text-white"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
          <div className="overflow-hidden rounded-2xl">
            {item.thumbnailUrl ? (
              <img src={item.thumbnailUrl} alt="" className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="aspect-[4/3] bg-gradient-to-br from-emerald-950 via-neutral-950 to-cyan-950" />
            )}
          </div>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-klik-cyan">{kind}</p>
          <h2 id="buy-drawer-title" className="mt-1 font-display text-2xl font-extrabold text-white">
            {item.title}
          </h2>
          {item.creatorName ? (
            <p className="mt-1.5 text-sm text-white/50">
              Por {item.creatorName}
              {item.handle ? ` · @${item.handle}` : ""}
            </p>
          ) : null}
          <p className="mt-4 font-display text-3xl font-extrabold text-klik-pastel">
            {formatProductPrice(item.price, item.currency)}
          </p>
          {item.description ? <p className="mt-3 text-sm leading-6 text-white/65">{item.description}</p> : null}

          <ul className="mt-5 space-y-2.5 text-sm text-white/70">
            <li className="flex gap-2">
              <span className="text-klik-pastel">✓</span>
              Entras a la academia en cuanto confirmemos tu pago
            </li>
            <li className="flex gap-2">
              <span className="text-klik-pastel">✓</span>
              Te quedas en la comunidad del creador
            </li>
            <li className="flex gap-2">
              <span className="text-klik-pastel">✓</span>
              El creador cobra sin pedirte nada por fuera
            </li>
          </ul>

          {canceled ? (
            <p className="mt-5 rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/70">
              El pago se canceló. Puedes intentarlo de nuevo aquí, sin salir del video.
            </p>
          ) : null}

          {paid ? (
            <div className="mt-8 rounded-2xl bg-klik-pastel/10 px-4 py-5">
              <p className="font-display text-xl font-extrabold text-white">Ya estás dentro</p>
              <p className="mt-2 text-sm text-white/60">
                El acceso quedó en tu academy y en la comunidad. El video sigue aquí.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href={`/academy/${item.slug}`}
                  className="flex min-h-11 items-center justify-center rounded-full bg-klik-green text-sm font-bold text-klik-black"
                >
                  Ir a Academy
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex min-h-11 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white"
                >
                  Seguir viendo
                </button>
              </div>
            </div>
          ) : signedIn ? (
            <div className="mt-8">
              <CheckoutForm
                slug={item.slug}
                title={item.title}
                price={item.price}
                currency={item.currency}
                compact
                cancelPath={cancelPath}
                manualPaymentsEnabled={manualPaymentsEnabled}
                onPaid={() => setPaid(true)}
              />
            </div>
          ) : (
            <div className="mt-8">
              <Link
                href={loginHref}
                className="flex min-h-12 items-center justify-center rounded-full bg-klik-green text-sm font-bold text-klik-black"
              >
                Entra para comprar
              </Link>
              <p className="mt-3 text-center text-[11px] text-white/35">
                El video no se va. Cuando entres, este panel se abre otra vez.
              </p>
            </div>
          )}
        </div>
        </div>
      </aside>
    </>
  );
}
