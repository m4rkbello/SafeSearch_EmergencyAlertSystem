package com.safesearch

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.shell.MainReactPackage
import com.facebook.soloader.SoLoader
import android.util.Log

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> {
            Log.d("SafeSearch", "getPackages() called")
            
            // DON'T import the SMS package - it will be auto-linked
            return mutableListOf<ReactPackage>(
                MainReactPackage()
            )
        }

        override fun getJSMainModuleName(): String = "index"
        
        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
        
        override val isNewArchEnabled: Boolean = false
        
        override val isHermesEnabled: Boolean = false
    }

    override fun onCreate() {
        super.onCreate()
        Log.d("SafeSearch", "MainApplication onCreate")
        SoLoader.init(this, false)
    }
}