import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { legalMeta, type LegalSection } from "@/config/legal";

type LegalDocumentProps = {
  title: string;
  intro: string;
  sections: LegalSection[];
  related?: { href: string; label: string }[];
};

export function LegalDocument({ title, intro, sections, related }: LegalDocumentProps) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-white/70">
      <Logo />
      <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">
        Versión {legalMeta.version} · Última actualización: {legalMeta.lastUpdated}
      </p>
      <h1 className="mt-3 font-display text-3xl font-extrabold text-white md:text-4xl">{title}</h1>
      <p className="mt-4 text-sm leading-7 text-white/60">{intro}</p>

      <nav aria-label="Índice del documento" className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Índice</p>
        <ol className="mt-3 space-y-2 text-sm">
          {sections.map((section, index) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="text-klik-cyan transition hover:text-white">
                {index + 1}. {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12 space-y-12">
        {sections.map((section, index) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="font-display text-xl font-bold text-white md:text-2xl">
              {index + 1}. {section.title}
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-7">
              {section.blocks.map((block, blockIndex) => (
                <div key={blockIndex} className="space-y-3">
                  {block.paragraphs?.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                  {block.list ? (
                    <ul className="list-disc space-y-2 pl-5 marker:text-klik-cyan">
                      {block.list.map((item) => (
                        <li key={item.slice(0, 48)}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <aside className="mt-14 rounded-2xl border border-white/10 bg-black/40 p-5 text-sm leading-7">
        <p className="font-semibold text-white">Contacto legal</p>
        <p className="mt-2">
          Responsable: {legalMeta.legalEntity}
          {legalMeta.taxId !== "[NIF/CIF — completar]" ? ` · ${legalMeta.taxId}` : null}
        </p>
        <p>Domicilio: {legalMeta.address}</p>
        <p>
          Email general:{" "}
          <a href={`mailto:${legalMeta.contactEmail}`} className="text-klik-cyan hover:text-white">
            {legalMeta.contactEmail}
          </a>
        </p>
        <p>
          Privacidad:{" "}
          <a href={`mailto:${legalMeta.privacyEmail}`} className="text-klik-cyan hover:text-white">
            {legalMeta.privacyEmail}
          </a>
        </p>
        <p className="mt-3 text-white/50">
          Sitio:{" "}
          <a href={legalMeta.siteUrl} className="text-klik-cyan hover:text-white">
            {legalMeta.siteUrl}
          </a>
        </p>
      </aside>

      {related?.length ? (
        <p className="mt-8 text-sm">
          Documentos relacionados:{" "}
          {related.map((link, index) => (
            <span key={link.href}>
              {index > 0 ? " · " : null}
              <Link href={link.href} className="text-klik-cyan hover:text-white">
                {link.label}
              </Link>
            </span>
          ))}
        </p>
      ) : null}
    </main>
  );
}
