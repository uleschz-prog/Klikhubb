import { siteUrl } from "@/config/site";

const OPENAI_URL = "https://api.openai.com/v1";
const OPENROUTER_URL = "https://openrouter.ai/api/v1";
const POLLINATIONS_IMAGE = "https://image.pollinations.ai/prompt";
const POLLINATIONS_TEXT = "https://text.pollinations.ai";
const POLLINATIONS_VIDEO = "https://gen.pollinations.ai/video";

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

function openrouterImageModel() {
  return env("OPENROUTER_IMAGE_MODEL") || "google/gemini-2.5-flash-image-preview";
}

async function readText(response: Response) {
  return (await response.text()).trim();
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
  const origin = siteUrl();
  const response = await fetch(`${OPENROUTER_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": origin,
      "X-Title": "Qlyk Academy",
    },
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
    if (input.json) {
      return chatOpenRouter({ ...input, json: false });
    }
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
  throw new Error("ACADEMY_AI_UNAVAILABLE");
}

function extractOpenRouterImage(payload: unknown): string | null {
  const root = payload as {
    choices?: {
      message?: {
        content?: unknown;
        images?: { image_url?: { url?: string }; url?: string }[];
      };
    }[];
  };
  const message = root.choices?.[0]?.message;
  const fromImages = message?.images?.[0]?.image_url?.url || message?.images?.[0]?.url;
  if (fromImages) return fromImages;

  const content = message?.content;
  if (typeof content === "string") {
    const markdown = content.match(/!\[[^\]]*\]\((https?:[^)\s]+|data:image\/[^)\s]+)\)/);
    if (markdown?.[1]) return markdown[1];
    const data = content.match(/(data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+)/);
    if (data?.[1]) return data[1];
    const url = content.match(/(https?:\/\/\S+\.(?:png|jpe?g|webp|gif))/i);
    if (url?.[1]) return url[1];
  }
  if (Array.isArray(content)) {
    for (const part of content) {
      const row = part as { type?: string; image_url?: { url?: string }; url?: string };
      if (row.image_url?.url) return row.image_url.url;
      if (row.type === "image" && row.url) return row.url;
    }
  }
  return null;
}

async function imageOpenAI(prompt: string): Promise<{ url: string; kind: "image" } | null> {
  const key = openaiKey();
  if (!key) return null;
  const response = await fetch(`${OPENAI_URL}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: openaiImageModel(),
      prompt,
      size: "1024x1024",
      n: 1,
    }),
  });
  if (!response.ok) {
    console.error("openai image", response.status, await readText(response).catch(() => ""));
    return null;
  }
  const payload = (await response.json()) as { data?: { url?: string; b64_json?: string }[] };
  const first = payload.data?.[0];
  if (first?.url) return { url: first.url, kind: "image" };
  if (first?.b64_json) return { url: `data:image/png;base64,${first.b64_json}`, kind: "image" };
  return null;
}

async function imageOpenRouter(prompt: string): Promise<{ url: string; kind: "image" } | null> {
  const key = openrouterKey();
  if (!key) return null;
  const origin = siteUrl();
  const response = await fetch(`${OPENROUTER_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": origin,
      "X-Title": "Qlyk Academy",
    },
    body: JSON.stringify({
      model: openrouterImageModel(),
      modalities: ["image", "text"],
      messages: [
        {
          role: "user",
          content: `Generate a high-quality image. No captions. Prompt: ${prompt}`,
        },
      ],
    }),
  });
  if (!response.ok) {
    console.error("openrouter image", response.status, await readText(response).catch(() => ""));
    return null;
  }
  const payload: unknown = await response.json();
  const url = extractOpenRouterImage(payload);
  return url ? { url, kind: "image" } : null;
}

export async function generateAcademyImage(prompt: string) {
  const openai = await imageOpenAI(prompt).catch((error) => {
    console.error("openai image", error);
    return null;
  });
  if (openai) return openai;

  const openrouter = await imageOpenRouter(prompt).catch((error) => {
    console.error("openrouter image", error);
    return null;
  });
  if (openrouter) return openrouter;

  const url = `${POLLINATIONS_IMAGE}/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
  return { url, kind: "image" as const };
}

export async function generateAcademyVideo(prompt: string) {
  const videoUrl = `${POLLINATIONS_VIDEO}/${encodeURIComponent(prompt)}?aspectRatio=9:16&nologo=true`;
  try {
    const head = await fetch(videoUrl, { method: "HEAD", redirect: "follow" });
    const type = head.headers.get("content-type") ?? "";
    if (head.ok && type.startsWith("video")) {
      return { url: videoUrl, kind: "video" as const, frames: [] as string[] };
    }
  } catch (error) {
    console.error("pollinations video", error);
  }

  const frames = await Promise.all(
    [1, 2, 3, 4].map(async (frame) => {
      const still = await generateAcademyImage(
        `Cinematic video keyframe ${frame}/4, photoreal, 9:16, motion still of: ${prompt}`,
      );
      return still.url;
    }),
  );
  return { url: frames[0] ?? "", kind: "storyboard" as const, frames };
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
      "Eres un agente autónomo de Qlyk Academy. Devuelve JSON con {\"steps\":[{\"title\":\"...\",\"action\":\"...\"}]} entre 3 y 6 pasos concretos, en español.",
    user: `Objetivo del alumno: ${goal}`,
    json: true,
  });

  let steps: { title: string; action: string }[] = [];
  try {
    const parsed = JSON.parse(planRaw) as { steps?: { title?: string; action?: string }[] };
    steps = (parsed.steps ?? [])
      .map((step) => ({ title: String(step.title ?? "").trim(), action: String(step.action ?? "").trim() }))
      .filter((step) => step.title && step.action)
      .slice(0, 6);
  } catch {
    steps = [
      { title: "Entender el objetivo", action: goal },
      { title: "Proponer un plan", action: "Desglosar el trabajo en entregables." },
      { title: "Entregar resultado", action: "Redactar la respuesta final." },
    ];
  }

  const executions: { title: string; result: string }[] = [];
  for (const step of steps) {
    const result = await completeAcademyText({
      system: "Ejecutas un paso de un agente autónomo de Qlyk Academy. Español, accionable, sin relleno.",
      user: `Objetivo: ${goal}\nPaso: ${step.title}\nQué hacer: ${step.action}\nAvance previo:\n${executions
        .map((item) => `- ${item.title}: ${item.result}`)
        .join("\n")}`,
    });
    executions.push({ title: step.title, result });
  }

  const summary = await completeAcademyText({
    system: "Sintetizas el trabajo de un agente autónomo. Entrega final clara, en español, lista para usar.",
    user: `Objetivo: ${goal}\nPasos:\n${executions.map((item) => `## ${item.title}\n${item.result}`).join("\n\n")}`,
  });

  return {
    plan: JSON.stringify(steps, null, 2),
    result: summary,
    steps: executions,
  };
}

export function academyAiProviders() {
  return {
    openai: Boolean(openaiKey()),
    openrouter: Boolean(openrouterKey()),
  };
}
