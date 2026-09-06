import type { Doc, Id } from "backend/convex/_generated/dataModel";
import { advanceDueAt, completionPatch } from "domain/tasks";
import type { IdMap, OutboxEntry } from "./types";

export type SpendingRow = Doc<"spendings"> & {
  fromName: string | null;
  toName: string | null;
};
const resolver = (idmap: IdMap) => (id: string) => idmap[id] ?? id;

/** Inputs have already been parsed at the outbox boundary. */
export function overlayItems(
  base: Doc<"listItems">[],
  listId: string,
  entries: OutboxEntry[],
  idmap: IdMap,
  ctx: { createdBy: Id<"users"> },
): Doc<"listItems">[] {
  const resolve = resolver(idmap);
  let items = [...base];
  for (const entry of entries) {
    const { functionName, args } = entry;
    switch (functionName) {
      case "listItems:create": {
        if (resolve(args.listId) !== listId) break;
        const tempId = entry.tempIds[0];
        if (
          !tempId ||
          items.some((item) => item._id === (idmap[tempId] ?? tempId))
        )
          break;
        items.push({
          ...args,
          _id: tempId as Id<"listItems">,
          _creationTime: entry.createdAt,
          listId: resolve(args.listId) as Id<"lists">,
          completed: false,
          category: args.category?.trim() || undefined,
          details: args.details?.trim() || undefined,
          createdBy: ctx.createdBy,
          updatedAt: entry.createdAt,
        });
        break;
      }
      case "listItems:update": {
        const { itemId, ...fields } = args;
        items = items.map((item) => {
          if (item._id !== resolve(itemId)) return item;
          const rescheduled =
            fields.recurrence && fields.completed && !item.completed;
          return {
            ...item,
            ...fields,
            category: fields.category?.trim() || undefined,
            details: fields.details?.trim() || undefined,
            dueAllDay: fields.dueAllDay,
            assigneeId: fields.assigneeId,
            priority: fields.priority,
            recurrence: fields.recurrence,
            dueAt:
              rescheduled && fields.recurrence
                ? advanceDueAt(
                    fields.dueAt ?? entry.createdAt,
                    fields.recurrence,
                    entry.createdAt,
                  )
                : fields.dueAt,
            completed: rescheduled ? false : fields.completed,
            updatedAt: entry.createdAt,
          };
        });
        break;
      }
      case "listItems:setCompleted":
        items = items.map((item) =>
          item._id === resolve(args.itemId)
            ? {
                ...item,
                ...completionPatch(item, { ...args, now: entry.createdAt }),
              }
            : item,
        );
        break;
      case "listItems:setCategory":
        items = items.map((item) =>
          item._id === resolve(args.itemId)
            ? { ...item, category: args.category?.trim() || undefined }
            : item,
        );
        break;
      case "listItems:remove":
        items = items.filter((item) => item._id !== resolve(args.itemId));
        break;
      case "lists:clearCompleted":
        if (resolve(args.listId) === listId)
          items = items.filter((item) => !item.completed);
        break;
      case "lists:create":
      case "lists:update":
      case "lists:toggleFavorite":
      case "lists:remove":
      case "lists:importTemplates":
      case "expenses:createPot":
      case "expenses:createSpending":
      case "expenses:settlePayments":
      case "expenses:deletePot":
        break;
      default: {
        const exhaustive: never = functionName;
        return exhaustive;
      }
    }
  }
  return items;
}

export function overlaySpendings(
  base: SpendingRow[],
  potId: string,
  entries: OutboxEntry[],
  idmap: IdMap,
  ctx: {
    projectId: Id<"projects">;
    createdBy: Id<"users">;
    nameById: Map<Id<"users">, string | null>;
  },
): SpendingRow[] {
  const resolve = resolver(idmap);
  const pending: SpendingRow[] = [];
  for (const entry of entries) {
    const { functionName, args } = entry;
    if (functionName === "expenses:createSpending") {
      if (resolve(args.potId) !== potId) continue;
      const tempId = entry.tempIds[0];
      if (!tempId || base.some((row) => row._id === (idmap[tempId] ?? tempId)))
        continue;
      pending.push({
        ...args,
        _id: tempId as Id<"spendings">,
        _creationTime: entry.createdAt,
        currency: "EUR",
        description: args.description?.trim() || undefined,
        projectId: ctx.projectId,
        potId: potId as Id<"pots">,
        createdBy: ctx.createdBy,
        createdAt: entry.createdAt,
        fromName: ctx.nameById.get(args.from) ?? null,
        toName: args.to ? (ctx.nameById.get(args.to) ?? null) : null,
      });
    } else if (
      functionName === "expenses:settlePayments" &&
      resolve(args.potId) === potId
    ) {
      for (const [index, payment] of args.payments.entries()) {
        pending.push({
          ...payment,
          _id: `${entry.id}-settle-${index}` as Id<"spendings">,
          _creationTime: entry.createdAt,
          currency: "EUR",
          description: "Settle up",
          projectId: ctx.projectId,
          potId: potId as Id<"pots">,
          createdBy: ctx.createdBy,
          createdAt: entry.createdAt,
          fromName: ctx.nameById.get(payment.from) ?? null,
          toName: ctx.nameById.get(payment.to) ?? null,
        });
      }
    }
  }
  pending.sort((a, b) => b._creationTime - a._creationTime);
  return [...pending, ...base];
}
