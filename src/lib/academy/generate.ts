import { siteUrl } from "@/config/site";
import { persistAcademyBytes, persistAcademyDataUrl, persistAcademyRemote } from "@/lib/academy/media";

const OPENAI_URL = "https://api.openai.com/v1";
const OPENROUTER_URL = "https://openrouter.ai/api/v1";
const POLLINATIONS_IMAGE = "https://image.pollinations.ai/prompt";
const POLLINATIONS_TEXT = "https://text.pollinations.ai";
const POLLINATIONS_VIDEO = "https://gen.pollinations.ai/video";

export type AcademyMedia = {
  url: string;
  kind: "image" | "video" | "storyboard" | "processing";
  frames?: string[];
  jobId?: string;
  pollingUrl?: string;
  provider?: string;
};

export class AcademyAiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AcademyAiError";
  }
}

function env(name: string) {
  return process.env[name]?.trim() || "";
}

function openaiKey() {
  return env("OPENAI_API_KEY");
}

function openrouterKey() {
  return env("OPENROUTER_API_KEY");
}

function openaiChatModel() {
  return env("OPENAI_MODEL") || "gpt-4o-mini";
}

function openaiImageModel() {
  return env("OPENAI_IMAGE_MODEL") || "dall-e-3";
}

function openrouterChatModel() {
  return env("OPENROUTER_MODEL") || "google/gemini-2.5-flash";
}

function imageModels() {
  const preferred = env("OPENROUTER_IMAGE_MODEL");
  return [
    preferred,
    "google/gemini-2.5-flash-image",
    "openai/gpt-image-1",
    "black-forest-labs/flux.2-flex",
  ].filter((model, index, list) => model && list.indexOf(model) === index);
}

function videoModels() {
  const preferred = env("OPENROUTER_VIDEO_MODEL");
  return [
    preferred,
    "bytedance/seedance-2.0",
    "minimax/hailuo-02",
    "alibaba/wan-2.5",
  ].filter((model, index, list) => model && list.indexOf(model) === index);
}

function openrouterHeaders() {
  return {
    Authorization: `Bearer ${openrouterKey()}`,
    "Content-Type": "application/json",
    "HTTP-Referer": siteUrl(),
    "X-Title": "Qlyk Academy",
  };
}

