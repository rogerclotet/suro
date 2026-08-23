package dev.clotet.suro.wear.auth

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import dev.clotet.suro.wear.net.ConvexHttp
import java.util.Base64
import kotlinx.coroutines.runBlocking
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * The pairing and refresh handshake end to end against a stand-in Convex, with
 * the real encrypted token store underneath. Covers the sequence that the
 * emulator pair can't exercise on its own — pairing a watch to a phone emulator
 * needs a Google sign-in in the Wear OS companion app.
 */
@RunWith(AndroidJUnit4::class)
class AuthRepositoryTest {

    private lateinit var server: MockWebServer
    private lateinit var tokens: TokenStore
    private lateinit var auth: AuthRepository

    private fun jwt(expiresInMillis: Long): String {
        val exp = (System.currentTimeMillis() + expiresInMillis) / 1000
        val payload = Base64.getUrlEncoder().withoutPadding()
            .encodeToString("""{"sub":"user","exp":$exp}""".toByteArray())
        return "header.$payload.signature"
    }

    private fun enqueueTokens(access: String, refresh: String) {
        server.enqueue(
            MockResponse().setBody(
                """{"status":"success","value":{"tokens":{"token":"$access","refreshToken":"$refresh"}}}""",
            ),
        )
    }

    private fun enqueueFailure() {
        server.enqueue(
            MockResponse().setBody(
                """{"status":"error","errorMessage":"Invalid watch pairing ticket"}""",
            ),
        )
    }

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()
        tokens = TokenStore(InstrumentationRegistry.getInstrumentation().targetContext)
        tokens.clear()
        auth = AuthRepository(ConvexHttp(server.url("/").toString()), tokens)
    }

    @After
    fun tearDown() = server.shutdown()

    @Test
    fun startsUnknownUntilSomethingChecks() {
        assertEquals(AuthState.Unknown, auth.state.value)
    }

    @Test
    fun withoutATicketOrTokensItSettlesUnpaired() = runBlocking {
        assertNull(auth.accessToken())
        assertEquals(AuthState.Unpaired, auth.state.value)
    }

    @Test
    fun redeemsAPendingTicketForItsOwnSession() = runBlocking {
        tokens.pendingTicket = "the-secret"
        val access = jwt(60 * 60_000)
        enqueueTokens(access, "watch-refresh")

        assertEquals(access, auth.accessToken())
        assertEquals(AuthState.Paired, auth.state.value)
        assertEquals("watch-refresh", tokens.refreshToken)

        // The exchange must go through the watch-pairing provider, not carry the
        // phone's credentials.
        val body = JSONObject(server.takeRequest().body.readUtf8())
        assertEquals("auth:signIn", body.getString("path"))
        val args = body.getJSONObject("args")
        assertEquals("watch-pairing", args.getString("provider"))
        assertEquals("the-secret", args.getJSONObject("params").getString("secret"))
    }

    @Test
    fun aRejectedTicketIsDiscardedRatherThanRetriedForever() = runBlocking {
        tokens.pendingTicket = "stale-secret"
        enqueueFailure()

        assertNull(auth.accessToken())
        assertEquals(AuthState.Unpaired, auth.state.value)
        assertNull(tokens.pendingTicket)
    }

    @Test
    fun refreshesWithTheStoredRefreshTokenWhenTheAccessTokenIsStale() = runBlocking {
        tokens.save(jwt(-60_000), "old-refresh")
        val fresh = jwt(60 * 60_000)
        enqueueTokens(fresh, "rotated-refresh")

        assertEquals(fresh, auth.accessToken())
        // Convex Auth rotates on every use; storing the new one is what keeps
        // the watch signed in.
        assertEquals("rotated-refresh", tokens.refreshToken)

        val args = JSONObject(server.takeRequest().body.readUtf8()).getJSONObject("args")
        assertEquals("old-refresh", args.getString("refreshToken"))
    }

    @Test
    fun aValidAccessTokenIsReusedWithoutHittingTheNetwork() = runBlocking {
        val access = jwt(60 * 60_000)
        tokens.save(access, "refresh")

        assertEquals(access, auth.accessToken())
        assertEquals(AuthState.Paired, auth.state.value)
        assertEquals(0, server.requestCount)
    }

    @Test
    fun aSpentRefreshTokenSignsTheWatchOut() = runBlocking {
        tokens.save(jwt(-60_000), "revoked")
        enqueueFailure()

        assertNull(auth.accessToken())
        assertEquals(AuthState.Unpaired, auth.state.value)
        // Nothing left to retry with — the UI has to send the user to the phone.
        assertNull(tokens.refreshToken)
    }

    @Test
    fun signOutClearsTheSession() = runBlocking {
        tokens.save(jwt(60 * 60_000), "refresh")

        auth.signOut()

        assertEquals(AuthState.Unpaired, auth.state.value)
        assertNull(tokens.refreshToken)
    }
}
