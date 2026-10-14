# Cyber Hayat — Android app

Kotlin + Jetpack Compose shell that hosts the full Cyber Hayat experience from
`app/src/main/assets/www/` — **fully offline**, light theme only, edge-to-edge.

* Works with no internet: all pages, fonts (system), guide video, resources, offline chatbot guidance.
* Online extras: AI assistant (hosted Llama via your Apps Script) and data sync to your Google Sheet.
* Forms and chat logs are saved on the device first and uploaded automatically when online.

## Set up your new Google Sheet
See `backend/SETUP.md` and `backend/Code.gs`, then put the Web App URL and secret in
`app/src/main/assets/www/assets/js/config.js`.

## Build
* **GitHub Actions:** push this folder to your repo (the workflow is already in `.github/workflows`),
  then Actions → *Build APK* → download the artifact.
* **Android Studio:** open the folder → Build → Build APK(s).
