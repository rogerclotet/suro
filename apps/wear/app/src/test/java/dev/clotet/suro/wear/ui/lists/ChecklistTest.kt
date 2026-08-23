package dev.clotet.suro.wear.ui.lists

import dev.clotet.suro.wear.data.ListItem
import dev.clotet.suro.wear.data.ListWithItems
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ChecklistTest {

    private val list = ListWithItems(
        id = "list1",
        name = "Camping",
        items = listOf(
            ListItem(id = "a", name = "Tent", completed = false),
            ListItem(id = "b", name = "Stove", completed = true),
        ),
    )

    @Test
    fun `flips only the item that was tapped`() {
        val updated = list.withItemCompleted("a", true)

        assertTrue(updated.items.single { it.id == "a" }.completed)
        assertTrue(updated.items.single { it.id == "b" }.completed)
    }

    @Test
    fun `unticking works the same way`() {
        val updated = list.withItemCompleted("b", false)

        assertFalse(updated.items.single { it.id == "b" }.completed)
    }

    @Test
    fun `an unknown id leaves the list untouched`() {
        assertEquals(list, list.withItemCompleted("gone", true))
    }

    @Test
    fun `remaining counts only open items`() {
        assertEquals(1, list.remaining)
        assertFalse(list.isComplete)
        assertTrue(list.withItemCompleted("a", true).isComplete)
    }

    @Test
    fun `an empty list is not complete`() {
        // "0 of 0 done" would show a checkmark on a list nobody has filled in yet.
        assertFalse(list.copy(items = emptyList()).isComplete)
    }
}
