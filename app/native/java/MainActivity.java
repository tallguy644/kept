package com.desertcircuitapps.kept;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(KeptNativePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
