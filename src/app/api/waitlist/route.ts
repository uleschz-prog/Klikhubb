import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { sendWaitlistNotify, sendWaitlistWelcome } from "@/lib/email/waitlist";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { waitlistSchema } from "@/lib/validations/waitlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email no válido." }, { status: 400 });
  }

  const data = {
    email: parsed.data.email.toLowerCase(),
    intent: parsed.data.intent,
    source: "landing" as const,
    locale: "es",
  };

  let saved = false;
  if (hasDatabaseUrl) {
    try {
      await prisma.waitlistEntry.upsert({
        where: { email: data.email },
        create: data,
        update: { intent: data.intent },
      });
      saved = true;
    } catch (error) {
      console.error("waitlist db", error);
    }
  }
  if (!saved && process.env.NODE_ENV !== "production") {
    await appendLocalFallback(data);
    saved = true;
  }

  const emailed = await sendWaitlistWelcome(data);
  if (emailed) {
    await sendWaitlistNotify(data).catch(() => false);
  }

  if (saved || emailed) {
    return NextResponse.json({ ok: true, emailed });
  }

  return NextResponse.json(
    { error: "La lista de espera no está disponible ahora." },
    { status: 503 },
  );
}

async function appendLocalFallback(entry: { email: string; intent: string }) {
  const dir = join(process.cwd(), "data");
  const file = join(dir, "waitlist.json");
  await mkdir(dir, { recursive: true });
  let rows: unknown[] = [];
  try {
    rows = JSON.parse(await readFile(file, "utf8")) as unknown[];
  } catch {
    rows = [];
  }
  rows.push({ ...entry, createdAt: new Date().toISOString() });
  await writeFile(file, JSON.stringify(rows, null, 2));
}
