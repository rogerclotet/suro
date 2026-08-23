package dev.clotet.suro.wear.ui.calendar

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.wear.compose.material3.ListHeader
import androidx.wear.compose.material3.Text
import androidx.wear.compose.material3.TitleCard
import dev.clotet.suro.wear.R
import dev.clotet.suro.wear.data.Event
import dev.clotet.suro.wear.ui.common.DateTimes
import dev.clotet.suro.wear.ui.common.SuroScreen
import dev.clotet.suro.wear.ui.common.rememberFetcher
import java.time.LocalDate

/** How far ahead the watch looks. Beyond a month it stops being a glance. */
private const val WINDOW_DAYS = 30L

@Composable
fun CalendarScreen(
    projectId: String,
    loadEvents: suspend (String, Long, Long) -> List<Event>,
    onOpen: (Event) -> Unit,
) {
    val fetcher = rememberFetcher(projectId) {
        loadEvents(projectId, DateTimes.startOfToday(), DateTimes.daysFromToday(WINDOW_DAYS))
    }

    SuroScreen(
        fetcher = fetcher,
        title = stringResource(R.string.nav_calendar),
        emptyMessage = stringResource(R.string.calendar_empty),
        isEmpty = { it.isEmpty() },
    ) { events ->
        // `listByRange` already sorts by start, so grouping in order is enough
        // to produce day headers without a second sort.
        var lastDay: LocalDate? = null
        for (event in events) {
            val day = DateTimes.localDate(event.startAt)
            if (day != lastDay) {
                lastDay = day
                item(key = "day-$day") { ListHeader { Text(dayLabel(day)) } }
            }
            item(key = event.id) {
                TitleCard(
                    onClick = { onOpen(event) },
                    title = { Text(event.name) },
                    subtitle = {
                        Text(
                            if (event.allDay) {
                                stringResource(R.string.calendar_all_day)
                            } else {
                                DateTimes.time(event.startAt)
                            },
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}

@Composable
private fun dayLabel(day: LocalDate): String {
    val today = LocalDate.now()
    return when (day) {
        today -> stringResource(R.string.calendar_today)
        today.plusDays(1) -> stringResource(R.string.calendar_tomorrow)
        else -> DateTimes.day(day)
    }
}
