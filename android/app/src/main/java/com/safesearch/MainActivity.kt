package com.safesearch

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "SafeSearch"

    override fun createReactActivityDelegate(): ReactActivityDelegate {
        // FORCE disable new architecture
        return DefaultReactActivityDelegate(
            this,
            mainComponentName,
            false  // fabricEnabled - set to FALSE
        )
    }
}