package dev.clotet.suro.wear.net

import dev.clotet.suro.wear.auth.AuthRepository
import dev.clotet.suro.wear.data.Event
import dev.clotet.suro.wear.data.EventDetail
import dev.clotet.suro.wear.data.ListWithItems
import dev.clotet.suro.wear.data.ListsOverview
import dev.clotet.suro.wear.data.PotDetail
import dev.clotet.suro.wear.data.PotsOverview
import dev.clotet.suro.wear.data.Project
import dev.clotet.suro.wear.data.User
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

/**
 * Every Convex function the watch calls, typed.
 *
 * These are the same public queries and mutations the phone and web clients use
 * — the backend is the shared API, so the watch adds no server surface of its
 * own beyond `listItems.setCompleted` (a toggle safe for a client that doesn't
 * render task fields) and the pairing flow.
 */
class SuroApi(
    private val http: ConvexHttp,
    private val auth: AuthRepository,
) {
    private val json = Json { ignoreUnknownKeys = true }

    suspend fun me(): User? =
        queryOrNull("users:me", buildJsonObject { }, User.serializer())

    suspend fun projects(): List<Project> =
        query("projects:listMine", buildJsonObject { }, ListSerializer(Project.serializer()))

    suspend fun lists(projectId: String): ListsOverview = query(
        "lists:overviewByProject",
        buildJsonObject {
            put("projectId", projectId)
            // The watch shows what's still open. Scrolling a wall of finished
            // lists on a wrist is nobody's idea of a good time.
            put("completedLimit", 0)
        },
        ListsOverview.serializer(),
    )

    suspend fun list(listId: String): ListWithItems? = queryOrNull(
        "lists:get",
        buildJsonObject { put("listId", listId) },
        ListWithItems.serializer(),
    )

    suspend fun events(projectId: String, from: Long, to: Long): List<Event> = query(
        "events:listByRange",
        buildJsonObject {
            put("projectId", projectId)
            put("from", from)
            put("to", to)
        },
        ListSerializer(Event.serializer()),
    )

    suspend fun event(eventId: String): EventDetail? = queryOrNull(
        "events:get",
        buildJsonObject { put("eventId", eventId) },
        EventDetail.serializer(),
    )

    suspend fun pots(projectId: String): PotsOverview = query(
        "expenses:listPotsOverview",
        buildJsonObject {
            put("projectId", projectId)
            // Same reasoning as `completedLimit` above: settled pots are history.
            put("settledLimit", 0)
        },
        PotsOverview.serializer(),
    )

    suspend fun pot(potId: String): PotDetail? = queryOrNull(
        "expenses:getPot",
        buildJsonObject { put("potId", potId) },
        PotDetail.serializer(),
    )

    suspend fun setItemCompleted(itemId: String, completed: Boolean) {
        mutate(
            "listItems:setCompleted",
            buildJsonObject {
                put("itemId", itemId)
                put("completed", completed)
            },
        )
    }

    /**
     * `amount` is in cents — the backend rejects anything that isn't a positive
     * integer. `to` unset means split equally among the pot's members.
     */
    suspend fun createSpending(
        potId: String,
        amountCents: Int,
        description: String?,
        from: String,
        to: String?,
    ) {
        mutate(
            "expenses:createSpending",
            buildJsonObject {
                put("potId", potId)
                put("amount", amountCents)
                put("from", from)
                if (!description.isNullOrBlank()) put("description", description.trim())
                if (to != null) put("to", to)
            },
        )
    }

    private suspend fun <T> query(
        path: String,
        args: JsonObject,
        serializer: DeserializationStrategy<T>,
    ): T = json.decodeFromJsonElement(serializer, authenticated { http.query(path, args, it) })

    /**
     * For the `get`-style queries that return null once the document is gone —
     * the detail screens stay subscribed across a delete, so null is a normal
     * answer rather than an error (see the comments on `lists.get` server-side).
     */
    private suspend fun <T> queryOrNull(
        path: String,
        args: JsonObject,
        serializer: DeserializationStrategy<T>,
    ): T? {
        val value = authenticated { http.query(path, args, it) }
        if (value is JsonNull) return null
        return json.decodeFromJsonElement(serializer, value)
    }

    private suspend fun mutate(path: String, args: JsonObject) {
        authenticated { http.mutation(path, args, it) }
    }

    /**
     * Run a call with a valid access token, refreshing once if the server says
     * the token is no good. One retry only: a second rejection means the session
     * is genuinely gone, and [AuthRepository] has already reset the UI to setup.
     */
    private suspend fun <T> authenticated(call: suspend (String?) -> T): T {
        val token = auth.accessToken() ?: throw ConvexHttp.UnauthenticatedException(
            "The watch is not paired with a Suro account",
        )
        return try {
            call(token)
        } catch (unauthenticated: ConvexHttp.UnauthenticatedException) {
            val refreshed = auth.forceRefresh() ?: throw unauthenticated
            call(refreshed)
        }
    }
}
