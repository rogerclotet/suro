package dev.clotet.suro.wear

import android.app.Application

class SuroWearApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Touch the locator early so the Data Layer listener service — which can
        // fire before any Activity exists — never races to build it.
        ServiceLocator.from(this)
    }
}
