package com.deltion.rooster;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SimplePlugin")
public class SimplePlugin extends Plugin {

    @PluginMethod
    public void echo(PluginCall call) {
        String value = call.getString("value");
        
        if (value == null || value.isEmpty()) {
            call.reject("Must provide a value");
            return;
        }
        
        JSObject ret = new JSObject();
        ret.put("value", "Echo: " + value);
        call.resolve(ret);
    }
}
