import * as v from "valibot";
import { parseOperation } from "./operations";
import type { IdMap, OutboxEntry } from "./types";

export const OUTBOX_VERSION = 1;
export type SavedOutbox = {
  version: typeof OUTBOX_VERSION;
  entries: OutboxEntry[];
  idmap: IdMap;
  userId: string | null;
  counter: number;
  quarantined: unknown[];
};
export function emptyOutbox(): SavedOutbox {
  return {
    version: OUTBOX_VERSION,
    entries: [],
    idmap: {},
    userId: null,
    counter: 0,
    quarantined: [],
  };
}
const count = v.pipe(v.number(), v.integer(), v.minValue(0));
const metadata = v.object({
  id: v.pipe(v.string(), v.nonEmpty()),
  functionName: v.string(),
  args: v.unknown(),
  tempIds: v.array(v.string()),
  dependsOn: v.array(v.string()),
  createdAt: v.pipe(v.number(), v.finite()),
  attempts: count,
  status: v.picklist(["pending", "failed"]),
  lastError: v.optional(v.string()),
});

export function parseEntry(raw: unknown): OutboxEntry {
  const data = v.parse(metadata, raw);
  const { functionName, args, lastError, status, ...common } = data;
  const operation = parseOperation(functionName, args);
  return status === "failed"
    ? {
        ...common,
        ...operation,
        status,
        lastError: lastError ?? "Previous sync failed",
      }
    : { ...common, ...operation, status };
}

const envelope = v.object({
  version: v.literal(OUTBOX_VERSION),
  entries: v.array(v.unknown()),
  idmap: v.record(v.string(), v.string()),
  userId: v.nullable(v.string()),
  counter: count,
  quarantined: v.optional(v.array(v.unknown()), []),
});

/** Invalid/future data is retained for recovery instead of silently discarded. */
export function decodeOutbox(raw: unknown): SavedOutbox {
  const parsed = v.safeParse(envelope, raw);
  if (!parsed.success) return { ...emptyOutbox(), quarantined: [raw] };
  const { entries: saved, ...state } = parsed.output;
  const entries: OutboxEntry[] = [];
  const quarantined = [...state.quarantined];
  for (const candidate of saved) {
    try {
      entries.push(parseEntry(candidate));
    } catch {
      quarantined.push(candidate);
    }
  }
  return { ...state, entries, quarantined };
}

export function readJson(raw: string | undefined): unknown {
  if (raw === undefined) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/** Migrate the original three MMKV slots without changing replacement commands. */
export function migrateLegacy(
  entries: unknown,
  idmap: unknown,
  meta: unknown,
): SavedOutbox {
  const owner = v.safeParse(
    v.object({ counter: count, userId: v.nullable(v.string()) }),
    meta,
  );
  if (!owner.success) {
    return {
      ...emptyOutbox(),
      quarantined: entries === undefined ? [] : [{ entries, idmap, meta }],
    };
  }
  return decodeOutbox({
    version: OUTBOX_VERSION,
    entries: entries ?? [],
    idmap: idmap ?? {},
    ...owner.output,
  });
}
