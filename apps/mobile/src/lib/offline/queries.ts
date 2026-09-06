import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { useMemo } from "react";
import { calculateBalances, generateProposals } from "./balances";
import { resolveOfflineId } from "./outbox-logic";
import { useIdmap, useOutboxEntries } from "./outbox-store";
import { overlayItems, overlaySpendings, type SpendingRow } from "./overlay";
import { type IdMap, isTempId, type OutboxEntry } from "./types";
import { usePersistentQuery } from "./use-persistent-query";

/**
 * Overlay-aware read hooks for the two write-enabled domains (lists, expenses).
 * Each reads the persisted query result, then applies pending outbox entries on
 * top so the UI reflects offline writes — including writes made before an app
 * kill — and reconciles automatically once the server value catches up.
 *
 * Once the outbox is drained, new writes use Convex optimistic updates directly.
 * Temporary route IDs resolve through the persisted acknowledgement map.
 */

type ListGet = NonNullable<FunctionReturnType<typeof api.lists.get>>;
type Overview = NonNullable<
  FunctionReturnType<typeof api.lists.overviewByProject>
>;
type ListWithItems = Overview["active"][number];
type PotsOverview = FunctionReturnType<typeof api.expenses.listPotsOverview>;
type PotDetail = NonNullable<FunctionReturnType<typeof api.expenses.getPot>>;
type PublicUser = PotDetail["members"][number];

type CurrentUser = { id: Id<"users">; name: string | null };

function useCurrentUser(): CurrentUser | null {
  const me = usePersistentQuery(api.users.me, {});
  if (!me) {
    return null;
  }
  return { id: me._id, name: me.name ?? null };
}

const resolver = (idmap: IdMap) => (id: string) => idmap[id] ?? id;

/** Build a list shell for a list that exists only as a pending offline create. */
function buildListBase(
  listId: Id<"lists">,
  create: Extract<OutboxEntry, { functionName: "lists:create" }>,
  user: CurrentUser,
): ListWithItems {
  const args = create.args;
  return {
    _id: listId,
    _creationTime: create.createdAt,
    name: typeof args.name === "string" ? args.name : "",
    description:
      typeof args.description === "string" ? args.description : undefined,
    projectId: String(args.projectId) as Id<"projects">,
    favorite: false,
    createdBy: user.id,
    updatedAt: create.createdAt,
    items: [],
    createdByName: user.name,
  };
}

function patchListFields(
  list: ListWithItems,
  listId: string,
  entries: OutboxEntry[],
  idmap: IdMap,
): ListWithItems {
  const resolve = resolver(idmap);
  let patched = list;
  for (const entry of entries) {
    const { functionName, args } = entry;
    if (
      functionName === "lists:update" &&
      resolve(String(args.listId)) === listId
    ) {
      patched = {
        ...patched,
        name: typeof args.name === "string" ? args.name : patched.name,
        description:
          typeof args.description === "string" ? args.description : undefined,
      };
    } else if (
      functionName === "lists:toggleFavorite" &&
      resolve(String(args.listId)) === listId
    ) {
      patched = { ...patched, favorite: !patched.favorite };
    }
  }
  return patched;
}

export function useOfflineListGet(
  routeListId: Id<"lists">,
): ListGet | null | undefined {
  const idmap = useIdmap();
  const listId = resolveOfflineId(routeListId, idmap);
  const base = usePersistentQuery(
    api.lists.get,
    isTempId(listId) ? "skip" : { listId },
  );
  const entries = useOutboxEntries();
  const user = useCurrentUser();
  return useMemo(() => {
    let listBase: ListWithItems | null = base ?? null;
    if (base === undefined) {
      const create = entries.find(
        (e) => e.functionName === "lists:create" && e.tempIds[0] === listId,
      );
      if (create?.functionName === "lists:create" && user) {
        listBase = buildListBase(listId, create, user);
      } else {
        return isTempId(listId) ? null : undefined;
      }
    }
    if (listBase === null) {
      return null;
    }
    const patched = patchListFields(listBase, listId, entries, idmap);
    const items = overlayItems(patched.items, listId, entries, idmap, {
      createdBy: patched.createdBy,
    });
    return { ...patched, items, event: base?.event ?? null };
  }, [base, entries, idmap, user, listId]);
}

