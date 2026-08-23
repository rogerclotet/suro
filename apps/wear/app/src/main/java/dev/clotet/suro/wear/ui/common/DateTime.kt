package dev.clotet.suro.wear.ui.common

import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

/**
 * Event timestamps are epoch millis. All-day events store `endAt` as the day
 * after the last one (a half-open range — see the `events` table), so anything
 * that displays a range has to step back a day; the watch only shows start
 * times, so it doesn't have to care.
 */
object DateTimes {

    private val timeFormat: DateTimeFormatter =
        DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT)

    private val dayFormat: DateTimeFormatter =
        DateTimeFormatter.ofPattern("EEE d MMM", Locale.getDefault())

    fun localDate(epochMillis: Double, zone: ZoneId = ZoneId.systemDefault()): LocalDate =
        Instant.ofEpochMilli(epochMillis.toLong()).atZone(zone).toLocalDate()

    fun time(epochMillis: Double, zone: ZoneId = ZoneId.systemDefault()): String =
        Instant.ofEpochMilli(epochMillis.toLong()).atZone(zone).format(timeFormat)

    fun day(date: LocalDate): String = date.format(dayFormat)

    /** Milliseconds at the start of today, the calendar window's lower bound. */
    fun startOfToday(zone: ZoneId = ZoneId.systemDefault()): Long =
        LocalDate.now(zone).atStartOfDay(zone).toInstant().toEpochMilli()

    fun daysFromToday(days: Long, zone: ZoneId = ZoneId.systemDefault()): Long =
        LocalDate.now(zone).plusDays(days).atStartOfDay(zone).toInstant().toEpochMilli()
}
