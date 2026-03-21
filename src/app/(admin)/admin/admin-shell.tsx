"use client";

import Link from "next/link";
import { useState } from "react";
import LogoutButton from "@/components/logout-button";

interface AdminShellProps {
  children: React.ReactNode;
}

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/inventario", label: "Inventario" },
  { href: "/admin/calendario", label: "Calendario" },
  { href: "/admin/rentas", label: "Alquileres" },
  { href: "/admin/ventas", label: "Ventas" },
];

export default function AdminShell({ children }: AdminShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-[#e7dbc8] bg-[#fbf7ef] md:flex">
        <div className="border-b border-[#e7dbc8] px-6 py-6">
          <p className="atelier-title text-5xl leading-none text-[#b88410]">Elegance</p>
          <p className="atelier-heading-kicker mt-2">Event Supplies</p>
        </div>

        <nav className="space-y-1 px-3 py-4 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-md px-4 py-2 font-semibold uppercase tracking-[0.1em] text-[#8a7350] hover:bg-[#f1e7d6]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-[#e7dbc8] p-4">
          <LogoutButton />
        </div>
      </aside>

      <section className="min-h-screen p-4 sm:p-6 md:p-10">
        <div className="mb-4 rounded-xl border border-[#e7dbc8] bg-[#fbf7ef] p-3 md:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#d9c8ae] bg-white text-[#8a7350]"
            >
              <span className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-5 bg-current" />
                <span className="block h-0.5 w-5 bg-current" />
                <span className="block h-0.5 w-5 bg-current" />
              </span>
            </button>
            <div>
              <p className="atelier-title text-3xl leading-none text-[#b88410]">Elegance</p>
              <p className="atelier-heading-kicker mt-1">Event Supplies</p>
            </div>
          </div>
        </div>

        {menuOpen ? (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
            <button
              type="button"
              aria-label="Cerrar menu"
              className="absolute inset-0 bg-black/35"
              onClick={() => setMenuOpen(false)}
            />
            <aside className="absolute left-0 top-0 flex h-full w-[82%] max-w-[300px] flex-col border-r border-[#e7dbc8] bg-[#fbf7ef] shadow-xl">
              <div className="flex items-start justify-between border-b border-[#e7dbc8] px-5 py-5">
                <div>
                  <p className="atelier-title text-4xl leading-none text-[#b88410]">Elegance</p>
                  <p className="atelier-heading-kicker mt-2">Event Supplies</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Cerrar menu"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d9c8ae] bg-[#f8f1e4] text-base font-semibold text-[#8c7550]"
                >
                  X
                </button>
              </div>

              <nav className="space-y-1 px-3 py-4 text-sm">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-md px-4 py-2 font-semibold uppercase tracking-[0.1em] text-[#8a7350] hover:bg-[#f1e7d6]"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto border-t border-[#e7dbc8] p-4">
                <LogoutButton />
              </div>
            </aside>
          </div>
        ) : null}

        {children}
      </section>
    </div>
  );
}
