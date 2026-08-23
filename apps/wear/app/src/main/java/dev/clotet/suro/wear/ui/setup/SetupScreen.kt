package dev.clotet.suro.wear.ui.setup

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.ScreenScaffold
import androidx.wear.compose.material3.Text
import dev.clotet.suro.wear.R
import dev.clotet.suro.wear.auth.PairingRequester

/**
 * What the watch shows until the phone hands it a session.
 *
 * There is nothing to tap: the watch can't sign in on its own (no keyboard worth
 * the name), so the only path forward is opening Suro on the phone, which pushes
 * a pairing ticket over the Data Layer. We nudge the phone once on arrival in
 * case its app is already running, then wait — the Data Layer listener flips the
 * whole app over to Home the moment a ticket lands.
 */
@Composable
fun SetupScreen(pairingRequester: PairingRequester) {
    var phoneReachable by remember { mutableStateOf<Boolean?>(null) }

    LaunchedEffect(Unit) {
        phoneReachable = pairingRequester.requestTicket()
    }

    ScreenScaffold {
        Column(
            modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterVertically),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = stringResource(R.string.setup_title),
                style = MaterialTheme.typography.titleMedium,
                textAlign = TextAlign.Center,
            )
            Text(
                text = stringResource(
                    when (phoneReachable) {
                        true -> R.string.setup_waiting
                        false -> R.string.setup_failed
                        null -> R.string.setup_body
                    },
                ),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
        }
    }
}
