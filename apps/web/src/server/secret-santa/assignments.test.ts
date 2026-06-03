import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SecretSanta } from "@/app/_data/secret-santa";
import { generateAssignments } from "./assignments";
import { pickRandom } from "./pick-random";

vi.mock("./pick-random", () => ({
  pickRandom: vi.fn(),
}));

const pickRandomMock = vi.mocked(pickRandom);

describe("generateAssignments", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should assign secret santa without exclusions", () => {
    const secretSanta = {
      participants: [{ id: "1" }, { id: "2" }, { id: "3" }],
      exclusions: [],
    } as unknown as SecretSanta;

    pickRandomMock
      .mockReturnValueOnce("2")
      .mockReturnValueOnce("3")
      .mockReturnValueOnce("1");

    const assignments = generateAssignments(secretSanta);

    expect(assignments).toEqual([
      {
        participant: "1",
        assignedTo: "2",
      },
      {
        participant: "2",
        assignedTo: "3",
      },
      {
        participant: "3",
        assignedTo: "1",
      },
    ]);

    expect(pickRandomMock).toHaveBeenCalledTimes(3);
    expect(pickRandomMock).toHaveBeenNthCalledWith(1, ["2", "3"]);
    expect(pickRandomMock).toHaveBeenNthCalledWith(2, ["1", "3"]);
    expect(pickRandomMock).toHaveBeenNthCalledWith(3, ["1"]);
  });

  it("should assign secret santa with exclusions", () => {
    const secretSanta = {
      participants: [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }],
      exclusions: [
        ["1", "2"],
        ["3", "4"],
      ],
    } as unknown as SecretSanta;

    pickRandomMock
      .mockReturnValueOnce("3")
      .mockReturnValueOnce("4")
      .mockReturnValueOnce("1")
      .mockReturnValueOnce("2");

    const assignments = generateAssignments(secretSanta);

    expect(assignments).toEqual([
      {
        participant: "1",
        assignedTo: "3",
      },
      {
        participant: "2",
        assignedTo: "4",
      },
      {
        participant: "3",
        assignedTo: "1",
      },
      {
        participant: "4",
        assignedTo: "2",
      },
    ]);

    expect(pickRandomMock).toHaveBeenCalledTimes(4);
    expect(pickRandomMock).toHaveBeenNthCalledWith(1, ["3", "4"]);
    expect(pickRandomMock).toHaveBeenNthCalledWith(2, ["4"]);
    expect(pickRandomMock).toHaveBeenNthCalledWith(3, ["1", "2"]);
    expect(pickRandomMock).toHaveBeenNthCalledWith(4, ["2"]);
  });

  it("should throw an error if no eligible participants are found", () => {
    const secretSanta = {
      participants: [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }],
      exclusions: [
        ["1", "2"],
        ["1", "3"],
        ["1", "4"],
      ],
    } as unknown as SecretSanta;

    pickRandomMock.mockReturnValueOnce(undefined);

    expect(() => generateAssignments(secretSanta)).toThrow(
      "No eligible participants found",
    );
  });
});
