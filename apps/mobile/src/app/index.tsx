import { Redirect } from "expo-router";
import { useAuthGate } from "@/lib/offline";
import { Loading } from "@/ui";

export default function Index() {
  const { isLoading, isAuthenticated } = useAuthGate();
  if (isLoading) return <Loading />;
  return <Redirect href={isAuthenticated ? "/groups" : "/login"} />;
}
