package com.safesearch

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.shell.MainReactPackage
import com.facebook.soloader.SoLoader
import android.util.Log // Add this import

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> {
            Log.d("SafeSearch", "getPackages() called")
            
            val packages = mutableListOf<ReactPackage>()
            packages.add(MainReactPackage())
            
            // Add your SMS package if needed
            // packages.add(SmsPackage())
            
            return packages
        }

        override fun getJSMainModuleName(): String = "index"
        
        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
        
        // CRITICAL: Force disable New Architecture
        override val isNewArchEnabled: Boolean = false
        
        // CRITICAL: Force disable Hermes
        override val isHermesEnabled: Boolean = false
        
        // ADD THIS: Force disable Bridgeless
        override val isBridgelessEnabled: Boolean = false
    }

    override fun onCreate() {
        super.onCreate()
        Log.d("SafeSearch", "MainApplication onCreate")
        SoLoader.init(this, false)
    }
}