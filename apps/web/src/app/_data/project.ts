import type { api } from "backend/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

type ConvexProjectDetailed = FunctionReturnType<
  typeof api.projects.listMineDetailed
>[number];

/** A project member, shaped like the old Drizzle `projectToUsers` join row. */
export type ProjectMember = {
  user: {
    id: string;
    name: string | null;
    image: string | null;
    customImage: string | null;
    avatarColor: string | null;
  };
};

export type ProjectCategory = { id: string; name: string; projectId: string };

/**
 * Project shape consumed across the app. Backed by Convex (`listMineDetailed`)
 * via `adaptProject`, but kept field-compatible with the former Drizzle shape so
 * components don't change. `id`/`createdBy`/member ids are Convex ids.
 */
export type Project = {
  id: string;
  name: string;
  createdBy: string;
  inviteToken: string;
  image: string | null;
  color: string;
  features: { secretSanta: boolean };
  users: ProjectMember[];
  categories: ProjectCategory[];
  secretSantas: { assignmentsDone: boolean; datetime: Date }[];
};

/** Map a Convex `listMineDetailed` row to the app's `Project` shape. */
export function adaptProject(p: ConvexProjectDetailed): Project {
  return {
    id: p._id,
    name: p.name,
    createdBy: p.createdBy,
    inviteToken: p.inviteToken,
    image: p.image ?? null,
    color: p.color,
    // Secret Santa is disabled during the Convex cutover.
    features: { secretSanta: false },
    users: p.members.map((m) => ({
      user: {
        id: m._id,
        name: m.name,
        image: m.image,
        customImage: m.image,
        avatarColor: m.avatarColor,
      },
    })),
    categories: p.categories.map((c) => ({
      id: c._id,
      name: c.name,
      projectId: c.projectId,
    })),
    secretSantas: [],
  };
}
