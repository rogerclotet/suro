package dev.clotet.suro.wear.auth

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * The watch's half of the Convex Auth session, at rest.
 *
 * Writes go through `commit()`, not `apply()`. These are rare, one-off writes
 * where durability is the whole point: the Data Layer listener service that
 * receives a pairing ticket can be killed the moment it returns, and an
 * `apply()` still sitting in the queue would lose the session and send the user
 * back to their phone to pair again.
 *
 * Encrypted because a refresh token *is* the account: it mints access tokens for
 * as long as it keeps rotating. The watch owns its own pair (see WatchPairing.ts
 * on the backend), so losing this only signs the watch out, never the phone.
 *
 * Jetpack Security is deprecated with no drop-in replacement — the sanctioned
 * alternative is hand-rolling AndroidKeyStore AES-GCM, which is strictly worse
 * than a maintained-until-recently library doing exactly that. Revisit if a real
 * successor ships.
 */
@Suppress("DEPRECATION")
class TokenStore(context: Context) {

    private val prefs: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        FILE_NAME,
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    val accessToken: String? get() = prefs.getString(KEY_ACCESS, null)

    val refreshToken: String? get() = prefs.getString(KEY_REFRESH, null)

    /** The pairing secret the phone pushed, waiting to be exchanged. */
    var pendingTicket: String?
        get() = prefs.getString(KEY_TICKET, null)
        set(value) {
            prefs.edit().putString(KEY_TICKET, value).commit()
        }

    val isPaired: Boolean get() = refreshToken != null

    fun save(access: String, refresh: String) {
        prefs.edit()
            .putString(KEY_ACCESS, access)
            .putString(KEY_REFRESH, refresh)
            .putLong(KEY_EXPIRES_AT, Jwt.expiryMillis(access))
            .remove(KEY_TICKET)
            .commit()
    }

    fun clear() {
        prefs.edit().clear().commit()
    }

    /**
     * True when the cached access token is gone, or close enough to expiry that
     * a request would probably lose the race. Convex Auth's access tokens last
     * about an hour; refreshing a minute early costs one extra round trip a day.
     */
    fun needsRefresh(now: Long = System.currentTimeMillis()): Boolean {
        if (accessToken == null) return true
        return now >= prefs.getLong(KEY_EXPIRES_AT, 0L) - REFRESH_MARGIN_MS
    }

    private companion object {
        const val FILE_NAME = "suro-wear-auth"
        const val KEY_ACCESS = "access_token"
        const val KEY_REFRESH = "refresh_token"
        const val KEY_TICKET = "pending_ticket"
        const val KEY_EXPIRES_AT = "expires_at"
        const val REFRESH_MARGIN_MS = 60_000L
    }
}
