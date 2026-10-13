# Cyber Hayat — Android app

Native Kotlin + Jetpack Compose shell (same stack as your reference release APK) that hosts the
complete Cyber Hayat site from `app/src/main/assets/www/` — same UI, 9 languages (incl. RTL),
dark mode, chatbot, forms, Apps Script backend.

## Build option A — Android Studio
1. Install Android Studio (it brings the SDK + JDK 17).
2. File > Open > this folder, wait for Gradle sync.
3. Build > Generate Signed App Bundle / APK > APK > release.
   (Without a keystore, `gradle assembleRelease` signs with the debug key so it still installs.)
   Output: `app/build/outputs/apk/release/app-release.apk`

## Build option B — no install, GitHub Actions
1. Create a GitHub repo, upload this folder (the `.github` folder included).
2. Actions tab > "Build APK" > Run workflow.
3. Download `CyberHayat-release-apk` from the run's Artifacts.

## Updating the site
Edit files in `app/src/main/assets/www/` and rebuild. Backend URL/secret: `assets/js/config.js`.
