package com.alclean.app;

import android.os.Bundle;
import android.util.Log;
import android.view.View;

import androidx.activity.EdgeToEdge;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "AlCleanMainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Explicitly enable edge-to-edge for Android 15 behavior parity on older versions.
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);

        // Apply safe insets to the activity content so UI is not obscured by system bars/cutouts.
        View content = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(content, (view, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            view.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        Log.d(TAG, "MainActivity onCreate");
    }

    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "MainActivity onResume");
    }
}
