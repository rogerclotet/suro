import { requireOptionalNativeModule } from "expo";
import type {
  SuroWearEvents,
  SuroWearNativeModule,
} from "./src/SuroWear.types";

export type { SuroWearEvents } from "./src/SuroWear.types";

/**
 * Optional because the module ships for Android only — on iOS (and in Expo Go,
 * which has no custom native code) this is null and every export below becomes a
 * no-op, so callers never have to platform-guard.
 */
const native = requireOptionalNativeModule<SuroWearNativeModule>("SuroWear");

export const isWearBridgeAvailable = native !== null;

export async function isWatchConnected(): Promise<boolean> {
  return (await native?.isWatchConnected()) ?? false;
}

export async function pushAuthTicket(
  secret: string,
  convexUrl: string,
): Promise<void> {
  await native?.pushAuthTicket(secret, convexUrl);
}

export async function pushContext(
  lastProjectId: string | null,
  locale: string,
): Promise<void> {
  await native?.pushContext(lastProjectId, locale);
}

export async function clearAuth(): Promise<void> {
  await native?.clearAuth();
}

export function addWearListener<K extends keyof SuroWearEvents>(
  event: K,
  listener: SuroWearEvents[K],
): () => void {
  const subscription = native?.addListener(event, listener);
  return () => subscription?.remove();
}
