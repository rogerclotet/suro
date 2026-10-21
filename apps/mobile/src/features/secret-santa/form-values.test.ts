import { describe, expect, it } from "vitest";
import {
  draftError,
  draftFrom,
  exchangeFromDraft,
  newDraft,
  priceRangeFromDraft,
} from "./form-values";

const stored = {
  name: "Christmas",
  description: null,
  exchangeAt: Date.UTC(2026, 11, 24),
  exchangeAllDay: true,
  priceRange: { min: 0, max: 25 },
  participants: [{ userId: "u1" }, { userId: "u2" }],
};

describe("secret santa draft", () => {
  it("starts as an all-day exchange two weeks ahead with a suggested budget", () => {
    const draft = newDraft("Secret Santa", ["u1"], new Date(2026, 10, 1, 9));
    expect(draft.day).toEqual(new Date(2026, 10, 15));
    expect(draft.allDay).toBe(true);
    expect(priceRangeFromDraft(draft)).toEqual({ min: 0, max: 30 });
  });

  it("round-trips an all-day exchange through UTC midnight", () => {
    const draft = draftFrom(stored);
    expect(draft.day).toEqual(new Date(2026, 11, 24));
    expect(draft.budgetMin).toBe("");
    expect(exchangeFromDraft(draft)).toEqual({
      exchangeAt: Date.UTC(2026, 11, 24),
      exchangeAllDay: true,
    });
  });

  it("round-trips a timed exchange in local time", () => {
    const at = new Date(2026, 11, 20, 19, 30).getTime();
    const draft = draftFrom({
      ...stored,
      exchangeAt: at,
      exchangeAllDay: false,
    });
    expect(draft.time).toEqual({ hour: 19, minute: 30 });
    expect(exchangeFromDraft(draft).exchangeAt).toBe(at);
  });

  it("reports the first problem to fix", () => {
    const now = new Date(2026, 11, 25, 12);
    const draft = draftFrom(stored);
    expect(draftError(draft, { requireUpcoming: false }, now)).toBeNull();
    expect(draftError(draft, { requireUpcoming: true }, now)).toBe("date");
    expect(
      draftError({ ...draft, name: " " }, { requireUpcoming: false }, now),
    ).toBe("name");
    expect(
      draftError(
        { ...draft, budgetMin: "40" },
        { requireUpcoming: false },
        now,
      ),
    ).toBe("budget");
    expect(
      draftError(
        { ...draft, budgetMax: "2.5" },
        { requireUpcoming: false },
        now,
      ),
    ).toBe("budget");
    expect(
      draftError(
        { ...draft, participantIds: ["u1"] },
        { requireUpcoming: false },
        now,
      ),
    ).toBe("participants");
  });
});
