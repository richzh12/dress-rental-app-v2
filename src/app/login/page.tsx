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
    <main className="atelier-shell flex items-center justify-center p-6 sm:p-10">
      <section className="atelier-card mx-auto flex w-full max-w-md flex-col p-7 sm:p-9">
        <h1 className="atelier-title text-6xl leading-none">Elegance</h1>
        <p className="atelier-heading-kicker mt-2">Event Supplies</p>

        <div className="mt-8">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs font-semibold tracking-[0.18em] text-[#b39a72]">
          © 2026 Elegance Event Supplies
        </p>
      </section>
    </main>
  );
}
