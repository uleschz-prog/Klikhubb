import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireApiUser() {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        error: NextResponse.json(
          { error: "Inicia sesión para continuar." },
          { status: 401 }
        ),
      };
    }

    return { user, supabase };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Supabase no está configurado.";
    return {
      error: NextResponse.json({ error: message }, { status: 503 }),
    };
  }
}
