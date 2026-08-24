import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { waitlistSchema } from "@/lib/validations/waitlist";

export const runtime = "nodejs";

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

  try {
    await prisma.waitlistEntry.upsert({
      where: { email: data.email },
      create: data,
      update: { intent: data.intent },
    });
    return NextResponse.json({ ok: true });
  } catch {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "La lista de espera no está disponible ahora." },
        { status: 503 },
      );
    }

    await appendLocalFallback(data);
    return NextResponse.json({ ok: true, demo: true });
  }
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
