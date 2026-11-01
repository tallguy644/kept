package com.desertcircuitapps.kept;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.os.Looper;
import androidx.annotation.NonNull;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * GPS mileage tracking for "Start driving" in Kept. Runs as a foreground service (location type) with an ongoing
 * notification, so it keeps counting while the driver uses Uber or Lyft. Only the running distance is kept: no routes or
 * places are stored or sent anywhere. Finished drives wait in "pending" until the app adds them to the day (mileage.js).
 */
public class MileageService extends Service implements LocationListener {
    static final String PREFS = "kept_mileage", CHANNEL = "kept_mileage";
    static final String ACTION_STOP = "com.desertcircuitapps.kept.MILEAGE_STOP";
    static final int NOTE_ID = 4207;
    static final float MAX_ACCURACY_M = 35f;        // ignore fixes worse than this
    static final float MIN_STEP_M = 12f;            // ignore GPS jitter while parked or creeping
    static final float MAX_SPEED_MS = 67f;          // ~150 mph: anything faster is a GPS jump

    private LocationManager lm;
    private long lastNote;

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }
    static boolean active(Context c) { return prefs(c).getBoolean("active", false); }
    static double miles(Context c) { return Double.longBitsToDouble(prefs(c).getLong("meters", 0)) / 1609.344; }

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) { finish(this); stopSelf(); return START_NOT_STICKY; }
        SharedPreferences p = prefs(this);
        if (!p.getBoolean("active", false)) {   // a fresh drive
            p.edit().putBoolean("active", true).putLong("start", System.currentTimeMillis())
                    .putLong("meters", Double.doubleToLongBits(0)).remove("lat").remove("lon").remove("t").apply();
        }
        try {
            if (Build.VERSION.SDK_INT >= 29) startForeground(NOTE_ID, note(), ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
            else startForeground(NOTE_ID, note());
        } catch (RuntimeException notAllowed) {   // e.g. restarted in the background without permission: keep the miles so far
            finish(this); stopSelf(); return START_NOT_STICKY;
        }
        startUpdates();
        return START_STICKY;
    }

    @SuppressLint("MissingPermission")
    private void startUpdates() {
        if (lm != null) return;
        lm = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        try {
            lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, 2000L, 8f, this, Looper.getMainLooper());
        } catch (SecurityException | IllegalArgumentException e) {
            finish(this); stopSelf();
        }
    }

    @Override public void onLocationChanged(@NonNull Location loc) {
        if (!loc.hasAccuracy() || loc.getAccuracy() > MAX_ACCURACY_M) return;
        SharedPreferences p = prefs(this);
        if (!p.getBoolean("active", false)) return;
        long t = loc.getTime();
        if (p.contains("lat")) {
            float[] d = new float[1];
            Location.distanceBetween(Double.longBitsToDouble(p.getLong("lat", 0)), Double.longBitsToDouble(p.getLong("lon", 0)),
                    loc.getLatitude(), loc.getLongitude(), d);
            long dt = Math.max(1, t - p.getLong("t", t));
            if (d[0] < Math.max(MIN_STEP_M, loc.getAccuracy())) return;   // not moved enough yet: keep the old point
            if (d[0] / (dt / 1000f) > MAX_SPEED_MS) {                       // a jump: restart from here without counting it
                p.edit().putLong("lat", Double.doubleToLongBits(loc.getLatitude())).putLong("lon", Double.doubleToLongBits(loc.getLongitude())).putLong("t", t).apply();
                return;
            }
            double meters = Double.longBitsToDouble(p.getLong("meters", 0)) + d[0];
            p.edit().putLong("meters", Double.doubleToLongBits(meters)).apply();
        }
        p.edit().putLong("lat", Double.doubleToLongBits(loc.getLatitude())).putLong("lon", Double.doubleToLongBits(loc.getLongitude())).putLong("t", t).apply();
        if (System.currentTimeMillis() - lastNote > 15000) {   // refresh the notification's miles now and then
            lastNote = System.currentTimeMillis();
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (nm != null) nm.notify(NOTE_ID, note());
        }
    }
    @Override public void onStatusChanged(String provider, int status, Bundle extras) {}
    @Override public void onProviderEnabled(@NonNull String provider) {}
    @Override public void onProviderDisabled(@NonNull String provider) {}

    @Override public void onDestroy() {
        if (lm != null) { try { lm.removeUpdates(this); } catch (RuntimeException ignored) {} lm = null; }
        super.onDestroy();
    }

    /** Ends the current drive: saves it to "pending" (start, end, miles) for the app to add to the day. Returns it, or null. */
    static synchronized JSONObject finish(Context c) {
        SharedPreferences p = prefs(c);
        if (!p.getBoolean("active", false)) return null;
        JSONObject drive = new JSONObject();
        try {
            drive.put("start", p.getLong("start", System.currentTimeMillis()));
            drive.put("end", System.currentTimeMillis());
            drive.put("miles", Math.round(miles(c) * 10) / 10.0);
            JSONArray pending = new JSONArray(p.getString("pending", "[]"));
            pending.put(drive);
            p.edit().putBoolean("active", false).putString("pending", pending.toString()).remove("lat").remove("lon").remove("t").apply();
        } catch (Exception e) {
            p.edit().putBoolean("active", false).apply();
        }
        return drive;
    }

    private Notification note() {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm != null && nm.getNotificationChannel(CHANNEL) == null) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Mileage tracking", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Shows your miles while Kept is tracking a drive");
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
        }
        int imm = Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0;
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent openPi = PendingIntent.getActivity(this, 1, open, imm | PendingIntent.FLAG_UPDATE_CURRENT);
        PendingIntent stopPi = PendingIntent.getService(this, 2, new Intent(this, MileageService.class).setAction(ACTION_STOP), imm | PendingIntent.FLAG_UPDATE_CURRENT);
        String text = String.format(Locale.US, "%.1f mi so far", miles(this));
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this);
        b.setSmallIcon(R.drawable.ic_stat_mileage)
                .setContentTitle("Kept is tracking your miles")
                .setContentText(text)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setContentIntent(openPi)
                .addAction(new Notification.Action.Builder(null, "End driving", stopPi).build());
        if (Build.VERSION.SDK_INT >= 31) b.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE);
        return b.build();
    }
}
