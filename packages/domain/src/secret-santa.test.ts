import { describe, expect, it } from "vitest";
import {
  canGiveTo,
  drawAssignments,
  drawProblem,
  exchangeHasPassed,
  exclusionError,
  giftLinkLabel,
  hasValidDraw,
  maxExclusionSize,
  parseGiftUrl,
  priceRangeIsValid,
  pruneExclusions,
} from "./secret-santa";

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    return state / 2_147_483_648;
  };
}

function expectValidDraw(
  draw: Map<string, string> | null,
  participants: string[],
  exclusions: string[][],
) {
  expect(draw).not.toBeNull();
  const assignments = draw as Map<string, string>;
  expect([...assignments.keys()].sort()).toEqual([...participants].sort());
  expect([...assignments.values()].sort()).toEqual([...participants].sort());
  for (const [giver, receiver] of assignments) {
    expect(canGiveTo(giver, receiver, exclusions)).toBe(true);
  }
}

describe("drawAssignments", () => {
  it("swaps the two participants of the smallest draw", () => {
    expect(drawAssignments(["a", "b"], [])).toEqual(
      new Map([
        ["a", "b"],
        ["b", "a"],
      ]),
    );
  });

  it("never assigns anyone to themselves or within an exclusion", () => {
    const participants = ["a", "b", "c", "d", "e", "f"];
    const exclusions = [
      ["a", "b"],
      ["c", "d", "e"],
    ];
    for (let seed = 1; seed <= 50; seed++) {
      expectValidDraw(
        drawAssignments(participants, exclusions, seeded(seed)),
        participants,
        exclusions,
      );
    }
  });

  it("finds the only valid draw when sampling keeps missing it", () => {
    const participants = ["a", "b", "c", "d"];
    // a and b must give to c and d, so c and d must give to a and b.
    const exclusions = [
      ["a", "b"],
      ["c", "d"],
    ];
    const alwaysFirst = () => 0;
    expectValidDraw(
      drawAssignments(participants, exclusions, alwaysFirst),
      participants,
      exclusions,
    );
  });

  it("returns null when the exclusions leave someone without a receiver", () => {
    const participants = ["a", "b", "c", "d"];
    const exclusions = [
      ["a", "b"],
      ["a", "c"],
      ["a", "d"],
    ];
    expect(hasValidDraw(participants, exclusions)).toBe(false);
    expect(drawAssignments(participants, exclusions)).toBeNull();
  });

  it("needs at least two participants", () => {
    expect(drawAssignments(["a"], [])).toBeNull();
    expect(hasValidDraw(["a"], [])).toBe(false);
  });
});

describe("drawProblem", () => {
  it("explains what keeps the organizer from drawing", () => {
    expect(drawProblem(["a"], [])).toBe("tooFewParticipants");
    expect(drawProblem(["a", "b", "c"], [["a", "b"]])).toBe("exclusions");
    expect(drawProblem(["a", "b", "c", "d"], [["a", "b"]])).toBeNull();
  });
});

describe("exclusionError", () => {
  const participants = ["a", "b", "c", "d", "e"];

  it("accepts a new group of participants within the size limit", () => {
    expect(exclusionError(["a", "b"], participants, [])).toBeNull();
  });

  it("rejects groups that are too small or too large", () => {
    expect(maxExclusionSize(participants.length)).toBe(2);
    expect(exclusionError(["a"], participants, [])).toBe("tooFew");
    expect(exclusionError(["a", "b", "c"], participants, [])).toBe("tooMany");
  });

  it("rejects repeated members, outsiders and duplicates in any order", () => {
    expect(exclusionError(["a", "a"], participants, [])).toBe("repeated");
    expect(exclusionError(["a", "z"], participants, [])).toBe("notParticipant");
    expect(exclusionError(["b", "a"], participants, [["a", "b"]])).toBe(
      "alreadyExists",
    );
  });
});

describe("pruneExclusions", () => {
  it("removes former participants and groups left with one member", () => {
    expect(
      pruneExclusions(
        [
          ["a", "b"],
          ["c", "d", "e"],
        ],
        ["a", "c", "d", "f"],
      ),
    ).toEqual([["c", "d"]]);
  });

  it("removes groups larger than half of the remaining participants", () => {
    const exclusions = [
      ["a", "b"],
      ["c", "d", "e"],
    ];
    // Six people allow a group of three; five allow only two.
    expect(pruneExclusions(exclusions, ["a", "b", "c", "d", "e"])).toEqual([
      ["a", "b"],
    ]);
    // Three people can't keep any exclusion and still have a valid draw.
    expect(hasValidDraw(["a", "b", "c"], [["a", "b"]])).toBe(false);
    expect(pruneExclusions(exclusions, ["a", "b", "c"])).toEqual([]);
  });
});

describe("priceRangeIsValid", () => {
  it("accepts whole, non-negative, ordered amounts", () => {
    expect(priceRangeIsValid({ min: 0, max: 0 })).toBe(true);
    expect(priceRangeIsValid({ min: 10, max: 30 })).toBe(true);
    expect(priceRangeIsValid({ min: 30, max: 10 })).toBe(false);
    expect(priceRangeIsValid({ min: -1, max: 10 })).toBe(false);
    expect(priceRangeIsValid({ min: 1.5, max: 10 })).toBe(false);
  });
});

describe("parseGiftUrl", () => {
  it("treats a blank link as no link", () => {
    expect(parseGiftUrl("  ")).toEqual({ valid: true, url: undefined });
  });

  it("keeps web links and adds https to bare hosts", () => {
    expect(parseGiftUrl(" https://shop.example/item?id=1 ")).toEqual({
      valid: true,
      url: "https://shop.example/item?id=1",
    });
    expect(parseGiftUrl("shop.example/item")).toEqual({
      valid: true,
      url: "https://shop.example/item",
    });
  });

  it("rejects other schemes and text that is not a link", () => {
    expect(parseGiftUrl("javascript:alert(1)")).toEqual({ valid: false });
    expect(parseGiftUrl("ftp://shop.example")).toEqual({ valid: false });
    expect(parseGiftUrl("a red scarf")).toEqual({ valid: false });
  });
});

describe("giftLinkLabel", () => {
  it("shortens a link to its host", () => {
    expect(giftLinkLabel("https://www.amazon.es/dp/B0?tag=x")).toBe(
      "amazon.es",
    );
    expect(giftLinkLabel("http://shop.example.com#top")).toBe(
      "shop.example.com",
    );
    expect(giftLinkLabel("https://example.com")).toBe("example.com");
  });
});

describe("exchangeHasPassed", () => {
  it("ends a timed exchange at its start and an all-day one with its day", () => {
    const evening = new Date(2026, 11, 24, 20).getTime();
    expect(
      exchangeHasPassed(
        { exchangeAt: evening, exchangeAllDay: false },
        evening - 1,
      ),
    ).toBe(false);
    expect(
      exchangeHasPassed(
        { exchangeAt: evening, exchangeAllDay: false },
        evening,
      ),
    ).toBe(true);
    const allDay = { exchangeAt: Date.UTC(2026, 11, 24), exchangeAllDay: true };
    expect(
      exchangeHasPassed(allDay, new Date(2026, 11, 24, 23).getTime()),
    ).toBe(false);
    expect(exchangeHasPassed(allDay, new Date(2026, 11, 25).getTime())).toBe(
      true,
    );
  });
});
