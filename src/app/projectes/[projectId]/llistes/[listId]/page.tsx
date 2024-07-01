import { checkAuth } from "@/lib/check-auth";
import { getList } from "@/server/lists";
import Link from "next/link";
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
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">{list.name}</h1>
        <SettingsMenu list={list} />
      </div>
      {list.description && (
        <p
          dangerouslySetInnerHTML={{
            __html: list.description.replaceAll("\n", "<br/>"),
          }}
          className="pb-6"
        />
      )}

      <CheckList list={list} />
    </div>
  );
}
