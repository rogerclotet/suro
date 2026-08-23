package dev.clotet.suro.wear.auth

import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.Wearable
import com.google.android.gms.wearable.WearableListenerService
import dev.clotet.suro.wear.ServiceLocator
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

/**
 * Receives the pairing ticket the phone app writes to the Data Layer.
 *
 * This runs whether or not the watch app is open, which is the point: the user
 * signs in on their phone, and by the time they raise their wrist the watch
 * already has a session. The service only stores and redeems — the UI reacts to
 * [AuthRepository.state] like it would to any other change.
 */
class WearAuthListenerService : WearableListenerService() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onDataChanged(events: DataEventBuffer) {
        val locator = ServiceLocator.from(applicationContext)
        for (event in events) {
            if (event.type != DataEvent.TYPE_CHANGED) continue
            val item = event.dataItem
            when (item.uri.path) {
                WearDataLayer.PATH_AUTH -> {
                    val map = DataMapItem.fromDataItem(item).dataMap
                    val secret = map.getString(WearDataLayer.KEY_SECRET) ?: continue
                    locator.tokenStore.pendingTicket = secret
                    scope.launch {
                        locator.authRepository.redeemPendingTicket()
                        acknowledge()
                    }
                }

                WearDataLayer.PATH_CONTEXT -> {
                    val map = DataMapItem.fromDataItem(item).dataMap
                    // Not authoritative — just a better first guess than "the
                    // first group alphabetically" when the watch has never been
                    // opened. The user can still switch groups on the watch.
                    map.getString(WearDataLayer.KEY_LAST_PROJECT_ID)?.let {
                        locator.preferences.setLastProjectIdIfUnset(it)
                    }
                }
            }
        }
    }

    /**
     * Tell the phone the ticket landed, so it stops re-pushing and deletes the
     * DataItem. Best-effort: if the phone is out of range the ticket simply
     * expires, and the next foreground mints another.
     */
    private suspend fun acknowledge() {
        runCatching {
            val nodes = Wearable.getNodeClient(applicationContext).connectedNodes.await()
            for (node in nodes) {
                Wearable.getMessageClient(applicationContext)
                    .sendMessage(node.id, WearDataLayer.PATH_AUTH_ACK, ByteArray(0))
                    .await()
            }
        }
    }
}
