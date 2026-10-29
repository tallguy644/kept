package com.desertcircuitapps.keptoffercheck;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONObject;

/** What this phone remembers: its device key, the last status from the Kept server, settings, and the last offer read. */
final class Store {
    private Store() {}
    static final long DAY = 86_400_000L;

    static SharedPreferences p(Context c) { return c.getSharedPreferences("offer", Context.MODE_PRIVATE); }

    static String key(Context c) { return p(c).getString("key", null); }
    static boolean linked(Context c) { return key(c) != null; }

    static void saveStatus(Context c, JSONObject j) {
        SharedPreferences.Editor e = p(c).edit();
        String k = j.optString("key", "");
        if (!k.isEmpty()) e.putString("key", k);
        e.putBoolean("active", j.optBoolean("active", false));
        e.putLong("expires", j.isNull("expires") ? -1 : j.optLong("expires", 0));
        e.putFloat("cpm", (float) j.optDouble("cpm", 0));
        e.putFloat("target", (float) j.optDouble("target", 0));
        e.putBoolean("car", j.optBoolean("car", false));
        e.putLong("checked", System.currentTimeMillis());
        e.apply();
    }

    static void unlink(Context c) {
        p(c).edit().remove("key").remove("active").remove("expires").remove("checked").remove("cpm").remove("target").remove("car").apply();
    }

    /** Offer Check is on for this account, as last heard from the server (a week of grace without a connection). */
    static boolean active(Context c) {
        SharedPreferences s = p(c);
        if (key(c) == null || !s.getBoolean("active", false)) return false;
        long now = System.currentTimeMillis(), ex = s.getLong("expires", 0);
        if (ex != -1 && ex < now) return false;
        return now - s.getLong("checked", 0) < 7 * DAY;
    }
    static boolean stale(Context c, long ms) { return System.currentTimeMillis() - p(c).getLong("checked", 0) > ms; }

    static boolean popups(Context c) { return p(c).getBoolean("popups", true); }
    static void setPopups(Context c, boolean on) { p(c).edit().putBoolean("popups", on).apply(); }
    static boolean canShow(Context c) { return active(c) && popups(c); }

    static double cpm(Context c) { return p(c).getFloat("cpm", 0); }
    static double target(Context c) { return p(c).getFloat("target", 0); }
    static boolean fromCar(Context c) { return p(c).getBoolean("car", false); }

    static boolean disclosed(Context c) { return p(c).getBoolean("disclosed", false); }
    static void setDisclosed(Context c) { p(c).edit().putBoolean("disclosed", true).apply(); }

    /** The last offer screen, kept only on this phone so the driver can check what was read. */
    static void saveLast(Context c, String summary, String raw) {
        p(c).edit().putString("lastSummary", summary).putString("lastRaw", raw.length() > 4000 ? raw.substring(0, 4000) : raw)
                .putLong("lastAt", System.currentTimeMillis()).apply();
    }
    static String lastSummary(Context c) { return p(c).getString("lastSummary", null); }
    static String lastRaw(Context c) { return p(c).getString("lastRaw", null); }
    static long lastAt(Context c) { return p(c).getLong("lastAt", 0); }
    static void clearLast(Context c) { p(c).edit().remove("lastSummary").remove("lastRaw").remove("lastAt").apply(); }
}
