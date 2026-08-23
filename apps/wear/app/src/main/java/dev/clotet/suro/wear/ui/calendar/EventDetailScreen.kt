package dev.clotet.suro.wear.ui.calendar

import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.res.stringResource
import androidx.wear.compose.material3.ListHeader
import androidx.wear.compose.material3.Text
import dev.clotet.suro.wear.R
import dev.clotet.suro.wear.data.EventDetail
import dev.clotet.suro.wear.ui.common.DateTimes
import dev.clotet.suro.wear.ui.common.MessageRow
import dev.clotet.suro.wear.ui.common.SuroScreen
import dev.clotet.suro.wear.ui.common.rememberFetcher
import dev.clotet.suro.wear.ui.lists.checklistItems
import dev.clotet.suro.wear.ui.lists.withItemCompleted
import kotlinx.coroutines.launch

/**
 * An event, plus its linked list inline — the reason the calendar is on the
 * watch at all. `events.get` already returns the list with its items, so ticking
 * a packing list off at the door is one screen, not a hop through Lists.
 */
@Composable
fun EventDetailScreen(
    eventId: String,
    loadEvent: suspend (String) -> EventDetail?,
    setCompleted: suspend (String, Boolean) -> Unit,
) {
    val fetcher = rememberFetcher(eventId) { loadEvent(eventId) }
    val scope = rememberCoroutineScope()

    SuroScreen(fetcher = fetcher, isEmpty = { it == null }) { event ->
        if (event == null) return@SuroScreen
        item { ListHeader { Text(event.name) } }
        item {
            MessageRow(
                if (event.allDay) {
                    stringResource(R.string.calendar_all_day)
                } else {
                    DateTimes.time(event.startAt)
                },
            )
        }
        event.description?.takeIf { it.isNotBlank() }?.let { description ->
            item { MessageRow(description) }
        }

        val list = event.list
        if (list == null) {
            item { MessageRow(stringResource(R.string.event_no_list)) }
        } else {
            item { ListHeader { Text(list.name) } }
            checklistItems(
                fetcher = fetcher,
                list = list,
                replaceItem = { current, itemId, completed ->
                    current?.copy(list = current.list?.withItemCompleted(itemId, completed))
                },
                onToggle = { item, completed ->
                    scope.launch {
                        runCatching { setCompleted(item.id, completed) }
                        fetcher.refresh()
                    }
                },
            )
        }
    }
}
