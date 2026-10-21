/** A draw needs at least two participants, who would simply swap gifts. */
export const MIN_PARTICIPANTS = 2;

/**
 * Exclusions only make sense once more than three people take part: with three
 * or fewer, any exclusion leaves the draw with a single forced outcome or none.
 */
export const MIN_PARTICIPANTS_FOR_EXCLUSIONS = 4;

/** Random sampling attempts before falling back to a constructed matching. */
const SAMPLING_ATTEMPTS = 2_000;

export type PriceRange = { min: number; max: number };

export type ExclusionError =
  | "tooFew"
  | "tooMany"
  | "repeated"
  | "notParticipant"
  | "alreadyExists";

/** An exclusion may cover at most half the participants, as the old app did. */
export function maxExclusionSize(participantCount: number): number {
  return Math.floor(participantCount / 2);
}

export function sameExclusion(
  a: readonly string[],
  b: readonly string[],
): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

/** Validate a new exclusion group against the participants and existing groups. */
export function exclusionError(
  exclusion: readonly string[],
  participants: readonly string[],
  existing: readonly (readonly string[])[],
): ExclusionError | null {
  if (exclusion.length < 2) return "tooFew";
  if (new Set(exclusion).size !== exclusion.length) return "repeated";
  if (exclusion.some((id) => !participants.includes(id))) {
    return "notParticipant";
  }
  if (exclusion.length > maxExclusionSize(participants.length)) {
    return "tooMany";
  }
  if (existing.some((group) => sameExclusion(group, exclusion))) {
    return "alreadyExists";
  }
  return null;
}

export function priceRangeIsValid({ min, max }: PriceRange): boolean {
  return (
    Number.isInteger(min) && Number.isInteger(max) && min >= 0 && min <= max
  );
}

/** A zero maximum means the organizer chose not to suggest a budget. */
export function hasPriceRange({ max }: PriceRange): boolean {
  return max > 0;
}

export type GiftUrl =
  | { valid: true; url: string | undefined }
  | { valid: false };

// A host with at least one dot, then an optional path, query or fragment.
const WEB_URL = /^https?:\/\/[^\s/?#@]+\.[^\s/?#@]+(?:[/?#]\S*)?$/i;

/**
 * Accept blank links, http(s) links and bare hosts (given `https://`). Other
 * schemes are rejected because the link is rendered for another participant to
 * open. A regex is used because React Native's `URL` lacks property getters.
 */
export function parseGiftUrl(raw: string): GiftUrl {
  const trimmed = raw.trim();
  if (trimmed === "") return { valid: true, url: undefined };
  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed);
  const url = hasScheme ? trimmed : `https://${trimmed}`;
  return WEB_URL.test(url) ? { valid: true, url } : { valid: false };
}

/** Nobody gives to themselves or to anyone sharing an exclusion group. */
export function canGiveTo(
  giver: string,
  receiver: string,
  exclusions: readonly (readonly string[])[],
): boolean {
  if (giver === receiver) return false;
  return !exclusions.some(
    (group) => group.includes(giver) && group.includes(receiver),
  );
}

/** Drop exclusion members who no longer take part, and groups left too small. */
export function pruneExclusions<T extends string>(
  exclusions: readonly (readonly T[])[],
  participants: readonly T[],
): T[][] {
  return exclusions
    .map((group) => group.filter((id) => participants.includes(id)))
    .filter((group) => group.length >= 2);
}

/** Whether any assignment satisfies every exclusion. */
export function hasValidDraw(
  participants: readonly string[],
  exclusions: readonly (readonly string[])[],
): boolean {
  return (
    participants.length >= MIN_PARTICIPANTS &&
    findMatching(participants, exclusions, (ids) => ids) !== null
  );
}

/**
 * Assign every participant a receiver, so that each participant also receives
 * exactly one gift. Returns `null` when the exclusions make that impossible.
 *
 * Random permutations are sampled first because accepting the first valid one
 * picks uniformly among all valid draws. Dense exclusions can make valid
 * permutations rare, so after the sampling budget a randomized bipartite
 * matching still finds a draw whenever one exists.
 */
export function drawAssignments<T extends string>(
  participants: readonly T[],
  exclusions: readonly (readonly string[])[],
  random: () => number = Math.random,
): Map<T, T> | null {
  if (participants.length < MIN_PARTICIPANTS) return null;
  if (!hasValidDraw(participants, exclusions)) return null;

  for (let attempt = 0; attempt < SAMPLING_ATTEMPTS; attempt++) {
    const receivers = shuffle(participants, random);
    if (
      participants.every((giver, index) =>
        canGiveTo(giver, receivers[index] as T, exclusions),
      )
    ) {
      return new Map(
        participants.map((giver, index) => [giver, receivers[index] as T]),
      );
    }
  }
  return findMatching(participants, exclusions, (ids) => shuffle(ids, random));
}

/** Kuhn's augmenting-path matching from givers to receivers. */
function findMatching<T extends string>(
  participants: readonly T[],
  exclusions: readonly (readonly string[])[],
  order: (ids: readonly T[]) => readonly T[],
): Map<T, T> | null {
  const giverOf = new Map<T, T>();

  function augment(giver: T, visited: Set<T>): boolean {
    for (const receiver of order(participants)) {
      if (visited.has(receiver) || !canGiveTo(giver, receiver, exclusions)) {
        continue;
      }
      visited.add(receiver);
      const current = giverOf.get(receiver);
      if (current === undefined || augment(current, visited)) {
        giverOf.set(receiver, giver);
        return true;
      }
    }
    return false;
  }

  for (const giver of order(participants)) {
    if (!augment(giver, new Set())) return null;
  }
  return new Map([...giverOf].map(([receiver, giver]) => [giver, receiver]));
}

function shuffle<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}
