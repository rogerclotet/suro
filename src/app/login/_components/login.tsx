"use client";

import type { Session } from "next-auth";
import { redirect, useSearchParams } from "next/navigation";
import { login } from "./actions";

export default function Login({ session }: { session?: Session | null }) {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("to") ?? "/";

  if (session) {
    return redirect(redirectTo);
  }

  return (
    <div className="container mx-auto mt-8 flex flex-col items-center gap-2 px-10">
      <div className="card w-full max-w-80 bg-primary text-primary-content shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Iniciar sessió</h2>
          <p>{"Has d'iniciar sessió per a accedir a l'aplicació"}</p>
          <div className="card-actions mt-4">
            <form action={login} className="w-full">
              <button type="submit" className="btn w-full">
                Entrar amb Google
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
