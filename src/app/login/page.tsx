"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-fucsia-600 py-3 text-base font-medium text-white transition-colors disabled:opacity-60"
    >
      {pending ? "Ingresando..." : "Ingresar"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-bordo-700 to-bordo-500 px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="rounded-full bg-fucsia-500/20 px-4 py-1 text-xs font-medium uppercase tracking-widest text-fucsia-200">
            Allium E.A.S.
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold text-white">
            Allium
          </h1>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm text-fucsia-100">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder:text-fucsia-100/50 focus:border-fucsia-300 focus:outline-none"
              placeholder="vos@onion.com.py"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm text-fucsia-100">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder:text-fucsia-100/50 focus:border-fucsia-300 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {state.error && (
            <p role="alert" className="text-sm text-fucsia-200">
              {state.error}
            </p>
          )}

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
