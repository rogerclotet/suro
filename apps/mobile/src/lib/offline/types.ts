/**
 * Shared types + constants for the offline write outbox. Pure (no react-native
 * imports) so the logic that consumes it stays unit-testable.
 */

/** Prefix for client-allocated placeholder ids, swapped for real ids on sync. */
export const TEMP_ID_PREFIX = "temp-";

/** Mutations that delete a row — used to collapse create→delete chains offline. */
export const DELETE_FUNCTIONS: ReadonlySet<string> = new Set([
  "lists:remove",
  "listItems:remove",
  "expenses:deletePot",
]);

export type OutboxStatus = "pending" | "failed";

/** A single queued mutation, persisted across app restarts. */
export type OutboxEntry = {
  /** Local id (counter + timestamp); identifies the entry in the queue. */
  id: string;
  /** Convex function name, e.g. "listItems:create" — key into the registry. */
  functionName: string;
  /** Mutation args; values may be temp ids that get remapped before flushing. */
  args: Record<string, unknown>;
  /** Temp ids this op creates (e.g. ["temp-pots-7"]); resolved to real ids. */
  tempIds: string[];
  /** Temp ids this op consumes in its args (child ops of an offline create). */
  dependsOn: string[];
  /** Creation time — flush order + the optimistic row's updatedAt. */
  createdAt: number;
  status: OutboxStatus;
  attempts: number;
  lastError?: string;
};

/** Accumulated temp-id → server-id mapping, persisted as creates resolve. */
export type IdMap = Record<string, string>;

export function isTempId(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(TEMP_ID_PREFIX);
}
