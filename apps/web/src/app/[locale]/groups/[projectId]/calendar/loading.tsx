import LoadingPage from "@/components/ui/loading-page";

// The calendar loads reactively from Convex (useEventsInRange), so the
// route-level fallback is a simple spinner.
export default function Loading() {
  return <LoadingPage />;
}
