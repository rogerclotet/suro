import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Button, Sheet, Txt } from "@/ui";
import { flush } from "./flush";
import {
  outbox,
  useOutboxEntries,
  useQuarantinedEntries,
} from "./outbox-store";

export function SyncStatus() {
  const tr = useTranslations("offline");
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const entries = useOutboxEntries();
  const quarantined = useQuarantinedEntries();
  const [open, setOpen] = useState(false);
  const failed = entries.filter((entry) => entry.status === "failed").length;
  const count = entries.length + quarantined.length;
  const confirmDiscard = (discard: () => void) =>
    Alert.alert(tr("discard"), tr("discardDescription"), [
      { text: tr("cancel"), style: "cancel" },
      { text: tr("discard"), style: "destructive", onPress: discard },
    ]);
  if (count === 0) return null;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={{
          backgroundColor: theme.bg,
          padding: 12,
          paddingBottom: Math.max(insets.bottom, 12),
        }}
      >
        <Txt>
          {failed + quarantined.length > 0
            ? tr("needsAttention", { count: failed + quarantined.length })
            : tr("waiting", { count })}
        </Txt>
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)}>
        <Txt>{tr("title")}</Txt>
        <ScrollView contentContainerStyle={{ gap: 16 }}>
          {entries.map((entry) => (
            <View key={entry.id} style={{ gap: 8 }}>
              <Txt>
                {"name" in entry.args
                  ? entry.args.name
                  : "description" in entry.args && entry.args.description
                    ? entry.args.description
                    : entry.functionName.startsWith("expenses:")
                      ? tr("expenseChange")
                      : tr("listChange")}
              </Txt>
              <Txt>
                {entry.status === "failed" ? tr("failed") : tr("pending")}
              </Txt>
              {entry.status === "failed" && (
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Button
                    title={tr("retry")}
                    onPress={() => {
                      outbox.retry(entry.id);
                      void flush();
                    }}
                  />
                  <Button
                    title={tr("discard")}
                    variant="danger"
                    onPress={() =>
                      confirmDiscard(() => outbox.discard(entry.id))
                    }
                  />
                </View>
              )}
            </View>
          ))}
          {quarantined.length > 0 && (
            <View style={{ gap: 8 }}>
              <Txt>{tr("unsupported", { count: quarantined.length })}</Txt>
              <Button
                title={tr("discard")}
                variant="danger"
                onPress={() =>
                  confirmDiscard(() => outbox.discardQuarantined())
                }
              />
            </View>
          )}
        </ScrollView>
      </Sheet>
    </>
  );
}
