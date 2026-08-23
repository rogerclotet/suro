package dev.clotet.suro.wear.ui.expenses

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.material3.Text
import androidx.wear.compose.material3.TitleCard
import dev.clotet.suro.wear.R
import dev.clotet.suro.wear.data.PotOverviewEntry
import dev.clotet.suro.wear.data.PotsOverview
import dev.clotet.suro.wear.ui.common.SuroScreen
import dev.clotet.suro.wear.ui.common.formatMoney
import dev.clotet.suro.wear.ui.common.rememberFetcher

@Composable
fun PotsScreen(
    projectId: String,
    loadPots: suspend (String) -> PotsOverview,
    onOpen: (PotOverviewEntry) -> Unit,
) {
    val fetcher = rememberFetcher(projectId) { loadPots(projectId) }

    SuroScreen(
        fetcher = fetcher,
        title = stringResource(R.string.nav_expenses),
        emptyMessage = stringResource(R.string.expenses_empty),
        isEmpty = { it.active.isEmpty() },
    ) { overview ->
        items(overview.active, key = { it.id }) { pot ->
            TitleCard(
                onClick = { onOpen(pot) },
                title = { Text(pot.name) },
                subtitle = {
                    Text(stringResource(R.string.expenses_total_spent, formatMoney(pot.totalSpent)))
                },
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
