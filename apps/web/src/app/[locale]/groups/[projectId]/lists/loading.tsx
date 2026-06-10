import LoadingPage from "@/components/ui/loading-page";

// The lists view now loads reactively from Convex (useProjectLists shows its own
// skeleton), so the route-level fallback is a simple spinner.
export default function Loading() {
  return <LoadingPage />;
}
