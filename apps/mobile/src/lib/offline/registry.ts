import { api } from "backend/convex/_generated/api";
import type { FunctionReference } from "convex/server";

/**
 * Maps a serialized function name (as stored in an outbox entry) back to its
 * live Convex mutation reference, so the flusher can replay a persisted entry.
 * Only the lists + expenses mutations we queue offline are listed.
 */
export const MUTATION_REGISTRY: Record<
  string,
  FunctionReference<"mutation">
> = {
  "lists:create": api.lists.create,
  "lists:update": api.lists.update,
  "lists:toggleFavorite": api.lists.toggleFavorite,
  "lists:clearCompleted": api.lists.clearCompleted,
  "lists:remove": api.lists.remove,
  "lists:importTemplates": api.lists.importTemplates,
  "listItems:create": api.listItems.create,
  "listItems:update": api.listItems.update,
  "listItems:remove": api.listItems.remove,
  "expenses:createPot": api.expenses.createPot,
  "expenses:createSpending": api.expenses.createSpending,
  "expenses:settlePayments": api.expenses.settlePayments,
  "expenses:deletePot": api.expenses.deletePot,
};
