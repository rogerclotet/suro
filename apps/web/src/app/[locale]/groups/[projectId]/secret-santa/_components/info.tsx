"use client";

import { hasPriceRange } from "domain/secret-santa";
import {
  CalendarDaysIcon,
  type LucideIcon,
  UserRoundIcon,
  WalletIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { ProjectMember } from "@/app/_data/project";
import { exchangeLocalStart, type SecretSanta } from "@/app/_data/secret-santa";
import TimeRemaining from "@/app/[locale]/groups/[projectId]/calendar/[eventId]/_components/time-remaining";
import { ClientOnly } from "@/components/client-only";
import { Link } from "@/i18n/navigation";
import { PriceRangeText } from "./price-range-text";
import SettingsMenu from "./settings-menu";

/** The Secret Santa's headline, laid out like an event's: plain text, no card. */
export default function SecretSantaInfo({
  secretSanta,
  members,
}: {
  secretSanta: SecretSanta;
  members: ProjectMember[];
}) {
  const t = useTranslations("secretSanta");
  const locale = useLocale();
  const start = exchangeLocalStart(secretSanta);
  const when = start.toLocaleString(
    locale,
    secretSanta.exchangeAllDay
      ? { dateStyle: "full" }
      : { dateStyle: "full", timeStyle: "short" },
  );

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-display font-semibold text-2xl">
            {secretSanta.name}
          </h2>
          {secretSanta.canOrganize && (
            <SettingsMenu secretSanta={secretSanta} members={members} />
          )}
        </div>
        <ClientOnly>
          <p className="text-muted-foreground">{when}</p>
          <TimeRemaining
            event={{
              startAt: secretSanta.exchangeAt,
              endAt: secretSanta.exchangeAt,
              allDay: secretSanta.exchangeAllDay,
            }}
            className="block text-primary text-sm"
          />
        </ClientOnly>
      </div>

      {secretSanta.description && (
        <p className="whitespace-pre-line">{secretSanta.description}</p>
      )}

      <div className="space-y-1">
        {hasPriceRange(secretSanta.priceRange) && (
          <MetaLine icon={WalletIcon}>
            <PriceRangeText priceRange={secretSanta.priceRange} />
          </MetaLine>
        )}
        {secretSanta.organizerName && (
          <MetaLine icon={UserRoundIcon}>
            {t("organizedBy", { name: secretSanta.organizerName })}
          </MetaLine>
        )}
      </div>

      {secretSanta.eventId && (
        <Link
          href={{
            pathname: "/groups/[projectId]/calendar/[eventId]",
            params: {
              projectId: secretSanta.projectId,
              eventId: secretSanta.eventId,
            },
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 font-semibold text-[13px] text-foreground transition-opacity hover:opacity-70"
        >
          <CalendarDaysIcon size={14} className="shrink-0 text-primary" />
          {t("viewInCalendar")}
        </Link>
      )}
    </div>
  );
}

function MetaLine({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <p className="flex items-center gap-2 text-muted-foreground text-sm">
      <Icon className="size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
