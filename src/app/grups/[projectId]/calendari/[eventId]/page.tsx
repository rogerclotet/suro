import { Folders, ListTodo } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ClientOnly } from "@/components/client-only";
import ShareButton from "@/components/ui/share-button";
import { textToHtml } from "@/lib/utils";
import { getEvent } from "@/server/events";
import { getEventList } from "@/server/lists";
import Files from "../../fitxers/_components/files";
import UploadButton from "../../fitxers/_components/upload-button";
import CheckList from "../../llistes/[listId]/_components/check-list";
import TimeRange from "../_components/event/time-range";
import SettingsMenu from "./_components/settings-menu";
import TimeRemaining from "./_components/time-remaining";

export default async function EventPage({
  params: { projectId, eventId },
}: {
  params: { projectId: string; eventId: string };
}) {
  const session = await auth();
  if (!session) {
    return redirect("/");
  }

  const event = await getEvent(projectId, eventId);
  if (event === undefined) {
    return redirect(`/grups/${projectId}/calendari`);
  }

  const list = await getEventList(projectId, event.id);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">{event.name}</h1>

          <div className="flex items-center gap-2">
            <ClientOnly>
              <ShareButton
                title={event.name}
                text={event.description ?? ""}
                path={`/grups/${event.projectId}/calendari/${event.id}`}
              />
            </ClientOnly>
            <SettingsMenu event={event} list={list} />
          </div>
        </div>

        <div className="flex flex-wrap text-sm text-muted-foreground">
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
          dangerouslySetInnerHTML={{ __html: textToHtml(event.description) }}
        />
      )}

      <div className="grid grid-cols-1 items-stretch gap-4 pt-6 md:grid-cols-2">
        {list !== undefined && (
          <div className="max-w-3xl space-y-4 border-y border-muted py-6 md:rounded-lg md:border-x md:px-6">
            <h2 className="text-xl font-semibold">
              <Link
                href={`/grups/${projectId}/llistes/${list.id}`}
                className="flex items-center gap-2"
              >
                <ListTodo />
                {list.name !== event.name ? list.name : "Llista"}
              </Link>
            </h2>
            <CheckList list={list} />
          </div>
        )}

        <div className="space-y-4 border-y border-muted py-6 md:rounded-lg md:border-x md:px-6">
          <h2 className="flex items-start justify-between text-xl font-semibold">
            <div className="flex items-center gap-2">
              <Folders />
              Fitxers
            </div>

            <UploadButton projectId={projectId} eventId={eventId} />
          </h2>

          {event.files.length > 0 && <Files files={event.files} />}
        </div>
      </div>
    </div>
  );
}
