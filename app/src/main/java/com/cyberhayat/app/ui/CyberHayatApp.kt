package com.cyberhayat.app.ui

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.view.ViewGroup
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.displayCutout
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.systemBars
import androidx.compose.foundation.layout.union
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color as ComposeColor
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewFeature
import java.io.ByteArrayInputStream
import kotlin.math.roundToInt

private const val HOST = "appassets.androidplatform.net"
private const val START_URL = "https://$HOST/assets/www/index.html"

/** The only internet hosts the app may talk to: the Google Apps Script backend. */
private fun isBackendHost(host: String?): Boolean =
    host != null && (host == "script.google.com" || host.endsWith(".googleusercontent.com"))

/**
 * Hosts the bundled Cyber Hayat site (assets/www) full-screen and edge-to-edge.
 * The page receives the real status-bar / navigation-bar / cutout sizes so its own
 * top bar extends under the status bar (no white strip) and nothing sits off-screen.
 */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun CyberHayatApp() {
    var webView by remember { mutableStateOf<WebView?>(null) }
    var canGoBack by remember { mutableStateOf(false) }

    // ---- real insets, in CSS px (1 dp == 1 CSS px) ----
    val density = LocalDensity.current
    val bars = WindowInsets.systemBars.union(WindowInsets.displayCutout)
    val d = density.density
    val top = (bars.getTop(density) / d).roundToInt()
    val left = (bars.getLeft(density, LayoutDirection.Ltr) / d).roundToInt()
    val right = (bars.getRight(density, LayoutDirection.Ltr) / d).roundToInt()
    val imeOpen = WindowInsets.ime.getBottom(density) > 0
    val bottom = if (imeOpen) 0 else (bars.getBottom(density) / d).roundToInt()
    val insetsJs = "window.__CH_INSETS=[$top,$right,$bottom,$left];" +
        "if(window.CH_setInsets){CH_setInsets($top,$right,$bottom,$left);}"

    LaunchedEffect(insetsJs, webView) { webView?.evaluateJavascript(insetsJs, null) }

    BackHandler(enabled = canGoBack) { webView?.goBack() }

    Box(Modifier.fillMaxSize().background(ComposeColor.White)) {
        AndroidView(
            modifier = Modifier.fillMaxSize().imePadding(),
            factory = { ctx ->
                val loader = WebViewAssetLoader.Builder()
                    .setDomain(HOST)
                    .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(ctx))
                    .build()

                WebView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    setBackgroundColor(Color.WHITE)
                    overScrollMode = WebView.OVER_SCROLL_NEVER
                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true       // theme-free: language, consent, chats, offline queue
                        allowFileAccess = false
                        allowContentAccess = false
                        mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                        textZoom = 100                 // system font scale must not break layouts
                        useWideViewPort = true
                        loadWithOverviewMode = false
                        setSupportZoom(false)
                        builtInZoomControls = false
                        displayZoomControls = false
                        cacheMode = WebSettings.LOAD_DEFAULT
                    }
                    // Light theme only: never let the system force a dark rendering.
                    if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
                        WebSettingsCompat.setAlgorithmicDarkeningAllowed(settings, false)
                    }
                    webViewClient = object : WebViewClient() {
                        override fun shouldInterceptRequest(
                            view: WebView, request: WebResourceRequest
                        ): WebResourceResponse? {
                            val host = request.url.host
                            return when {
                                host == HOST -> loader.shouldInterceptRequest(request.url)
                                isBackendHost(host) -> null      // allowed: sync + AI answers
                                else -> WebResourceResponse(     // everything else stays offline
                                    "text/plain", "utf-8", 403, "Blocked", emptyMap(),
                                    ByteArrayInputStream(ByteArray(0))
                                )
                            }
                        }

                        override fun shouldOverrideUrlLoading(
                            view: WebView, request: WebResourceRequest
                        ): Boolean {
                            val uri = request.url
                            if (uri.host == HOST) return false   // in-app page
                            openExternally(ctx, uri)             // tel:, mailto:, official portals
                            return true
                        }

                        override fun onPageCommitVisible(v: WebView, url: String?) { v.evaluateJavascript(insetsJs, null) }
                        override fun onPageFinished(v: WebView, url: String?) {
                            v.evaluateJavascript(insetsJs, null); canGoBack = v.canGoBack()
                        }
                        override fun doUpdateVisitedHistory(v: WebView, url: String?, isReload: Boolean) {
                            canGoBack = v.canGoBack()
                        }
                    }
                    loadUrl(START_URL)
                    webView = this
                }
            },
            onRelease = { it.destroy() }
        )
    }
}

private fun openExternally(ctx: Context, uri: Uri) {
    val action = if (uri.scheme == "tel") Intent.ACTION_DIAL else Intent.ACTION_VIEW
    try {
        ctx.startActivity(Intent(action, uri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    } catch (_: ActivityNotFoundException) { /* no app can handle it */ }
}
