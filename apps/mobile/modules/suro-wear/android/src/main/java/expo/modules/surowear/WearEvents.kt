package expo.modules.surowear

import java.util.concurrent.CopyOnWriteArrayList

/**
 * In-process fan-out from the Data Layer listener service to the JS module.
 *
 * The service and the module live in the same process, so a static registry is
 * all the plumbing this needs. When JS isn't running there are no listeners and
 * the event is dropped — which is the right outcome: the only two events are
 * "the watch got its ticket" and "the watch wants one", and both are things the
 * phone re-resolves on its next foreground anyway.
 */
internal object WearEvents {

    enum class Kind { AuthAck, TicketRequest }

    private val listeners = CopyOnWriteArrayList<(Kind) -> Unit>()

    fun addListener(listener: (Kind) -> Unit) {
        listeners.add(listener)
    }

    fun removeListener(listener: (Kind) -> Unit) {
        listeners.remove(listener)
    }

    fun emit(kind: Kind) {
        listeners.forEach { it(kind) }
    }
}
