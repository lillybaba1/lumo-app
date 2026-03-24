package com.julazone.app;

import android.os.Bundle;
import android.view.View;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Ensure WebView does NOT render behind the status bar
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }
}
