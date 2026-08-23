package dev.clotet.suro.wear

import android.content.Context
import dev.clotet.suro.wear.auth.AuthRepository
import dev.clotet.suro.wear.auth.PairingRequester
import dev.clotet.suro.wear.auth.TokenStore
import dev.clotet.suro.wear.net.ConvexHttp
import dev.clotet.suro.wear.net.SuroApi
import okhttp3.OkHttpClient

/**
 * Hand-rolled singletons.
 *
 * A watch app this size doesn't earn a DI framework: Hilt would add build time
 * and an annotation processor to wire up six objects that are all created once
 * and never swapped. The Data Layer listener service needs to reach them without
 * an Activity, hence a locator rather than constructor injection from the UI.
 */
class ServiceLocator private constructor(context: Context) {

    private val appContext = context.applicationContext

    private val okHttp: OkHttpClient by lazy { OkHttpClient() }

    val tokenStore: TokenStore by lazy { TokenStore(appContext) }

    val preferences: Preferences by lazy { Preferences(appContext) }

    private val http: ConvexHttp by lazy {
        // Fail with the actual cause. Without this the first request dies inside
        // OkHttp complaining that "/api/query" has no URL scheme, which says
        // nothing about the build being misconfigured. Mirrors the same guard in
        // apps/mobile/src/lib/convex.ts.
        check(BuildConfig.CONVEX_URL.isNotBlank()) {
            "CONVEX_URL is empty — set EXPO_PUBLIC_CONVEX_URL in apps/mobile/.env " +
                "or SURO_WEAR_CONVEX_URL in the environment, then rebuild."
        }
        ConvexHttp(BuildConfig.CONVEX_URL, okHttp)
    }

    val authRepository: AuthRepository by lazy { AuthRepository(http, tokenStore) }

    val api: SuroApi by lazy { SuroApi(http, authRepository) }

    val pairingRequester: PairingRequester by lazy { PairingRequester(appContext) }

    companion object {
        @Volatile
        private var instance: ServiceLocator? = null

        fun from(context: Context): ServiceLocator =
            instance ?: synchronized(this) {
                instance ?: ServiceLocator(context).also { instance = it }
            }
    }
}
