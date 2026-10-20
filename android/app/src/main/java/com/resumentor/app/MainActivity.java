package com.resumentor.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        // Allow webview to draw edge-to-edge behind the transparent status bar
        WindowCompat.setDecorFitsSystemWindows(window, false);

        // Keep status bar transparent for edge-to-edge
        window.setStatusBarColor(Color.TRANSPARENT);

        // Ensure status bar icons (time, battery, network, notifications) are clearly visible in dark mode
        View decorView = window.getDecorView();
        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, decorView);
        if (insetsController != null) {
            insetsController.setAppearanceLightStatusBars(true);
        }

        // Accurately capture hardware status bar & navigation insets and expose to web via CSS variables
        ViewCompat.setOnApplyWindowInsetsListener(decorView, (v, windowInsets) -> {
            Insets statusInsets = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars());
            Insets navInsets = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars());
            float density = getResources().getDisplayMetrics().density;

            int statusBarHeightDp = Math.round(statusInsets.top / density);
            int navBarHeightDp = Math.round(navInsets.bottom / density);

            if (statusBarHeightDp <= 0) {
                statusBarHeightDp = 36; // Sensible default for modern punch-hole / notch displays
            }

            final int finalStatusDp = statusBarHeightDp;
            final int finalNavDp = navBarHeightDp;

            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().post(() -> {
                    String js = String.format(
                        "document.documentElement.style.setProperty('--sat', '%dpx');" +
                        "document.documentElement.style.setProperty('--sab', '%dpx');" +
                        "document.documentElement.setAttribute('data-platform', 'android');",
                        finalStatusDp, finalNavDp
                    );
                    getBridge().getWebView().evaluateJavascript(js, null);
                });
            }
            return windowInsets;
        });
    }
}
