import { auth } from "@/auth";
import { textToHtml } from "@/lib/utils";
import { getEvent } from "@/server/events";
import { getEventList } from "@/server/lists";
import { ListTodo } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { toast } from "sonner";
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
    toast.error("No s'ha trobat l'esdeveniment");
    return redirect(`/projectes/${projectId}/calendari`);
  }

  const list = await getEventList(projectId, event.id);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">{event.name}</h1>
          <SettingsMenu event={event} list={list} />
        </div>

        <p className="flex flex-wrap text-sm text-muted-foreground">
          <TimeRemaining
            event={event}
            className="mr-2 text-foreground opacity-70"
          />
          <TimeRange startAt={event.startAt} endAt={event.endAt} />
        </p>
      </div>

      {event.description && (
        <p
          dangerouslySetInnerHTML={{ __html: textToHtml(event.description) }}
        />
      )}

      {list !== undefined && (
        <div className="pt-6">
          <div className="mx-auto max-w-xl space-y-4 border-y border-muted py-6 md:rounded-lg md:border-x md:px-6">
            <h2 className="text-xl font-semibold">
              <Link
                href={`/projectes/${projectId}/llistes/${list.id}`}
                className="flex items-center gap-2"
              >
                <ListTodo />
                {list.name !== event.name ? list.name : "Llista"}
              </Link>
            </h2>
            <CheckList list={list} />
          </div>
        </div>
      )}
    </div>
  );
}
