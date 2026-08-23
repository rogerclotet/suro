package dev.clotet.suro.wear.ui.expenses

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.material3.FilledTonalButton
import androidx.wear.compose.material3.ListHeader
import androidx.wear.compose.material3.Text
import androidx.wear.compose.material3.TitleCard
import dev.clotet.suro.wear.R
import dev.clotet.suro.wear.data.PotDetail
import dev.clotet.suro.wear.ui.common.MessageRow
import dev.clotet.suro.wear.ui.common.SuroScreen
import dev.clotet.suro.wear.ui.common.formatMoney
import dev.clotet.suro.wear.ui.common.rememberFetcher
import kotlin.math.abs

/** Spendings past this point are history; the wrist shows the recent few. */
private const val VISIBLE_SPENDINGS = 5

@Composable
fun PotDetailScreen(
    potId: String,
    currentUserId: String?,
    loadPot: suspend (String) -> PotDetail?,
    onAddExpense: () -> Unit,
) {
    val fetcher = rememberFetcher(potId) { loadPot(potId) }

    SuroScreen(fetcher = fetcher, isEmpty = { it == null }) { pot ->
        if (pot == null) return@SuroScreen
        item { ListHeader { Text(pot.name) } }
        item { MessageRow(balanceLabel(pot, currentUserId)) }
        item {
            FilledTonalButton(onClick = onAddExpense, modifier = Modifier.fillMaxWidth()) {
                Text(stringResource(R.string.expenses_add))
            }
        }

        val recent = pot.spendings.take(VISIBLE_SPENDINGS)
        if (recent.isNotEmpty()) {
            item { ListHeader { Text(stringResource(R.string.expenses_latest)) } }
            items(recent, key = { it.id }) { spending ->
                TitleCard(
                    onClick = {},
                    title = { Text(formatMoney(spending.amount)) },
                    subtitle = {
                        Text(
                            spending.description
                                ?: spending.fromName
                                ?: stringResource(R.string.expenses_unknown_member),
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}

/**
 * The one number worth showing on a watch: where you personally stand. Positive
 * balances mean the group owes you (the backend computes them in `getPot`).
 */
@Composable
private fun balanceLabel(pot: PotDetail, currentUserId: String?): String {
    val mine = pot.balances.firstOrNull { it.user.id == currentUserId }?.amount ?: 0.0
    // Sub-cent residue from an uneven split isn't a debt anybody settles.
    if (abs(mine) < 1.0) return stringResource(R.string.expenses_balance_even)
    return if (mine > 0) {
        stringResource(R.string.expenses_balance_owed, formatMoney(mine))
    } else {
        stringResource(R.string.expenses_balance_owe, formatMoney(abs(mine)))
    }
}
