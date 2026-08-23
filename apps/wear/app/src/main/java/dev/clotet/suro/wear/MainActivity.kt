package dev.clotet.suro.wear

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.lifecycleScope
import dev.clotet.suro.wear.ui.SuroNavHost
import dev.clotet.suro.wear.ui.theme.SuroTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)

        val locator = ServiceLocator.from(this)

        // Redeem anything the phone pushed while the app was closed, and settle
        // the auth state before the first frame decides between Setup and Home.
        lifecycleScope.launch { locator.authRepository.accessToken() }

        setContent {
            SuroTheme {
                SuroNavHost(locator)
            }
        }
    }
}
