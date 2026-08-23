package dev.clotet.suro.wear.auth

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import java.util.Base64
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * On-device because [TokenStore] is backed by EncryptedSharedPreferences, which
 * needs the AndroidKeyStore — a JVM unit test would only ever exercise a stub.
 */
@RunWith(AndroidJUnit4::class)
class TokenStoreTest {

    private lateinit var store: TokenStore

    private fun jwtExpiringIn(millis: Long): String {
        val exp = (System.currentTimeMillis() + millis) / 1000
        val payload = Base64.getUrlEncoder().withoutPadding()
            .encodeToString("""{"sub":"user","exp":$exp}""".toByteArray())
        return "header.$payload.signature"
    }

    @Before
    fun setUp() {
        store = TokenStore(InstrumentationRegistry.getInstrumentation().targetContext)
        store.clear()
    }

    @Test
    fun startsEmpty() {
        assertFalse(store.isPaired)
        assertNull(store.accessToken)
        assertNull(store.refreshToken)
        assertTrue(store.needsRefresh())
    }

    @Test
    fun roundTripsTokensThroughEncryptedStorage() {
        val access = jwtExpiringIn(60 * 60_000)
        store.save(access, "refresh-token")

        assertEquals(access, store.accessToken)
        assertEquals("refresh-token", store.refreshToken)
        assertTrue(store.isPaired)
    }

    @Test
    fun survivesANewInstanceOverTheSameFile() {
        // The Data Layer listener service and the Activity build their own
        // instances; a key that only decrypts in one process would be useless.
        store.save(jwtExpiringIn(60 * 60_000), "refresh-token")

        val reopened = TokenStore(InstrumentationRegistry.getInstrumentation().targetContext)

        assertEquals("refresh-token", reopened.refreshToken)
        assertTrue(reopened.isPaired)
    }

    @Test
    fun doesNotNeedARefreshWhileTheTokenIsComfortablyValid() {
        store.save(jwtExpiringIn(60 * 60_000), "refresh-token")

        assertFalse(store.needsRefresh())
    }

    @Test
    fun refreshesEarlyRatherThanRacingExpiry() {
        // Inside the one-minute margin: still technically valid, but a request
        // sent now could easily arrive expired.
        store.save(jwtExpiringIn(30_000), "refresh-token")

        assertTrue(store.needsRefresh())
    }

    @Test
    fun treatsAnExpiredTokenAsNeedingRefresh() {
        store.save(jwtExpiringIn(-60_000), "refresh-token")

        assertTrue(store.needsRefresh())
    }

    @Test
    fun keepsAPendingTicketUntilTokensReplaceIt() {
        store.pendingTicket = "the-secret"
        assertEquals("the-secret", store.pendingTicket)

        store.save(jwtExpiringIn(60 * 60_000), "refresh-token")

        // Redeeming consumes the ticket; leaving it would re-run a dead exchange
        // on every launch.
        assertNull(store.pendingTicket)
    }

    @Test
    fun clearWipesEverything() {
        store.save(jwtExpiringIn(60 * 60_000), "refresh-token")
        store.pendingTicket = "the-secret"

        store.clear()

        assertNull(store.accessToken)
        assertNull(store.refreshToken)
        assertNull(store.pendingTicket)
        assertFalse(store.isPaired)
    }
}
