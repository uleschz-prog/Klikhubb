import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getSession() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser(next = "/dashboard") {
  const user = await getUser();
  if (!user) {
    redirect(`/iniciar-sesion?next=${encodeURIComponent(next)}`);
  }
  return user;
}
