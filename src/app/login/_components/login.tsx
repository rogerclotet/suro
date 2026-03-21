"use client";

import { SiGoogle } from "@icons-pack/react-simple-icons";
import { Info, Mail } from "lucide-react";
import Image from "next/image";
import { redirect, useSearchParams } from "next/navigation";
import type { Session } from "next-auth";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { getSafeRedirectTo } from "@/lib/auth-redirect";
import { loginWithGoogle, loginWithResend } from "./actions";

export default function Login({ session }: { session?: Session | null }) {
  const [loggedInWithResend, setLoggedInWithResend] = useState(false);
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirectTo(searchParams.get("to"));

  if (session) {
    return redirect(redirectTo);
  }

  async function handleResendSignIn(formData?: FormData) {
    await loginWithResend(formData);
    setLoggedInWithResend(true);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-xs space-y-6">
        {/* Logo + heading */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-card shadow-sm border border-border">
            <Image src="/favicon.png" alt="Logo" width={36} height={36} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Benvingut/da
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Inicia sessió per accedir a la teva família
            </p>
          </div>
        </div>

        {/* Primary CTA: Google */}
        <form action={loginWithGoogle}>
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-card border border-border rounded-xl text-foreground font-medium text-sm shadow-sm hover:bg-accent hover:text-accent-foreground active:scale-[0.99] transition-all duration-150 cursor-pointer"
          >
            <SiGoogle
              className="w-4 h-4 shrink-0"
              style={{ color: "#4285F4" }}
            />
            Continua amb Google
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground tracking-wide">
            o bé
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Secondary: Email magic link */}
        <form action={handleResendSignIn} className="space-y-2.5">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <Input
            name="email"
            type="email"
            placeholder="el-teu@correu.com"
            required
            className="h-10 rounded-xl bg-card border-border text-foreground text-sm placeholder:text-muted-foreground dark:bg-card"
          />
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm text-muted-foreground border border-border bg-card hover:bg-accent hover:text-accent-foreground active:scale-[0.99] transition-all duration-150 cursor-pointer"
          >
            <Mail className="w-4 h-4 shrink-0" />
            Continua amb correu electrònic
          </button>
        </form>

        {/* Success state */}
        {loggedInWithResend && (
          <Alert className="rounded-xl border-blue-100 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertTitle className="text-blue-800 dark:text-blue-300 text-sm font-medium">
              Correu enviat
            </AlertTitle>
            <AlertDescription className="text-blue-600 dark:text-blue-400 text-xs leading-relaxed">
              {
                "T'hem enviat un email amb un enllaç per iniciar la sessió. Comprova la safata d'entrada."
              }
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
