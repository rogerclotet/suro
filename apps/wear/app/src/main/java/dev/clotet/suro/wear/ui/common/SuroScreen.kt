package dev.clotet.suro.wear.ui.common

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.LifecycleEventEffect
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.wear.compose.foundation.lazy.TransformingLazyColumn
import androidx.wear.compose.foundation.lazy.TransformingLazyColumnScope
import androidx.wear.compose.foundation.lazy.rememberTransformingLazyColumnState
import androidx.wear.compose.material3.CircularProgressIndicator
import androidx.wear.compose.material3.FilledTonalButton
import androidx.wear.compose.material3.ListHeader
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.ScreenScaffold
import androidx.wear.compose.material3.Text
import dev.clotet.suro.wear.R

/**
 * Builds a [Fetcher] bound to this screen's lifetime: it loads when the screen
 * appears and reloads on resume once the data has aged out. Cancelling with the
 * composition means a screen the user swiped away stops holding the radio open.
 */
@Composable
fun <T> rememberFetcher(vararg keys: Any?, load: suspend () -> T): Fetcher<T> {
    val scope = rememberCoroutineScope()
    val fetcher = remember(keys = keys) { Fetcher(scope, load) }
    LaunchedEffect(fetcher) { fetcher.refresh() }
    LifecycleEventEffect(Lifecycle.Event.ON_RESUME) { fetcher.refreshIfStale() }
    return fetcher
}

/**
 * The shape every data-backed screen takes: a rotary-scrollable list inside
 * Wear's screen scaffold, rendering the four states a fetch can be in.
 *
 * The Refresh row at the end is the manual escape hatch for the one thing the
 * watch gives up by not holding a subscription — something changed on the phone
 * while this screen was already open.
 */
@Composable
fun <T> SuroScreen(
    fetcher: Fetcher<T>,
    title: String? = null,
    emptyMessage: String? = null,
    isEmpty: (T) -> Boolean = { false },
    content: TransformingLazyColumnScope.(T) -> Unit,
) {
    val state by fetcher.state.collectAsStateWithLifecycle()
    val listState = rememberTransformingLazyColumnState()

    ScreenScaffold(scrollState = listState) { contentPadding ->
        TransformingLazyColumn(state = listState, contentPadding = contentPadding) {
            if (title != null) {
                item { ListHeader { Text(title) } }
            }
            when (val current = state) {
                is LoadState.Loading -> item { LoadingRow() }
                is LoadState.Failed -> item { ErrorRow(current.offline) { fetcher.refresh() } }
                is LoadState.Content -> if (isEmpty(current.value)) {
                    item { MessageRow(emptyMessage ?: stringResource(R.string.list_empty)) }
                } else {
                    content(current.value)
                    item { RefreshRow { fetcher.refresh() } }
                }
            }
        }
    }
}

@Composable
fun LoadingRow() {
    Column(
        modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        CircularProgressIndicator()
    }
}

@Composable
fun MessageRow(message: String) {
    Text(
        text = message,
        textAlign = TextAlign.Center,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp, horizontal = 8.dp),
    )
}

@Composable
fun ErrorRow(offline: Boolean, onRetry: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        MessageRow(
            stringResource(
                if (offline) R.string.error_offline else R.string.error_generic,
            ),
        )
        FilledTonalButton(onClick = onRetry, modifier = Modifier.fillMaxWidth()) {
            Text(stringResource(R.string.try_again))
        }
    }
}

@Composable
fun RefreshRow(onRefresh: () -> Unit) {
    FilledTonalButton(
        onClick = onRefresh,
        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
    ) {
        Text(stringResource(R.string.refresh))
    }
}
