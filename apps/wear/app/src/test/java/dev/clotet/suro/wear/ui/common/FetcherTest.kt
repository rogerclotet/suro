package dev.clotet.suro.wear.ui.common

import dev.clotet.suro.wear.net.ConvexHttp
import java.io.IOException
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class FetcherTest {

    @Test
    fun `exposes loaded content`() = runTest {
        val fetcher = Fetcher(TestScope(testScheduler)) { "loaded" }
        fetcher.refresh()
        runCurrent()

        assertEquals(LoadState.Content("loaded"), fetcher.state.value)
    }

    @Test
    fun `reports a transport failure as offline`() = runTest {
        val fetcher = Fetcher<String>(TestScope(testScheduler)) { throw IOException("no route") }
        fetcher.refresh()
        runCurrent()

        assertEquals(LoadState.Failed(offline = true), fetcher.state.value)
    }

    @Test
    fun `reports a server error as not offline`() = runTest {
        // The radio worked fine; Convex just said no. Telling the user they're
        // offline would send them to fiddle with Bluetooth for nothing.
        val fetcher = Fetcher<String>(TestScope(testScheduler)) {
            throw ConvexHttp.ConvexException("List not found")
        }
        fetcher.refresh()
        runCurrent()

        assertEquals(LoadState.Failed(offline = false), fetcher.state.value)
    }

    @Test
    fun `keeps content on screen while refetching`() = runTest {
        var value = "first"
        val fetcher = Fetcher(TestScope(testScheduler)) { value }
        fetcher.refresh()
        runCurrent()

        value = "second"
        fetcher.refresh()
        // Mid-flight the old content is still what's rendered — a spinner
        // replacing readable data is a downgrade.
        assertEquals(LoadState.Content("first"), fetcher.state.value)

        runCurrent()
        assertEquals(LoadState.Content("second"), fetcher.state.value)
    }

    @Test
    fun `refreshIfStale skips a refetch while the data is fresh`() = runTest {
        var loads = 0
        val fetcher = Fetcher(TestScope(testScheduler)) { loads++ }
        fetcher.refresh()
        runCurrent()

        fetcher.refreshIfStale()
        runCurrent()

        assertEquals(1, loads)
    }

    @Test
    fun `refreshIfStale loads when nothing has been fetched yet`() = runTest {
        var loads = 0
        val fetcher = Fetcher(TestScope(testScheduler)) { loads++ }

        fetcher.refreshIfStale()
        runCurrent()

        assertEquals(1, loads)
    }

    @Test
    fun `refreshIfStale leaves a load that is already in flight alone`() = runTest {
        // The screen's initial fetch and the first ON_RESUME land together;
        // restarting the one for the other would just delay the first paint.
        var loads = 0
        val fetcher = Fetcher(TestScope(testScheduler)) { loads++ }
        fetcher.refresh()

        fetcher.refreshIfStale()
        runCurrent()

        assertEquals(1, loads)
    }

    @Test
    fun `optimistically rewrites the content in place`() = runTest {
        val fetcher = Fetcher(TestScope(testScheduler)) { 1 }
        fetcher.refresh()
        runCurrent()

        fetcher.optimistically { it + 1 }

        assertEquals(LoadState.Content(2), fetcher.state.value)
    }

    @Test
    fun `optimistically does nothing before the first load lands`() = runTest {
        val fetcher = Fetcher<Int>(TestScope(testScheduler)) { 1 }

        fetcher.optimistically { it + 1 }

        assertTrue(fetcher.state.value is LoadState.Loading)
    }
}
