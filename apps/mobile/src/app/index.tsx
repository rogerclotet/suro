import { useConvexAuth } from "convex/react";
import { Redirect } from "expo-router";
import { Loading } from "@/ui";

export default function Index() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return <Loading />;
  }

  return <Redirect href={isAuthenticated ? "/projects" : "/login"} />;
}
