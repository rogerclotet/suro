package dev.clotet.suro.wear.ui.common

import java.util.Locale
import org.junit.Assert.assertEquals
import org.junit.Test

class FormatTest {

    @Test
    fun `formats cents as euros with both decimals`() {
        val locale = Locale.forLanguageTag("en-IE")
        assertEquals("\u20ac12.50", formatMoney(1250.0, locale))
        // Whole amounts still show cents, so a column of figures lines up.
        assertEquals("\u20ac5.00", formatMoney(500.0, locale))
        assertEquals("\u20ac0.05", formatMoney(5.0, locale))
    }

    @Test
    fun `follows the locale's own currency conventions`() {
        // Catalan puts the symbol last with a comma decimal; the watch renders
        // whatever the system locale asks for.
        assertEquals("12,50\u00a0\u20ac", formatMoney(1250.0, Locale.forLanguageTag("ca-ES")))
    }
}
