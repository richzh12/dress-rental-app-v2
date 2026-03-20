import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen bg-zinc-100 p-6 sm:p-10">
      <section className="mx-auto flex w-full max-w-2xl flex-col rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Dress Rental</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Sistema de administracion</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Gestiona inventario, reservas, alquileres y ventas desde un solo panel.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {session?.user ? (
            <Link
              href="/admin"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
            >
              Ir al dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
            >
              Iniciar sesion
            </Link>
          )}

          <Link
            href="/admin"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            Abrir panel
          </Link>
        </div>

        <p className="mt-6 text-xs text-zinc-500">
          Usuario seed: admin@dressrental.local | Password: Admin123!@#
        </p>
      </section>
    </main>
  );
}
