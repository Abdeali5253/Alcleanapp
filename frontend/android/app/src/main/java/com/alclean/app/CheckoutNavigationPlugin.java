package com.alclean.app;

import android.content.Intent;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CheckoutNavigation")
public class CheckoutNavigationPlugin extends Plugin {
    @PluginMethod
    public void returnToApp(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                // Reuse the existing app/WebView and remove the checkout activity
                // above it so the verified success route is visible immediately.
                Intent intent = new Intent(getActivity(), MainActivity.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                getActivity().startActivity(intent);
                call.resolve();
            } catch (Exception error) {
                call.reject("Unable to return to AlClean", error);
            }
        });
    }
}
