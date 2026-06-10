import LoadingPage from "@/components/ui/loading-page";

// The list detail now loads reactively from Convex (ListsClientContainer), so
// the route-level fallback is a simple spinner.
export default function Loading() {
  return <LoadingPage />;
}
