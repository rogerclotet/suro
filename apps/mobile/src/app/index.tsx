import { api } from "backend/convex/_generated/api";
import { Redirect } from "expo-router";
import { lastGroupId } from "@/lib/last-group";
import { useAuthGate, usePersistentQuery } from "@/lib/offline";
import { Loading } from "@/ui";

export default function Index() {
  const { isLoading, isAuthenticated } = useAuthGate();
  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Redirect href="/login" />;
  return <SignedInLanding />;
}

/**
 * Reopens the last group, with the Groups list one step back. Someone who uses
 * one group never has to pick it again.
 */
function SignedInLanding() {
  const lastGroup = lastGroupId();
  const groups = usePersistentQuery(
    api.projects.listMine,
    lastGroup ? {} : "skip",
  );
  if (!lastGroup) return <Redirect href="/groups" />;
  if (groups === undefined) return <Loading />;
  // The group layout forgets a group the user has left once the server confirms.
  if (!groups.some((group) => group._id === lastGroup)) {
    return <Redirect href="/groups" />;
  }
  return <Redirect href={`/${lastGroup}/home`} withAnchor />;
}
