import LoadingPage from "@/components/ui/loading-page";

// The dashboard loads reactively from Convex (each widget shows its own
// skeleton/empty state), so the route-level fallback is a simple spinner.
export default function Loading() {
  return <LoadingPage />;
}
