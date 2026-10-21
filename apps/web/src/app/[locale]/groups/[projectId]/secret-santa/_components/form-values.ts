import { DAY_MS, dateOnlyTimestamp, startOfDay } from "domain/events";
import type { PriceRange } from "domain/secret-santa";
import { exchangeLocalStart, type SecretSanta } from "@/app/_data/secret-santa";

export type SecretSantaFormValues = {
  name: string;
  description: string;
  /** Local calendar day of the exchange. */
  date: Date;
  allDay: boolean;
  /** `HH:mm`, ignored for an all-day exchange. */
  time: string;
  priceRange: PriceRange;
  participantIds: string[];
};

const DEFAULT_TIME = "19:00";
const DEFAULT_LEAD_DAYS = 14;
const DEFAULT_PRICE_RANGE: PriceRange = { min: 0, max: 30 };

export function newSecretSantaValues(
  name: string,
  participantIds: string[],
  now = new Date(),
): SecretSantaFormValues {
  return {
    name,
    description: "",
    date: startOfDay(new Date(now.getTime() + DEFAULT_LEAD_DAYS * DAY_MS)),
    allDay: true,
    time: DEFAULT_TIME,
    priceRange: DEFAULT_PRICE_RANGE,
    participantIds,
  };
}

export function secretSantaValues(
  secretSanta: SecretSanta,
): SecretSantaFormValues {
  const start = exchangeLocalStart(secretSanta);
  return {
    name: secretSanta.name,
    description: secretSanta.description ?? "",
    date: startOfDay(start),
    allDay: secretSanta.exchangeAllDay,
    time: secretSanta.exchangeAllDay ? DEFAULT_TIME : timeString(start),
    priceRange: secretSanta.priceRange,
    participantIds: secretSanta.participants.map((p) => p.id),
  };
}

/** All-day exchanges use the events convention: UTC midnight of the day. */
export function exchangeFromValues({
  date,
  allDay,
  time,
}: Pick<SecretSantaFormValues, "date" | "allDay" | "time">) {
  if (allDay) {
    return { exchangeAt: dateOnlyTimestamp(date), exchangeAllDay: true };
  }
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const start = new Date(date);
  start.setHours(hours, minutes, 0, 0);
  return { exchangeAt: start.getTime(), exchangeAllDay: false };
}

/** Whether the exchange has not happened yet; an all-day one lasts all day. */
export function isUpcomingExchange(
  values: Pick<SecretSantaFormValues, "date" | "allDay" | "time">,
  now = new Date(),
): boolean {
  if (values.allDay) {
    return values.date.getTime() >= startOfDay(now).getTime();
  }
  const [hours = 0, minutes = 0] = values.time.split(":").map(Number);
  const start = new Date(values.date);
  start.setHours(hours, minutes, 0, 0);
  return start.getTime() > now.getTime();
}

function timeString(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
