import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
}

/**
 * The monorepo root `package.json` is the single version of record (see
 * apps/mobile/app.config.ts, which reads the same field for the phone app).
 */
val appVersionName: String = run {
    val packageJson = rootProject.file("../../package.json").readText()
    Regex("\"version\"\\s*:\\s*\"([^\"]+)\"").find(packageJson)?.groupValues?.get(1)
        ?: error("Could not read \"version\" from the monorepo root package.json")
}

/**
 * The watch ships in the same Play listing as the phone app, under the Wear OS
 * form factor, which means it shares the applicationId *and* the versionCode
 * namespace — Play rejects a duplicate code across form factors. The phone's
 * codes are small and EAS-managed (`appVersionSource: "remote"`), so the watch
 * starts a million above and derives its code from the shared version instead of
 * keeping a counter that could drift into the phone's range.
 */
val appVersionCode: Int = run {
    val (major, minor, patch) = appVersionName.split(".").map { it.toInt() }
    1_000_000 + major * 10_000 + minor * 100 + patch
}

/**
 * The Convex deployment the watch talks to.
 *
 * Read from the phone app's `.env` so both clients point at the same deployment
 * without a second copy of the URL to keep in sync — `SURO_WEAR_CONVEX_URL`
 * overrides it for CI and one-off builds. An empty value is a build error rather
 * than a runtime surprise: without it every request fails, and OkHttp's
 * complaint about a missing URL scheme says nothing about the real cause.
 */
val convexUrl: String = run {
    val fromEnv = System.getenv("SURO_WEAR_CONVEX_URL")
    if (!fromEnv.isNullOrBlank()) return@run fromEnv
    val dotenv = rootProject.file("../mobile/.env")
    if (dotenv.exists()) {
        val properties = Properties().apply { dotenv.inputStream().use { load(it) } }
        val fromFile = properties.getProperty("EXPO_PUBLIC_CONVEX_URL")
        if (!fromFile.isNullOrBlank()) return@run fromFile.trim('"')
    }
    ""
}

/**
 * The phone app's debug keystore, if it has been prebuilt.
 *
 * The Wear Data Layer only bridges apps signed with the *same* certificate, and
 * the phone app is signed by the keystore React Native's template ships in
 * `android/app/debug.keystore` — not AGP's default `~/.android/debug.keystore`.
 * Left alone, the two debug builds get different certificates and the pairing
 * silently never fires, with nothing in the logs to explain it.
 *
 * Null when `apps/mobile/android` hasn't been generated (Expo prebuild is
 * on-demand), in which case the watch falls back to the default debug signing —
 * fine for running the watch app alone, but pairing will not work until the
 * phone app has been prebuilt and this build re-run.
 */
val phoneDebugKeystore: File? =
    rootProject.file("../mobile/android/app/debug.keystore").takeIf { it.exists() }

/**
 * Play upload key for release builds.
 *
 * CI decodes `ANDROID_UPLOAD_KEYSTORE_BASE64` to a temp file and points
 * `ANDROID_UPLOAD_KEYSTORE_PATH` at it; local release builds can set the same
 * env vars or pass `-Pandroid.injected.signing.*` properties. When unset,
 * release bundles are signed with the debug config so `./gradlew bundleRelease`
 * still produces an installable artifact for smoke tests.
 */
val uploadKeystorePath: String? = System.getenv("ANDROID_UPLOAD_KEYSTORE_PATH")?.takeIf { it.isNotBlank() }
val uploadKeystorePassword: String? = System.getenv("ANDROID_UPLOAD_KEYSTORE_PASSWORD")?.takeIf { it.isNotBlank() }
val uploadKeyAlias: String? = System.getenv("ANDROID_UPLOAD_KEY_ALIAS")?.takeIf { it.isNotBlank() }
val uploadKeyPassword: String? = System.getenv("ANDROID_UPLOAD_KEY_PASSWORD")?.takeIf { it.isNotBlank() }
val hasUploadKeystore: Boolean =
    uploadKeystorePath != null &&
        uploadKeystorePassword != null &&
        uploadKeyAlias != null &&
        uploadKeyPassword != null

if (phoneDebugKeystore == null) {
    // Loud, because the symptom is silent: the watch installs and runs fine, and
    // the pairing just never happens, with nothing in either app's logs.
    logger.warn(
        "apps/wear: apps/mobile/android/app/debug.keystore not found, so this debug " +
            "build is signed with the default key and will NOT pair with the phone " +
            "app over the Data Layer. Run `pnpm --filter mobile exec expo prebuild " +
            "--platform android` first, then rebuild.",
    )
}

android {
    namespace = "dev.clotet.suro.wear"
    compileSdk = 36

    defaultConfig {
        // Same id as the phone app so both live in one Play listing; the Wear
        // Data Layer also only bridges apps that share a signing certificate.
        applicationId = "dev.clotet.suro"
        // Wear OS 3.0. Older watches never got the Compose-era system UI.
        minSdk = 30
        targetSdk = 36
        versionCode = appVersionCode
        versionName = appVersionName
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        buildConfigField("String", "CONVEX_URL", "\"$convexUrl\"")
    }

    signingConfigs {
        if (phoneDebugKeystore != null) {
            getByName("debug") {
                storeFile = phoneDebugKeystore
                storePassword = "android"
                keyAlias = "androiddebugkey"
                keyPassword = "android"
            }
        }
        if (hasUploadKeystore) {
            create("release") {
                storeFile = file(uploadKeystorePath!!)
                storePassword = uploadKeystorePassword
                keyAlias = uploadKeyAlias
                keyPassword = uploadKeyPassword
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
            signingConfig = when {
                hasUploadKeystore -> signingConfigs.getByName("release")
                phoneDebugKeystore != null -> signingConfigs.getByName("debug")
                else -> signingConfigs.getByName("debug")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlin {
        compilerOptions {
            jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources.excludes += setOf(
            "/META-INF/{AL2.0,LGPL2.1}",
            "/META-INF/versions/9/OSGI-INF/MANIFEST.MF",
        )
    }

    testOptions {
        unitTests.isReturnDefaultValues = true
    }
}

dependencies {
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.tooling.preview)
    debugImplementation(libs.compose.ui.tooling)

    implementation(libs.wear.compose.material3)
    implementation(libs.wear.compose.foundation)
    implementation(libs.wear.compose.navigation)
    implementation(libs.wear.tooling.preview)

    implementation(libs.activity.compose)
    implementation(libs.lifecycle.runtime.compose)
    implementation(libs.lifecycle.viewmodel.compose)
    implementation(libs.core.splashscreen)

    implementation(libs.play.services.wearable)
    // Turns the Wearable Task APIs into suspend calls.
    implementation(libs.kotlinx.coroutines.play.services)
    implementation(libs.security.crypto)

    implementation(libs.okhttp)
    implementation(libs.kotlinx.serialization.json)

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.okhttp.mockwebserver)

    // On-device tests. EncryptedSharedPreferences needs the AndroidKeyStore, so
    // the token store can only be exercised for real on a device or emulator.
    androidTestImplementation(libs.junit)
    androidTestImplementation(libs.androidx.test.runner)
    androidTestImplementation(libs.androidx.test.ext.junit)
    androidTestImplementation(libs.kotlinx.coroutines.test)
    androidTestImplementation(libs.okhttp.mockwebserver)
}
