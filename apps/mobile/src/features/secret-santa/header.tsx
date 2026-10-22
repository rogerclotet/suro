import { eventLocalStart } from "domain/events";
import { hasPriceRange } from "domain/secret-santa";
import {
  CalendarDays,
  type LucideIcon,
  UserRound,
  Wallet,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useLocale, useTranslations } from "@/i18n";
import { useTimeRemaining } from "@/lib/datetime";
import { useTheme } from "@/theme";
import { Txt } from "@/ui";
import type { SecretSanta } from "./types";

const MINUTE_MS = 60_000;

/** The current time, refreshed every minute so a countdown stays current. */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), MINUTE_MS);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * The Secret Santa's headline, laid out like the event detail screen: name,
 * when, countdown and description on the page itself rather than in a card.
 */
export function SecretSantaHeader({
  secretSanta,
  onOpenEvent,
}: {
  secretSanta: SecretSanta;
  onOpenEvent: (() => void) | null;
}) {
  const t = useTheme();
  const locale = useLocale();
  const tSanta = useTranslations("secretSanta");
  const timeRemaining = useTimeRemaining();
  const now = useNow();
  const times = {
    startAt: secretSanta.exchangeAt,
    endAt: secretSanta.exchangeAt,
    allDay: secretSanta.exchangeAllDay,
  };
  const remaining = timeRemaining(times, now);
  const when = eventLocalStart(times).toLocaleString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(secretSanta.exchangeAllDay
      ? null
      : { hour: "2-digit", minute: "2-digit" }),
  });
  const { priceRange } = secretSanta;

  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Txt size={26} weight="700">
          {secretSanta.name}
        </Txt>
        <Txt muted size={16}>
          {when}
        </Txt>
        {remaining ? (
          <Txt size={15} style={{ color: t.primary }}>
            {remaining}
          </Txt>
        ) : null}
      </View>
      {secretSanta.description ? (
        <Txt size={16}>{secretSanta.description}</Txt>
      ) : null}
      <View style={{ gap: 6 }}>
        {hasPriceRange(priceRange) ? (
          <MetaLine
            icon={Wallet}
            text={
              priceRange.min > 0
                ? tSanta("priceRangeValue", priceRange)
                : tSanta("priceRangeUpTo", { max: priceRange.max })
            }
          />
        ) : null}
        {secretSanta.organizerName ? (
          <MetaLine
            icon={UserRound}
            text={tSanta("organizedBy", { name: secretSanta.organizerName })}
          />
        ) : null}
      </View>
      {onOpenEvent ? (
        <View style={{ flexDirection: "row" }}>
          <Pressable
            onPress={onOpenEvent}
            accessibilityRole="link"
            accessibilityLabel={tSanta("viewInCalendar")}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: t.border,
              backgroundColor: t.card,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <CalendarDays color={t.primary} size={14} />
            <Txt weight="700" size={13}>
              {tSanta("viewInCalendar")}
            </Txt>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function MetaLine({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Icon color={t.muted} size={16} />
      <Txt muted size={14} style={{ flex: 1 }}>
        {text}
      </Txt>
    </View>
  );
}
