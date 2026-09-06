import type { OperationName } from "./operations";
import { parseEntry } from "./persistence";

/** Fixtures enter through the same parser as persisted JSON. */
export function entry(over: {
  functionName: OperationName;
  args?: Record<string, unknown>;
  id?: string;
  tempIds?: string[];
  dependsOn?: string[];
  createdAt?: number;
  status?: "pending" | "failed";
  attempts?: number;
  lastError?: string;
}) {
  const defaults: Partial<Record<OperationName, Record<string, unknown>>> = {
    "lists:create": { projectId: "project-1" },
    "expenses:createPot": { projectId: "project-1", memberIds: ["u1", "u2"] },
  };
  return parseEntry({
    id: "entry",
    tempIds: [],
    dependsOn: [],
    createdAt: 0,
    status: "pending",
    attempts: 0,
    ...over,
    args: { ...defaults[over.functionName], ...over.args },
  });
}
