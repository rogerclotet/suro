import type { SecretSanta } from "@/app/_data/secret-santa";
import { pickRandom } from "./pick-random";
import type { Assignment } from "./types";

export function generateAssignments(secretSanta: SecretSanta) {
  const participantIds = secretSanta.participants.map((p) => p.id);
  const assignments: Assignment[] = [];

  for (const participant of participantIds) {
    const affectedExclusions = secretSanta.exclusions.filter((e) =>
      e.includes(participant),
    );

    const eligibleParticipantIds = participantIds.filter(
      (p) =>
        p !== participant &&
        assignments.every((a) => a.assignedTo !== p) &&
        affectedExclusions.every((e) => !e.includes(p)),
    );

    const assignedTo = pickRandom(eligibleParticipantIds);
    if (assignedTo === undefined) {
      throw new Error("No eligible participants found");
    }

    assignments.push({ participant, assignedTo });
  }

  return assignments;
}
