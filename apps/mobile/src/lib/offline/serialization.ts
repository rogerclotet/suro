import {
  convexToJson,
  type JSONValue,
  jsonToConvex,
  type Value,
} from "convex/values";

/**
 * Serialize/deserialize Convex query results for disk storage.
 *
 * We go through `convexToJson`/`jsonToConvex` rather than raw `JSON.stringify`
 * so that any future `v.int64` (bigint) or `v.bytes` (ArrayBuffer) field round
 * trips correctly — plain JSON can't represent those. The current schema uses
 * neither, but this keeps the cache layer correct if that ever changes.
 *
 * `convexToJson` drops `undefined`-valued fields (reading them back as absent ==
 * undefined) and preserves `null`, which is exactly what we want.
 */
export function serialize(value: Value): string {
  return JSON.stringify(convexToJson(value));
}

export function deserialize(raw: string): Value {
  return jsonToConvex(JSON.parse(raw) as JSONValue);
}
