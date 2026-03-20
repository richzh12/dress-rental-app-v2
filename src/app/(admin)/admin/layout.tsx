import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LogoutButton from "@/components/logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="mx-auto grid max-w-7xl gap-4 p-4 md:grid-cols-[240px_1fr]">
        <aside className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Panel</p>
          <p className="mt-2 text-sm font-semibold text-zinc-800">{session.user.name}</p>

          <nav className="mt-6 flex flex-col gap-2 text-sm">
            <Link href="/admin" className="rounded-md bg-zinc-900 px-3 py-2 text-white">
              Dashboard
            </Link>
            <span className="rounded-md border border-dashed border-zinc-300 px-3 py-2 text-zinc-500">
              Inventario (proximo)
            </span>
            <span className="rounded-md border border-dashed border-zinc-300 px-3 py-2 text-zinc-500">
              Alquileres (proximo)
            </span>
            <span className="rounded-md border border-dashed border-zinc-300 px-3 py-2 text-zinc-500">
              Ventas (proximo)
            </span>
          </nav>

          <div className="mt-8">
            <LogoutButton />
          </div>
        </aside>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          {children}
        </section>
      </div>
    </div>
  );
}
