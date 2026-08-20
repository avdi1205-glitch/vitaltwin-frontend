package com.vitaltwin.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(HealthConnectPlugin.class);
        super.onCreate(savedInstanceState);
        // App Link (Phase 2.3, Schritt 3): a verified https://www.vitaltwin.de
        // link (e.g. the Google Health OAuth callback's final redirect
        // target, or a /passwort-bestaetigen email link) launches THIS
        // activity via ACTION_VIEW — Capacitor's BridgeActivity does not
        // route the WebView to that specific URL on its own, it would just
        // show the configured server.url root. loadDeepLinkIfPresent()
        // closes that gap.
        loadDeepLinkIfPresent(getIntent());
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // launchMode="singleTask" (AndroidManifest.xml) means a second tap
        // on an App Link while the app is already running re-delivers here
        // instead of creating a new Activity instance.
        loadDeepLinkIfPresent(intent);
    }

    @Override
    public void onResume() {
        super.onResume();
        // Health Connect background sync (Phase 2.3) — best-effort trigger
        // whenever the app comes to the foreground, in addition to the
        // periodic ~6h job scheduled in VitalTwinApplication.
        VitalTwinApplication.Companion.enqueueForegroundSync(getApplication());
    }

    private void loadDeepLinkIfPresent(Intent intent) {
        if (intent == null) return;
        Uri uri = intent.getData();
        if (uri == null) return;
        String host = uri.getHost();
        // Only ever navigate the WebView to our own app links — never an
        // arbitrary URI a malicious intent might carry.
        if (!"www.vitaltwin.de".equals(host) && !"vitaltwin.de".equals(host)) return;
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().loadUrl(uri.toString());
        }
    }
}