async function readText(response: Response) {
  return (await response.text()).trim();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ChatInput = { system: string; user: string; json?: boolean };

async function chatOpenAI(input: ChatInput): Promise<string | null> {
  const key = openaiKey();
  if (!key) return null;
  const response = await fetch(`${OPENAI_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: openaiChatModel(),
      temperature: 0.7,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
      ...(input.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!response.ok) {
    console.error("openai chat", response.status, await readText(response).catch(() => ""));
    return null;
  }
  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return payload.choices?.[0]?.message?.content?.trim() || null;
}

async function chatOpenRouter(input: ChatInput): Promise<string | null> {
  const key = openrouterKey();
  if (!key) return null;
  const response = await fetch(`${OPENROUTER_URL}/chat/completions`, {
    method: "POST",
    headers: openrouterHeaders(),
    body: JSON.stringify({
      model: openrouterChatModel(),
      temperature: 0.7,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
      ...(input.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!response.ok) {
    console.error("openrouter chat", response.status, await readText(response).catch(() => ""));
    if (input.json) return chatOpenRouter({ ...input, json: false });
    return null;
  }
  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return payload.choices?.[0]?.message?.content?.trim() || null;
}

async function chatPollinations(input: ChatInput): Promise<string | null> {
  const prompt = `${input.system}\n\n${input.user}${input.json ? "\nResponde solo JSON válido." : ""}`;
  const response = await fetch(POLLINATIONS_TEXT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
      model: "openai",
      seed: Date.now(),
    }),
  });
  if (response.ok) {
    const text = await readText(response);
    if (text) return text;
  }
  const fallback = await fetch(`${POLLINATIONS_TEXT}/${encodeURIComponent(prompt.slice(0, 1800))}`);
  if (!fallback.ok) return null;
  return readText(fallback);
}

export async function completeAcademyText(input: ChatInput): Promise<string> {
  const openrouter = await chatOpenRouter(input).catch((error) => {
    console.error("openrouter chat", error);
    return null;
  });
  if (openrouter) return openrouter;

  const openai = await chatOpenAI(input).catch((error) => {
    console.error("openai chat", error);
    return null;
  });
  if (openai) return openai;

  const pollinations = await chatPollinations(input).catch((error) => {
    console.error("pollinations chat", error);
    return null;
  });
  if (pollinations) return pollinations;
  throw new AcademyAiError("No hay un modelo de texto disponible ahora.");
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const text = (fence?.[1] ?? raw).trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function imageFromOpenRouter(prompt: string): Promise<string | null> {
  if (!openrouterKey()) return null;
  for (const model of imageModels()) {
    const response = await fetch(`${OPENROUTER_URL}/images`, {
      method: "POST",
      headers: openrouterHeaders(),
      body: JSON.stringify({
        model,
        prompt,
        aspect_ratio: "1:1",
      }),
    });
    if (!response.ok) {
      console.error("openrouter image", model, response.status, await readText(response).catch(() => ""));
      continue;
    }
    const payload = (await response.json()) as {
      data?: { b64_json?: string; url?: string; media_type?: string }[];
    };
    const first = payload.data?.[0];
    if (first?.b64_json) {
      const media = first.media_type || "image/png";
      return persistAcademyDataUrl(`data:${media};base64,${first.b64_json}`, "image");
    }
    if (first?.url) {
      return (await persistAcademyRemote({ url: first.url, filename: "image", fallbackExt: "png" })) ?? first.url;
    }
  }
  return null;
}

async function imageFromOpenAI(prompt: string): Promise<string | null> {
  const key = openaiKey();
  if (!key) return null;
  const models = [openaiImageModel(), "dall-e-3", "gpt-image-1"].filter(
    (model, index, list) => list.indexOf(model) === index,
  );
  for (const model of models) {
    const response = await fetch(`${OPENAI_URL}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        size: "1024x1024",
        n: 1,
      }),
    });
    if (!response.ok) {
      console.error("openai image", model, response.status, await readText(response).catch(() => ""));
      continue;
    }
    const payload = (await response.json()) as { data?: { url?: string; b64_json?: string }[] };
    const first = payload.data?.[0];
    if (first?.b64_json) {
      return persistAcademyDataUrl(`data:image/png;base64,${first.b64_json}`, "image");
    }
    if (first?.url) {
      return (await persistAcademyRemote({ url: first.url, filename: "image", fallbackExt: "png" })) ?? first.url;
    }
  }
  return null;
}

async function imageFromPollinations(prompt: string): Promise<string | null> {
  const url = `${POLLINATIONS_IMAGE}/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=flux&seed=${Date.now()}`;
  return persistAcademyRemote({
    url,
    filename: "image",
    fallbackExt: "png",
    headers: { Accept: "image/*", "User-Agent": "QlykAcademy/1.0" },
  });
}

export async function generateAcademyImage(prompt: string): Promise<AcademyMedia> {
  const openrouter = await imageFromOpenRouter(prompt).catch((error) => {
    console.error("openrouter image", error);
    return null;
  });
  if (openrouter) return { url: openrouter, kind: "image", provider: "openrouter" };

  const openai = await imageFromOpenAI(prompt).catch((error) => {
    console.error("openai image", error);
    return null;
  });
  if (openai) return { url: openai, kind: "image", provider: "openai" };

  const pollinations = await imageFromPollinations(prompt).catch((error) => {
    console.error("pollinations image", error);
    return null;
  });
  if (pollinations) return { url: pollinations, kind: "image", provider: "pollinations" };

  throw new AcademyAiError("No se pudo crear la imagen. Revisa las claves de OpenRouter u OpenAI.");
}

