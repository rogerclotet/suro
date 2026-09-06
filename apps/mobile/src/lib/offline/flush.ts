import { convex } from "@/lib/convex";
import { isOnlineNow } from "./network";
import { OPERATIONS } from "./operations";
import { outbox } from "./outbox-store";
import { createFlusher } from "./replay";

let confirmedUserId: string | null = null;
export function setFlushingUserId(userId: string | null) {
  confirmedUserId = userId;
}
export const flush = createFlusher({
  queue: outbox,
  isOnline: isOnlineNow,
  currentUserId: () => confirmedUserId,
  send: (operation) =>
    convex.mutation(
      OPERATIONS[operation.functionName].reference,
      operation.args,
    ),
});
