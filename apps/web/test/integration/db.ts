import { randomUUID } from "node:crypto";
import { db } from "@/server/db";
import {
  categories,
  listItems,
  lists,
  projects,
  projectToUsers,
  templates,
  users,
} from "@/server/db/schema";

function requireRow<T>(row: T | undefined): T {
  if (!row) {
    throw new Error("expected an inserted row to be returned");
  }
  return row;
}

/** Wipe every table the Lists slice touches, in FK-safe order. */
export async function resetDb() {
  await db.delete(listItems);
  await db.delete(lists);
  await db.delete(templates);
  await db.delete(categories);
  await db.delete(projectToUsers);
  await db.delete(projects);
  await db.delete(users);
}

export async function insertUser(name: string) {
  // f_user.id has no DB default (NextAuth's adapter supplies it), so we must.
  const id = randomUUID();
  await db.insert(users).values({ id, name, email: `${id}@example.test` });
  return { id, name };
}

export async function insertProject(name: string, createdBy: string) {
  const [row] = await db
    .insert(projects)
    .values({ name, createdBy })
    .returning({ id: projects.id });
  return requireRow(row).id;
}

export async function addMember(projectId: string, userId: string) {
  await db.insert(projectToUsers).values({ projectId, userId });
}

export async function insertCategory(projectId: string, name: string) {
  const [row] = await db
    .insert(categories)
    .values({ projectId, name })
    .returning({ id: categories.id });
  return requireRow(row).id;
}

export async function insertList(
  projectId: string,
  createdBy: string,
  name: string,
  opts: { favorite?: boolean; description?: string; updatedAt?: Date } = {},
) {
  const [row] = await db
    .insert(lists)
    .values({
      projectId,
      createdBy,
      name,
      favorite: opts.favorite ?? false,
      description: opts.description,
      updatedAt: opts.updatedAt,
    })
    .returning({ id: lists.id });
  return requireRow(row).id;
}

export async function insertItem(
  listId: string,
  createdBy: string,
  name: string,
  opts: {
    completed?: boolean;
    categoryId?: string | null;
    details?: string;
  } = {},
) {
  const [row] = await db
    .insert(listItems)
    .values({
      listId,
      createdBy,
      name,
      completed: opts.completed ?? false,
      categoryId: opts.categoryId ?? null,
      details: opts.details,
    })
    .returning({ id: listItems.id });
  return requireRow(row).id;
}

export async function insertTemplate(
  projectId: string,
  createdBy: string,
  name: string,
  items: { name: string; category: string | null }[],
) {
  const [row] = await db
    .insert(templates)
    .values({ projectId, createdBy, name, items })
    .returning({ id: templates.id });
  return requireRow(row).id;
}

export async function countItems(listId: string) {
  const rows = await db.query.listItems.findMany({
    columns: { id: true },
    where: (li, { eq }) => eq(li.listId, listId),
  });
  return rows.length;
}
