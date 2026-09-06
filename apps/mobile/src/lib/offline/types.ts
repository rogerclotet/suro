import type { Operation } from "./operations";

export const TEMP_ID_PREFIX = "temp-";
export type TempId = `temp-${string}`;
export type OutboxStatus = "pending" | "failed";
export type OutboxEntry = Operation & {
  id: string;
  tempIds: string[];
  dependsOn: string[];
  createdAt: number;
  attempts: number;
} & ({ status: "pending" } | { status: "failed"; lastError: string });
export type IdMap = Record<string, string>;
export function isTempId(value: unknown): value is TempId {
  return typeof value === "string" && value.startsWith(TEMP_ID_PREFIX);
}
