plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.cyberhayat.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.cyberhayat.app"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    // Release is signed with your keystore if CH_KEYSTORE* env vars are set,
    // otherwise with the debug key so the APK is still installable.
    signingConfigs {
        create("release") {
            val ks = System.getenv("CH_KEYSTORE")
            if (ks != null && file(ks).exists()) {
                storeFile = file(ks)
                storePassword = System.getenv("CH_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("CH_KEY_ALIAS")
                keyPassword = System.getenv("CH_KEY_PASSWORD")
            } else {
                initWith(getByName("debug"))
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.getByName("release")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures { compose = true }
    composeOptions { kotlinCompilerExtensionVersion = "1.5.14" }
    packaging { resources.excludes += "/META-INF/{AL2.0,LGPL2.1}" }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.06.00")
    implementation(composeBom)
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-compose:1.9.0")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.webkit:webkit:1.11.0")
}
