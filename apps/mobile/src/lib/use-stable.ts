import { useRef } from "react";

// Holds the last loaded result while a query re-runs with new args (Convex
// returns undefined during the swap), so paginating ("show more") grows a
// section in place instead of flashing the screen back to the spinner.
export function useStable<T>(value: T | undefined): T | undefined {
  const last = useRef<T | undefined>(undefined);
  if (value !== undefined) {
    last.current = value;
  }
  return last.current;
}
