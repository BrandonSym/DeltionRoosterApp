package com.deltion.rooster;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.JSObject;
import com.getcapacitor.JSArray;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import android.content.Context;
import android.content.pm.PackageManager;
import android.net.wifi.WifiManager;
import android.net.wifi.ScanResult;
import android.Manifest;
import android.util.Log;
import androidx.core.content.ContextCompat;

import java.util.List;

@CapacitorPlugin(
    name = "WifiPlugin",
    permissions = {
        @Permission(strings = { Manifest.permission.ACCESS_FINE_LOCATION }, alias = "location"),
        @Permission(strings = { Manifest.permission.ACCESS_WIFI_STATE }, alias = "wifiState"),
        @Permission(strings = { Manifest.permission.CHANGE_WIFI_STATE }, alias = "wifiChange")
    }
)
public class WifiPlugin extends Plugin {

    private static final String TAG = "WifiPlugin";
    private WifiManager wifiManager;

    @Override
    public void load() {
        Log.d(TAG, "WifiPlugin loaded");
        Context context = getContext();
        wifiManager = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
    }

    @PluginMethod
    public void scanNetworks(PluginCall call) {
        Log.d(TAG, "scanNetworks called");
        
        if (!hasRequiredPermissions()) {
            Log.d(TAG, "Permissions not granted, requesting...");
            requestAllPermissions(call, "scanNetworksCallback");
            return;
        }

        performScan(call);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        Log.d(TAG, "requestPermissions called");
        
        if (hasRequiredPermissions()) {
            Log.d(TAG, "Permissions already granted");
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        } else {
            Log.d(TAG, "Requesting permissions...");
            requestAllPermissions(call, "requestPermissionsCallback");
        }
    }

    @PermissionCallback
    private void requestPermissionsCallback(PluginCall call) {
        Log.d(TAG, "requestPermissionsCallback called");
        boolean granted = hasRequiredPermissions();
        Log.d(TAG, "Permissions granted: " + granted);
        
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PermissionCallback
    private void scanNetworksCallback(PluginCall call) {
        Log.d(TAG, "scanNetworksCallback called");
        
        if (hasRequiredPermissions()) {
            Log.d(TAG, "Permissions granted, performing scan");
            performScan(call);
        } else {
            Log.d(TAG, "Permissions denied");
            call.reject("Location permission is required for WiFi scanning.");
        }
    }

    private void performScan(PluginCall call) {
        Log.d(TAG, "performScan called");
        
        if (wifiManager == null) {
            Log.e(TAG, "WiFi manager not available");
            call.reject("WiFi manager not available");
            return;
        }

        Log.d(TAG, "Starting WiFi scan...");
        boolean success = wifiManager.startScan();
        Log.d(TAG, "Scan started: " + success);
        
        if (!success) {
            call.reject("Scan failed to start");
            return;
        }

        List<ScanResult> results = wifiManager.getScanResults();
        Log.d(TAG, "Found " + results.size() + " networks");
        
        JSArray networks = new JSArray();
        for (ScanResult result : results) {
            JSObject net = new JSObject();
            net.put("SSID", result.SSID);
            net.put("BSSID", result.BSSID);
            net.put("level", result.level);
            net.put("frequency", result.frequency);
            networks.put(net);
        }

        JSObject ret = new JSObject();
        ret.put("networks", networks);
        call.resolve(ret);
    }

    public boolean hasRequiredPermissions() {
        boolean hasPermission = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION)
                == PackageManager.PERMISSION_GRANTED;
        Log.d(TAG, "hasRequiredPermissions: " + hasPermission);
        return hasPermission;
    }
}
