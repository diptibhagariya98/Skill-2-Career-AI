package com.resumentor.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        // Prevent webview from drawing behind the status bar and notch
        WindowCompat.setDecorFitsSystemWindows(window, true);

        // Keep status bar background white matching the application's clean design system
        window.setStatusBarColor(Color.WHITE);

        // Ensure status bar icons (time, battery, network, notifications) are clearly visible in dark mode
        View decorView = window.getDecorView();
        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, decorView);
        if (insetsController != null) {
            insetsController.setAppearanceLightStatusBars(true);
        }
    }
}
