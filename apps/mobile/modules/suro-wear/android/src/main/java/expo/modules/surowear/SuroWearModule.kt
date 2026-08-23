package expo.modules.surowear

import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.tasks.await

/**
 * The phone's half of the Wear pairing bridge.
 *
 * The watch can't sign in on its own — no keyboard worth the name — so the phone
 * mints a one-time Convex Auth ticket while it's signed in and writes it to the
 * Data Layer, where it syncs to the watch even if the watch app is closed. The
 * watch redeems it for a session of its own; see `packages/backend/convex/
 * WatchPairing.ts` for why it must be a separate session and not a copy of this
 * device's.
 *
 * Android-only by design: watchOS has no equivalent, and Apple Watch support
 * would be a different app, not a different backend for this one.
 */
class SuroWearModule : Module() {

    private val listener: (WearEvents.Kind) -> Unit = { kind ->
        when (kind) {
            WearEvents.Kind.AuthAck -> sendEvent(EVENT_AUTH_ACK)
            WearEvents.Kind.TicketRequest -> sendEvent(EVENT_TICKET_REQUEST)
        }
    }

    override fun definition() = ModuleDefinition {
        Name("SuroWear")

        Events(EVENT_AUTH_ACK, EVENT_TICKET_REQUEST)

        OnStartObserving { WearEvents.addListener(listener) }
        OnStopObserving { WearEvents.removeListener(listener) }

        AsyncFunction("isWatchConnected") Coroutine { ->
            runCatching {
                Wearable.getNodeClient(context).connectedNodes.await().isNotEmpty()
            }.getOrDefault(false)
        }

        AsyncFunction("pushAuthTicket") Coroutine { secret: String, convexUrl: String ->
            val request = PutDataMapRequest.create(WearPaths.AUTH).apply {
                dataMap.putString(WearPaths.KEY_SECRET, secret)
                dataMap.putString(WearPaths.KEY_CONVEX_URL, convexUrl)
                // The Data Layer drops a put whose payload is byte-identical to
                // what's already there, so a re-mint with the same secret would
                // silently not sync. The timestamp guarantees each push differs.
                dataMap.putLong(WearPaths.KEY_ISSUED_AT, System.currentTimeMillis())
            }
            // Urgent: the user is very likely staring at the watch right now.
            Wearable.getDataClient(context)
                .putDataItem(request.asPutDataRequest().setUrgent())
                .await()
            Unit
        }

        AsyncFunction("pushContext") Coroutine { lastProjectId: String?, locale: String ->
            val request = PutDataMapRequest.create(WearPaths.CONTEXT).apply {
                lastProjectId?.let { dataMap.putString(WearPaths.KEY_LAST_PROJECT_ID, it) }
                dataMap.putString(WearPaths.KEY_LOCALE, locale)
            }
            Wearable.getDataClient(context).putDataItem(request.asPutDataRequest()).await()
            Unit
        }

        AsyncFunction("clearAuth") Coroutine { ->
            // Called on ack and on sign-out: a redeemed ticket is spent, and a
            // signed-out phone shouldn't leave one lying around to be replayed.
            runCatching {
                Wearable.getDataClient(context)
                    .deleteDataItems(dataItemUri(WearPaths.AUTH))
                    .await()
            }
            Unit
        }
    }

    private val context
        get() = requireNotNull(appContext.reactContext) {
            "SuroWear needs a React context"
        }

    private fun dataItemUri(path: String) =
        android.net.Uri.Builder().scheme("wear").path(path).build()

    private companion object {
        const val EVENT_AUTH_ACK = "onAuthAck"
        const val EVENT_TICKET_REQUEST = "onTicketRequest"
    }
}
