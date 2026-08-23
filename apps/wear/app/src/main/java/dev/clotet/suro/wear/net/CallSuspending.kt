package dev.clotet.suro.wear.net

import java.io.IOException
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.suspendCancellableCoroutine
import okhttp3.Call
import okhttp3.Callback
import okhttp3.Response

/**
 * OkHttp's enqueue as a cancellable suspend call. Using this rather than
 * `execute()` on Dispatchers.IO means a screen the user swiped away actually
 * cancels its in-flight request instead of holding the radio awake.
 */
suspend fun Call.executeSuspending(): Response = suspendCancellableCoroutine { continuation ->
    enqueue(object : Callback {
        override fun onResponse(call: Call, response: Response) {
            continuation.resume(response)
        }

        override fun onFailure(call: Call, e: IOException) {
            if (continuation.isCancelled) return
            continuation.resumeWithException(e)
        }
    })
    continuation.invokeOnCancellation {
        runCatching { cancel() }
    }
}
