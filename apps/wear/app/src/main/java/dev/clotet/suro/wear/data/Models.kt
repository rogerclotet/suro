package dev.clotet.suro.wear.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * The slices of the Convex payloads the watch actually renders.
 *
 * Every class is decoded with `ignoreUnknownKeys`, so these are deliberately
 * partial: the phone's queries return whole documents, and echoing all of that
 * here would mean a schema change breaks the watch for a field it never shows.
 * Ids stay `String` — Convex ids are opaque strings over the wire, and the watch
 * only ever passes them back.
 */

@Serializable
data class User(
    @SerialName("_id") val id: String,
    val name: String? = null,
)

@Serializable
data class Project(
    @SerialName("_id") val id: String,
    val name: String,
    val color: String? = null,
)

@Serializable
data class ListItem(
    @SerialName("_id") val id: String,
    val name: String,
    val completed: Boolean,
    val category: String? = null,
    val dueAt: Double? = null,
)

@Serializable
data class ListWithItems(
    @SerialName("_id") val id: String,
    val name: String,
    val favorite: Boolean = false,
    val taskMode: Boolean = false,
    val items: List<ListItem> = emptyList(),
) {
    val remaining: Int get() = items.count { !it.completed }
    val isComplete: Boolean get() = items.isNotEmpty() && remaining == 0
}

@Serializable
data class ListsOverview(
    val active: List<ListWithItems> = emptyList(),
    val completed: List<ListWithItems> = emptyList(),
)

@Serializable
data class Event(
    @SerialName("_id") val id: String,
    val name: String,
    val description: String? = null,
    val startAt: Double,
    val endAt: Double,
    val allDay: Boolean,
)

@Serializable
data class EventDetail(
    @SerialName("_id") val id: String,
    val name: String,
    val description: String? = null,
    val startAt: Double,
    val endAt: Double,
    val allDay: Boolean,
    val list: ListWithItems? = null,
)

/** A pot member. `_id` is null when the account behind it was deleted. */
@Serializable
data class PotMember(
    @SerialName("_id") val id: String? = null,
    val name: String? = null,
)

@Serializable
data class PotOverviewEntry(
    @SerialName("_id") val id: String,
    val name: String,
    val settledAt: Double? = null,
    val totalSpent: Double = 0.0,
    val members: List<PotMember> = emptyList(),
)

@Serializable
data class PotsOverview(
    val active: List<PotOverviewEntry> = emptyList(),
    val settled: List<PotOverviewEntry> = emptyList(),
)

@Serializable
data class Spending(
    @SerialName("_id") val id: String,
    val amount: Double,
    val description: String? = null,
    val fromName: String? = null,
    val toName: String? = null,
    val from: String? = null,
    val to: String? = null,
)

@Serializable
data class Balance(
    val user: PotMember,
    val amount: Double,
)

@Serializable
data class PotDetail(
    @SerialName("_id") val id: String,
    val name: String,
    val settledAt: Double? = null,
    val members: List<PotMember> = emptyList(),
    val spendings: List<Spending> = emptyList(),
    val balances: List<Balance> = emptyList(),
) {
    /** Members still backed by a live account — the only ones we can bill. */
    val payableMembers: List<PotMember> get() = members.filter { it.id != null }
}

/** The `{ tokens: { token, refreshToken } }` half of Convex Auth's signIn. */
@Serializable
data class SignInResult(val tokens: AuthTokens? = null)

@Serializable
data class AuthTokens(
    val token: String,
    val refreshToken: String,
)
