import { NextResponse } from "next/server";
import { registerShare, SocialError } from "@/lib/video/social";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await registerShare(params.id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SocialError && error.code === "NOT_FOUND") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudo registrar el share." }, { status: 500 });
  }
}