type VideoJob = {
  id: string;
  polling_url?: string;
  status?: string;
  error?: string;
  unsigned_urls?: string[];
};

async function submitOpenRouterVideo(prompt: string): Promise<VideoJob | null> {
  if (!openrouterKey()) return null;
  for (const model of videoModels()) {
    for (const body of [
      {
        model,
        prompt,
        duration: 4,
        resolution: "720p",
        aspect_ratio: "9:16",
        generate_audio: false,
      },
      { model, prompt },
    ]) {
      const response = await fetch(`${OPENROUTER_URL}/videos`, {
        method: "POST",
        headers: openrouterHeaders(),
        body: JSON.stringify(body),
      });
      if (response.ok || response.status === 202) {
        const job = (await response.json()) as VideoJob;
        if (job.id) return job;
      }
      console.error("openrouter video submit", model, response.status, await readText(response).catch(() => ""));
    }
  }
  return null;
}

async function pollOpenRouterVideo(job: VideoJob, waitMs: number): Promise<VideoJob> {
  const pollingUrl = new URL(job.polling_url || `/api/v1/videos/${job.id}`, "https://openrouter.ai").toString();
  const deadline = Date.now() + waitMs;
  let current = job;
  while (Date.now() < deadline) {
    if (current.status === "completed") return current;
    if (current.status === "failed" || current.status === "cancelled" || current.status === "expired") {
      throw new AcademyAiError(current.error || "El video no se pudo generar.");
    }
    await sleep(4000);
    const response = await fetch(pollingUrl, { headers: { Authorization: `Bearer ${openrouterKey()}` } });
    if (!response.ok) {
      console.error("openrouter video poll", response.status, await readText(response).catch(() => ""));
      continue;
    }
    current = (await response.json()) as VideoJob;
  }
  return current;
}

