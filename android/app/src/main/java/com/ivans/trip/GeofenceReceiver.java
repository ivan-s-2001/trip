package com.ivans.trip;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import com.google.android.gms.location.Geofence;
import com.google.android.gms.location.GeofencingEvent;

import java.util.Calendar;
import java.util.List;
import java.util.TimeZone;

public class GeofenceReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        GeofencingEvent event = GeofencingEvent.fromIntent(intent);
        if (event == null || event.hasError()) return;

        int transition = event.getGeofenceTransition();
        if (transition != Geofence.GEOFENCE_TRANSITION_ENTER &&
                transition != Geofence.GEOFENCE_TRANSITION_EXIT) {
            return;
        }

        List<Geofence> fences = event.getTriggeringGeofences();
        if (fences == null || fences.isEmpty()) return;

        SharedPreferences prefs =
                context.getSharedPreferences(GeofenceManager.PREFS, Context.MODE_PRIVATE);

        for (Geofence fence : fences) {
            String zone = fence.getRequestId();
            String previous = prefs.getString(GeofenceManager.KEY_ZONE, "");

            if (transition == Geofence.GEOFENCE_TRANSITION_ENTER) {
                prefs.edit().putString(GeofenceManager.KEY_ZONE, zone).apply();

                if ("rybinsk".equals(zone) && isReturnWindow()) {
                    prefs.edit().putBoolean(GeofenceManager.KEY_HOME, true).apply();
                }

                if (!zone.equals(previous)) {
                    notifyTransition(context, zone, true);
                }
            } else {
                if (zone.equals(previous)) {
                    prefs.edit().putString(GeofenceManager.KEY_ZONE, "between").apply();
                }
                if(zone.equals(previous)) notifyTransition(context, zone, false);
            }
        }
    }

    private void notifyTransition(Context context, String zone, boolean entered) {
        Calendar now = Calendar.getInstance(TimeZone.getTimeZone("Europe/Moscow"));
        int year = now.get(Calendar.YEAR);
        int month = now.get(Calendar.MONTH);
        int day = now.get(Calendar.DAY_OF_MONTH);

        if (year != 2026 || month != Calendar.OCTOBER || day < 10 || day > 18) {
            return;
        }

        String title = null;
        String text = null;

        if (entered) {
            if ("svo".equals(zone) && day == 10) {
                title = "Шереметьево ✓";
                text = "Ты уже у большого этапа дороги. SU1502 · терминал B · 23:00.";
            } else if ("tjm".equals(zone) && day == 11) {
                title = "Тюмень ✓";
                text = "Самолёт позади. Дальше — дорога в Курган.";
            } else if ("kurgan".equals(zone) && day >= 11 && day <= 17) {
                title = "Курган ✓";
                text = "Ты добралась. Теперь можно немного выдохнуть ♥";
            } else if ("tjm".equals(zone) && (day == 16 || day == 17)) {
                title = "Тюмень · дорога домой";
                text = "Следующий большой этап — SU1503.";
            } else if ("svo".equals(zone) && day == 17) {
                title = "Москва ✓";
                text = "Самолёт уже позади. Остался путь до Рыбинска.";
            } else if ("rybinsk".equals(zone) && (day == 17 || day == 18)) {
                title = "Рыбинск ♥";
                text = "Вот теперь — домой.";
            }
        } else {
            if ("rybinsk".equals(zone) && day == 10) {
                title = "Поездка началась";
                text = "Рыбинск остаётся позади. Береги себя в дороге ♥";
            } else if ("kurgan".equals(zone) && (day == 16 || day == 17)) {
                title = "Домой";
                text = "Курган остаётся позади. Теперь каждый следующий этап — к Рыбинску.";
            }
        }

        if (title == null) return;

        // One notification per route milestone, even when GPS crosses a boundary repeatedly.
        String leg = day >= 16 ? "back" : "out";
        String milestone = "sent-" + leg + "-" + zone + "-" + entered;
        SharedPreferences state = context.getSharedPreferences(GeofenceManager.PREFS, Context.MODE_PRIVATE);
        if (state.getBoolean(milestone, false)) return;
        if (android.os.Build.VERSION.SDK_INT >= 33 && context.checkSelfPermission(
                android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) return;
        state.edit().putBoolean(milestone, true).apply();

        Intent notification = new Intent(context, NotificationReceiver.class);
        notification.putExtra("notification_id", 8100 + Math.abs((zone + entered + day).hashCode() % 700));
        notification.putExtra("channel", NotificationScheduler.CHANNEL_TRIP);
        notification.putExtra("title", title);
        notification.putExtra("text", text);
        notification.putExtra("screen", "home");
        if (entered && "rybinsk".equals(zone)) notification.putExtra("surprise", "day-17-7");
        context.sendBroadcast(notification);
    }

    private boolean isReturnWindow() {
        Calendar now = Calendar.getInstance(TimeZone.getTimeZone("Europe/Moscow"));
        return now.get(Calendar.YEAR) == 2026 &&
                now.get(Calendar.MONTH) == Calendar.OCTOBER &&
                now.get(Calendar.DAY_OF_MONTH) >= 17 &&
                now.get(Calendar.DAY_OF_MONTH) <= 18;
    }
}
