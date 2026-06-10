import type { api } from "backend/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

type ConvexFile = FunctionReturnType<typeof api.files.listByProject>[number];

/**
 * File shape consumed by the files UI. Backed by Convex storage via `adaptFile`;
 * `url`/`thumbnailUrl` are short-lived Convex storage URLs.
 */
export type File = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl: string | null;
  projectId: string;
  eventId: string | null;
  uploadedBy: { id: string; name: string | null };
  event: { id: string; name: string; projectId: string } | null;
  createdAt: Date | null;
};

export function adaptFile(f: ConvexFile): File {
  return {
    id: f._id,
    name: f.name,
    type: f.type,
    size: f.size,
    url: f.url ?? "",
    thumbnailUrl: f.thumbnailUrl,
    projectId: f.projectId,
    eventId: f.eventId ?? null,
    uploadedBy: { id: f.uploadedBy, name: f.uploaderName },
    event: f.eventId
      ? { id: f.eventId, name: f.eventName ?? "", projectId: f.projectId }
      : null,
    createdAt: new Date(f._creationTime),
  };
}
