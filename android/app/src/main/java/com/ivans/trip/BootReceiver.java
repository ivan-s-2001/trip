package com.ivans.trip;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
                Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) ||
                Intent.ACTION_TIMEZONE_CHANGED.equals(action) ||
                Intent.ACTION_TIME_CHANGED.equals(action)) {
            MessageService.startIfReady(context);
            NotificationScheduler.ensureChannels(context);
            NotificationScheduler.scheduleAll(context);
            GeofenceManager.invalidate(context);GeofenceManager.registerAll(context);
        }
    }
}
