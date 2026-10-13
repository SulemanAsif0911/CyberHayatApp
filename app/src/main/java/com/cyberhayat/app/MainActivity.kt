package com.cyberhayat.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.cyberhayat.app.ui.CyberHayatApp
import com.cyberhayat.app.ui.theme.CyberHayatTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { CyberHayatTheme { CyberHayatApp() } }
    }
}
