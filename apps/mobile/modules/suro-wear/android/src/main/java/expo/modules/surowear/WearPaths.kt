package expo.modules.surowear

/**
 * The Data Layer contract shared with the Wear app
 * (`apps/wear/.../auth/WearDataLayer.kt`). Both sides hard-code these strings,
 * so each keeps them in one commented place rather than at every call site.
 */
internal object WearPaths {
    const val AUTH = "/suro/auth"
    const val CONTEXT = "/suro/context"
    const val AUTH_ACK = "/suro/auth/ack"
    const val AUTH_REQUEST = "/suro/auth/request"

    const val KEY_SECRET = "secret"
    const val KEY_CONVEX_URL = "convexUrl"
    const val KEY_ISSUED_AT = "issuedAt"
    const val KEY_LAST_PROJECT_ID = "lastProjectId"
    const val KEY_LOCALE = "locale"
}
