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
        versionCode = 5
        versionName = "1.4.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
