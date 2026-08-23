package dev.clotet.suro.wear.ui.common

import dev.clotet.suro.wear.net.ConvexHttp
import java.io.IOException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface LoadState<out T> {
    data object Loading : LoadState<Nothing>
    data class Content<T>(val value: T) : LoadState<T>

    /** [offline] separates "no radio" from "the server said no", which read very
     *  differently to someone glancing at a watch. */
    data class Failed(val offline: Boolean) : LoadState<Nothing>
}

/**
 * One screen's worth of fetched data, plus the refresh policy that stands in for
 * the reactive subscriptions the phone and web clients get.
 *
 * The watch deliberately has no websocket (see ConvexHttp), so freshness is
 * bought explicitly: load when the screen opens, reload on resume if the data
 * has gone stale, reload after our own writes, and let the user force it. That's
 * enough for wrist-length sessions, and it keeps the radio asleep between them.
 */
class Fetcher<T>(
    private val scope: CoroutineScope,
    private val load: suspend () -> T,
) {
    private val _state = MutableStateFlow<LoadState<T>>(LoadState.Loading)
    val state: StateFlow<LoadState<T>> = _state.asStateFlow()

    private var inFlight: Job? = null
    private var loadedAt = 0L

    /** Reload now, replacing any in-flight load. */
    fun refresh() {
        inFlight?.cancel()
        inFlight = scope.launch {
            // Keep showing stale content while refetching; a spinner that
            // replaces readable data is a downgrade.
            if (_state.value !is LoadState.Content) _state.value = LoadState.Loading
            _state.value = try {
                LoadState.Content(load()).also { loadedAt = now() }
            } catch (io: IOException) {
                LoadState.Failed(offline = io !is ConvexHttp.ConvexException)
            }
        }
    }

    /**
     * Reload only if what's on screen has aged out — the ON_RESUME path.
     *
     * A load already in flight counts as fresh enough. Otherwise the first
     * resume, which lands while the screen's initial fetch is still running,
     * would cancel and restart it.
     */
    fun refreshIfStale() {
        if (inFlight?.isActive == true) return
        if (_state.value is LoadState.Content && now() - loadedAt < STALE_AFTER_MS) return
        refresh()
    }

    /**
     * Apply a change locally so a tap lands instantly, then refetch to reconcile.
     * The server is authoritative for anything the watch can't compute — checking
     * off a recurring task advances its due date instead of completing it, and
     * only the refetch reveals that.
     */
    fun optimistically(transform: (T) -> T) {
        val current = _state.value
        if (current is LoadState.Content) _state.value = LoadState.Content(transform(current.value))
    }

    private fun now() = System.currentTimeMillis()

    private companion object {
        const val STALE_AFTER_MS = 30_000L
    }
}
