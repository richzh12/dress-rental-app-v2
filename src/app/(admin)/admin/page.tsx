import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Sesion activa como <span className="font-semibold">{session?.user.email}</span>.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-zinc-200 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Reservas hoy</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">0</p>
        </article>
        <article className="rounded-lg border border-zinc-200 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Vestidos disponibles</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">0</p>
        </article>
        <article className="rounded-lg border border-zinc-200 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Alertas</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">0</p>
        </article>
      </div>
    </main>
  );
}
