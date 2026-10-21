import { describe, expect, it } from "vitest";
import type { SecretSanta } from "@/app/_data/secret-santa";
import {
  exchangeFromValues,
  isUpcomingExchange,
  newSecretSantaValues,
  secretSantaValues,
} from "./form-values";

const base: SecretSanta = {
  id: "s1",
  projectId: "p1",
  name: "Christmas",
  description: null,
  exchangeAt: new Date(Date.UTC(2026, 11, 24)),
  exchangeAllDay: true,
  priceRange: { min: 10, max: 20 },
  exclusions: [],
  eventId: null,
  drawn: false,
  organizerName: "Anna",
  canOrganize: true,
  isParticipant: true,
  participants: [
    { id: "u1", name: "Anna", image: null, avatarColor: null },
    { id: "u2", name: "Bernat", image: null, avatarColor: null },
  ],
  assignment: null,
};

describe("secret santa form values", () => {
  it("starts a new Secret Santa as an all-day exchange two weeks ahead", () => {
    const values = newSecretSantaValues(
      "Secret Santa 2026",
      ["u1"],
      new Date(2026, 10, 1, 15, 30),
    );
    expect(values.date).toEqual(new Date(2026, 10, 15));
    expect(values.allDay).toBe(true);
    expect(values.participantIds).toEqual(["u1"]);
  });

  it("round-trips an all-day exchange through the stored UTC midnight", () => {
    const values = secretSantaValues(base);
    expect(values.date).toEqual(new Date(2026, 11, 24));
    expect(exchangeFromValues(values)).toEqual({
      exchangeAt: Date.UTC(2026, 11, 24),
      exchangeAllDay: true,
    });
  });

  it("round-trips a timed exchange in local time", () => {
    const at = new Date(2026, 11, 20, 19, 30);
    const values = secretSantaValues({
      ...base,
      exchangeAt: at,
      exchangeAllDay: false,
    });
    expect(values.time).toBe("19:30");
    expect(exchangeFromValues(values)).toEqual({
      exchangeAt: at.getTime(),
      exchangeAllDay: false,
    });
  });

  it("treats today as upcoming for an all-day exchange only", () => {
    const now = new Date(2026, 11, 24, 20);
    const today = new Date(2026, 11, 24);
    expect(
      isUpcomingExchange({ date: today, allDay: true, time: "" }, now),
    ).toBe(true);
    expect(
      isUpcomingExchange({ date: today, allDay: false, time: "19:00" }, now),
    ).toBe(false);
  });
});
