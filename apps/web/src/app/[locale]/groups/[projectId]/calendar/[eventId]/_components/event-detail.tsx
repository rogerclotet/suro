"use client";

import { Folders, ListTodo, NotebookText, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useProjects } from "@/app/_state/project-state";
import { ClientOnly } from "@/components/client-only";
import ShareButton from "@/components/ui/share-button";
import { Link } from "@/i18n/navigation";
import { useEvent } from "@/lib/queries/use-events";
import { textToHtml } from "@/lib/utils";
import Files from "../../../files/_components/files";
import UploadButton from "../../../files/_components/upload-button";
import CheckList from "../../../lists/[listId]/_components/check-list";
import TimeRange from "../../_components/event/time-range";
import SettingsMenu from "./settings-menu";
import TimeRemaining from "./time-remaining";

export default function EventDetail({
  projectId,
  eventId,
}: {
  projectId: string;
  eventId: string;
}) {
  const tCommon = useTranslations("common");
  const tCal = useTranslations("calendar");
  const { project } = useProjects();
  const data = useEvent(eventId);

  if (data === undefined) {
    return null;
  }

  const { event, list, note, pot } = data;
  const canCreatePot = (project?.users.length ?? 0) >= 2;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-semibold text-xl">{event.name}</h1>

          <div className="flex items-center gap-2">
            <ClientOnly>
              <ShareButton
                title={event.name}
                text={event.description ?? ""}
                href={{
                  pathname: "/groups/[projectId]/calendar/[eventId]",
                  params: { projectId: event.projectId, eventId: event.id },
                }}
              />
            </ClientOnly>
            <SettingsMenu
              event={event}
              list={list}
              pot={pot}
              canCreatePot={canCreatePot}
            />
          </div>
        </div>

        <div className="flex flex-wrap text-muted-foreground text-sm">
          <TimeRemaining
            event={event}
            className="mr-2 text-foreground opacity-70"
          />
          <TimeRange
            startAt={event.startAt}
            endAt={event.endAt}
            allDay={event.allDay}
          />
        </div>
      </div>

      {event.description && (
        <p
          // biome-ignore lint/security/noDangerouslySetInnerHtml: This is safe because the description is sanitized
          dangerouslySetInnerHTML={{ __html: textToHtml(event.description) }}
        />
      )}

      <div className="columns-1 gap-4 space-y-4 pt-6 md:columns-2">
        {list !== null && (
          <div className="break-inside-avoid space-y-4 border-muted border-y py-6 md:rounded-lg md:border-x md:px-6">
            <h2 className="font-semibold text-xl">
              <Link
                href={{
                  pathname: "/groups/[projectId]/lists/[listId]",
                  params: { projectId, listId: list.id },
                }}
                className="flex items-center gap-2"
              >
                <ListTodo />
                {list.name !== event.name ? list.name : tCommon("list")}
              </Link>
            </h2>
            <CheckList list={list} />
          </div>
        )}

        {pot !== null && (
          <div className="break-inside-avoid space-y-4 border-muted border-y py-6 md:rounded-lg md:border-x md:px-6">
            <h2 className="font-semibold text-xl">
              <Link
                href={{
                  pathname: "/groups/[projectId]/expenses/[potId]",
                  params: { projectId, potId: pot.id },
                }}
                className="flex items-center gap-2"
              >
                <Wallet />
                {pot.name !== event.name ? pot.name : tCal("potSection")}
              </Link>
            </h2>
          </div>
        )}

        <div className="break-inside-avoid space-y-4 border-muted border-y py-6 md:rounded-lg md:border-x md:px-6">
          <h2 className="flex items-start justify-between font-semibold text-xl">
            <div className="flex items-center gap-2">
              <Folders />
              {tCal("filesSection")}
            </div>

            <UploadButton projectId={projectId} eventId={eventId} />
          </h2>

          {event.files.length > 0 && <Files files={event.files} />}
        </div>

        {note !== null && (
          <div className="break-inside-avoid space-y-4 border-muted border-y py-6 md:rounded-lg md:border-x md:px-6">
            <h2 className="flex items-center gap-2 font-semibold text-xl">
              <NotebookText />
              {tCal("notesSection")}
            </h2>
            <Link
              href={{
                pathname: "/groups/[projectId]/notes/[noteId]",
                params: { projectId, noteId: note.id },
              }}
              className="text-primary underline"
            >
              {note.name}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
