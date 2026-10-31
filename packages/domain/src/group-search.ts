/** A group as the switchers search it: its name and its members' names. */
export type SearchableGroup = {
  name: string;
  members: readonly { name?: string | null }[];
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Match every search word against the group name or any member's name. */
export function matchesGroupSearch(group: SearchableGroup, query: string) {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  const names = [
    group.name,
    ...group.members.map((member) => member.name ?? ""),
  ].map(normalize);
  return words.every((word) => names.some((name) => name.includes(word)));
}
