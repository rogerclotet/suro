package dev.clotet.suro.wear.ui.home

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.wear.compose.material3.FilledTonalButton
import androidx.wear.compose.material3.Text
import dev.clotet.suro.wear.R
import dev.clotet.suro.wear.data.Project
import dev.clotet.suro.wear.ui.common.SuroScreen
import dev.clotet.suro.wear.ui.common.rememberFetcher

/**
 * The three things worth doing from a wrist, over the active group's name.
 * Tapping the header switches groups — a watch has no room for a persistent
 * switcher, and most people have one group they actually use.
 */
@Composable
fun HomeScreen(
    loadProjects: suspend () -> List<Project>,
    activeProjectId: String?,
    onActiveProject: (Project) -> Unit,
    onLists: () -> Unit,
    onCalendar: () -> Unit,
    onExpenses: () -> Unit,
    onSwitchGroup: () -> Unit,
) {
    val fetcher = rememberFetcher(activeProjectId) { loadProjects() }

    SuroScreen(fetcher = fetcher) { projects ->
        val active = projects.firstOrNull { it.id == activeProjectId } ?: projects.firstOrNull()
        // A watch that has never been told which group to use adopts the first
        // one. Without this the project-scoped screens have no id to query with
        // and bounce straight back here.
        if (active != null && active.id != activeProjectId) {
            item(key = "adopt-${active.id}") {
                LaunchedEffect(active.id) { onActiveProject(active) }
            }
        }
        item {
            FilledTonalButton(onClick = onSwitchGroup, modifier = Modifier.fillMaxWidth()) {
                Text(active?.name ?: stringResource(R.string.select_group))
            }
        }
        item {
            FilledTonalButton(onClick = onLists, modifier = Modifier.fillMaxWidth()) {
                Text(stringResource(R.string.nav_lists))
            }
        }
        item {
            FilledTonalButton(onClick = onCalendar, modifier = Modifier.fillMaxWidth()) {
                Text(stringResource(R.string.nav_calendar))
            }
        }
        item {
            FilledTonalButton(onClick = onExpenses, modifier = Modifier.fillMaxWidth()) {
                Text(stringResource(R.string.nav_expenses))
            }
        }
    }
}
