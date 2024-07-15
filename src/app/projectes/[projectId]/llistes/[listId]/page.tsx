import { checkAuth } from "@/lib/check-auth";
import { textToHtml } from "@/lib/utils";
import { getList } from "@/server/lists";
import { CalendarFold } from "lucide-react";
import Link from "next/link";
import ShareButton from "../../../../../components/ui/share-button";
import TimeRange from "../../calendari/_components/event/time-range";
import CheckList from "./_components/check-list";
import SettingsMenu from "./_components/settings/settings-menu";

export default async function ListPage({
  params: { listId },
}: {
  params: { listId: string };
}) {
  await checkAuth();

  const list = await getList(listId);

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
        <h1 className="text-xl font-semibold">{list.name}</h1>

        <div className="flex items-center gap-2">
          <ShareButton
            name={list.name}
            text={list.description ?? ""}
            path={`/projectes/${list.projectId}/llistes/${list.id}`}
          />
          <SettingsMenu list={list} />
        </div>
      </div>

      {list.event && (
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="flex items-center gap-2">
            <CalendarFold />
            <Link
              href={`/projectes/${list.projectId}/calendari/${list.event.id}`}
            >
              {list.event.name}
            </Link>
          </h2>
          <TimeRange
            startAt={list.event.startAt}
            endAt={list.event.endAt}
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
