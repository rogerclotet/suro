package dev.clotet.suro.wear

import android.content.Context

/**
 * The one thing the watch remembers between launches: which group you were in.
 * Everything else is fetched. Mirrors `apps/mobile/src/lib/last-project.ts`.
 */
class Preferences(context: Context) {

    private val prefs = context.getSharedPreferences("suro-wear", Context.MODE_PRIVATE)

    var lastProjectId: String?
        get() = prefs.getString(KEY_LAST_PROJECT, null)
        set(value) = prefs.edit().putString(KEY_LAST_PROJECT, value).apply()

    /**
     * Seed from the phone's active group without overriding a choice the user
     * made on the watch — the phone's Data Layer context arrives on every
     * foreground, and it shouldn't yank the watch back mid-use.
     */
    fun setLastProjectIdIfUnset(projectId: String) {
        if (lastProjectId == null) lastProjectId = projectId
    }

    private companion object {
        const val KEY_LAST_PROJECT = "last_project_id"
    }
}
