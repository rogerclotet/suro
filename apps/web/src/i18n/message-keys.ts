import type messages from "@/i18n/messages/en.json";

export type Messages = typeof messages;
export type NavKey = keyof Messages["nav"];
export type InfoKey = keyof Messages["info"];
