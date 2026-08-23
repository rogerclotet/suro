package dev.clotet.suro.wear.screenshots

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import dev.clotet.suro.wear.auth.TokenStore
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Puts a Convex Auth session onto the watch so the store screenshots can be
 * captured from the real app.
 *
 * Not a test of anything — it's the screenshot runbook's one piece of scaffolding
 * (see apps/mobile/store/README.md). The watch normally receives its session from
 * the phone over the Data Layer, and pairing two emulators needs a Google sign-in
 * in the Wear OS companion app, which a capture run can't do. Everything after
 * this runs as the real app against the real deployment; only the delivery of the
 * token is substituted.
 *
 * It lives in androidTest because [TokenStore] is encrypted against the
 * AndroidKeyStore and can only be written from inside the app's own process.
 *
 * Drive it with `am instrument` rather than Gradle's `connectedAndroidTest`,
 * which uninstalls the app afterwards and takes the seeded session with it.
 */
@RunWith(AndroidJUnit4::class)
class SessionSeeder {

    @Test
    fun seedSession() {
        val arguments = InstrumentationRegistry.getArguments()
        val access = arguments.getString("suroAccessToken")
        val refresh = arguments.getString("suroRefreshToken")

        // Skipped, not failed, when nobody asked for a session: this runs in the
        // same source set as the real tests, and `connectedAndroidTest` sweeps
        // up everything it finds.
        assumeTrue(
            "Pass -e suroAccessToken <jwt> -e suroRefreshToken <token> to seed a session",
            access != null && refresh != null,
        )

        val store = TokenStore(InstrumentationRegistry.getInstrumentation().targetContext)
        store.clear()
        store.save(requireNotNull(access), requireNotNull(refresh))

        assertTrue(store.isPaired)
    }
}
