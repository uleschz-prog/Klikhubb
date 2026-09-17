"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Artifact = {
  id: string;
  kind: "IMAGE" | "VIDEO" | "NOTEBOOK" | "AGENT";
  title: string;
  prompt: string;
  output: string;
  createdAt: string;
};

type NotebookListItem = { id: string; title: string; updatedAt: string; sources: number; turns: number };
type Notebook = {
  id: string;
  title: string;
  body: string;
  sources: { id: string; title: string; content: string }[];
  turns: { id: string; role: string; content: string; createdAt: string }[];
};
type AgentRun = { id: string; goal: string; plan: string; result: string; createdAt: string };

function parseOutput(raw: string): { url?: string; kind?: string; frames?: string[] } {
  try {
    return JSON.parse(raw) as { url?: string; kind?: string; frames?: string[] };
  } catch {
    return { url: raw };
  }
}

export function AcademyStudioClient({
  artifacts: initialArtifacts,
  notebooks: initialNotebooks,
  agents: initialAgents,
}: {
  artifacts: Artifact[];
  notebooks: NotebookListItem[];
  agents: AgentRun[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"image" | "video" | "notebook" | "agent">("image");
  const [artifacts, setArtifacts] = useState(initialArtifacts);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notebooks, setNotebooks] = useState(initialNotebooks);
  const [notebookTitle, setNotebookTitle] = useState("");
  const [activeNotebook, setActiveNotebook] = useState<Notebook | null>(null);
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceContent, setSourceContent] = useState("");
  const [question, setQuestion] = useState("");
  const [agents, setAgents] = useState(initialAgents);
  const [goal, setGoal] = useState("");

  const gallery = useMemo(
    () => artifacts.filter((item) => (tab === "image" ? item.kind === "IMAGE" : tab === "video" ? item.kind === "VIDEO" : true)),
    [artifacts, tab],
  );

  async function generate(kind: "image" | "video") {
    setBusy(true);
    setError("");
    const response = await fetch("/api/academy/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, prompt }),
    });
    const payload = (await response.json()) as { error?: string; artifact?: Artifact; code?: string };
    setBusy(false);
    if (payload.code === "ACADEMY_INACTIVE") {
      router.push("/academy");
      return;
    }
    if (!response.ok || !payload.artifact) {
      setError(payload.error ?? "No se pudo generar.");
      return;
    }
    setArtifacts((current) => [payload.artifact!, ...current]);
    setPrompt("");
    router.refresh();
  }

  async function createNotebook() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/academy/notebooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: notebookTitle || "Notebook sin título" }),
    });
    const payload = (await response.json()) as { error?: string; notebook?: Notebook };
    setBusy(false);
    if (!response.ok || !payload.notebook) {
      setError(payload.error ?? "No se pudo crear el notebook.");
      return;
    }
    setNotebooks((current) => [
      { id: payload.notebook!.id, title: payload.notebook!.title, updatedAt: new Date().toISOString(), sources: 0, turns: 0 },
      ...current,
    ]);
    setActiveNotebook(payload.notebook);
    setNotebookTitle("");
  }

  async function addSource() {
    if (!activeNotebook) return;
    setBusy(true);
    setError("");
    const response = await fetch(`/api/academy/notebooks/${activeNotebook.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "source", title: sourceTitle, content: sourceContent }),
    });
    const payload = (await response.json()) as { error?: string; notebook?: Notebook };
    setBusy(false);
    if (!response.ok || !payload.notebook) {
      setError(payload.error ?? "No se pudo agregar la fuente.");
      return;
    }
    setActiveNotebook(payload.notebook);
    setSourceTitle("");
    setSourceContent("");
  }

  async function askNotebook() {
    if (!activeNotebook) return;
    setBusy(true);
    setError("");
    const response = await fetch(`/api/academy/notebooks/${activeNotebook.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ask", question }),
    });
    const payload = (await response.json()) as { error?: string; notebook?: Notebook };
    setBusy(false);
    if (!response.ok || !payload.notebook) {
      setError(payload.error ?? "No se pudo consultar.");
      return;
    }
    setActiveNotebook(payload.notebook);
    setQuestion("");
    router.refresh();
  }

  async function runAgent() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/academy/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal }),
    });
    const payload = (await response.json()) as { error?: string; run?: AgentRun };
    setBusy(false);
    if (!response.ok || !payload.run) {
      setError(payload.error ?? "El agente no pudo terminar.");
      return;
    }
    setAgents((current) => [payload.run!, ...current]);
    setGoal("");
    router.refresh();
  }

  const tabs = [
    { id: "image" as const, label: "Imagen" },
    { id: "video" as const, label: "Video" },
    { id: "notebook" as const, label: "Notebook LM" },
    { id: "agent" as const, label: "Agentes" },
  ];

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-klik-line bg-klik-card px-5 py-4">
        <p className="text-sm text-white/60">
          Acceso <span className="font-display text-lg font-bold text-klik-cyan">ilimitado</span>
          <span className="text-white/35"> · incluido en tu mensualidad</span>
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold ${
              tab === item.id ? "bg-klik-cyan text-klik-black" : "border border-white/10 text-white/70"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

      {tab === "image" || tab === "video" ? (
        <div className="mt-6 space-y-4">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={5}
            maxLength={2000}
            placeholder={tab === "image" ? "Describe la imagen con detalle…" : "Describe el video, estilo, cámara y duración percibida…"}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-klik-cyan/40"
          />
          <button
            type="button"
            disabled={busy || prompt.trim().length < 8}
            onClick={() => void generate(tab)}
            className="inline-flex min-h-12 items-center rounded-full bg-klik-green px-6 text-sm font-bold text-klik-black disabled:opacity-60"
          >
            {busy ? "Generando…" : tab === "image" ? "Crear imagen" : "Crear video"}
          </button>
          <div className="grid gap-4 sm:grid-cols-2">
            {gallery.map((item) => {
              const output = parseOutput(item.output);
              return (
                <article key={item.id} className="overflow-hidden rounded-2xl border border-klik-line bg-klik-card">
                  {output.kind === "storyboard" && output.frames?.length ? (
                    <div className="grid grid-cols-2">
                      {output.frames.map((frame) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={frame} src={frame} alt="" className="aspect-[9/16] w-full object-cover" />
                      ))}
                    </div>
                  ) : output.kind === "video" && output.url ? (
                    <video src={output.url} controls className="aspect-[9/16] w-full bg-black" />
                  ) : output.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={output.url} alt={item.title} className="aspect-square w-full object-cover" />
                  ) : null}
                  <div className="px-4 py-3">
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-white/45">{item.prompt}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {tab === "notebook" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="space-y-3">
            <input
              value={notebookTitle}
              onChange={(event) => setNotebookTitle(event.target.value)}
              placeholder="Nuevo notebook"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-klik-cyan/40"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void createNotebook()}
              className="flex min-h-11 w-full items-center justify-center rounded-full bg-klik-cyan text-sm font-bold text-klik-black"
            >
              Crear notebook
            </button>
            <ul className="space-y-1">
              {notebooks.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={async () => {
                      const response = await fetch(`/api/academy/notebooks/${item.id}`);
                      const payload = (await response.json()) as { notebook?: Notebook };
                      if (payload.notebook) setActiveNotebook(payload.notebook);
                    }}
                    className={`w-full rounded-xl px-3 py-3 text-left text-sm ${
                      activeNotebook?.id === item.id ? "bg-klik-cyan/15 text-white" : "text-white/70 hover:bg-white/5"
                    }`}
                  >
                    <span className="font-semibold">{item.title}</span>
                    <span className="mt-1 block text-[11px] text-white/35">
                      {item.sources} fuentes · {item.turns} turnos
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          <div>
            {activeNotebook ? (
              <div className="space-y-4">
                <h2 className="font-display text-2xl font-bold">{activeNotebook.title}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={sourceTitle}
                    onChange={(event) => setSourceTitle(event.target.value)}
                    placeholder="Título de la fuente"
                    className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"
                  />
                  <button
                    type="button"
                    disabled={busy || sourceTitle.trim().length < 2 || sourceContent.trim().length < 12}
                    onClick={() => void addSource()}
                    className="rounded-full border border-white/15 text-sm font-semibold disabled:opacity-50"
                  >
                    Agregar fuente
                  </button>
                </div>
                <textarea
                  value={sourceContent}
                  onChange={(event) => setSourceContent(event.target.value)}
                  rows={4}
                  placeholder="Pega apuntes, transcripción o un artículo…"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"
                />
                <ul className="flex flex-wrap gap-2 text-xs text-white/45">
                  {activeNotebook.sources.map((source) => (
                    <li key={source.id} className="rounded-full bg-white/5 px-3 py-1">
                      {source.title}
                    </li>
                  ))}
                </ul>
                <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-white/10 p-4">
                  {activeNotebook.turns.map((turn) => (
                    <div key={turn.id} className={turn.role === "user" ? "text-klik-cyan" : "text-white/80"}>
                      <p className="text-[11px] uppercase tracking-wider text-white/35">
                        {turn.role === "user" ? "Tú" : "Notebook"}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{turn.content}</p>
                    </div>
                  ))}
                </div>
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  rows={3}
                  placeholder="Pregunta sobre tus fuentes…"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"
                />
                <button
                  type="button"
                  disabled={busy || question.trim().length < 4}
                  onClick={() => void askNotebook()}
                  className="inline-flex min-h-12 items-center rounded-full bg-klik-green px-6 text-sm font-bold text-klik-black disabled:opacity-60"
                >
                  {busy ? "Pensando…" : "Preguntar"}
                </button>
              </div>
            ) : (
              <p className="rounded-2xl border border-white/10 px-5 py-10 text-sm text-white/50">
                Crea un notebook, carga fuentes y pregunta. El modelo responde solo con tu material.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {tab === "agent" ? (
        <div className="mt-6 space-y-4">
          <textarea
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            rows={4}
            placeholder="Objetivo del agente: por ejemplo, armar un plan de lanzamiento de 7 días para un curso…"
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"
          />
          <button
            type="button"
            disabled={busy || goal.trim().length < 8}
            onClick={() => void runAgent()}
            className="inline-flex min-h-12 items-center rounded-full bg-klik-green px-6 text-sm font-bold text-klik-black disabled:opacity-60"
          >
            {busy ? "El agente está trabajando…" : "Lanzar agente"}
          </button>
          <div className="space-y-4">
            {agents.map((run) => (
              <article key={run.id} className="rounded-2xl border border-klik-line bg-klik-card p-5">
                <p className="text-[11px] uppercase tracking-wider text-klik-cyan">Agente</p>
                <h3 className="mt-1 font-display text-xl font-bold">{run.goal}</h3>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-white/45">{run.plan}</pre>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/80">{run.result}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
