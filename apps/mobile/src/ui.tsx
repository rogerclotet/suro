import { Plus } from "lucide-react-native";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type TextProps,
  View,
} from "react-native";
import { FONT, useTheme } from "./theme";

export function Sheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const t = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
        onPress={onClose}
      />
      <View
        style={{
          backgroundColor: t.bg,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 20,
          paddingBottom: 36,
          gap: 12,
        }}
      >
        {children}
      </View>
    </Modal>
  );
}

export function Fab({ onPress }: { onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        position: "absolute",
        right: 20,
        bottom: 28,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: t.primary,
        opacity: pressed ? 0.85 : 1,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
      })}
    >
      <Plus color={t.onPrimary} size={28} />
    </Pressable>
  );
}

export function Screen({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <View style={{ flex: 1, backgroundColor: t.bg }}>{children}</View>;
}

export function Center({ children }: { children: ReactNode }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      {children}
    </View>
  );
}

export function Loading() {
  const t = useTheme();
  return (
    <Center>
      <ActivityIndicator color={t.primary} size="large" />
    </Center>
  );
}

export function Txt({
  muted,
  size = 16,
  weight = "400",
  strike,
  style,
  ...rest
}: TextProps & {
  muted?: boolean;
  size?: number;
  weight?: "400" | "700";
  strike?: boolean;
}) {
  const t = useTheme();
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: FONT,
          fontSize: size,
          fontWeight: weight,
          color: muted ? t.muted : t.text,
          textDecorationLine: strike ? "line-through" : "none",
        },
        style,
      ]}
    />
  );
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: variant === "primary" ? t.primary : "transparent",
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: FONT,
          fontWeight: "700",
          fontSize: 16,
          textAlign: "center",
          color: variant === "primary" ? t.onPrimary : t.primary,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Field({ style, ...props }: TextInputProps) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.muted}
      {...props}
      style={[
        styles.field,
        {
          backgroundColor: t.inputBg,
          borderColor: t.border,
          color: t.text,
          fontFamily: FONT,
        },
        style,
      ]}
    />
  );
}

export function Card({
  children,
  onPress,
}: {
  children: ReactNode;
  onPress?: () => void;
}) {
  const t = useTheme();
  const inner = (
    <View
      style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}
    >
      {children}
    </View>
  );
  if (!onPress) {
    return inner;
  }
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      {inner}
    </Pressable>
  );
}

export function ComingSoon({ emoji, title }: { emoji: string; title: string }) {
  return (
    <Screen>
      <Center>
        <Text style={{ fontSize: 48 }}>{emoji}</Text>
        <Txt size={20} weight="700" style={{ marginTop: 12 }}>
          {title}
        </Txt>
        <Txt muted style={{ marginTop: 4 }}>
          Coming soon
        </Txt>
      </Center>
    </Screen>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  field: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
  },
  card: { borderWidth: 1, borderRadius: 14, padding: 16 },
});
