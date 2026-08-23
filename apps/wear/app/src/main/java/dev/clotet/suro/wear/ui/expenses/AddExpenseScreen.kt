package dev.clotet.suro.wear.ui.expenses

import android.app.Activity
import android.content.Intent
import android.speech.RecognizerIntent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.wear.compose.foundation.lazy.TransformingLazyColumn
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.foundation.lazy.rememberTransformingLazyColumnState
import androidx.wear.compose.material3.FilledTonalButton
import androidx.wear.compose.material3.ListHeader
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.ScreenScaffold
import androidx.wear.compose.material3.Text
import dev.clotet.suro.wear.R
import dev.clotet.suro.wear.data.PotDetail
import dev.clotet.suro.wear.data.PotMember
import dev.clotet.suro.wear.ui.common.LoadState
import dev.clotet.suro.wear.ui.common.LoadingRow
import dev.clotet.suro.wear.ui.common.MessageRow
import dev.clotet.suro.wear.ui.common.rememberFetcher
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kotlinx.coroutines.launch

/**
 * Adding an expense, one decision per screen.
 *
 * The phone puts amount, description, payer and split on a single form. A watch
 * can't, and shouldn't try — each step here is a full screen with one job, and
 * swiping back is the undo. The steps mirror the phone's field order so the
 * muscle memory carries over.
 */
private enum class Step { Amount, Description, Payer, Split, Saving }

@Composable
fun AddExpenseScreen(
    potId: String,
    currentUserId: String?,
    loadPot: suspend (String) -> PotDetail?,
    createSpending: suspend (potId: String, cents: Int, description: String?, from: String, to: String?) -> Unit,
    onDone: () -> Unit,
) {
    val fetcher = rememberFetcher(potId) { loadPot(potId) }
    val state by fetcher.state.collectAsStateWithLifecycle()

    when (val current = state) {
        is LoadState.Loading -> CenteredScreen { LoadingRow() }
        is LoadState.Failed -> CenteredScreen {
            MessageRow(
                stringResource(
                    if (current.offline) R.string.error_offline else R.string.error_generic,
                ),
            )
        }
        is LoadState.Content -> {
            val pot = current.value
            val members = pot?.payableMembers.orEmpty()
            if (pot == null || members.isEmpty()) {
                CenteredScreen { MessageRow(stringResource(R.string.expenses_no_members)) }
            } else {
                AddExpenseFlow(
                    pot = pot,
                    members = members,
                    currentUserId = currentUserId,
                    createSpending = createSpending,
                    onDone = onDone,
                )
            }
        }
    }
}

@Composable
private fun AddExpenseFlow(
    pot: PotDetail,
    members: List<PotMember>,
    currentUserId: String?,
    createSpending: suspend (String, Int, String?, String, String?) -> Unit,
    onDone: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    var step by remember { mutableStateOf(Step.Amount) }
    var cents by remember { mutableIntStateOf(0) }
    var description by remember { mutableStateOf<String?>(null) }
    // Default to whoever is wearing the watch — they're the one who just paid,
    // the overwhelming majority of the time.
    var payerId by remember {
        mutableStateOf(members.firstOrNull { it.id == currentUserId }?.id ?: members.first().id)
    }
    var failed by remember { mutableStateOf(false) }

    val voiceLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult(),
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            description = result.data
                ?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
                ?.firstOrNull()
        }
        step = Step.Payer
    }

    fun save(recipientId: String?) {
        step = Step.Saving
        failed = false
        scope.launch {
            val result = runCatching {
                createSpending(
                    pot.id,
                    cents,
                    description,
                    requireNotNull(payerId) { "A payable member always has an id" },
                    recipientId,
                )
            }
            if (result.isSuccess) {
                onDone()
            } else {
                failed = true
                step = Step.Split
            }
        }
    }

    when (step) {
        Step.Amount -> ScreenScaffold {
            AmountPicker(
                onConfirm = {
                    cents = it
                    step = Step.Description
                },
            )
        }

        Step.Description -> DescriptionStep(
            onSpeak = { voiceLauncher.launch(speechIntent(context.getString(R.string.expenses_speak_description))) },
            onSkip = { step = Step.Payer },
        )

        Step.Payer -> ChoiceStep(
            title = stringResource(R.string.expenses_payer),
            options = members,
            onSelect = {
                payerId = it.id
                step = Step.Split
            },
        )

        Step.Split -> SplitStep(
            members = members.filter { it.id != payerId },
            failed = failed,
            onEqual = { save(null) },
            onSingle = { save(it.id) },
        )

        Step.Saving -> CenteredScreen {
            MessageRow(stringResource(R.string.expenses_saving))
            LoadingRow()
        }
    }
}

@Composable
private fun DescriptionStep(onSpeak: () -> Unit, onSkip: () -> Unit) {
    ScreenScaffold {
        Column(
            modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterVertically),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = stringResource(R.string.expenses_description),
                style = MaterialTheme.typography.titleMedium,
                textAlign = TextAlign.Center,
            )
            FilledTonalButton(onClick = onSpeak, modifier = Modifier.fillMaxWidth()) {
                Text(stringResource(R.string.expenses_speak_description))
            }
            FilledTonalButton(onClick = onSkip, modifier = Modifier.fillMaxWidth()) {
                Text(stringResource(R.string.expenses_description_skip))
            }
        }
    }
}

@Composable
private fun ChoiceStep(
    title: String,
    options: List<PotMember>,
    onSelect: (PotMember) -> Unit,
) {
    val listState = rememberTransformingLazyColumnState()
    ScreenScaffold(scrollState = listState) { contentPadding ->
        TransformingLazyColumn(state = listState, contentPadding = contentPadding) {
            item { ListHeader { Text(title) } }
            items(options, key = { it.id.orEmpty() }) { member ->
                FilledTonalButton(
                    onClick = { onSelect(member) },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(member.name ?: stringResource(R.string.expenses_unknown_member))
                }
            }
        }
    }
}

@Composable
private fun SplitStep(
    members: List<PotMember>,
    failed: Boolean,
    onEqual: () -> Unit,
    onSingle: (PotMember) -> Unit,
) {
    val listState = rememberTransformingLazyColumnState()
    ScreenScaffold(scrollState = listState) { contentPadding ->
        TransformingLazyColumn(state = listState, contentPadding = contentPadding) {
            item { ListHeader { Text(stringResource(R.string.expenses_split)) } }
            if (failed) {
                item { MessageRow(stringResource(R.string.expenses_save_error)) }
            }
            item {
                FilledTonalButton(onClick = onEqual, modifier = Modifier.fillMaxWidth()) {
                    Text(stringResource(R.string.expenses_split_equally))
                }
            }
            if (members.isNotEmpty()) {
                item { ListHeader { Text(stringResource(R.string.expenses_split_to)) } }
                items(members, key = { it.id.orEmpty() }) { member ->
                    FilledTonalButton(
                        onClick = { onSingle(member) },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(member.name ?: stringResource(R.string.expenses_unknown_member))
                    }
                }
            }
        }
    }
}

@Composable
private fun CenteredScreen(content: @Composable () -> Unit) {
    ScreenScaffold {
        Column(
            modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterVertically),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            content()
        }
    }
}

private fun speechIntent(prompt: String): Intent =
    Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
        .putExtra(
            RecognizerIntent.EXTRA_LANGUAGE_MODEL,
            RecognizerIntent.LANGUAGE_MODEL_FREE_FORM,
        )
        .putExtra(RecognizerIntent.EXTRA_PROMPT, prompt)
