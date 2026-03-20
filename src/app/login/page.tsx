import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-6 sm:p-10">
      <section className="mx-auto flex w-full max-w-md flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Dress Rental Admin</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Iniciar sesion</h1>
        <p className="mt-1 text-sm text-zinc-600">Accede para administrar inventario, reservas y ventas.</p>

        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
