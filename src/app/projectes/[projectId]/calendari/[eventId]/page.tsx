import { auth } from "@/auth";
import { getEvent } from "@/server/events";
import { getEventList } from "@/server/lists";
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
    <div className="space-y-4">
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

      {event.description && <p>{event.description}</p>}

      {list !== undefined && (
        <div className="mx-auto mt-8 max-w-lg space-y-4">
          <h2 className="text-xl font-semibold">
            <Link href={`/projectes/${projectId}/llistes/${list.id}`}>
              Llista
              {list.name !== event.name && <span> ({list.name})</span>}:
            </Link>
          </h2>
          <CheckList list={list} />
        </div>
      )}
    </div>
  );
}