async function downloadOpenRouterVideo(job: VideoJob): Promise<string | null> {
  const downloadUrl =
    job.unsigned_urls?.[0] ?? `${OPENROUTER_URL}/videos/${job.id}/content?index=0`;
  const response = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${openrouterKey()}` },
  });
  if (!response.ok) {
    console.error("openrouter video download", response.status, await readText(response).catch(() => ""));
    return null;
  }
  const type = (response.headers.get("content-type") ?? "video/mp4").split(";")[0];
  const bytes = Buffer.from(await response.arrayBuffer());
  const stored = await persistAcademyBytes({
    bytes,
    contentType: type.startsWith("video/") ? type : "video/mp4",
    filename: "video.mp4",
  });
  return stored;
}

export async function startAcademyVideo(prompt: string): Promise<AcademyMedia> {
  const job = await submitOpenRouterVideo(prompt).catch((error) => {
    console.error("openrouter video", error);
    return null;
  });
  if (job) {
    const polled = await pollOpenRouterVideo(job, 18_000);
    if (polled.status === "completed") {
      const url = await downloadOpenRouterVideo(polled);
      if (url) return { url, kind: "video", provider: "openrouter" };
    }
    return {
      url: "",
      kind: "processing",
      jobId: job.id,
      pollingUrl: job.polling_url,
      provider: "openrouter",
    };
  }

  const pollinationsUrl = `${POLLINATIONS_VIDEO}/${encodeURIComponent(prompt)}?aspectRatio=9:16&nologo=true`;
  const stored = await persistAcademyRemote({
    url: pollinationsUrl,
    filename: "video",
    fallbackExt: "mp4",
    headers: { Accept: "video/*,*/*", "User-Agent": "QlykAcademy/1.0" },
  }).catch((error) => {
    console.error("pollinations video", error);
    return null;
  });
  if (stored && !stored.includes("pollinations.ai/prompt")) {
    return { url: stored, kind: "video", provider: "pollinations" };
  }

  throw new AcademyAiError("No se pudo crear el video. Revisa OPENROUTER_API_KEY y el modelo de video.");
}

export async function settleAcademyVideo(job: { jobId: string; pollingUrl?: string }): Promise<AcademyMedia | null> {
  const polled = await pollOpenRouterVideo({ id: job.jobId, polling_url: job.pollingUrl, status: "in_progress" }, 22_000);
  if (polled.status !== "completed") {
    return {
      url: "",
      kind: "processing",
      jobId: job.jobId,
      pollingUrl: polled.polling_url || job.pollingUrl,
      provider: "openrouter",
    };
  }
  const url = await downloadOpenRouterVideo(polled);
  if (!url) throw new AcademyAiError("El video se generó pero no se pudo guardar.");
  return { url, kind: "video", provider: "openrouter" };
}

export async function runAcademyNotebook(input: {
  question: string;
  sources: { title: string; content: string }[];
  history: { role: string; content: string }[];
}) {
  const corpus = input.sources
    .map((source, index) => `Fuente ${index + 1} · ${source.title}\n${source.content}`)
    .join("\n\n---\n\n")
    .slice(0, 24_000);
  const history = input.history
    .slice(-8)
    .map((turn) => `${turn.role === "user" ? "Alumno" : "Notebook"}: ${turn.content}`)
    .join("\n");
  return completeAcademyText({
    system:
      "Eres Notebook LM de Qlyk Academy. Respondes en español, con rigor, citando las fuentes por título. Si el material no alcanza, dilo. No inventes bibliografía.",
    user: `Fuentes:\n${corpus || "(sin fuentes todavía)"}\n\nHistorial:\n${history || "(nuevo)"}\n\nPregunta:\n${input.question}`,
  });
}

export async function runAcademyAgent(goal: string) {
  const planRaw = await completeAcademyText({
    system:
      'Eres un agente autónomo de Qlyk Academy. Planifica y ejecuta. Devuelve JSON {"steps":[{"title":"...","result":"..."}],"summary":"..."} con 3 a 5 pasos ya resueltos, en español.',
    user: `Objetivo del alumno: ${goal}`,
    json: true,
  });

  const parsed = parseJsonObject(planRaw);
  const rawSteps = Array.isArray(parsed?.steps) ? (parsed.steps as { title?: string; result?: string; action?: string }[]) : [];
  let steps = rawSteps
    .map((step) => ({
      title: String(step.title ?? "").trim(),
      result: String(step.result ?? step.action ?? "").trim(),
    }))
    .filter((step) => step.title && step.result)
    .slice(0, 6);

  let summary = typeof parsed?.summary === "string" ? parsed.summary.trim() : "";

  if (!steps.length || !summary) {
    const follow = await completeAcademyText({
      system:
        "Ejecutas un agente de Qlyk Academy. Entrega JSON {\"steps\":[{\"title\":\"...\",\"result\":\"...\"}],\"summary\":\"...\"} en español, accionable.",
      user: `Objetivo: ${goal}\nBorrador:\n${planRaw}`,
      json: true,
    });
    const second = parseJsonObject(follow);
    const more = Array.isArray(second?.steps) ? (second.steps as { title?: string; result?: string }[]) : [];
    steps = more
      .map((step) => ({ title: String(step.title ?? "").trim(), result: String(step.result ?? "").trim() }))
      .filter((step) => step.title && step.result)
      .slice(0, 6);
    summary = typeof second?.summary === "string" ? second.summary.trim() : follow;
  }

  if (!steps.length) {
    steps = [{ title: "Entrega", result: summary || planRaw }];
  }
  if (!summary) summary = steps.map((step) => `${step.title}: ${step.result}`).join("\n\n");

  return {
    plan: JSON.stringify(
      steps.map((step) => ({ title: step.title })),
      null,
      2,
    ),
    result: summary,
    steps,
  };
}

export function academyAiProviders() {
  return {
    openai: Boolean(openaiKey()),
    openrouter: Boolean(openrouterKey()),
  };
}
