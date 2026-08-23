/**
 * The Data Layer bridge to the Wear OS app. Android-only: the native module
 * doesn't exist on iOS, and every call here no-ops there (see `index.ts`).
 */
export type SuroWearEvents = {
  /** The watch redeemed the ticket we pushed — stop re-pushing and clean up. */
  onAuthAck: () => void;
  /** The watch has no session and is asking for one right now. */
  onTicketRequest: () => void;
};

export type SuroWearNativeModule = {
  isWatchConnected: () => Promise<boolean>;
  pushAuthTicket: (secret: string, convexUrl: string) => Promise<void>;
  pushContext: (lastProjectId: string | null, locale: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  addListener: <K extends keyof SuroWearEvents>(
    event: K,
    listener: SuroWearEvents[K],
  ) => { remove: () => void };
};
