package dev.clotet.suro.wear.auth

/**
 * The Data Layer contract shared with the phone app's `suro-wear` Expo module.
 * Both sides hard-code these strings, so they live in one commented place on
 * each side rather than being spelled out at every call site.
 */
object WearDataLayer {
    /** DataItem the phone writes with a one-time Convex Auth pairing ticket. */
    const val PATH_AUTH = "/suro/auth"

    /** DataItem carrying the phone's active group and locale. */
    const val PATH_CONTEXT = "/suro/context"

    /** Message the watch sends once it has redeemed a ticket. */
    const val PATH_AUTH_ACK = "/suro/auth/ack"

    /** Message the watch sends when it has no session and wants a new ticket. */
    const val PATH_AUTH_REQUEST = "/suro/auth/request"

    const val KEY_SECRET = "secret"
    const val KEY_CONVEX_URL = "convexUrl"
    const val KEY_ISSUED_AT = "issuedAt"
    const val KEY_LAST_PROJECT_ID = "lastProjectId"
    const val KEY_LOCALE = "locale"
}
