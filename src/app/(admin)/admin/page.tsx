import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="space-y-6">
      <div>
        <p className="atelier-heading-kicker">Vista General</p>
        <h1 className="atelier-title text-6xl leading-none">Dashboard</h1>
      </div>
      <p className="text-sm text-[#8f7f65]">
        Sesion activa como <span className="font-semibold">{session?.user.email}</span>.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="atelier-card p-5">
          <p className="atelier-heading-kicker">Reservas hoy</p>
          <p className="mt-4 atelier-title text-5xl text-[#a77d10]">0</p>
        </article>
        <article className="atelier-card p-5">
          <p className="atelier-heading-kicker">Vestidos disponibles</p>
          <p className="mt-4 atelier-title text-5xl text-[#2b9a61]">0</p>
        </article>
        <article className="atelier-card p-5">
          <p className="atelier-heading-kicker">Alertas</p>
          <p className="mt-4 atelier-title text-5xl text-[#d25a5a]">0</p>
        </article>
      </div>
    </main>
  );
}
