package com.ivans.trip;

import android.Manifest;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import com.google.android.gms.location.Geofence;
import com.google.android.gms.location.GeofencingClient;
import com.google.android.gms.location.GeofencingRequest;
import com.google.android.gms.location.LocationServices;

import java.util.ArrayList;
import java.util.List;

public final class GeofenceManager {
    public static final String PREFS = "trip_geo";
    public static final String KEY_ZONE = "zone";
    public static final String KEY_HOME = "home_arrived";

    private static final Zone[] ZONES = new Zone[] {
            new Zone("rybinsk", 58.0500, 38.8333, 15000f),
            new Zone("svo", 55.97264, 37.41459, 5000f),
            new Zone("tjm", 57.16833, 65.31611, 5000f),
            new Zone("kurgan", 55.4500, 65.3333, 15000f)
    };

    private GeofenceManager() {}

    public static boolean hasRequiredPermissions(Context context) {
        boolean fine = context.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
                == PackageManager.PERMISSION_GRANTED;
        if (!fine) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            return context.checkSelfPermission(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
                    == PackageManager.PERMISSION_GRANTED;
        }
        return true;
    }

    public static void registerAll(Context context) {
        if (!hasRequiredPermissions(context)) return;

        GeofencingClient client = LocationServices.getGeofencingClient(context);
        PendingIntent pendingIntent = pendingIntent(context);

        List<Geofence> fences = new ArrayList<>();
        for (Zone zone : ZONES) {
            fences.add(new Geofence.Builder()
                    .setRequestId(zone.id)
                    .setCircularRegion(zone.lat, zone.lon, zone.radiusMeters)
                    .setTransitionTypes(
                            Geofence.GEOFENCE_TRANSITION_ENTER |
                            Geofence.GEOFENCE_TRANSITION_EXIT
                    )
                    .setNotificationResponsiveness(60_000)
                    .setExpirationDuration(Geofence.NEVER_EXPIRE)
                    .build());
        }

        GeofencingRequest request = new GeofencingRequest.Builder()
                .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER)
                .addGeofences(fences)
                .build();

        try {
            client.removeGeofences(pendingIntent).addOnCompleteListener(task -> {
                try {
                    client.addGeofences(request, pendingIntent);
                } catch (SecurityException ignored) {
                }
            });
        } catch (SecurityException ignored) {
        }
    }

    public static String getLastZone(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getString(KEY_ZONE, "");
    }

    public static boolean isHomeArrived(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getBoolean(KEY_HOME, false);
    }

    private static PendingIntent pendingIntent(Context context) {
        Intent intent = new Intent(context, GeofenceReceiver.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_MUTABLE;
        }
        return PendingIntent.getBroadcast(context, 7200, intent, flags);
    }

    private static final class Zone {
        final String id;
        final double lat;
        final double lon;
        final float radiusMeters;

        Zone(String id, double lat, double lon, float radiusMeters) {
            this.id = id;
            this.lat = lat;
            this.lon = lon;
            this.radiusMeters = radiusMeters;
        }
    }
}
