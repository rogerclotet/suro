import { api } from "backend/convex/_generated/api";
import type { Id, TableNames } from "backend/convex/_generated/dataModel";
import type { FunctionArgs, FunctionReference } from "convex/server";
import * as v from "valibot";

// IDs may refer to an offline row. The server validates real IDs after remapping.
const id = <T extends TableNames>(_: T) =>
  v.pipe(
    v.string(),
    v.nonEmpty(),
    v.transform((value) => value as Id<T>),
  );
const number = () => v.pipe(v.number(), v.finite());
const taskFields = {
  dueAt: v.optional(number()),
  dueAllDay: v.optional(v.boolean()),
  assigneeId: v.optional(id("users")),
  priority: v.optional(v.picklist(["low", "normal", "high"])),
  recurrence: v.optional(
    v.strictObject({
      freq: v.picklist(["daily", "weekly", "monthly", "yearly"]),
      interval: number(),
    }),
  ),
};
const itemFields = {
  name: v.string(),
  details: v.optional(v.string()),
  category: v.optional(v.nullable(v.string())),
  ...taskFields,
};

type Mutation = FunctionReference<"mutation">;
type Behavior =
  | { kind: "create"; table: "lists" | "listItems" | "pots" | "spendings" }
  | { kind: "update" }
  | { kind: "delete" };

function operation<const Name extends string, M extends Mutation>(
  name: Name,
  reference: M,
  schema: v.GenericSchema<unknown, FunctionArgs<M>>,
  behavior: Behavior,
) {
  return {
    name,
    reference,
    schema,
    ...behavior,
    parse(args: unknown) {
      return { functionName: name, args: v.parse(schema, args) };
    },
  };
}

/** The supported offline protocol. Argument outputs must match the generated API. */
export const OPERATIONS = {
  "lists:create": operation(
    "lists:create",
    api.lists.create,
    v.strictObject({
      projectId: id("projects"),
      name: v.string(),
      description: v.optional(v.string()),
      templateIds: v.optional(v.array(id("listTemplates"))),
      taskMode: v.optional(v.boolean()),
    }),
    { kind: "create", table: "lists" },
  ),
  "lists:update": operation(
    "lists:update",
    api.lists.update,
    v.strictObject({
      listId: id("lists"),
      name: v.string(),
      description: v.optional(v.string()),
      taskMode: v.optional(v.boolean()),
    }),
    { kind: "update" },
  ),
  "lists:toggleFavorite": operation(
    "lists:toggleFavorite",
    api.lists.toggleFavorite,
    v.strictObject({ listId: id("lists") }),
    { kind: "update" },
  ),
  "lists:clearCompleted": operation(
    "lists:clearCompleted",
    api.lists.clearCompleted,
    v.strictObject({ listId: id("lists") }),
    { kind: "update" },
  ),
  "lists:remove": operation(
    "lists:remove",
    api.lists.remove,
    v.strictObject({ listId: id("lists") }),
    { kind: "delete" },
  ),
  "lists:importTemplates": operation(
    "lists:importTemplates",
    api.lists.importTemplates,
    v.strictObject({
      listId: id("lists"),
      templateIds: v.array(id("listTemplates")),
    }),
    { kind: "update" },
  ),
  "listItems:create": operation(
    "listItems:create",
    api.listItems.create,
    v.strictObject({ listId: id("lists"), ...itemFields }),
    { kind: "create", table: "listItems" },
  ),
  // Keep the original replacement semantics for installed clients' queued edits.
  "listItems:update": operation(
    "listItems:update",
    api.listItems.update,
    v.strictObject({
      itemId: id("listItems"),
      ...itemFields,
      completed: v.boolean(),
    }),
    { kind: "update" },
  ),
  "listItems:setCompleted": operation(
    "listItems:setCompleted",
    api.listItems.setCompleted,
    v.strictObject({
      itemId: id("listItems"),
      completed: v.boolean(),
      expectedDueAt: v.nullable(number()),
    }),
    { kind: "update" },
  ),
  "listItems:setCategory": operation(
    "listItems:setCategory",
    api.listItems.setCategory,
    v.strictObject({
      itemId: id("listItems"),
      category: v.nullable(v.string()),
    }),
    { kind: "update" },
  ),
  "listItems:remove": operation(
    "listItems:remove",
    api.listItems.remove,
    v.strictObject({ itemId: id("listItems") }),
    { kind: "delete" },
  ),
  "expenses:createPot": operation(
    "expenses:createPot",
    api.expenses.createPot,
    v.strictObject({
      projectId: id("projects"),
      name: v.string(),
      memberIds: v.array(id("users")),
    }),
    { kind: "create", table: "pots" },
  ),
  "expenses:createSpending": operation(
    "expenses:createSpending",
    api.expenses.createSpending,
    v.strictObject({
      potId: id("pots"),
      amount: number(),
      description: v.optional(v.string()),
      from: id("users"),
      to: v.optional(id("users")),
    }),
    { kind: "create", table: "spendings" },
  ),
  "expenses:settlePayments": operation(
    "expenses:settlePayments",
    api.expenses.settlePayments,
    v.strictObject({
      potId: id("pots"),
      payments: v.array(
        v.strictObject({
          from: id("users"),
          to: id("users"),
          amount: number(),
        }),
      ),
    }),
    { kind: "update" },
  ),
  "expenses:deletePot": operation(
    "expenses:deletePot",
    api.expenses.deletePot,
    v.strictObject({ potId: id("pots") }),
    { kind: "delete" },
  ),
};

export type OperationName = keyof typeof OPERATIONS;
export type Operation = ReturnType<(typeof OPERATIONS)[OperationName]["parse"]>;
export type OperationReference<K extends OperationName> =
  (typeof OPERATIONS)[K]["reference"];

export function isOperationName(name: string): name is OperationName {
  return Object.hasOwn(OPERATIONS, name);
}

/** Called at persistence/enqueue boundaries, never from domain reducers. */
export function parseOperation(functionName: string, args: unknown): Operation {
  if (!isOperationName(functionName))
    throw new Error("Unsupported saved operation");
  return OPERATIONS[functionName].parse(args);
}
