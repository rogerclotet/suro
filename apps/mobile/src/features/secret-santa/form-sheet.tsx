import { startOfDay } from "domain/events";
import { Check } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Dimensions, Pressable, ScrollView, Switch, View } from "react-native";
import { Avatar } from "@/components/avatar";
import { MonthGrid } from "@/components/month-grid";
import { TimeStepper } from "@/components/time-stepper";
import { useTranslations } from "@/i18n";
import { useLongDate } from "@/lib/datetime";
import { useTheme } from "@/theme";
import { Button, Field, Section, Sheet, Txt } from "@/ui";
import {
  type DraftError,
  draftError,
  type SecretSantaDraft,
} from "./form-values";
import type { Person } from "./types";

const SCREEN_HEIGHT = Dimensions.get("window").height;

const ERROR_KEYS: Record<DraftError, string> = {
  name: "validationName",
  date: "validationFutureDate",
  budget: "validationPriceMinMax",
  participants: "validationMinParticipants",
};

/** Create or edit a Secret Santa: details, date, budget and participants. */
export function SecretSantaFormSheet({
  visible,
  title,
  initial,
  members,
  participantsLocked = false,
  requireUpcoming = false,
  busy,
  submitLabel,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  title: string;
  initial: SecretSantaDraft;
  members: Pick<Person, "userId" | "name" | "image" | "avatarColor">[];
  participantsLocked?: boolean;
  requireUpcoming?: boolean;
  busy: boolean;
  submitLabel: string;
  onSubmit: (draft: SecretSantaDraft) => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const tSanta = useTranslations("secretSanta");
  const tc = useTranslations("mobile.common");
  const longDate = useLongDate();
  const [draft, setDraft] = useState(initial);
  const [touched, setTouched] = useState(false);
  const [month, setMonth] = useState(() => startOfDay(initial.day));

  // Read the latest initial draft when the sheet opens without resetting the
  // form on every parent render.
  const initialRef = useRef(initial);
  initialRef.current = initial;
  useEffect(() => {
    if (!visible) return;
    setDraft(initialRef.current);
    setMonth(startOfDay(initialRef.current.day));
    setTouched(false);
  }, [visible]);

  function change(patch: Partial<SecretSantaDraft>) {
    setTouched(true);
    setDraft((current) => ({ ...current, ...patch }));
  }

  function toggleParticipant(userId: string) {
    change({
      participantIds: draft.participantIds.includes(userId)
        ? draft.participantIds.filter((id) => id !== userId)
        : [...draft.participantIds, userId],
    });
  }

  const error = draftError(draft, { requireUpcoming });

  return (
    <Sheet visible={visible} onClose={onClose}>
      <ScrollView
        style={{ flex: 1, maxHeight: SCREEN_HEIGHT * 0.85 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{ gap: 16, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <Txt size={18} weight="700">
          {title}
        </Txt>
        <View style={{ gap: 8 }}>
          <Field
            placeholder={tc("name")}
            value={draft.name}
            onChangeText={(name) => change({ name })}
          />
          <Field
            placeholder={tSanta("descriptionPlaceholder")}
            value={draft.description}
            onChangeText={(description) => change({ description })}
            multiline
          />
        </View>

        <Section label={tSanta("dateLabel")}>
          <View
            style={{
              borderWidth: 1,
              borderColor: t.border,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 12,
              }}
            >
              <Txt size={16} weight="700" style={{ flex: 1 }}>
                {longDate(draft.day)}
              </Txt>
              {draft.allDay ? null : (
                <TimeStepper
                  value={draft.time}
                  onChange={(time) => change({ time })}
                />
              )}
            </View>
            <View style={{ height: 1, backgroundColor: t.border }} />
            <View style={{ padding: 8 }}>
              <MonthGrid
                month={month}
                onChangeMonth={setMonth}
                onSelectDay={(day) => change({ day: startOfDay(day) })}
                selectedStart={draft.day}
                selectedEnd={draft.day}
              />
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Txt size={15}>{tSanta("allDayLabel")}</Txt>
            <Switch
              value={draft.allDay}
              onValueChange={(allDay) => change({ allDay })}
              trackColor={{ true: t.primary, false: t.border }}
            />
          </View>
        </Section>

        <Section label={tSanta("priceRangeLabel")} hint={tSanta("budgetHint")}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Txt muted size={12}>
                {tSanta("budgetMinPlaceholder")}
              </Txt>
              <Field
                placeholder="0"
                value={draft.budgetMin}
                onChangeText={(budgetMin) => change({ budgetMin })}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Txt muted size={12}>
                {tSanta("budgetMaxPlaceholder")}
              </Txt>
              <Field
                placeholder="0"
                value={draft.budgetMax}
                onChangeText={(budgetMax) => change({ budgetMax })}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </Section>

        <Section
          label={`${tSanta("participants")} (${draft.participantIds.length}/${members.length})`}
          hint={participantsLocked ? tSanta("participantsLocked") : undefined}
        >
          <View>
            {members.map((member, index) => {
              const on = draft.participantIds.includes(member.userId);
              return (
                <Pressable
                  key={member.userId}
                  onPress={() => toggleParticipant(member.userId)}
                  disabled={participantsLocked}
                  accessibilityRole="checkbox"
                  accessibilityLabel={member.name ?? tSanta("unnamedMember")}
                  accessibilityState={{
                    checked: on,
                    disabled: participantsLocked,
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 10,
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderColor: t.border,
                    opacity: participantsLocked ? 0.6 : 1,
                  }}
                >
                  <Avatar
                    kind="user"
                    name={member.name}
                    image={member.image}
                    color={member.avatarColor}
                    size={32}
                  />
                  <Txt style={{ flex: 1 }} numberOfLines={1}>
                    {member.name ?? tSanta("unnamedMember")}
                  </Txt>
                  <View
                    // Remount on toggle: Android drops the corner radius when
                    // a mounted view's background color changes.
                    key={on ? "on" : "off"}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: on ? 0 : 1.5,
                      borderColor: t.border,
                      backgroundColor: on ? t.primary : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {on ? (
                      <Check color={t.onPrimary} size={14} strokeWidth={3} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {touched && error !== null && error !== "name" ? (
          <Txt size={13} style={{ color: t.danger }}>
            {tSanta(ERROR_KEYS[error])}
          </Txt>
        ) : null}
        <Button
          title={busy ? tc("saving") : submitLabel}
          disabled={busy || error !== null}
          onPress={() => onSubmit(draft)}
        />
      </ScrollView>
    </Sheet>
  );
}
