package dev.clotet.suro.wear.auth

import android.content.Context
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.tasks.await

/**
 * Asks the phone for a fresh pairing ticket.
 *
 * The phone pushes one on its own whenever it comes to the foreground, so this
 * is the impatient path: the user is staring at the setup screen right now, and
 * if the phone app happens to be running it can answer immediately instead of
 * making them wait for the next launch.
 */
class PairingRequester(private val context: Context) {

    /** True when a phone with the companion app is reachable. */
    suspend fun requestTicket(): Boolean = runCatching {
        val nodes = Wearable.getNodeClient(context).connectedNodes.await()
        if (nodes.isEmpty()) return@runCatching false
        for (node in nodes) {
            Wearable.getMessageClient(context)
                .sendMessage(node.id, WearDataLayer.PATH_AUTH_REQUEST, ByteArray(0))
                .await()
        }
        true
    }.getOrDefault(false)
}
