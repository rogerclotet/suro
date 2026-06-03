/**
 * Backend-agnostic projections of the Lists domain. Postgres ids and timestamps
 * are dropped and categories are referenced by name, so the exact same expected
 * shapes can be asserted against the Convex implementation (`convex-test`) to
 * prove behavioral parity across the migration.
 */

export type NormalizedItem = {
  name: string;
  details: string | null;
  completed: boolean;
  category: string | null;
};

export type NormalizedList = {
  name: string;
  description: string | null;
  favorite: boolean;
  items: NormalizedItem[];
};

type ListLike = {
  name: string;
  description: string | null;
  favorite: boolean;
  items: {
    name: string;
    details: string | null;
    // `completed` is a nullable boolean column (defaults to false).
    completed: boolean | null;
    category: { name: string } | null;
  }[];
};

export function normalizeList(list: ListLike): NormalizedList {
  return {
    name: list.name,
    description: list.description ?? null,
    favorite: list.favorite,
    items: list.items.map((item) => ({
      name: item.name,
      details: item.details ?? null,
      completed: item.completed ?? false,
      category: item.category?.name ?? null,
    })),
  };
}
