import { api } from "backend/convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { getLastProjectId } from "@/lib/last-project";
import { usePersistentQuery } from "@/lib/offline";
import { Loading } from "@/ui";

export default function Index() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const projects = usePersistentQuery(
    api.projects.listMine,
    isAuthenticated ? {} : "skip",
  );
  const [storedProjectId, setStoredProjectId] = useState<
    string | null | undefined
  >(undefined);

  useEffect(() => {
    getLastProjectId()
      .then(setStoredProjectId)
      .catch(() => setStoredProjectId(null));
  }, []);

  if (isLoading) {
    return <Loading />;
  }
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }
  // Resume in the last-used group, but only once we've confirmed it still
  // exists and the user still belongs to it — otherwise fall back to the list.
  if (storedProjectId === undefined || projects === undefined) {
    return <Loading />;
  }
  // Resume the last group when it still exists; otherwise land in the first
  // group the user belongs to, falling back to group creation only if they have
  // none (the manage-groups list page is gone — the switcher owns that now).
  const resume =
    storedProjectId && projects.some((p) => p._id === storedProjectId);
  const target = resume
    ? `/${storedProjectId}/lists`
    : projects[0]
      ? `/${projects[0]._id}/lists`
      : "/create-group";
  return <Redirect href={target} />;
}
