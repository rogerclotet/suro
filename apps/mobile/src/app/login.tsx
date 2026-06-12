import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "backend/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import { makeRedirectUri } from "expo-auth-session";
import * as Linking from "expo-linking";
import { Redirect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { type ReactNode, useState } from "react";
import { Image, Pressable, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Button, Field, Screen, Txt } from "@/ui";

// Finishes any auth session that was pending when the app was backgrounded.
WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri();

// Reuses the splash icon so the splash → login handoff keeps the same mark.
const logo = require("@/assets/images/splash-icon.png");

type OAuthProvider = "google" | "apple";

// The official multicolor "G" from Google's sign-in branding guidelines —
// users recognize the standard mark faster than a text-only button.
function GoogleLogo({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Path
        fill="#4285F4"
        d="M17.64 9.2045c0-.6382-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"
      />
      <Path
        fill="#34A853"
        d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.0359-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z"
      />
      <Path
        fill="#FBBC05"
        d="M3.9641 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9574A8.9965 8.9965 0 0 0 0 9c0 1.4523.3477 2.8268.9574 4.0418L3.9641 10.71z"
      />
      <Path
        fill="#EA4335"
        d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9574 4.9582L3.9641 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z"
      />
    </Svg>
  );
}

function AppleLogo({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.03 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-.702"
      />
    </Svg>
  );
}

// Standard provider sign-in button: a hairline-bordered surface with the
// provider's mark beside a centered label — mirroring the web login's CTAs.
function OAuthButton({
  title,
  logo,
  background,
  borderColor,
  labelColor,
  onPress,
  disabled,
}: {
  title: string;
  logo: ReactNode;
  background: string;
  borderColor: string;
  labelColor: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor,
        backgroundColor: background,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      {logo}
      <Txt weight="700" style={{ color: labelColor }}>
        {title}
      </Txt>
    </Pressable>
  );
}

function Divider({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
      <Txt muted size={13}>
        {label}
      </Txt>
      <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
    </View>
  );
}

export default function Login() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  // Auth-free config query: it must fire while signed out — it feeds the
  // login screen — so it is deliberately not gated with "skip".
  const oauthProviders = useQuery(api.auth.oauthProviders);
  const t = useTranslations("mobile.auth");
  const theme = useTheme();
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
      setError(err instanceof Error ? err.message : t("genericError"));
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

  const signInWithOAuth = (provider: OAuthProvider) =>
    run(async () => {
      const { redirect } = await signIn(provider, { redirectTo });
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
        await signIn(provider, { code: returnedCode });
      }
    });

  // Once Convex Auth flips to authenticated (OAuth or OTP), leave the login
  // screen automatically — otherwise it sits here until a manual reload.
  if (isAuthenticated) {
    // Hand off to the index router, which resumes the last group (or routes to
    // group creation when the user has none).
    return <Redirect href="/" />;
  }

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", gap: 16, padding: 24 }}>
        <Image
          source={logo}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="Suro"
          style={{ width: 88, height: 88, alignSelf: "center" }}
        />
        <Txt size={40} weight="700" style={{ textAlign: "center" }}>
          Suro
        </Txt>
        <Txt muted style={{ textAlign: "center" }}>
          {t("tagline")}
        </Txt>

        {step === "email" ? (
          <>
            {/* Primary CTAs, matching the web login's hierarchy: OAuth first,
                email code as the secondary path below the divider. */}
            <OAuthButton
              title={t("continueWithGoogle")}
              logo={<GoogleLogo size={20} />}
              background={theme.card}
              borderColor={theme.border}
              labelColor={theme.text}
              disabled={busy}
              onPress={() => signInWithOAuth("google")}
            />
            {oauthProviders?.apple ? (
              // Apple's HIG: black button on light surfaces, white on dark —
              // `text` over `bg` gives exactly that in both schemes.
              <OAuthButton
                title={t("continueWithApple")}
                logo={<AppleLogo size={20} color={theme.bg} />}
                background={theme.text}
                borderColor={theme.text}
                labelColor={theme.bg}
                disabled={busy}
                onPress={() => signInWithOAuth("apple")}
              />
            ) : null}
            <Divider label={t("or")} />
            <Field
              placeholder={t("emailPlaceholder")}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              inputMode="email"
              editable={!busy}
            />
            <Button
              title={busy ? t("sending") : t("sendCode")}
              variant="ghost"
              disabled={busy || email.length === 0}
              onPress={sendCode}
            />
          </>
        ) : (
          <>
            <Txt muted style={{ textAlign: "center" }}>
              {t("codeSentTo", { email })}
            </Txt>
            <Field
              placeholder={t("codePlaceholder")}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              inputMode="numeric"
              editable={!busy}
            />
            <Button
              title={busy ? t("verifying") : t("verifyCode")}
              disabled={busy || code.length === 0}
              onPress={verifyCode}
            />
            <Button
              title={t("differentEmail")}
              variant="ghost"
              onPress={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
            />
          </>
        )}

        {error ? (
          <Txt size={13} style={{ textAlign: "center", color: theme.danger }}>
            {error}
          </Txt>
        ) : null}
      </View>
    </Screen>
  );
}