export function useOfflineListsOverview(
  projectId: Id<"projects">,
  completedLimit: number,
): Overview | undefined {
  const base = usePersistentQuery(api.lists.overviewByProject, {
    projectId,
    completedLimit,
  });
  const entries = useOutboxEntries();
  const idmap = useIdmap();
  const user = useCurrentUser();
  return useMemo(() => {
    if (base === undefined) {
      return undefined;
    }
    const resolve = resolver(idmap);
    const overlayList = (list: ListWithItems): ListWithItems => {
      const patched = patchListFields(list, list._id, entries, idmap);
      return {
        ...patched,
        items: overlayItems(patched.items, list._id, entries, idmap, {
          createdBy: patched.createdBy,
        }),
      };
    };
    const removed = new Set(
      entries
        .filter((e) => e.functionName === "lists:remove")
        .map((e) => resolve(String(e.args.listId))),
    );
    const keep = (list: ListWithItems) => !removed.has(list._id);
    let active = base.active.map(overlayList).filter(keep);
    const completed = base.completed.map(overlayList).filter(keep);

    for (const entry of entries) {
      if (entry.functionName !== "lists:create" || !user) {
        continue;
      }
      const tempId = entry.tempIds[0];
      if (tempId === undefined || String(entry.args.projectId) !== projectId) {
        continue;
      }
      const realId = idmap[tempId];
      if (realId !== undefined && active.some((l) => l._id === realId)) {
        continue; // already synced and present in base
      }
      if (active.some((l) => l._id === tempId)) {
        continue;
      }
      const synth = overlayList(
        buildListBase(tempId as Id<"lists">, entry, user),
      );
      active = [synth, ...active];
    }
    return { ...base, active, completed };
  }, [base, entries, idmap, user, projectId]);
}

function toPublicUser(id: Id<"users">, members: PublicUser[]): PublicUser {
  const found = members.find((m) => m._id === id);
  return found ?? { _id: id, name: null, image: null, avatarColor: null };
}

export function useOfflineListPotsOverview(
  projectId: Id<"projects">,
  settledLimit: number,
): PotsOverview | undefined {
  const base = usePersistentQuery(api.expenses.listPotsOverview, {
    projectId,
    settledLimit,
  });
  const projectMembers = usePersistentQuery(api.projects.members, {
    projectId,
  });
  const entries = useOutboxEntries();
  const idmap = useIdmap();
  const user = useCurrentUser();
  return useMemo(() => {
    if (base === undefined) {
      return undefined;
    }
    const resolve = resolver(idmap);
    const removed = new Set(
      entries
        .filter((e) => e.functionName === "expenses:deletePot")
        .map((e) => resolve(String(e.args.potId))),
    );
    const settled = base.settled.filter((pot) => !removed.has(pot._id));
    let active = base.active.filter((pot) => !removed.has(pot._id));

    for (const entry of entries) {
      if (
        entry.functionName !== "expenses:createPot" ||
        !user ||
        projectMembers === undefined
      ) {
        continue;
      }
      const tempId = entry.tempIds[0];
      if (tempId === undefined || String(entry.args.projectId) !== projectId) {
        continue;
      }
      // New pots are always active; dedup against both groups so a just-synced
      // create isn't shown twice.
      const present = (id: string) =>
        active.some((p) => p._id === id) || settled.some((p) => p._id === id);
      const realId = idmap[tempId];
      if (realId !== undefined && present(realId)) {
        continue;
      }
      if (present(tempId)) {
        continue;
      }
      const memberIds = (
        Array.isArray(entry.args.memberIds) ? entry.args.memberIds : []
      ).map((id) => String(id) as Id<"users">);
      active = [
        {
          _id: tempId as Id<"pots">,
          _creationTime: entry.createdAt,
          name: typeof entry.args.name === "string" ? entry.args.name : "",
          projectId,
          createdBy: user.id,
          members: memberIds.map((id) => toPublicUser(id, projectMembers)),
          totalSpent: 0,
        },
        ...active,
      ];
    }
    return { active, settled, hasMoreSettled: base.hasMoreSettled };
  }, [base, projectMembers, entries, idmap, user, projectId]);
}

