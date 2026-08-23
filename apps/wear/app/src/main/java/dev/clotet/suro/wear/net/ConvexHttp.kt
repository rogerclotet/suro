package dev.clotet.suro.wear.net

import java.io.IOException
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

/**
 * The watch's whole Convex transport: `POST /api/{query,mutation,action}`.
 *
 * The phone and web clients use the reactive Convex client, which holds a
 * websocket open and pushes changes. A watch shouldn't — the radio is the
 * expensive part, sessions last seconds, and the reactive client drags a Rust
 * `.so` into the APK. So the watch fetches on demand and refetches after its own
 * writes; see the repositories for the refresh policy.
 */
class ConvexHttp(
    private val deploymentUrl: String,
    private val client: OkHttpClient = OkHttpClient(),
) {
    /** Raised for anything the caller can't fix by retrying with a new token. */
    class ConvexException(message: String, val errorData: JsonElement? = null) :
        IOException(message)

    /**
     * The server rejected our identity. Distinct from [ConvexException] because
     * the only useful response is to refresh the token and retry once.
     */
    class UnauthenticatedException(message: String) : IOException(message)

    private val json = Json { ignoreUnknownKeys = true }

    suspend fun query(path: String, args: JsonObject, token: String?): JsonElement =
        call("query", path, args, token)

    suspend fun mutation(path: String, args: JsonObject, token: String?): JsonElement =
        call("mutation", path, args, token)

    suspend fun action(path: String, args: JsonObject, token: String?): JsonElement =
        call("action", path, args, token)

    private suspend fun call(
        endpoint: String,
        path: String,
        args: JsonObject,
        token: String?,
    ): JsonElement {
        val body = buildJsonObject {
            put("path", path)
            put("args", args)
            // The only format Convex's HTTP API supports. It's lossy for some
            // Convex types, but every field Suro reads is a string, boolean or
            // float64, all of which round-trip cleanly.
            put("format", "json")
        }
        val request = Request.Builder()
            .url("${deploymentUrl.trimEnd('/')}/api/$endpoint")
            .post(body.toString().toRequestBody(JSON_MEDIA_TYPE))
            .apply { if (token != null) header("Authorization", "Bearer $token") }
            .build()

        val response = client.newCall(request).executeSuspending()
        val payload = response.use { it.body?.string() }.orEmpty()

        if (response.code == 401) {
            throw UnauthenticatedException("Convex rejected the access token")
        }
        if (!response.isSuccessful) {
            throw ConvexException("Convex returned HTTP ${response.code}")
        }

        val envelope = json.parseToJsonElement(payload).asJsonObject()
        return when (envelope["status"]?.jsonPrimitive?.content) {
            "success" -> envelope["value"] ?: JsonNull
            "error" -> {
                val message = envelope["errorMessage"]?.jsonPrimitive?.content
                    ?: "Convex returned an error"
                // Convex Auth reports a stale or revoked token as an application
                // error, not a 401, so the retry path has to recognise it here.
                if (message.contains("token", ignoreCase = true) &&
                    message.contains("invalid", ignoreCase = true)
                ) {
                    throw UnauthenticatedException(message)
                }
                throw ConvexException(message, envelope["errorData"])
            }
            else -> throw ConvexException("Unrecognised Convex response")
        }
    }

    private companion object {
        val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
    }
}

private fun JsonElement.asJsonObject(): JsonObject =
    this as? JsonObject ?: throw ConvexHttp.ConvexException("Expected a JSON object")
