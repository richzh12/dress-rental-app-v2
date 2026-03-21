"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/admin",
    });

    setPending(false);

    if (result?.error) {
      setError("Credenciales invalidas.");
      return;
    }

    router.push(result?.url ?? "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1">
        <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#a78f68]">
          Usuario
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md px-4 py-3 text-sm"
          placeholder="admin@elegance.local"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#a78f68]">
          Contrasena
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md px-4 py-3 text-sm"
          placeholder="********"
        />
      </div>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <button type="submit" disabled={pending} className="atelier-btn-primary w-full px-4 py-3 text-sm uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-70">
        {pending ? "Entrando..." : "Iniciar sesion"}
      </button>
    </form>
  );
}
