package dev.clotet.suro.wear.ui.common

import java.text.NumberFormat
import java.util.Currency
import java.util.Locale

/**
 * Amounts are stored in cents (see the `spendings` table), and the app is
 * euro-only today — `expenses.createSpending` hard-codes the currency too.
 */
private const val CURRENCY_CODE = "EUR"

fun formatMoney(cents: Double, locale: Locale = Locale.getDefault()): String {
    val format = NumberFormat.getCurrencyInstance(locale).apply {
        currency = Currency.getInstance(CURRENCY_CODE)
        maximumFractionDigits = 2
        minimumFractionDigits = 2
    }
    return format.format(cents / 100.0)
}
