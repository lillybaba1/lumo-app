package com.julazone.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Fix: Prevent WebView from rendering behind the status bar
        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, true);
        window.setStatusBarColor(Color.parseColor("#a21caf"));
    }

    @Override
    public void onResume() {
        super.onResume();
        // Re-apply after Capacitor may override in its lifecycle
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }
}
