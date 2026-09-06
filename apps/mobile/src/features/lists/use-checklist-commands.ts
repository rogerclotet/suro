import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import type { OptimisticLocalStore } from "convex/browser";
import { useQueuedMutation } from "@/lib/offline";
import {
  OPERATIONS,
  type Operation,
  parseOperation,
} from "@/lib/offline/operations";
import { overlayItems } from "@/lib/offline/overlay";

let optimisticCounter = 0;

/** Online optimism and persisted replay apply the same typed item commands. */
function projectCommand(
  store: OptimisticLocalStore,
  listId: Id<"lists">,
  operation: Operation,
) {
  const current = store.getQuery(api.lists.get, { listId });
  if (!current) return;
  const id = `optimistic-item-${++optimisticCounter}`;
  const tempIds =
    OPERATIONS[operation.functionName].kind === "create" ? [id] : [];
  const items = overlayItems(
    current.items,
    listId,
    [
      {
        ...operation,
        id,
        tempIds,
        dependsOn: [],
        createdAt: Date.now(),
        status: "pending",
        attempts: 0,
      },
    ],
    {},
    { createdBy: current.createdBy },
  );
  store.setQuery(api.lists.get, { listId }, { ...current, items });
}

export function useChecklistCommands(listId: Id<"lists">) {
  const createItem = useQueuedMutation("listItems:create", (store, args) =>
    projectCommand(store, listId, parseOperation("listItems:create", args)),
  );
  const updateItem = useQueuedMutation("listItems:update", (store, args) =>
    projectCommand(store, listId, parseOperation("listItems:update", args)),
  );
  const setCompleted = useQueuedMutation(
    "listItems:setCompleted",
    (store, args) =>
      projectCommand(
        store,
        listId,
        parseOperation("listItems:setCompleted", args),
      ),
  );
  const setCategory = useQueuedMutation(
    "listItems:setCategory",
    (store, args) =>
      projectCommand(
        store,
        listId,
        parseOperation("listItems:setCategory", args),
      ),
  );
  const removeItem = useQueuedMutation("listItems:remove");
  return { createItem, updateItem, setCompleted, setCategory, removeItem };
}