export function useOfflineGetPot(
  routePotId: Id<"pots">,
): PotDetail | null | undefined {
  const idmap = useIdmap();
  const potId = resolveOfflineId(routePotId, idmap);
  const base = usePersistentQuery(
    api.expenses.getPot,
    isTempId(potId) ? "skip" : { potId },
  );
  const entries = useOutboxEntries();
  const user = useCurrentUser();
  // Synthesize a pot that exists only as a pending offline create — needs the
  // project's members to resolve names; skipped (no fetch) for already-real pots.
  const create =
    base === undefined
      ? entries.find(
          (e) =>
            e.functionName === "expenses:createPot" && e.tempIds[0] === potId,
        )
      : undefined;
  const synthProjectId =
    create?.functionName === "expenses:createPot"
      ? create.args.projectId
      : null;
  const projectMembers = usePersistentQuery(
    api.projects.members,
    synthProjectId ? { projectId: synthProjectId as Id<"projects"> } : "skip",
  );
  return useMemo(() => {
    // A null base means the pot was deleted server-side; surface it so the
    // detail screen can navigate away rather than rendering stale chrome.
    if (base === null) {
      return null;
    }
    let potBase: PotDetail | undefined = base;
    if (base === undefined) {
      if (isTempId(potId) && !create) return null;
      if (
        create?.functionName !== "expenses:createPot" ||
        !user ||
        projectMembers === undefined
      ) {
        return undefined;
      }
      const memberIds = (
        Array.isArray(create.args.memberIds) ? create.args.memberIds : []
      ).map((id) => String(id) as Id<"users">);
      const members = memberIds.map((id) => toPublicUser(id, projectMembers));
      potBase = {
        _id: potId,
        _creationTime: create.createdAt,
        name: typeof create.args.name === "string" ? create.args.name : "",
        projectId: synthProjectId as Id<"projects">,
        createdBy: user.id,
        members,
        spendings: [],
        balances: members.map((m) => ({ user: m, amount: 0 })),
        settlements: [],
      };
    }
    if (potBase === undefined) {
      return undefined;
    }
    const memberIds = potBase.members
      .map((m) => m._id)
      .filter((id): id is Id<"users"> => id !== null);
    const nameById = new Map<Id<"users">, string | null>(
      potBase.members
        .filter((m): m is PublicUser & { _id: Id<"users"> } => m._id !== null)
        .map((m) => [m._id, m.name]),
    );
    const spendings: SpendingRow[] = overlaySpendings(
      potBase.spendings,
      potId,
      entries,
      idmap,
      {
        projectId: potBase.projectId,
        createdBy: user?.id ?? potBase.createdBy,
        nameById,
      },
    );
    const balanceMap = calculateBalances(
      memberIds,
      spendings.map((s) => ({ amount: s.amount, from: s.from, to: s.to })),
    );
    const balances = potBase.members
      .filter((m): m is PublicUser & { _id: Id<"users"> } => m._id !== null)
      .map((m) => ({ user: m, amount: balanceMap.get(m._id) ?? 0 }));
    const settlements = generateProposals(balanceMap).map((p) => ({
      ...p,
      fromName: nameById.get(p.from) ?? null,
      toName: nameById.get(p.to) ?? null,
    }));

    // Replay reopen/settle ordering so settledAt reflects pending ops.
    const resolve = resolver(idmap);
    let settledAt = potBase.settledAt;
    for (const entry of [...entries].sort(
      (a, b) => a.createdAt - b.createdAt,
    )) {
      if (
        (entry.functionName !== "expenses:createSpending" &&
          entry.functionName !== "expenses:settlePayments") ||
        resolve(entry.args.potId) !== potId
      ) {
        continue;
      }
      if (entry.functionName === "expenses:createSpending") {
        settledAt = undefined;
      } else if (entry.functionName === "expenses:settlePayments") {
        settledAt = entry.createdAt;
      }
    }
    return { ...potBase, spendings, balances, settlements, settledAt };
  }, [
    base,
    create,
    synthProjectId,
    projectMembers,
    entries,
    idmap,
    user,
    potId,
  ]);
}

type SoloExpenses = NonNullable<
  FunctionReturnType<typeof api.expenses.getSoloExpenses>
>;

export function useOfflineSoloExpenses(
  projectId: Id<"projects">,
): SoloExpenses | null | undefined {
  const base = usePersistentQuery(api.expenses.getSoloExpenses, { projectId });
  const entries = useOutboxEntries();
  const idmap = useIdmap();
  const user = useCurrentUser();
  return useMemo((): SoloExpenses | null | undefined => {
    if (base === null || base === undefined) {
      return base;
    }
    const resolve = resolver(idmap);
    let potId = base.potId;
    for (const entry of entries) {
      if (
        entry.functionName === "expenses:createPot" &&
        String(entry.args.projectId) === projectId
      ) {
        const memberIds = Array.isArray(entry.args.memberIds)
          ? entry.args.memberIds
          : [];
        if (memberIds.length === 1) {
          const tempId = entry.tempIds[0];
          if (tempId !== undefined) {
            potId = tempId as Id<"pots">;
          }
        }
      }
    }
    if (potId === null)
      return { potId: null, memberId: base.memberId, spendings: [] };
    const resolvedPotId = resolve(potId) as Id<"pots">;
    const spendings = overlaySpendings(
      base.spendings,
      resolvedPotId,
      entries,
      idmap,
      {
        projectId,
        createdBy: user?.id ?? base.memberId,
        nameById: new Map(),
      },
    );
    return {
      ...base,
      potId: resolvedPotId,
      spendings: spendings.map((spending) => ({
        ...spending,
        fromName: null,
        toName: null,
      })),
    };
  }, [base, entries, idmap, user, projectId]);
}
