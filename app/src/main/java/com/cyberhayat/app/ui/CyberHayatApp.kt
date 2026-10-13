package com.cyberhayat.app.ui

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebViewAssetLoader

private const val HOST = "appassets.androidplatform.net"
private const val START_URL = "https://$HOST/assets/www/index.html"

/** Hosts the bundled Cyber Hayat site (assets/www) inside a native Compose screen. */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun CyberHayatApp() {
    var webView by remember { mutableStateOf<WebView?>(null) }
    var canGoBack by remember { mutableStateOf(false) }
    var progress by remember { mutableFloatStateOf(0f) }

    BackHandler(enabled = canGoBack) { webView?.goBack() }

    Box(Modifier.fillMaxSize().statusBarsPadding()) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                val loader = WebViewAssetLoader.Builder()
                    .setDomain(HOST)
                    .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(ctx))
                    .build()

                WebView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true   // localStorage: theme, language, consent, chat history
                        allowFileAccess = false
                        allowContentAccess = false
                        mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                        cacheMode = if (isOnline(ctx)) WebSettings.LOAD_DEFAULT
                                    else WebSettings.LOAD_CACHE_ELSE_NETWORK
                    }
                    webViewClient = object : WebViewClient() {
                        override fun shouldInterceptRequest(
                            view: WebView, request: WebResourceRequest
                        ): WebResourceResponse? = loader.shouldInterceptRequest(request.url)

                        override fun shouldOverrideUrlLoading(
                            view: WebView, request: WebResourceRequest
                        ): Boolean {
                            val uri = request.url
                            if (uri.host == HOST) return false   // in-app page
                            openExternally(ctx, uri)             // tel:, mailto:, external https
                            return true
                        }

                        override fun onPageStarted(v: WebView, url: String?, f: Bitmap?) { progress = 0.05f }
                        override fun onPageFinished(v: WebView, url: String?) {
                            progress = 1f; canGoBack = v.canGoBack()
                        }
                        override fun doUpdateVisitedHistory(v: WebView, url: String?, isReload: Boolean) {
                            canGoBack = v.canGoBack()
                        }
                    }
                    webChromeClient = object : WebChromeClient() {
                        override fun onProgressChanged(v: WebView, p: Int) { progress = p / 100f }
                    }
                    loadUrl(START_URL)
                    webView = this
                }
            },
            onRelease = { it.destroy() }
        )
        if (progress in 0.01f..0.99f) {
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier.align(Alignment.TopCenter).fillMaxWidth()
            )
        }
    }
}

private fun isOnline(ctx: Context): Boolean {
    val cm = ctx.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    val caps = cm.getNetworkCapabilities(cm.activeNetwork) ?: return false
    return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
}

private fun openExternally(ctx: Context, uri: Uri) {
    val action = if (uri.scheme == "tel") Intent.ACTION_DIAL else Intent.ACTION_VIEW
    try {
        ctx.startActivity(Intent(action, uri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    } catch (_: ActivityNotFoundException) { /* no app can handle it */ }
}
