package dev.clotet.suro.wear.auth

import dev.clotet.suro.wear.data.SignInResult
import dev.clotet.suro.wear.net.ConvexHttp
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

/** Whether the watch currently holds a usable Suro session. */
enum class AuthState { Unknown, Paired, Unpaired }

/**
 * Owns the watch's session: redeems the pairing ticket the phone pushed, then
 * keeps an access token fresh off the refresh token.
 *
 * Both operations are the same Convex Auth action (`auth:signIn`) — once with a
 * provider and the ticket, thereafter with a refresh token. Convex Auth rotates
 * refresh tokens on every use, so [refresh] is serialised behind a mutex: two
 * concurrent screens racing to refresh would burn the same token twice and
 * invalidate the session.
 */
class AuthRepository(
    private val http: ConvexHttp,
    private val tokens: TokenStore,
) {
    private val json = Json { ignoreUnknownKeys = true }
    private val mutex = Mutex()

    // Starts Unknown and is settled by the first [accessToken] call, which
    // MainActivity makes before the first frame. The UI waits rather than
    // guessing: rendering Home at a watch that turns out to be unpaired means a
    // screen of failed queries, and rendering Setup at a paired one means a
    // flash of the wrong screen.
    private val _state = MutableStateFlow(AuthState.Unknown)
    val state: StateFlow<AuthState> = _state.asStateFlow()

    /**
     * An access token good for the next request, refreshing first if the cached
     * one is stale. Null when the watch isn't paired at all.
     */
    suspend fun accessToken(): String? = mutex.withLock {
        redeemPendingTicketLocked()
        if (tokens.refreshToken == null) {
            _state.value = AuthState.Unpaired
            return@withLock null
        }
        if (tokens.needsRefresh()) {
            refreshLocked()
        } else {
            _state.value = AuthState.Paired
        }
        tokens.accessToken
    }

    /** Force a refresh — the retry path after the server rejects a token. */
    suspend fun forceRefresh(): String? = mutex.withLock {
        if (tokens.refreshToken == null) {
            _state.value = AuthState.Unpaired
            return@withLock null
        }
        refreshLocked()
        tokens.accessToken
    }

    /**
     * Exchange a ticket the phone just pushed. Called by the Data Layer
     * listener; safe to call when there's nothing pending.
     */
    suspend fun redeemPendingTicket() = mutex.withLock { redeemPendingTicketLocked() }

    fun signOut() {
        tokens.clear()
        _state.value = AuthState.Unpaired
    }

    private suspend fun redeemPendingTicketLocked() {
        val ticket = tokens.pendingTicket ?: return
        val result = runCatching {
            signIn(
                buildJsonObject {
                    put("provider", "watch-pairing")
                    put("params", buildJsonObject { put("secret", ticket) })
                },
            )
        }
        // A ticket only redeems once, and the phone re-mints on every foreground.
        // Dropping a failed one avoids retrying a dead secret forever.
        tokens.pendingTicket = null
        val pair = result.getOrNull()
        if (pair == null) {
            if (!tokens.isPaired) _state.value = AuthState.Unpaired
            return
        }
        tokens.save(pair.token, pair.refreshToken)
        _state.value = AuthState.Paired
    }

    private suspend fun refreshLocked() {
        val refreshToken = tokens.refreshToken ?: return
        val pair = runCatching {
            signIn(buildJsonObject { put("refreshToken", refreshToken) })
        }.getOrNull()
        if (pair == null) {
            // The refresh token is spent or revoked. Clearing sends the UI back
            // to the setup screen, which is exactly what the user has to act on.
            tokens.clear()
            _state.value = AuthState.Unpaired
            return
        }
        tokens.save(pair.token, pair.refreshToken)
        _state.value = AuthState.Paired
    }

    private suspend fun signIn(args: JsonObject) =
        json.decodeFromJsonElement(
            SignInResult.serializer(),
            http.action("auth:signIn", args, token = null),
        ).tokens ?: throw ConvexHttp.ConvexException("Convex Auth returned no tokens")
}
