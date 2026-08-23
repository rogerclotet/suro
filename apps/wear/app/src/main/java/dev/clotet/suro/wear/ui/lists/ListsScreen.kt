package dev.clotet.suro.wear.ui.lists

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.material3.ListHeader
import androidx.wear.compose.material3.Text
import androidx.wear.compose.material3.TitleCard
import dev.clotet.suro.wear.R
import dev.clotet.suro.wear.data.ListWithItems
import dev.clotet.suro.wear.data.ListsOverview
import dev.clotet.suro.wear.ui.common.SuroScreen
import dev.clotet.suro.wear.ui.common.rememberFetcher

/**
 * The project's open lists, favorites first. Completed ones are left on the
 * phone — the query asks for `completedLimit = 0`, so they never cross the wire.
 */
@Composable
fun ListsScreen(
    projectId: String,
    loadLists: suspend (String) -> ListsOverview,
    onOpen: (ListWithItems) -> Unit,
) {
    val fetcher = rememberFetcher(projectId) { loadLists(projectId) }

    SuroScreen(
        fetcher = fetcher,
        title = stringResource(R.string.nav_lists),
        emptyMessage = stringResource(R.string.lists_empty),
        isEmpty = { it.active.isEmpty() },
    ) { overview ->
        val (favorites, others) = overview.active.partition { it.favorite }
        if (favorites.isNotEmpty()) {
            item { ListHeader { Text(stringResource(R.string.lists_favorites)) } }
            items(favorites, key = { it.id }) { ListRow(it, onOpen) }
        }
        items(others, key = { it.id }) { ListRow(it, onOpen) }
    }
}

@Composable
private fun ListRow(list: ListWithItems, onOpen: (ListWithItems) -> Unit) {
    TitleCard(
        onClick = { onOpen(list) },
        title = { Text(list.name) },
        subtitle = {
            Text(
                if (list.isComplete) {
                    stringResource(R.string.list_all_done)
                } else {
                    stringResource(R.string.list_items_remaining, list.remaining, list.items.size)
                },
            )
        },
        modifier = Modifier.fillMaxWidth(),
    )
}
