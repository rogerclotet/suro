import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mock only the non-DB seams. Everything below auth (Drizzle queries,
// cascades, the getProjectCategoryId guard, sorting) runs for real against the
// Testcontainers Postgres. ---
const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));

vi.mock("@/auth", () => ({ auth: authMock }));
// React's cache() needs a request scope; collapse it to identity for plain Node.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: <T>(fn: T) => fn };
});
vi.mock("@/lib/posthog-server", () => ({
  getPostHogServer: () => ({ capture: vi.fn(), captureException: vi.fn() }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/revalidate", () => ({ revalidateLocalizedPath: vi.fn() }));
vi.mock("@/server/notification-digests", () => ({
  enqueueListNotificationDigest: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/server/push", () => ({
  sendProjectNotification: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/server/notification-i18n", () => ({
  translateNotificationBody: vi.fn().mockResolvedValue("body"),
}));

import type { Category } from "@/app/_data/category";
import type { List } from "@/app/_data/list";
import type { Project } from "@/app/_data/project";
import { createList } from "@/app/[locale]/groups/[projectId]/lists/_components/create-list/actions";
import {
  createListItem,
  deleteListItem,
  updateListItem,
} from "@/app/[locale]/groups/[projectId]/lists/[listId]/_components/list-item/actions";
import {
  clearCompletedItems,
  deleteList,
  toggleFavorite,
  updateList,
} from "@/app/[locale]/groups/[projectId]/lists/[listId]/_components/settings/actions";
import { deleteCategory } from "@/app/[locale]/groups/[projectId]/lists/categories/_components/actions";
import { db } from "@/server/db";
import { listItems } from "@/server/db/schema";
import { getList, getLists } from "@/server/lists";
import {
  addMember,
  countItems,
  insertCategory,
  insertItem,
  insertList,
  insertProject,
  insertTemplate,
  insertUser,
  resetDb,
} from "../../test/integration/db";
import { normalizeList } from "../../test/integration/normalize";

function defined<T>(value: T | null | undefined): T {
  if (value == null) {
    throw new Error("expected a value but got null/undefined");
  }
  return value;
}

// The actions take whole entities but re-load the trusted copy by id, so a stub
// carrying only the id is the correct minimal input.
const asProject = (id: string) => ({ id }) as unknown as Project;
const asList = (id: string) => ({ id }) as unknown as List;
const asCategory = (id: string) => ({ id }) as unknown as Category;

const loginAs = (userId: string, name = "User") =>
  authMock.mockResolvedValue({ user: { id: userId, name } });

let alice: { id: string; name: string };
let bob: { id: string; name: string };
let family: string; // project alice belongs to
let other: string; // project bob belongs to
let groceries: string; // category in `family`
let foreign: string; // category in `other`

beforeEach(async () => {
  vi.clearAllMocks();
  await resetDb();
  alice = await insertUser("Alice");
  bob = await insertUser("Bob");
  family = await insertProject("Family", alice.id);
  other = await insertProject("Other", bob.id);
  await addMember(family, alice.id);
  await addMember(other, bob.id);
  groceries = await insertCategory(family, "Groceries");
  foreign = await insertCategory(other, "Foreign");
  loginAs(alice.id, "Alice");
});

describe("lists: create & read", () => {
  it("creates a list (trimming the name) and reads it back empty", async () => {
    const id = await createList(asProject(family), {
      name: "  Camping  ",
      description: "",
    });
    const list = defined(await getList(id));
    expect(normalizeList(list)).toEqual({
      name: "Camping",
      description: "",
      favorite: false,
      items: [],
    });
  });

  it("seeds items from templates, resolving category ids within the project and nulling cross-project ones", async () => {
    const tpl = await insertTemplate(family, alice.id, "Starter", [
      { name: "Milk", category: groceries },
      { name: "Eggs", category: null },
      { name: "Sunscreen", category: foreign }, // belongs to another project
    ]);

    const id = await createList(asProject(family), {
      name: "Trip",
      description: "",
      templates: [tpl],
    });

    expect(normalizeList(defined(await getList(id)))).toEqual({
      name: "Trip",
      description: "",
      favorite: false,
      // sorted: completed asc (all false), then name asc
      items: [
        { name: "Eggs", details: null, completed: false, category: null },
        {
          name: "Milk",
          details: null,
          completed: false,
          category: "Groceries",
        },
        {
          name: "Sunscreen",
          details: null,
          completed: false,
          category: null, // cross-project category dropped
        },
      ],
    });
  });

  it("sorts items uncompleted-first then by name", async () => {
    const list = await insertList(family, alice.id, "Sort");
    await insertItem(list, alice.id, "Banana", { completed: true });
    await insertItem(list, alice.id, "Apple");
    await insertItem(list, alice.id, "Cherry");
    await insertItem(list, alice.id, "Date", { completed: true });

    const result = defined(await getList(list));
    expect(result.items.map((i) => i.name)).toEqual([
      "Apple",
      "Cherry",
      "Banana",
      "Date",
    ]);
  });

  it("orders the overview by updatedAt desc", async () => {
    await insertList(family, alice.id, "Older", {
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    });
    await insertList(family, alice.id, "Newer", {
      updatedAt: new Date("2024-06-01T00:00:00Z"),
    });
    const lists = await getLists(family);
    expect(lists.map((l) => l.name)).toEqual(["Newer", "Older"]);
  });
});

describe("lists: authorization", () => {
  it("hides lists from non-members (opaque not-found)", async () => {
    const list = await insertList(family, alice.id, "Secret");
    loginAs(bob.id, "Bob");
    expect(await getList(list)).toBeUndefined();
    expect(await getLists(family)).toEqual([]);
  });
});

describe("list items", () => {
  it("creates an item with a project category, ignoring a cross-project one", async () => {
    const list = await insertList(family, alice.id, "L");
    await createListItem(asList(list), {
      name: "Apples",
      completed: false,
      categoryId: groceries,
    });
    await createListItem(asList(list), {
      name: "Towels",
      completed: false,
      categoryId: foreign,
    });

    const result = defined(await getList(list));
    const apples = defined(result.items.find((i) => i.name === "Apples"));
    const towels = defined(result.items.find((i) => i.name === "Towels"));
    expect(apples.category?.name).toBe("Groceries");
    expect(towels.category).toBeNull();
  });

  it("updates name/details/completed and resolves the category within the project", async () => {
    const list = await insertList(family, alice.id, "L");
    const item = await insertItem(list, alice.id, "Tent");
    await updateListItem(
      asList(list),
      item,
      "Big Tent",
      "2-person",
      true,
      groceries,
    );

    const result = defined(await getList(list));
    const updated = defined(result.items.find((i) => i.id === item));
    expect(updated.name).toBe("Big Tent");
    expect(updated.details).toBe("2-person");
    expect(updated.completed).toBe(true);
    expect(updated.category?.name).toBe("Groceries");
  });

  it("nulls a cross-project category on update", async () => {
    const list = await insertList(family, alice.id, "L");
    const item = await insertItem(list, alice.id, "Tent", {
      categoryId: groceries,
    });
    await updateListItem(asList(list), item, "Tent", "", false, foreign);
    const result = defined(await getList(list));
    expect(defined(result.items[0]).category).toBeNull();
  });

  it("rejects updating an item that doesn't belong to the list", async () => {
    const list = await insertList(family, alice.id, "L");
    await expect(
      updateListItem(asList(list), "does-not-exist", "x", "", false, null),
    ).rejects.toThrow("List item not found");
  });

  it("deletes only the targeted item", async () => {
    const list = await insertList(family, alice.id, "L");
    await insertItem(list, alice.id, "Keep");
    const remove = await insertItem(list, alice.id, "Remove");
    await deleteListItem(asList(list), remove);
    const result = defined(await getList(list));
    expect(result.items.map((i) => i.name)).toEqual(["Keep"]);
  });
});

describe("list settings", () => {
  it("updates name and description", async () => {
    const list = await insertList(family, alice.id, "Old");
    await updateList(asList(list), { name: "New Name", description: "desc" });
    const result = defined(await getList(list));
    expect(result.name).toBe("New Name");
    expect(result.description).toBe("desc");
  });

  it("toggles favorite back and forth", async () => {
    const list = await insertList(family, alice.id, "L", { favorite: false });
    await toggleFavorite(asList(list));
    expect(defined(await getList(list)).favorite).toBe(true);
    await toggleFavorite(asList(list));
    expect(defined(await getList(list)).favorite).toBe(false);
  });

  it("clears only completed items", async () => {
    const list = await insertList(family, alice.id, "L");
    await insertItem(list, alice.id, "Done", { completed: true });
    await insertItem(list, alice.id, "Todo");
    await clearCompletedItems(asList(list));
    const result = defined(await getList(list));
    expect(result.items.map((i) => i.name)).toEqual(["Todo"]);
  });

  it("deletes a list and cascades its items", async () => {
    const list = await insertList(family, alice.id, "L");
    await insertItem(list, alice.id, "X");
    await deleteList(asList(list));
    expect(await getList(list)).toBeUndefined();
    const remaining = await db
      .select({ id: listItems.id })
      .from(listItems)
      .where(eq(listItems.listId, list));
    expect(remaining).toHaveLength(0);
  });
});

describe("categories", () => {
  it("orphans items when their category is deleted (items survive, category cleared)", async () => {
    const list = await insertList(family, alice.id, "L");
    await insertItem(list, alice.id, "Milk", { categoryId: groceries });
    await deleteCategory(asCategory(groceries));

    const result = defined(await getList(list));
    expect(await countItems(list)).toBe(1);
    expect(defined(result.items[0]).name).toBe("Milk");
    expect(defined(result.items[0]).category).toBeNull();
  });
});
