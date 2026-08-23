package dev.clotet.suro.wear.ui.groups

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.material3.FilledTonalButton
import androidx.wear.compose.material3.Text
import dev.clotet.suro.wear.R
import dev.clotet.suro.wear.data.Project
import dev.clotet.suro.wear.ui.common.SuroScreen
import dev.clotet.suro.wear.ui.common.rememberFetcher

@Composable
fun GroupsScreen(
    loadProjects: suspend () -> List<Project>,
    onSelect: (Project) -> Unit,
) {
    val fetcher = rememberFetcher { loadProjects() }

    SuroScreen(
        fetcher = fetcher,
        title = stringResource(R.string.nav_groups),
        isEmpty = { it.isEmpty() },
    ) { projects ->
        items(projects, key = { it.id }) { project ->
            FilledTonalButton(
                onClick = { onSelect(project) },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(project.name)
            }
        }
    }
}
