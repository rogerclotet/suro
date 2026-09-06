import type { OptimisticUpdate } from "convex/browser";
import { useMutation } from "convex/react";
import type { FunctionArgs, FunctionReturnType } from "convex/server";
import { useCallback } from "react";
import { flush } from "./flush";
import { isOnlineNow } from "./network";
import {
  OPERATIONS,
  type OperationName,
  type OperationReference,
  parseOperation,
} from "./operations";
import { tempIdsIn } from "./outbox-logic";
import { outbox } from "./outbox-store";

export type MutationOutcome<T> =
  | { kind: "synced"; value: T }
  | { kind: "queued"; localId: string | null };

/** Only registered commands can be queued; a queued result is not a server acknowledgement. */
export function useQueuedMutation<K extends OperationName>(
  name: K,
  optimisticUpdate?: OptimisticUpdate<FunctionArgs<OperationReference<K>>>,
): (
  args: FunctionArgs<OperationReference<K>>,
) => Promise<MutationOutcome<FunctionReturnType<OperationReference<K>>>> {
  const operation = OPERATIONS[name];
  const base = useMutation(operation.reference);
  const online = optimisticUpdate
    ? base.withOptimisticUpdate(optimisticUpdate)
    : base;
  return useCallback(
    async (args: FunctionArgs<OperationReference<K>>) => {
      if (isOnlineNow() && !outbox.getEntries().length) {
        return { kind: "synced", value: await online(args) };
      }
      // Queue new changes behind existing ones even after reconnection.
      const parsed = parseOperation(name, args);
      const tempIds =
        operation.kind === "create"
          ? [outbox.allocTempId(operation.table)]
          : [];
      const createdAt = Date.now();
      const id = outbox.allocTempId("operation");
      outbox.enqueue({
        ...parsed,
        id,
        tempIds,
        dependsOn: [...new Set(tempIdsIn(args))],
        createdAt,
        status: "pending",
        attempts: 0,
      });
      void flush();
      return { kind: "queued", localId: tempIds[0] ?? null };
    },
    [online, name, operation],
  );
}
