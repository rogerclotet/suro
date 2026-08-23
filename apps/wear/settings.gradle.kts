pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

// Standalone Gradle build, deliberately outside the pnpm workspace: nothing here
// is JavaScript, and keeping it out means `pnpm -r test` doesn't try to run a
// 5-minute Android build on every commit. CI reaches it through its own
// path-gated job instead.
rootProject.name = "suro-wear"
include(":app")
