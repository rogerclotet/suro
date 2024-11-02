import { ClientOnly } from "@/components/client-only";
import ShareButton from "@/components/ui/share-button";
import { checkAuth } from "@/lib/check-auth";
import { textToHtml } from "@/lib/utils";
import { getLists, getTemplates } from "@/server/lists";
import { CalendarFold } from "lucide-react";
import Link from "next/link";
import TimeRange from "../../calendari/_components/event/time-range";
import CheckList from "./_components/check-list";
import ListsDropdown from "./_components/lists-dropdown";
import SettingsMenu from "./_components/settings/settings-menu";

export default async function ListPage({
  params: { projectId, listId },
}: {
  params: { projectId: string; listId: string };
}) {
  await checkAuth();

  const lists = await getLists(projectId);
  const templates = await getTemplates(projectId);

  const list = lists.find((l) => l.id === listId);
  if (!list) {
    return (
      <div className="space-y-4">
        <div className="alert alert-error">{"No s'ha trobat la llista"}</div>
        <Link href="/" className="btn btn-neutral">
          Tornar a la pàgina principal
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1>
          <ListsDropdown listId={listId} lists={lists} projectId={projectId} />
        </h1>

        <div className="flex items-center gap-2">
          <ClientOnly>
            <ShareButton
              title={list.name}
              text={list.description ?? ""}
              path={`/grups/${list.projectId}/llistes/${list.id}`}
            />
          </ClientOnly>
          <SettingsMenu list={list} templates={templates} />
        </div>
      </div>

      {list.event && (
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="flex items-center gap-2">
            <CalendarFold />
            <Link href={`/grups/${list.projectId}/calendari/${list.event.id}`}>
              {list.event.name}
            </Link>
          </h2>
          <TimeRange
            startAt={list.event.startAt}
            endAt={list.event.endAt}
            allDay={list.event.allDay}
            className="mt-0.5 text-sm text-muted-foreground"
          />
        </div>
      )}

      {list.description && (
        <p
          dangerouslySetInnerHTML={{
            __html: textToHtml(list.description),
          }}
        />
      )}

      <CheckList list={list} />
    </div>
  );
}
