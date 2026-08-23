import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { sha256Hex } from "./reviewOtp";

/**
 * Wear OS pairing (Convex Auth credentials provider).
 *
 * The watch has no keyboard, so it never signs in on its own. Instead the phone
 * app — already signed in — mints a one-time ticket (`watchPairings.createTicket`)
 * and hands it to the watch over the Wear Data Layer. The watch redeems it here.
 *
 * The ticket buys the watch its *own* Convex Auth session rather than a copy of
 * the phone's: Convex Auth refresh tokens are single-use and rotate, so a shared
 * one would sign the phone out the first time the watch refreshed. Going through
 * a credentials provider means Convex Auth mints an independent session for the
 * same user, and the two devices can be revoked separately.
 *
 * Redemption is single-use and time-boxed — `redeemTicket` deletes the row it
 * matched, so a ticket sniffed off the Bluetooth link is worthless once the
 * watch has used it (and expires on its own within minutes if it hasn't).
 *
 * The functions live in `watchPairings.ts` (plural): a `watchPairing.ts` next to
 * this file would collide with it on a case-insensitive filesystem like macOS's.
 *
 * `authorize`'s return type is spelled out because `auth.ts` imports this module
 * while this module imports `internal` from the generated api — without the
 * annotation TypeScript can't break the cycle and every function in the
 * deployment degrades to `any`.
 */
export const WatchPairing = ConvexCredentials({
  id: "watch-pairing",
  authorize: async (params, ctx): Promise<{ userId: Id<"users"> }> => {
    const secret = params.secret;
    if (typeof secret !== "string" || secret.length === 0) {
      throw new Error("Missing watch pairing secret");
    }
    // The table stores only the hash, so hash before looking up (same scheme as
    // @convex-dev/auth's own verification codes — see reviewOtp.ts).
    const userId: Id<"users"> = await ctx.runMutation(
      internal.watchPairings.redeemTicket,
      { secretHash: sha256Hex(secret) },
    );
    return { userId };
  },
});
