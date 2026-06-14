"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { SiApple } from "@icons-pack/react-simple-icons";
import { api } from "backend/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import { Info, Mail, TriangleAlert } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { getSafeRedirectTo } from "@/lib/auth-redirect";

// The official multicolor "G" from Google's sign-in branding guidelines —
// the standard mark, unlike simple-icons' monochrome glyph.
function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" className={className}>
      <path
        fill="#4285F4"
        d="M17.64 9.2045c0-.6382-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.0359-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.9641 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9574A8.9965 8.9965 0 0 0 0 9c0 1.4523.3477 2.8268.9574 4.0418L3.9641 10.71z"
      />
      <path
        fill="#EA4335"
        d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9574 4.9582L3.9641 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z"
      />
    </svg>
  );
}

export default function Login({
  redirectTo: redirectToProp,
  compact = false,
}: {
  redirectTo?: string;
  compact?: boolean;
}) {
  const t = useTranslations("auth");
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  // Auth-free config query: it must fire while signed out — it feeds the
  // login screen — so it is deliberately not gated with "skip". Apple's
  // button stays hidden until the deployment has Apple credentials.
  const oauthProviders = useQuery(api.auth.oauthProviders);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirectTo(
    redirectToProp ?? searchParams.get("to"),
  );

  const [step, setStep] = useState<"signIn" | "code">("signIn");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Once Convex reports an authenticated session (OAuth return or OTP verified),
  // leave the login screen.
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, redirectTo, router]);

  async function handleSendCode(formData: FormData) {
    const value = formData.get("email")?.toString().trim() ?? "";
    if (!value) return;
    setSubmitting(true);
    setError(null);
    try {
      await signIn("resend-otp", { email: value });
      setEmail(value);
      setStep("code");
    } catch {
      setError(t("error.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode(formData: FormData) {
    const code = formData.get("code")?.toString().trim() ?? "";
    if (!code) return;
    setSubmitting(true);
    setError(null);
    try {
      // Convex Auth verifies the code and establishes the session; the effect
      // above handles the redirect.
      await signIn("resend-otp", { email, code });
    } catch {
      setError(t("codeError"));
    } finally {
      setSubmitting(false);
    }
  }

  // Pass an absolute URL on this origin so the OAuth round-trip returns here
  // (prod, a preview, or localhost) — the shared dev backend can't infer the
  // origin from a relative path.
  const oauthSignIn = (provider: "google" | "apple") =>
    void signIn(provider, {
      redirectTo: `${window.location.origin}${redirectTo}`,
    });

  const inner = (
    <div className="w-full max-w-xs space-y-6">
      {error && (
        <Alert className="rounded-xl border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50">
          <TriangleAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle className="font-medium text-red-800 text-sm dark:text-red-300">
            {t("error.title")}
          </AlertTitle>
          <AlertDescription className="text-red-700 text-xs leading-relaxed dark:text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {!compact && (
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

      {step === "signIn" ? (
        <>
          {/* Primary CTAs: OAuth providers */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => oauthSignIn("google")}
              className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 font-medium text-foreground text-sm shadow-sm transition-all duration-150 hover:bg-accent hover:text-accent-foreground active:scale-[0.99]"
            >
              <GoogleLogo className="h-[18px] w-[18px] shrink-0" />
              {t("continueWithGoogle")}
            </button>
            {oauthProviders?.apple && (
              <button
                type="button"
                onClick={() => oauthSignIn("apple")}
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 font-medium text-foreground text-sm shadow-sm transition-all duration-150 hover:bg-accent hover:text-accent-foreground active:scale-[0.99]"
              >
                <SiApple className="h-[18px] w-[18px] shrink-0" />
                {t("continueWithApple")}
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-muted-foreground text-xs tracking-wide">
              {t("or")}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Secondary: email one-time code */}
          <form action={handleSendCode} className="space-y-2.5">
            <Input
              name="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              required
              disabled={submitting}
              className="h-10 rounded-xl border-border bg-card text-foreground text-sm placeholder:text-muted-foreground dark:bg-card"
            />
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-muted-foreground text-sm transition-all duration-150 hover:bg-accent hover:text-accent-foreground active:scale-[0.99] disabled:opacity-50"
            >
              <Mail className="h-4 w-4 shrink-0" />
              {t("continueWithEmail")}
            </button>
          </form>
        </>
      ) : (
        /* Code entry */
        <div className="space-y-2.5">
          <Alert className="rounded-xl border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/50">
            <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="font-medium text-green-800 text-sm dark:text-green-300">
              {t("emailSent")}
            </AlertTitle>
            <AlertDescription className="text-green-700 text-xs leading-relaxed dark:text-green-400">
              {t("codeSentDescription")}
            </AlertDescription>
          </Alert>
          <form action={handleVerifyCode} className="space-y-2.5">
            <Input
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={t("codePlaceholder")}
              required
              disabled={submitting}
              className="h-10 rounded-xl border-border bg-card text-center font-mono text-foreground text-sm tracking-widest placeholder:text-muted-foreground dark:bg-card"
            />
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-foreground text-sm transition-all duration-150 hover:bg-accent hover:text-accent-foreground active:scale-[0.99] disabled:opacity-50"
            >
              {t("verifyCode")}
            </button>
          </form>
        </div>
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
