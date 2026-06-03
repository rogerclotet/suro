import { api } from "backend/convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { getLastProjectId } from "@/lib/last-project";
import { Loading } from "@/ui";

export default function Index() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const projects = useQuery(
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
  const resume =
    storedProjectId && projects.some((p) => p._id === storedProjectId);
  return <Redirect href={resume ? `/${storedProjectId}/lists` : "/projects"} />;
}
