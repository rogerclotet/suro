package dev.clotet.suro.wear.auth

import java.util.Base64
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long

/**
 * Just enough JWT to know when to refresh. The watch never *verifies* a token —
 * Convex does that on every request — it only needs the expiry so it can renew
 * before a call fails rather than after.
 *
 * Parsed with kotlinx.serialization rather than `org.json`: the latter is an
 * Android stub on the JVM test classpath, so it silently returns nulls under
 * unit test while working on device — the worst combination available.
 */
object Jwt {

    private val json = Json { ignoreUnknownKeys = true }

    /**
     * `exp` in epoch millis, or 0 if the token is unreadable. Treating garbage as
     * already-expired costs one wasted refresh and recovers on its own, which
     * beats trusting a token we can't parse.
     */
    fun expiryMillis(token: String): Long {
        val payload = token.split(".").getOrNull(1) ?: return 0L
        return runCatching {
            val decoded = Base64.getUrlDecoder().decode(payload.padToBase64())
            json.parseToJsonElement(String(decoded, Charsets.UTF_8))
                .jsonObject
                .getValue("exp")
                .jsonPrimitive
                .long * 1000L
        }.getOrDefault(0L)
    }

    /** JWT segments drop base64 padding; java.util.Base64's decoder wants it. */
    private fun String.padToBase64(): String = when (length % 4) {
        2 -> "$this=="
        3 -> "$this="
        else -> this
    }
}
