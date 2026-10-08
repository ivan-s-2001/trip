package com.ivans.trip;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;

public class NotificationReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        int id = intent.getIntExtra("notification_id", 2601);
        String channel = intent.getStringExtra("channel");
        String title = intent.getStringExtra("title");
        String text = intent.getStringExtra("text");
        String screen = intent.getStringExtra("screen");
        String surprise = intent.getStringExtra("surprise");

        if (shouldSuppressTimedDuplicate(context, surprise)) return;

        if (channel == null) channel = NotificationScheduler.CHANNEL_LOVE;
        if (title == null) title = "От мужа ♥";
        if (text == null) text = "Я кое-что оставил внутри. Откроешь?";

        if (Build.VERSION.SDK_INT >= 33 &&
                context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                        != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        Intent open = new Intent(context, MainActivity.class);
        open.putExtra("screen", screen == null ? "home" : screen);
        if (surprise != null) open.putExtra("surprise", surprise);
        open.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent contentIntent = PendingIntent.getActivity(
                context,
                id + 10000,
                open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(context, channel)
                : new Notification.Builder(context);

        builder
                .setSmallIcon(R.drawable.ic_heart_notification)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setContentIntent(contentIntent)
                .setAutoCancel(true)
                .setColor(Color.rgb(143, 51, 77))
                .setCategory(Notification.CATEGORY_MESSAGE)
                .setPriority(Notification.PRIORITY_DEFAULT);

        NotificationManager manager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        manager.notify(id, builder.build());
    }

    private boolean shouldSuppressTimedDuplicate(Context context, String surprise) {
        if (surprise == null) return false;
        String zone = GeofenceManager.getLastZone(context);

        // Geofence already provides these arrival milestones. Timed alarms remain only
        // as fallback when background location did not resolve a zone.
        if ("day-11-0".equals(surprise)) {
            return "tjm".equals(zone) || "kurgan".equals(zone);
        }
        if ("day-17-1".equals(surprise)) {
            return "svo".equals(zone) || "rybinsk".equals(zone);
        }
        return false;
    }
}
