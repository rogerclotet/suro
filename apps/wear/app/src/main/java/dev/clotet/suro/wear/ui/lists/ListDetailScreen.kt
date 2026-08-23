package dev.clotet.suro.wear.ui.lists

import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.res.stringResource
import androidx.wear.compose.material3.ListHeader
import androidx.wear.compose.material3.Text
import dev.clotet.suro.wear.R
import dev.clotet.suro.wear.data.ListWithItems
import dev.clotet.suro.wear.ui.common.SuroScreen
import dev.clotet.suro.wear.ui.common.rememberFetcher
import kotlinx.coroutines.launch

@Composable
fun ListDetailScreen(
    listId: String,
    loadList: suspend (String) -> ListWithItems?,
    setCompleted: suspend (String, Boolean) -> Unit,
) {
    val fetcher = rememberFetcher(listId) { loadList(listId) }
    val scope = rememberCoroutineScope()

    SuroScreen(
        fetcher = fetcher,
        emptyMessage = stringResource(R.string.list_empty),
        // A deleted list comes back as null rather than an error, and an empty
        // one reads the same to the user: there is nothing here to tick.
        isEmpty = { it == null || it.items.isEmpty() },
    ) { list ->
        if (list == null) return@SuroScreen
        item { ListHeader { Text(list.name) } }
        checklistItems(
            fetcher = fetcher,
            list = list,
            replaceItem = { current, itemId, completed -> current?.withItemCompleted(itemId, completed) },
            onToggle = { item, completed ->
                scope.launch {
                    runCatching { setCompleted(item.id, completed) }
                    fetcher.refresh()
                }
            },
        )
    }
}

/** Local mirror of the toggle, so the checkbox moves on the same frame as the tap. */
internal fun ListWithItems.withItemCompleted(itemId: String, completed: Boolean): ListWithItems =
    copy(items = items.map { if (it.id == itemId) it.copy(completed = completed) else it })
