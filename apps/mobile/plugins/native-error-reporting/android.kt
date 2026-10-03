if (!BuildConfig.DEBUG) {
// Native events bypass the JavaScript beforeSend callback.
RNSentrySDK.init(this) { options ->
  options.setBeforeSend { event, _ ->
    val filtered = io.sentry.SentryEvent()
    filtered.eventId = event.eventId
    filtered.timestamp = event.timestamp
    filtered.level = event.level
    filtered.message = event.message
    filtered.exceptions = event.exceptions
    filtered.threads = event.threads
    filtered.debugMeta = event.debugMeta
    filtered.platform = event.platform
    filtered.release = event.release
    filtered.dist = event.dist
    filtered.environment = event.environment
    filtered.sdk = event.sdk
    filtered.user = io.sentry.protocol.User().apply { ipAddress = "0.0.0.0" }
    filtered
  }
}
}
