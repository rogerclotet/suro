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
import { hasUnresolvedTemp, remapArgs, tempIdsIn } from "./outbox-logic";
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
      const resolvedArgs = remapArgs(args, outbox.getIdmap());
      if (
        isOnlineNow() &&
        !outbox.getEntries().length &&
        !hasUnresolvedTemp(resolvedArgs)
      ) {
        return { kind: "synced", value: await online(resolvedArgs) };
      }
      // Queue new changes behind existing ones even after reconnection.
      const parsed = parseOperation(name, resolvedArgs);
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
        dependsOn: [...new Set(tempIdsIn(resolvedArgs))],
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
