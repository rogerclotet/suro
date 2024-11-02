import { ClientOnly } from "@/components/client-only";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import ShareButton from "@/components/ui/share-button";
import { checkAuth } from "@/lib/check-auth";
import { textToHtml } from "@/lib/utils";
import { getLists, getTemplates } from "@/server/lists";
import { AlertCircle, ArrowLeft, CalendarFold } from "lucide-react";
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
      <div className="absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            <p>{"No s'ha trobat la llista."}</p>
            <div className="mt-4">
              <Link href="/">
                <Button variant="neutral" className="gap-2">
                  <ArrowLeft />
                  {"Tornar a l'inici"}
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
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
