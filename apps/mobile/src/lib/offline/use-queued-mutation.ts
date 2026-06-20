import type { OptimisticUpdate } from "convex/browser";
import { useMutation } from "convex/react";
import { type FunctionReference, getFunctionName } from "convex/server";
import { useCallback } from "react";
import { flush } from "./flush";
import { isOnlineNow } from "./network";
import { outbox } from "./outbox-store";
import { isTempId } from "./types";

/**
 * Per-mutation outbox metadata: which table a create produces a temp id for, and
 * which arg holds the parent id (so a child op created offline records the temp
 * dependency and is remapped before it flushes).
 */
type QueueConfig = { createsTable?: string; parentArg?: string };

const QUEUE_CONFIG: Record<string, QueueConfig> = {
  "lists:create": { createsTable: "lists" },
  "lists:update": { parentArg: "listId" },
  "lists:toggleFavorite": { parentArg: "listId" },
  "lists:clearCompleted": { parentArg: "listId" },
  "lists:remove": { parentArg: "listId" },
  "lists:importTemplates": { parentArg: "listId" },
  "listItems:create": { createsTable: "listItems", parentArg: "listId" },
  "listItems:update": { parentArg: "itemId" },
  "listItems:remove": { parentArg: "itemId" },
  "expenses:createPot": { createsTable: "pots" },
  "expenses:createSpending": { createsTable: "spendings", parentArg: "potId" },
  "expenses:settlePayments": { parentArg: "potId" },
  "expenses:deletePot": { parentArg: "potId" },
};

let entrySeq = 0;
function nextEntryId(): string {
  entrySeq += 1;
  return `ob-${Date.now()}-${entrySeq}`;
}

/**
 * Like `useMutation`, but offline the call is persisted to the outbox (with a
 * temp id for creates) and replayed on reconnect instead of being lost. Online
 * it behaves exactly like `useMutation` — including the optimistic update — so
 * the online UX is unchanged. Creates resolve to a temp id offline (usable for
 * navigation); other mutations resolve to `null`.
 */
export function useQueuedMutation<M extends FunctionReference<"mutation">>(
  mutationRef: M,
  optimisticUpdate?: OptimisticUpdate<M["_args"]>,
): (args: M["_args"]) => Promise<M["_returnType"]> {
  const base = useMutation(mutationRef);
  const online = optimisticUpdate
    ? base.withOptimisticUpdate(optimisticUpdate)
    : base;
  return useCallback(
    async (args: M["_args"]): Promise<M["_returnType"]> => {
      if (isOnlineNow()) {
        return online(args);
      }
      const functionName = getFunctionName(mutationRef);
      const config = QUEUE_CONFIG[functionName] ?? {};
      const tempIds: string[] = [];
      if (config.createsTable !== undefined) {
        tempIds.push(outbox.allocTempId(config.createsTable));
      }
      const dependsOn: string[] = [];
      if (config.parentArg !== undefined) {
        const value = (args as Record<string, unknown>)[config.parentArg];
        if (isTempId(value)) {
          dependsOn.push(value);
        }
      }
      outbox.enqueue({
        id: nextEntryId(),
        functionName,
        args: args as Record<string, unknown>,
        tempIds,
        dependsOn,
        createdAt: Date.now(),
        status: "pending",
        attempts: 0,
      });
      void flush(); // no-op while offline; covers a just-reconnected race
      return (tempIds[0] ?? null) as M["_returnType"];
    },
    [online, mutationRef],
  );
}
