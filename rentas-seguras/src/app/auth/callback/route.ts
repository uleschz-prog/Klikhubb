import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/env";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const origin = getAppUrl(request);

  if (!code) {
    return NextResponse.redirect(`${origin}/iniciar-sesion?error=missing_code`);
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/iniciar-sesion?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/dashboard"}`);
}
