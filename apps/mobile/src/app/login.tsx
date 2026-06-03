import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { View } from "react-native";
import { Button, Field, Screen, Txt } from "@/ui";

export default function Login() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", gap: 16, padding: 24 }}>
        <Txt size={40} weight="700" style={{ textAlign: "center" }}>
          Suro
        </Txt>
        <Txt muted style={{ textAlign: "center" }}>
          Lists, calendar and more, shared with your people.
        </Txt>

        <Button
          title="Continue with Google"
          onPress={() => void signIn("google")}
        />

        <Txt muted style={{ textAlign: "center" }}>
          or
        </Txt>

        <Field
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          inputMode="email"
        />
        <Button
          title={sent ? "Check your email" : "Email me a sign-in link"}
          disabled={sent || email.length === 0}
          onPress={async () => {
            await signIn("resend", { email });
            setSent(true);
          }}
        />
      </View>
    </Screen>
  );
}
