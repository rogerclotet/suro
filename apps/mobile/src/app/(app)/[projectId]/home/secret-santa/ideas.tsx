import { api } from "backend/convex/_generated/api";
import { Stack, useRouter } from "expo-router";
import { Lightbulb, Lock } from "lucide-react-native";
import { useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import {
  headerBackAction,
  headerCreateAction,
} from "@/components/header-badges";
import { GiftIdeaRow } from "@/features/secret-santa/gift-idea-row";
import { GiftIdeaSheet } from "@/features/secret-santa/gift-idea-sheet";
import { Notice } from "@/features/secret-santa/notice";
import type { GiftIdea } from "@/features/secret-santa/types";
import { useTranslations } from "@/i18n";
import { usePersistentQuery } from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import { Button, Fab, Loading, Screen, Txt, useFabScroll } from "@/ui";

/** The participant's own wishes, visible only to whoever draws them. */
export default function GiftIdeasScreen() {
  const pid = useProjectId();
  const router = useRouter();
  const fab = useFabScroll();
  const tSanta = useTranslations("secretSanta");
  const tc = useTranslations("mobile.common");
  const secretSanta = usePersistentQuery(api.secretSantas.current, {
    projectId: pid,
  });
  const participating = secretSanta?.isParticipant === true;
  const giftIdeas = usePersistentQuery(
    api.secretSantas.myGiftIdeas,
    secretSanta && participating ? { secretSantaId: secretSanta._id } : "skip",
  );
  // The idea stays set while the sheet slides out so its title doesn't flip.
  const [sheet, setSheet] = useState<{ open: boolean; idea: GiftIdea | null }>({
    open: false,
    idea: null,
  });
  const openSheet = (idea: GiftIdea | null) => setSheet({ open: true, idea });

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: tSanta("ideasTitle"),
          ...headerBackAction(() => router.back(), tc("back")),
          ...headerCreateAction(
            participating
              ? {
                  onPress: () => openSheet(null),
                  label: tSanta("ideaCreateAction"),
                }
              : undefined,
          ),
        }}
      />
      {secretSanta === undefined ? (
        <Loading />
      ) : secretSanta === null || !participating ? (
        <View style={{ padding: 16 }}>
          <Notice icon={Lightbulb} text={tSanta("ideasUnavailable")} />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 96, gap: 12 }}
            onScroll={fab.onScroll}
            scrollEventThrottle={16}
          >
            <Notice icon={Lock} text={tSanta("ideasIntro")} />
            {giftIdeas === undefined ? (
              <Loading />
            ) : giftIdeas.length === 0 ? (
              <EmptyIdeas onAdd={() => openSheet(null)} />
            ) : (
              giftIdeas.map((giftIdea) => (
                <GiftIdeaRow
                  key={giftIdea._id}
                  giftIdea={giftIdea}
                  onPress={() => openSheet(giftIdea)}
                />
              ))
            )}
          </ScrollView>
          <Fab
            onPress={() => openSheet(null)}
            label={tSanta("ideaCreateAction")}
            extended={fab.extended}
          />
          <GiftIdeaSheet
            visible={sheet.open}
            secretSantaId={secretSanta._id}
            giftIdea={sheet.idea}
            onClose={() => setSheet({ ...sheet, open: false })}
          />
        </>
      )}
    </Screen>
  );
}

function EmptyIdeas({ onAdd }: { onAdd: () => void }) {
  const t = useTheme();
  const tSanta = useTranslations("secretSanta");
  return (
    <View style={{ alignItems: "center", gap: 12, paddingVertical: 32 }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${t.marker}26`,
        }}
      >
        <Lightbulb color={t.marker} size={34} />
      </View>
      <Txt muted size={15} style={{ textAlign: "center", maxWidth: 280 }}>
        {tSanta("ideasEmpty")}
      </Txt>
      {/* Android already shows the FAB; iOS's header "+" is easy to miss. */}
      {Platform.OS === "ios" ? (
        <Button
          title={tSanta("ideaCreateAction")}
          variant="ghost"
          onPress={onAdd}
        />
      ) : null}
    </View>
  );
}
