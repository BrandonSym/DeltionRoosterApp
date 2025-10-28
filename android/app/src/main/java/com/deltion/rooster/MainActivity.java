package com.deltion.rooster;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.deltion.rooster.WifiPlugin;
import com.deltion.rooster.SimplePlugin;

 public class MainActivity extends BridgeActivity {
     @Override
     public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WifiPlugin.class);
        registerPlugin(SimplePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
