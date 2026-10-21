import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { parseGiftUrl } from "domain/secret-santa";
import { useEffect, useRef, useState } from "react";
import { Alert, View } from "react-native";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Button, Field, Sheet, Txt } from "@/ui";
import { secretSantaErrorMessage } from "./errors";
import type { GiftIdea } from "./types";

/** Add a gift idea, or edit and delete an existing one. */
export function GiftIdeaSheet({
  visible,
  secretSantaId,
  giftIdea,
  onClose,
}: {
  visible: boolean;
  secretSantaId: Id<"secretSantas">;
  /** Present → edit mode; absent → create mode. */
  giftIdea: GiftIdea | null;
  onClose: () => void;
}) {
  const t = useTheme();
  const tSanta = useTranslations("secretSanta");
  const tc = useTranslations("mobile.common");
  const create = useMutation(api.secretSantas.createGiftIdea);
  const update = useMutation(api.secretSantas.updateGiftIdea);
  const remove = useMutation(api.secretSantas.removeGiftIdea);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Fill the fields when the sheet opens; a live update to the idea while
  // it is being edited must not overwrite what the user is typing.
  const giftIdeaRef = useRef(giftIdea);
  giftIdeaRef.current = giftIdea;
  useEffect(() => {
    if (!visible) return;
    const idea = giftIdeaRef.current;
    setName(idea?.name ?? "");
    setDescription(idea?.description ?? "");
    setUrl(idea?.url ?? "");
    setError(null);
  }, [visible]);

  const urlValid = parseGiftUrl(url).valid;

  async function submit() {
    setBusy(true);
    try {
      const values = { name, description, url };
      if (giftIdea) {
        await update({ giftIdeaId: giftIdea._id, ...values });
      } else {
        await create({ secretSantaId, ...values });
      }
      onClose();
    } catch (caught) {
      setError(
        secretSantaErrorMessage(caught, tSanta) ??
          tSanta(giftIdea ? "ideaSaveError" : "ideaCreateError"),
      );
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (!giftIdea) return;
    Alert.alert(tSanta("ideaDeleteTitle"), tSanta("ideaDeleteDescription"), [
      { text: tc("cancel"), style: "cancel" },
      {
        text: tc("delete"),
        style: "destructive",
        onPress: () => {
          remove({ giftIdeaId: giftIdea._id })
            .then(onClose)
            .catch(() => setError(tSanta("ideaDeleteError")));
        },
      },
    ]);
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        {giftIdea ? tSanta("ideaEditTitle") : tSanta("ideaCreateTitle")}
      </Txt>
      <View style={{ gap: 8 }}>
        <Field
          placeholder={tc("name")}
          value={name}
          onChangeText={setName}
          autoFocus={!giftIdea}
        />
        <Field
          placeholder={tSanta("descriptionPlaceholder")}
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Field
          placeholder={tSanta("ideasUrlPlaceholder")}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        {urlValid ? null : (
          <Txt size={13} style={{ color: t.danger }}>
            {tSanta("validationInvalidUrl")}
          </Txt>
        )}
      </View>
      {error ? (
        <Txt size={13} style={{ color: t.danger }}>
          {error}
        </Txt>
      ) : null}
      <Button
        title={busy ? tc("saving") : tc("save")}
        disabled={busy || name.trim() === "" || !urlValid}
        onPress={submit}
      />
      {giftIdea ? (
        <Button
          title={tSanta("ideaDeleteTitle")}
          variant="danger"
          onPress={confirmDelete}
        />
      ) : null}
    </Sheet>
  );
}
