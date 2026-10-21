"use client";

import { CalendarIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ProjectMember } from "@/app/_data/project";
import { exchangeLocalStart, type SecretSanta } from "@/app/_data/secret-santa";
import TimeRemaining from "@/app/[locale]/groups/[projectId]/calendar/[eventId]/_components/time-remaining";
import { ClientOnly } from "@/components/client-only";
import { Link } from "@/i18n/navigation";
import { PriceRangeText } from "./price-range-text";
import SettingsMenu from "./settings-menu";

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
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold text-2xl">{secretSanta.name}</h2>
        {secretSanta.canOrganize && (
          <SettingsMenu secretSanta={secretSanta} members={members} />
        )}
      </div>

      {secretSanta.description && (
        <p className="whitespace-pre-line text-foreground/80">
          {secretSanta.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-2 text-muted-foreground text-sm">
        <ClientOnly>
          <TimeRemaining
            event={{
              startAt: secretSanta.exchangeAt,
              endAt: secretSanta.exchangeAt,
              allDay: secretSanta.exchangeAllDay,
            }}
            className="text-foreground opacity-70"
          />
          <span>{when}</span>
        </ClientOnly>
        {secretSanta.eventId && (
          <Link
            href={{
              pathname: "/groups/[projectId]/calendar/[eventId]",
              params: {
                projectId: secretSanta.projectId,
                eventId: secretSanta.eventId,
              },
            }}
            className="inline-flex items-center gap-1 text-primary underline"
          >
            <CalendarIcon className="size-4" />
            {t("viewInCalendar")}
          </Link>
        )}
      </div>

      <p className="text-muted-foreground text-sm">
        <PriceRangeText priceRange={secretSanta.priceRange} />
      </p>

      {secretSanta.organizerName && (
        <p className="text-muted-foreground text-sm">
          {t("organizedBy", { name: secretSanta.organizerName })}
        </p>
      )}
    </div>
  );
}
