package com.alclean.app;

import android.os.Bundle;
import android.util.Log;
import android.graphics.Color;

import com.getcapacitor.BridgeActivity;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "AlCleanMainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep web content below Android system bars (status/notch area).
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);

        // Match app header: white status bar with dark icons for readability.
        getWindow().setStatusBarColor(Color.WHITE);
        WindowInsetsControllerCompat insetsController =
                new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
        insetsController.setAppearanceLightStatusBars(true);

        Log.d(TAG, "MainActivity onCreate");
    }

    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "MainActivity onResume");
    }
}
