package expo.modules.surowear

import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService

/** Receives the watch's two messages and hands them to JS if it's listening. */
class SuroWearListenerService : WearableListenerService() {

    override fun onMessageReceived(event: MessageEvent) {
        when (event.path) {
            WearPaths.AUTH_ACK -> WearEvents.emit(WearEvents.Kind.AuthAck)
            WearPaths.AUTH_REQUEST -> WearEvents.emit(WearEvents.Kind.TicketRequest)
        }
    }
}
