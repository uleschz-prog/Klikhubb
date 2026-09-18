"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const [pending, setPending] = useState(false);

  async function onLogout() {
    setPending(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={pending}
      className="rounded-full border border-ink-700/20 px-3 py-1.5 hover:border-cedar-600 hover:text-cedar-700 disabled:opacity-60"
    >
      {pending ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}
