"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full rounded-md border border-[#d9c8ae] px-3 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#8c7550] transition hover:bg-[#f4ead8]"
    >
      Cerrar sesion
    </button>
  );
}
