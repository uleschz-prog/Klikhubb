import { PlatformShell } from "@/components/layout/PlatformShell";
import { mockPosts } from "@/data/mock";

export default function CommunityPage() {
  return (
    <PlatformShell title="Community">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-klik-green">Comunidad</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Community</h1>
      <p className="mt-2 max-w-xl text-sm text-white/55">
        Aquí se queda tu gente. Foros, anuncios y wins. Cada post suma puntos, no reclutas.
      </p>
      <div className="mt-8 space-y-3">
        {mockPosts.map((post) => (
          <article key={post.id} className="rounded-2xl border border-klik-line bg-klik-card p-5">
            <p className="text-[11px] uppercase tracking-wider text-white/40">{post.author}</p>
            <h2 className="mt-2 font-display text-lg font-bold">{post.title}</h2>
            <p className="mt-2 text-sm text-klik-cyan">{post.replies} respuestas</p>
          </article>
        ))}
      </div>
    </PlatformShell>
  );
}
