package dev.clotet.suro.wear.ui.lists

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.wear.compose.foundation.lazy.TransformingLazyColumnScope
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.material3.CheckboxButton
import androidx.wear.compose.material3.Text
import dev.clotet.suro.wear.data.ListItem
import dev.clotet.suro.wear.data.ListWithItems
import dev.clotet.suro.wear.ui.common.Fetcher

/**
 * The checklist rows, shared by the list screen and the event screen — ticking
 * an item off an event's linked list has to behave identically to ticking it off
 * the list itself.
 *
 * The tap flips the row locally and then refetches. The optimism is for latency;
 * the refetch is for correctness, because the server may disagree: checking off
 * a *recurring* task doesn't complete it, it advances the due date and leaves it
 * open (see `listItems.setCompleted`).
 */
fun <T> TransformingLazyColumnScope.checklistItems(
    fetcher: Fetcher<T>,
    list: ListWithItems,
    replaceItem: (T, itemId: String, completed: Boolean) -> T,
    onToggle: (item: ListItem, completed: Boolean) -> Unit,
) {
    items(list.items, key = { it.id }) { item ->
        ChecklistRow(
            item = item,
            onToggle = { completed ->
                fetcher.optimistically { replaceItem(it, item.id, completed) }
                onToggle(item, completed)
            },
        )
    }
}

@Composable
private fun ChecklistRow(item: ListItem, onToggle: (Boolean) -> Unit) {
    CheckboxButton(
        checked = item.completed,
        onCheckedChange = onToggle,
        label = { Text(item.name) },
        secondaryLabel = item.category?.let { category -> { Text(category) } },
        modifier = Modifier.fillMaxWidth(),
    )
}
