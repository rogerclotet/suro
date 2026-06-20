import type { Doc, Id } from "backend/convex/_generated/dataModel";
import type { IdMap, OutboxEntry } from "./types";

/**
 * Pure overlay helpers: apply pending outbox mutations on top of a cached query
 * result so a relaunched-while-offline app shows writes that haven't synced yet.
 * Only array-level transforms live here (items, spendings) — the higher-level
 * assembly (list field patches, balance recompute) is done in the hooks, typed
 * against the real query return shapes. Pure + Doc-typed → unit-testable.
 */

export type SpendingRow = Doc<"spendings"> & {
  fromName: string | null;
  toName: string | null;
};

type Args = Record<string, unknown>;

function str(args: Args, key: string): string {
  const value = args[key];
  return typeof value === "string" ? value : "";
}

function optStr(args: Args, key: string): string | undefined {
  const value = args[key];
  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : undefined;
}

function num(args: Args, key: string): number {
  const value = args[key];
  return typeof value === "number" ? value : 0;
}

const resolver = (idmap: IdMap) => (id: string) => idmap[id] ?? id;

/**
 * Apply pending list-item mutations to one list's items. Updates and removes
 * scope themselves implicitly: they only match ids already present in `items`
 * (this list's base rows plus rows added by create entries for this list).
 */
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
    const args = entry.args;
    switch (entry.functionName) {
      case "listItems:create": {
        if (resolve(str(args, "listId")) !== listId) {
          break;
        }
        const tempId = entry.tempIds[0];
        if (tempId === undefined) {
          break;
        }
        const realId = idmap[tempId];
        if (realId !== undefined && items.some((it) => it._id === realId)) {
          break; // already synced; the real row is in `base`
        }
        if (items.some((it) => it._id === tempId)) {
          break;
        }
        items.push({
          _id: tempId as Id<"listItems">,
          _creationTime: entry.createdAt,
          name: str(args, "name"),
          completed: false,
          listId: resolve(str(args, "listId")) as Id<"lists">,
          category: optStr(args, "category"),
          details: optStr(args, "details"),
          createdBy: ctx.createdBy,
          updatedAt: entry.createdAt,
        });
        break;
      }
      case "listItems:update": {
        const target = resolve(str(args, "itemId"));
        items = items.map((it) =>
          it._id === target
            ? {
                ...it,
                name: str(args, "name"),
                details: optStr(args, "details"),
                completed: args.completed === true,
                category: optStr(args, "category"),
                updatedAt: entry.createdAt,
              }
            : it,
        );
        break;
      }
      case "listItems:remove": {
        const target = resolve(str(args, "itemId"));
        items = items.filter((it) => it._id !== target);
        break;
      }
      case "lists:clearCompleted": {
        if (resolve(str(args, "listId")) === listId) {
          items = items.filter((it) => !it.completed);
        }
        break;
      }
      default:
        break;
    }
  }
  return items;
}

function parsePayments(
  value: unknown,
): { from: Id<"users">; to: Id<"users">; amount: number }[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: { from: Id<"users">; to: Id<"users">; amount: number }[] = [];
  for (const raw of value) {
    if (raw === null || typeof raw !== "object") {
      continue;
    }
    const p = raw as Record<string, unknown>;
    if (
      typeof p.from === "string" &&
      typeof p.to === "string" &&
      typeof p.amount === "number"
    ) {
      out.push({
        from: p.from as Id<"users">,
        to: p.to as Id<"users">,
        amount: p.amount,
      });
    }
  }
  return out;
}

/**
 * Prepend pending spendings (and settle-up rows) for one pot to its cached,
 * newest-first spendings list. The caller recomputes balances from the result.
 */
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
    const args = entry.args;
    if (entry.functionName === "expenses:createSpending") {
      if (resolve(str(args, "potId")) !== potId) {
        continue;
      }
      const tempId = entry.tempIds[0];
      if (tempId === undefined) {
        continue;
      }
      const realId = idmap[tempId];
      if (realId !== undefined && base.some((row) => row._id === realId)) {
        continue; // already synced
      }
      const from = str(args, "from") as Id<"users">;
      const toRaw = args.to;
      const to = typeof toRaw === "string" ? (toRaw as Id<"users">) : undefined;
      pending.push({
        _id: tempId as Id<"spendings">,
        _creationTime: entry.createdAt,
        amount: num(args, "amount"),
        currency: "EUR",
        description: optStr(args, "description"),
        from,
        to,
        projectId: ctx.projectId,
        potId: potId as Id<"pots">,
        createdBy: ctx.createdBy,
        createdAt: entry.createdAt,
        fromName: ctx.nameById.get(from) ?? null,
        toName: to ? (ctx.nameById.get(to) ?? null) : null,
      });
    } else if (entry.functionName === "expenses:settlePayments") {
      if (resolve(str(args, "potId")) !== potId) {
        continue;
      }
      parsePayments(args.payments).forEach((p, index) => {
        pending.push({
          _id: `${entry.id}-settle-${index}` as Id<"spendings">,
          _creationTime: entry.createdAt,
          amount: p.amount,
          currency: "EUR",
          description: "Settle up",
          from: p.from,
          to: p.to,
          projectId: ctx.projectId,
          potId: potId as Id<"pots">,
          createdBy: ctx.createdBy,
          createdAt: entry.createdAt,
          fromName: ctx.nameById.get(p.from) ?? null,
          toName: ctx.nameById.get(p.to) ?? null,
        });
      });
    }
  }
  pending.sort((a, b) => b._creationTime - a._creationTime);
  return [...pending, ...base];
}

/** True if any pending entry settles this pot (offline settle → settledAt set). */
export function hasPendingSettle(
  potId: string,
  entries: OutboxEntry[],
  idmap: IdMap,
): boolean {
  const resolve = resolver(idmap);
  return entries.some(
    (entry) =>
      entry.functionName === "expenses:settlePayments" &&
      resolve(str(entry.args, "potId")) === potId,
  );
}

/** True if a pending spending targets this pot (reopens a settled pot offline). */
export function hasPendingSpending(
  potId: string,
  entries: OutboxEntry[],
  idmap: IdMap,
): boolean {
  const resolve = resolver(idmap);
  return entries.some(
    (entry) =>
      entry.functionName === "expenses:createSpending" &&
      resolve(str(entry.args, "potId")) === potId,
  );
}
