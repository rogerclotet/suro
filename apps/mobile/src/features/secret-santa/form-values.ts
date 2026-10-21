import {
  DAY_MS,
  dateOnlyTimestamp,
  eventLocalStart,
  startOfDay,
} from "domain/events";
import {
  MIN_PARTICIPANTS,
  type PriceRange,
  priceRangeIsValid,
} from "domain/secret-santa";

/**
 * Relative-import-only on purpose: Vitest here has no "@/" alias, and this
 * module holds the form rules the tests exercise.
 */

export type Time = { hour: number; minute: number };

export type SecretSantaDraft = {
  name: string;
  description: string;
  /** Local calendar day of the exchange. */
  day: Date;
  allDay: boolean;
  /** Local time, ignored for an all-day exchange. */
  time: Time;
  /** Whole euros as typed; blank means zero. */
  budgetMin: string;
  budgetMax: string;
  participantIds: string[];
};

export type DraftError = "name" | "date" | "budget" | "participants";

const DEFAULT_TIME: Time = { hour: 19, minute: 0 };
const DEFAULT_LEAD_DAYS = 14;
const DEFAULT_BUDGET_MAX = "30";

export function newDraft(
  name: string,
  participantIds: string[],
  now = new Date(),
): SecretSantaDraft {
  return {
    name,
    description: "",
    day: startOfDay(new Date(now.getTime() + DEFAULT_LEAD_DAYS * DAY_MS)),
    allDay: true,
    time: DEFAULT_TIME,
    budgetMin: "",
    budgetMax: DEFAULT_BUDGET_MAX,
    participantIds,
  };
}

export function draftFrom(secretSanta: {
  name: string;
  description: string | null;
  exchangeAt: number;
  exchangeAllDay: boolean;
  priceRange: PriceRange;
  participants: { userId: string }[];
}): SecretSantaDraft {
  const start = eventLocalStart({
    startAt: secretSanta.exchangeAt,
    allDay: secretSanta.exchangeAllDay,
  });
  const amount = (value: number) => (value > 0 ? String(value) : "");
  return {
    name: secretSanta.name,
    description: secretSanta.description ?? "",
    day: startOfDay(start),
    allDay: secretSanta.exchangeAllDay,
    time: secretSanta.exchangeAllDay
      ? DEFAULT_TIME
      : { hour: start.getHours(), minute: start.getMinutes() },
    budgetMin: amount(secretSanta.priceRange.min),
    budgetMax: amount(secretSanta.priceRange.max),
    participantIds: secretSanta.participants.map((p) => p.userId),
  };
}

/** All-day exchanges use the events convention: UTC midnight of the day. */
export function exchangeFromDraft(
  draft: Pick<SecretSantaDraft, "day" | "allDay" | "time">,
) {
  if (draft.allDay) {
    return { exchangeAt: dateOnlyTimestamp(draft.day), exchangeAllDay: true };
  }
  const start = new Date(draft.day);
  start.setHours(draft.time.hour, draft.time.minute, 0, 0);
  return { exchangeAt: start.getTime(), exchangeAllDay: false };
}

function parseAmount(raw: string): number {
  const trimmed = raw.trim();
  return trimmed === "" ? 0 : Number(trimmed);
}

export function priceRangeFromDraft(
  draft: Pick<SecretSantaDraft, "budgetMin" | "budgetMax">,
): PriceRange {
  return {
    min: parseAmount(draft.budgetMin),
    max: parseAmount(draft.budgetMax),
  };
}

/** The first problem to fix before saving, or null. */
export function draftError(
  draft: SecretSantaDraft,
  { requireUpcoming }: { requireUpcoming: boolean },
  now = new Date(),
): DraftError | null {
  if (draft.name.trim() === "") return "name";
  if (requireUpcoming) {
    const upcoming = draft.allDay
      ? draft.day.getTime() >= startOfDay(now).getTime()
      : exchangeFromDraft(draft).exchangeAt > now.getTime();
    if (!upcoming) return "date";
  }
  if (!priceRangeIsValid(priceRangeFromDraft(draft))) return "budget";
  if (draft.participantIds.length < MIN_PARTICIPANTS) return "participants";
  return null;
}
