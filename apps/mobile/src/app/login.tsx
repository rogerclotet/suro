import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { makeRedirectUri } from "expo-auth-session";
import * as Linking from "expo-linking";
import { Redirect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { View } from "react-native";
import { Button, Field, Screen, Txt } from "@/ui";

// Finishes any auth session that was pending when the app was backgrounded.
WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri();

export default function Login() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const sendCode = () =>
    run(async () => {
      await signIn("resend-otp", { email });
      setStep("code");
    });

  const verifyCode = () =>
    run(async () => {
      await signIn("resend-otp", { email, code });
    });

  const signInWithGoogle = () =>
    run(async () => {
      const { redirect } = await signIn("google", { redirectTo });
      if (!redirect) {
        return;
      }
      const result = await WebBrowser.openAuthSessionAsync(
        redirect.toString(),
        redirectTo,
      );
      if (result.type !== "success") {
        return;
      }
      const returnedCode = Linking.parse(result.url).queryParams?.code;
      if (typeof returnedCode === "string") {
        await signIn("google", { code: returnedCode });
      }
    });

  // Once Convex Auth flips to authenticated (Google or OTP), leave the login
  // screen automatically — otherwise it sits here until a manual reload.
  if (isAuthenticated) {
    return <Redirect href="/projects" />;
  }

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", gap: 16, padding: 24 }}>
        <Txt size={40} weight="700" style={{ textAlign: "center" }}>
          Suro
        </Txt>
        <Txt muted style={{ textAlign: "center" }}>
          Lists, calendar and more, shared with your people.
        </Txt>

        {step === "email" ? (
          <>
            <Field
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              inputMode="email"
              editable={!busy}
            />
            <Button
              title={busy ? "Sending…" : "Email me a code"}
              disabled={busy || email.length === 0}
              onPress={sendCode}
            />
          </>
        ) : (
          <>
            <Txt muted style={{ textAlign: "center" }}>
              Enter the code we sent to {email}.
            </Txt>
            <Field
              placeholder="123456"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              inputMode="numeric"
              editable={!busy}
            />
            <Button
              title={busy ? "Verifying…" : "Verify code"}
              disabled={busy || code.length === 0}
              onPress={verifyCode}
            />
            <Button
              title="Use a different email"
              variant="ghost"
              onPress={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
            />
          </>
        )}

        <Txt muted style={{ textAlign: "center" }}>
          or
        </Txt>
        <Button
          title="Continue with Google"
          variant="ghost"
          disabled={busy}
          onPress={signInWithGoogle}
        />

        {error ? (
          <Txt size={13} style={{ textAlign: "center", color: "#e64553" }}>
            {error}
          </Txt>
        ) : null}
      </View>
    </Screen>
  );
}
