"use client";

import { eventLocalStart } from "domain/events";
import { useLocale, useTranslations } from "next-intl";
import { UnreadDot } from "@/components/unread-badge";
import { Link } from "@/i18n/navigation";
import { unreadItems } from "@/lib/notifications";
import { useUnreadNotifications } from "@/lib/queries/use-notifications";

type NewEvent = { id: string; name: string; startAt: number; allDay: boolean };

/**
 * Events other members added since the user last opened them. They can fall in
 * any month, so the grid's dots alone wouldn't lead the user to them.
 */
export default function NewEvents({ projectId }: { projectId: string }) {
  const unread = useUnreadNotifications();
  const t = useTranslations("calendar");
  const locale = useLocale();
  const events = unreadItems(unread, projectId, "calendar")
    .flatMap((item): NewEvent[] =>
      item.event && !item.gone ? [{ id: item.id, ...item.event }] : [],
    )
    .sort((a, b) => a.startAt - b.startAt);
  if (events.length === 0) return null;

  return (
    <section className="space-y-1">
      <h2 className="text-xs tracking-wider text-muted-foreground uppercase">
        {t("newEvents")}
      </h2>
      <ul className="divide-y divide-border">
        {events.map((event) => (
          <li key={event.id}>
            <Link
              href={{
                pathname: "/groups/[projectId]/calendar/[eventId]",
                params: { projectId, eventId: event.id },
              }}
              className="flex items-center gap-2.5 px-1 py-2.5 transition-colors hover:bg-accent"
            >
              <UnreadDot count={1} />
              <span className="min-w-0 flex-1 truncate font-semibold">
                {event.name}
              </span>
              <span className="shrink-0 text-[13px] text-muted-foreground">
                {eventLocalStart(event).toLocaleDateString(locale, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
