import type { api } from "backend/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { eventLocalStart } from "domain/events";
import type { PriceRange } from "domain/secret-santa";

type ConvexSecretSanta = NonNullable<
  FunctionReturnType<typeof api.secretSantas.current>
>;
type ConvexPerson = ConvexSecretSanta["participants"][number];
type ConvexGiftIdea = FunctionReturnType<
  typeof api.secretSantas.myGiftIdeas
>[number];

export type SecretSantaPerson = {
  id: string;
  name: string | null;
  image: string | null;
  avatarColor: string | null;
};

export type GiftIdea = {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
};

export type SecretSanta = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  /** Stored instant, UTC midnight for all-day (see `exchangeLocalStart`). */
  exchangeAt: Date;
  exchangeAllDay: boolean;
  priceRange: PriceRange;
  exclusions: string[][];
  eventId: string | null;
  drawn: boolean;
  organizerName: string | null;
  canOrganize: boolean;
  isParticipant: boolean;
  participants: SecretSantaPerson[];
  assignment: (SecretSantaPerson & { giftIdeas: GiftIdea[] }) | null;
};

function adaptPerson(person: ConvexPerson): SecretSantaPerson {
  return {
    id: person.userId,
    name: person.name,
    image: person.image,
    avatarColor: person.avatarColor,
  };
}

export function adaptGiftIdea(idea: ConvexGiftIdea): GiftIdea {
  return {
    id: idea._id,
    name: idea.name,
    description: idea.description,
    url: idea.url,
  };
}

/** Map `secretSantas.current` to the app's `SecretSanta` shape. */
export function adaptSecretSanta(s: ConvexSecretSanta): SecretSanta {
  return {
    id: s._id,
    projectId: s.projectId,
    name: s.name,
    description: s.description,
    exchangeAt: new Date(s.exchangeAt),
    exchangeAllDay: s.exchangeAllDay,
    priceRange: s.priceRange,
    exclusions: s.exclusions,
    eventId: s.eventId,
    drawn: s.drawnAt !== null,
    organizerName: s.organizerName,
    canOrganize: s.canOrganize,
    isParticipant: s.isParticipant,
    participants: s.participants.map(adaptPerson),
    assignment: s.assignment
      ? {
          ...adaptPerson(s.assignment),
          giftIdeas: s.assignment.giftIdeas.map(adaptGiftIdea),
        }
      : null,
  };
}

/** The exchange as a local date and time, local midnight when all-day. */
export function exchangeLocalStart(
  secretSanta: Pick<SecretSanta, "exchangeAt" | "exchangeAllDay">,
): Date {
  return eventLocalStart({
    startAt: secretSanta.exchangeAt.getTime(),
    allDay: secretSanta.exchangeAllDay,
  });
}
