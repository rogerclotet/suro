"use client";

import { SiGoogle } from "@icons-pack/react-simple-icons";
import { Info, Mail, TriangleAlert } from "lucide-react";
import Image from "next/image";
import { redirect, useSearchParams } from "next/navigation";
import type { Session } from "next-auth";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { getSafeRedirectTo } from "@/lib/auth-redirect";
import { loginWithGoogle, loginWithResend } from "./actions";

type AuthTranslator = ReturnType<typeof useTranslations<"auth">>;

/**
 * Maps an Auth.js error code (passed as the `error` query param to the
 * configured error page) to a friendly, retryable message. A cancelled Google
 * sign-in surfaces as `Configuration`, so it falls through to the generic case.
 */
function getErrorMessage(
  code: string | null,
  t: AuthTranslator,
): string | null {
  if (!code) {
    return null;
  }
  switch (code) {
    case "AccessDenied":
      return t("error.accessDenied");
    case "Verification":
      return t("error.verification");
    default:
      return t("error.generic");
  }
}

export default function Login({
  session,
  previewEmail,
  redirectTo: redirectToProp,
  compact = false,
}: {
  session?: Session | null;
  previewEmail?: string;
  redirectTo?: string;
  compact?: boolean;
}) {
  const t = useTranslations("auth");
  const [loggedInWithResend, setLoggedInWithResend] = useState(false);
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirectTo(
    redirectToProp ?? searchParams.get("to"),
  );
  const errorMessage = getErrorMessage(searchParams.get("error"), t);

  if (session) {
    return redirect(redirectTo);
  }

  async function handleResendSignIn(formData?: FormData) {
    await loginWithResend(formData);
    setLoggedInWithResend(true);
  }

  const inner = (
    <div className="w-full max-w-xs space-y-6">
      {errorMessage && (
        <Alert className="rounded-xl border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50">
          <TriangleAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle className="font-medium text-red-800 text-sm dark:text-red-300">
            {t("error.title")}
          </AlertTitle>
          <AlertDescription className="text-red-700 text-xs leading-relaxed dark:text-red-400">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {!compact && (
        /* Logo + heading */
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center justify-center">
            <Image src="/logo.png" alt="Suro" width={64} height={64} />
          </div>
          <div>
            <h1 className="font-semibold text-2xl text-foreground tracking-tight">
              {t("welcome")}
            </h1>
            <p className="mt-1 text-muted-foreground text-sm">
              {t("signInPrompt")}
            </p>
          </div>
        </div>
      )}

      {/* Primary CTA: Google */}
      <form action={loginWithGoogle}>
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <button
          type="submit"
          className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 font-medium text-foreground text-sm shadow-sm transition-all duration-150 hover:bg-accent hover:text-accent-foreground active:scale-[0.99]"
        >
          <SiGoogle className="h-4 w-4 shrink-0" style={{ color: "#4285F4" }} />
          {t("continueWithGoogle")}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-muted-foreground text-xs tracking-wide">
          {t("or")}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Secondary: Email magic link */}
      <form action={handleResendSignIn} className="space-y-2.5">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <Input
          name="email"
          type="email"
          placeholder={t("emailPlaceholder")}
          required
          className="h-10 rounded-xl border-border bg-card text-foreground text-sm placeholder:text-muted-foreground dark:bg-card"
        />
        <button
          type="submit"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-muted-foreground text-sm transition-all duration-150 hover:bg-accent hover:text-accent-foreground active:scale-[0.99]"
        >
          <Mail className="h-4 w-4 shrink-0" />
          {t("continueWithEmail")}
        </button>
      </form>

      {/* Preview environment quick login */}
      {previewEmail && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-muted-foreground text-xs uppercase tracking-wide">
              preview
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <a
            href="/api/preview-login"
            className="flex w-full items-center justify-center rounded-xl border border-border border-dashed bg-muted/50 px-4 py-2.5 font-mono text-muted-foreground text-xs transition-all duration-150 hover:bg-accent hover:text-accent-foreground active:scale-[0.99]"
          >
            {previewEmail}
          </a>
        </div>
      )}

      {/* Success state */}
      {loggedInWithResend && (
        <Alert className="rounded-xl border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/50">
          <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="font-medium text-green-800 text-sm dark:text-green-300">
            {t("emailSent")}
          </AlertTitle>
          <AlertDescription className="text-green-700 text-xs leading-relaxed dark:text-green-400">
            {t("emailSentDescription")}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  if (compact) {
    return inner;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {inner}
    </div>
  );
}
