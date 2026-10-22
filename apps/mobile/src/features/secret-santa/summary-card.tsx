import { eventLocalStart } from "domain/events";
import { hasPriceRange } from "domain/secret-santa";
import {
  CalendarDays,
  ChevronRight,
  Gift,
  type LucideIcon,
  UserRound,
  Wallet,
} from "lucide-react-native";
import { type ReactNode, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useLocale, useTranslations } from "@/i18n";
import { useTimeRemaining } from "@/lib/datetime";
import { useTheme } from "@/theme";
import { Card, Txt } from "@/ui";
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

/** The Secret Santa's name, countdown and key facts, with a calendar link. */
export function SummaryCard({
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
    <Card>
      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: t.navBar,
            }}
          >
            <Gift color={t.primary} size={24} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt size={20} weight="700" numberOfLines={2}>
              {secretSanta.name}
            </Txt>
            {remaining ? (
              <Txt size={14} weight="700" style={{ color: t.primary }}>
                {remaining}
              </Txt>
            ) : null}
          </View>
        </View>
        {secretSanta.description ? (
          <Txt muted size={15}>
            {secretSanta.description}
          </Txt>
        ) : null}
        <View
          style={{
            height: StyleSheet.hairlineWidth,
            backgroundColor: t.border,
          }}
        />
        <View style={{ gap: 2 }}>
          <DetailRow
            icon={CalendarDays}
            onPress={onOpenEvent}
            accessibilityLabel={`${when}. ${tSanta("viewInCalendar")}`}
          >
            <Txt size={15}>{when}</Txt>
            {onOpenEvent ? (
              <Txt size={13} style={{ color: t.primary }}>
                {tSanta("viewInCalendar")}
              </Txt>
            ) : null}
          </DetailRow>
          {hasPriceRange(priceRange) ? (
            <DetailRow icon={Wallet}>
              <Txt size={15}>
                {priceRange.min > 0
                  ? tSanta("priceRangeValue", priceRange)
                  : tSanta("priceRangeUpTo", { max: priceRange.max })}
              </Txt>
            </DetailRow>
          ) : null}
          {secretSanta.organizerName ? (
            <DetailRow icon={UserRound}>
              <Txt size={15}>
                {tSanta("organizedBy", { name: secretSanta.organizerName })}
              </Txt>
            </DetailRow>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

function DetailRow({
  icon: Icon,
  onPress,
  accessibilityLabel,
  children,
}: {
  icon: LucideIcon;
  onPress?: (() => void) | null;
  accessibilityLabel?: string;
  children: ReactNode;
}) {
  const t = useTheme();
  const content = (pressed: boolean) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 6,
        opacity: pressed ? 0.6 : 1,
      }}
    >
      <Icon color={t.muted} size={18} />
      <View style={{ flex: 1 }}>{children}</View>
      {onPress ? <ChevronRight color={t.muted} size={18} /> : null}
    </View>
  );
  if (!onPress) return content(false);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
    >
      {({ pressed }) => content(pressed)}
    </Pressable>
  );
}
