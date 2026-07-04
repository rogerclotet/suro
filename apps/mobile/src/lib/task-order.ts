import type { Doc } from "backend/convex/_generated/dataModel";
import type { Priority } from "@/lib/recurrence";

/**
 * Task-mode item ordering, copied 1:1 from the backend's `compareTaskItems`
 * (`packages/backend/convex/model/tasks.ts`) so the client sorts the same way
 * `api.tasks.myTasks` does — open items first, then by due date (no due date
 * last), then priority (high first), then name. The app can't import backend
 * `model/` code, so the pure comparator is duplicated here; `task-order.test.ts`
 * pins the contract.
 *
 * Generic over `T` so it accepts the optimistic list-item rows the detail screen
 * holds (a structural subset of the full Doc).
 */

/** High first so it sorts ahead of normal/low in a tie on due date. */
const PRIORITY_RANK: Record<Priority, number> = { high: 0, normal: 1, low: 2 };

type TaskOrderItem = Pick<
  Doc<"listItems">,
  "completed" | "dueAt" | "priority" | "name" | "_id"
>;

export function compareTaskItems<T extends TaskOrderItem>(a: T, b: T): number {
  if (a.completed !== b.completed) {
    return a.completed ? 1 : -1;
  }
  const aDue = a.dueAt ?? Number.POSITIVE_INFINITY;
  const bDue = b.dueAt ?? Number.POSITIVE_INFINITY;
  if (aDue !== bDue) {
    return aDue - bDue;
  }
  const aRank = PRIORITY_RANK[a.priority ?? "normal"];
  const bRank = PRIORITY_RANK[b.priority ?? "normal"];
  if (aRank !== bRank) {
    return aRank - bRank;
  }
  const byName = a.name.localeCompare(b.name);
  return byName !== 0 ? byName : a._id.localeCompare(b._id);
}
