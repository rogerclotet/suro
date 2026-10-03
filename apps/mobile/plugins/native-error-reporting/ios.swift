#if !DEBUG
// Native events bypass the JavaScript beforeSend callback.
RNSentrySDK.start(configureOptions: { options in
  options.beforeSend = { event in
    let filtered = Event(level: event.level)
    filtered.eventId = event.eventId
    filtered.timestamp = event.timestamp
    filtered.message = event.message
    filtered.exceptions = event.exceptions
    filtered.threads = event.threads
    filtered.stacktrace = event.stacktrace
    filtered.debugMeta = event.debugMeta
    filtered.platform = event.platform
    filtered.releaseName = event.releaseName
    filtered.dist = event.dist
    filtered.environment = event.environment
    filtered.sdk = event.sdk
    let user = User()
    user.ipAddress = "0.0.0.0"
    filtered.user = user
    return filtered
  }
})
#endif
