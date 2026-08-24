"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/60 hover:text-white"
    >
      Salir
    </button>
  );
}
