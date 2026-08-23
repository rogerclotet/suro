package dev.clotet.suro.wear.ui.theme

import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.Typography
import dev.clotet.suro.wear.R

/**
 * Convergence is Suro's display face on web and phone, so the watch uses it too.
 * It only exists at weight 400 — bold is synthesized, same as everywhere else.
 */
private val Convergence = FontFamily(Font(R.font.convergence, FontWeight.Normal))

/**
 * Wear's default type scale with the family swapped. The sizes are tuned by
 * Google for watch-sized screens and viewing distance; overriding them is how
 * watch apps end up unreadable, so only the family changes here.
 */
val SuroTypography: Typography
    @androidx.compose.runtime.Composable
    get() = MaterialTheme.typography.let { base ->
        Typography(
            displayLarge = base.displayLarge.copy(fontFamily = Convergence),
            displayMedium = base.displayMedium.copy(fontFamily = Convergence),
            displaySmall = base.displaySmall.copy(fontFamily = Convergence),
            titleLarge = base.titleLarge.copy(fontFamily = Convergence),
            titleMedium = base.titleMedium.copy(fontFamily = Convergence),
            titleSmall = base.titleSmall.copy(fontFamily = Convergence),
        )
    }
