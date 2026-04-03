package com.downloader

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import org.devio.rn.splashscreen.SplashScreen 

class MainActivity : ReactActivity() {

    // 1. Show the splash screen
    override fun onCreate(savedInstanceState: Bundle?) {
        SplashScreen.show(this) 
        super.onCreate(null) // Using null here is a common fix for fragment state issues with React Navigation
    }

    override fun getMainComponentName(): String = "downloader"

    // 2. Updated Delegate
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}`