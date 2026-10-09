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
        versionCode = 24
        versionName = "2.5.2"
    }

    buildTypes {
        getByName("debug") {
            isMinifyEnabled = false
            buildConfigField("boolean", "HUSBAND_APP", "false")
        }
        create("husband") {
            initWith(getByName("debug"))
            applicationIdSuffix = ".husband"
            versionNameSuffix = "-husband"
            isDebuggable = false
            buildConfigField("boolean", "HUSBAND_APP", "true")
            resValue("string", "app_name", "Ваня · Наше место")
            matchingFallbacks += listOf("debug")
        }
        release {
            buildConfigField("boolean", "HUSBAND_APP", "false")
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


dependencies {
    implementation("com.google.android.gms:play-services-location:21.4.0")
}

val webSourceDir = rootProject.projectDir.parentFile
val generatedOfflineAssets = layout.buildDirectory.dir("generated/offlineAssets")

val syncWebAssets by tasks.registering(Copy::class) {
    from(webSourceDir) {
        include("index.html")
        include("styles.css")
        include("app.js")
        include("sync.js")
        include("messages.js")
        include("attachments.js")
        include("content.js")
        include("moments.json")
        include("manifest.webmanifest")
        include("sw.js")
        include("assets/**")
    }
    into(generatedOfflineAssets.map { it.dir("www") })
}

android.sourceSets.getByName("main").assets.srcDir(generatedOfflineAssets)

tasks.named("preBuild").configure {
    dependsOn(syncWebAssets)
}
