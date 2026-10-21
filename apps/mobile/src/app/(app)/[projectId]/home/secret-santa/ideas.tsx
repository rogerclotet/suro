import { api } from "backend/convex/_generated/api";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import {
  headerBackAction,
  headerCreateAction,
} from "@/components/header-badges";
import { GiftIdeaRow } from "@/features/secret-santa/gift-idea-row";
import { GiftIdeaSheet } from "@/features/secret-santa/gift-idea-sheet";
import type { GiftIdea } from "@/features/secret-santa/types";
import { useTranslations } from "@/i18n";
import { usePersistentQuery } from "@/lib/offline";
import { useProjectId } from "@/lib/project-id";
import { Card, Fab, Loading, Screen, Txt, useFabScroll } from "@/ui";

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
          ...(participating
            ? headerCreateAction({
                onPress: () => openSheet(null),
                label: tSanta("ideaCreateAction"),
              })
            : {}),
        }}
      />
      {secretSanta === undefined ? (
        <Loading />
      ) : secretSanta === null || !participating ? (
        <View style={{ padding: 16 }}>
          <Card>
            <Txt muted>{tSanta("ideasUnavailable")}</Txt>
          </Card>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 96, gap: 12 }}
            onScroll={fab.onScroll}
            scrollEventThrottle={16}
          >
            <Card>
              <Txt muted size={14}>
                {tSanta("ideasIntro")}
              </Txt>
            </Card>
            {giftIdeas === undefined ? (
              <Loading />
            ) : giftIdeas.length === 0 ? (
              <Txt muted style={{ fontStyle: "italic" }}>
                {tSanta("ideasEmpty")}
              </Txt>
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
