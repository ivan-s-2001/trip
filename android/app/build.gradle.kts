plugins {
    id("com.android.application")
}

android {
    namespace = "com.ivans.trip"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.ivans.trip"
        minSdk = 24
        targetSdk = 35
        versionCode = 7
        versionName = "1.5.0"
    }

    buildTypes {
        getByName("debug") {
            isMinifyEnabled = false
        }
        create("qa") {
            initWith(getByName("debug"))
            applicationIdSuffix = ".qa"
            versionNameSuffix = "-qa"
            isDebuggable = true
            matchingFallbacks += listOf("debug")
        }
        release {
            isMinifyEnabled = false
        }
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
