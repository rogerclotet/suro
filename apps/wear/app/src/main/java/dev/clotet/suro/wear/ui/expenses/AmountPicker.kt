package dev.clotet.suro.wear.ui.expenses

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.wear.compose.material3.FilledTonalButton
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.PickerGroup
import androidx.wear.compose.material3.Text
import androidx.wear.compose.material3.rememberPickerState
import dev.clotet.suro.wear.R

/**
 * Amount entry, as two rotary-scrollable columns: euros and cents.
 *
 * The obvious design is a phone-style numeric keypad, and it was the first thing
 * built here — but three columns by four rows of 48dp touch targets does not fit
 * a 454px round screen, and shrinking the keys below the touch-target floor to
 * make it fit is worse than not shipping it. A picker is also what Wear itself
 * uses for numbers (see TimePicker), so it gets crown/rotary scrolling for free,
 * which is the fastest way to move through a range on a watch anyway.
 */
@Composable
fun AmountPicker(
    onConfirm: (cents: Int) -> Unit,
) {
    val euros = rememberPickerState(initialNumberOfOptions = MAX_EUROS + 1)
    val cents = rememberPickerState(initialNumberOfOptions = 100, shouldRepeatOptions = true)
    // Which column the crown and taps drive. Euros first: it's the digit people
    // actually change.
    var focused by remember { mutableIntStateOf(0) }

    Column(
        modifier = Modifier.fillMaxSize().padding(horizontal = 8.dp, vertical = 6.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = stringResource(R.string.expenses_amount),
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        PickerGroup(
            modifier = Modifier.size(width = 180.dp, height = 90.dp),
        ) {
            PickerGroupItem(
                pickerState = euros,
                selected = focused == 0,
                onSelected = { focused = 0 },
                modifier = Modifier.size(width = 76.dp, height = 90.dp),
                option = { index, _ -> PickerText(index.toString()) },
            )
            PickerGroupItem(
                pickerState = cents,
                selected = focused == 1,
                onSelected = { focused = 1 },
                modifier = Modifier.size(width = 76.dp, height = 90.dp),
                // Two digits so 5 cents reads "05", not "5".
                option = { index, _ -> PickerText(index.toString().padStart(2, '0')) },
            )
        }

        FilledTonalButton(
            onClick = { onConfirm(euros.selectedOptionIndex * 100 + cents.selectedOptionIndex) },
            enabled = euros.selectedOptionIndex > 0 || cents.selectedOptionIndex > 0,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(stringResource(R.string.expenses_save))
        }
    }
}

@Composable
private fun PickerText(value: String) {
    Text(text = value, style = MaterialTheme.typography.displaySmall)
}

/** Nobody splits a four-figure dinner from a watch. */
private const val MAX_EUROS = 999
