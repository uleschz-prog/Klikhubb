"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "qlyk-creator-onboarding-dismissed";

export type CreatorOnboardingProgress = {
  hasProfile: boolean;
  hasClip: boolean;
  hasCourse: boolean;
};

const STEPS = [
  {
    id: "profile",
    title: "Tu perfil",
    body: "Pon tu foto y tu nombre para que la gente sepa quién publica.",
    href: "/dashboard#perfil",
    action: "Completar perfil",
    doneKey: "hasProfile" as const,
  },
  {
    id: "clip",
    title: "Tu primer clip",
    body: "Sube un video corto. Si quieres vender, enlázalo a un curso.",
    href: "/publish",
    action: "Subir clip",
    doneKey: "hasClip" as const,
  },
  {
    id: "course",
    title: "Tu primer curso",
    body: "Arma un curso o membresía en Studio y publícalo cuando esté listo.",
    href: "/studio/new",
    action: "Crear curso",
    doneKey: "hasCourse" as const,
  },
];

export function CreatorOnboarding({ progress }: { progress: CreatorOnboardingProgress }) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const dismissed = window.localStorage.getItem(STORAGE_KEY) === "1";
    const complete = progress.hasProfile && progress.hasClip && progress.hasCourse;
    setHidden(dismissed || complete);
  }, [progress]);

  if (hidden) return null;

  const doneCount = STEPS.filter((step) => progress[step.doneKey]).length;

  function dismiss() {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setHidden(true);
  }

  return (
    <section className="rounded-3xl border border-klik-line bg-klik-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="page-kicker">Empieza a crear</p>
          <h2 className="mt-2 font-display text-xl font-extrabold">Tres pasos para publicar en Qlyk</h2>
          <p className="mt-1 text-sm text-foreground/55">
            {doneCount} de {STEPS.length} listos. Puedes saltártelo y volver cuando quieras.
          </p>
        </div>
        <button type="button" onClick={dismiss} className="text-sm font-semibold text-foreground/45 hover:text-foreground">
          Ahora no
        </button>
      </div>
      <ol className="mt-5 grid gap-3 md:grid-cols-3">
        {STEPS.map((step, index) => {
          const done = progress[step.doneKey];
          return (
            <li key={step.id} className="rounded-2xl border border-klik-line px-4 py-4">
              <p className={`text-xs font-bold ${done ? "text-klik-green" : "text-foreground/40"}`}>
                {done ? "Listo" : `Paso ${index + 1}`}
              </p>
              <h3 className="mt-1 font-display text-lg font-bold">{step.title}</h3>
              <p className="mt-1 text-sm leading-6 text-foreground/55">{step.body}</p>
              <Link
                href={step.href}
                className={`mt-4 inline-flex min-h-10 items-center rounded-full px-4 text-sm font-bold ${
                  done ? "border border-klik-line text-foreground" : "btn-primary"
                }`}
              >
                {done ? "Revisar" : step.action}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
