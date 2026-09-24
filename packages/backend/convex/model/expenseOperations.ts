import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

function requestHash(request: string): string {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(request)));
}

// Kept indefinitely: an offline device can retry long after the original write.
export async function findExpenseOperation(
  ctx: MutationCtx,
  userId: Id<"users">,
  operationId: string | undefined,
  request: string,
) {
  if (operationId === undefined) return null;
  if (operationId.length === 0 || operationId.length > 200) {
    throw new ConvexError({ code: "INVALID_OPERATION_ID" });
  }
  const receipt = await ctx.db
    .query("expenseOperations")
    .withIndex("by_user_operation", (q) =>
      q.eq("userId", userId).eq("operationId", operationId),
    )
    .unique();
  if (receipt && receipt.requestHash !== requestHash(request)) {
    throw new ConvexError({ code: "OPERATION_CONFLICT" });
  }
  return receipt;
}

export async function recordExpenseOperation(
  ctx: MutationCtx,
  userId: Id<"users">,
  operationId: string | undefined,
  request: string,
  result: Doc<"expenseOperations">["result"],
) {
  if (operationId !== undefined) {
    await ctx.db.insert("expenseOperations", {
      userId,
      operationId,
      requestHash: requestHash(request),
      result,
    });
  }
}
