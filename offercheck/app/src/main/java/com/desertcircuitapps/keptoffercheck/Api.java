package com.desertcircuitapps.keptoffercheck;

import android.content.Context;
import android.os.Build;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import org.json.JSONException;
import org.json.JSONObject;

/** Talks to the Kept Pro server. The app never signs in: it holds only a device key from linking. */
final class Api {
    private Api() {}

    static final class Res {
        final int status; final JSONObject json;
        Res(int status, JSONObject json) { this.status = status; this.json = json; }
    }

    /** The server address comes from Kept's own setting (pro.js workerUrl), filled in at build time. */
    static boolean configured() { return BuildConfig.SERVER != null && BuildConfig.SERVER.startsWith("https://"); }

    static Res post(String path, JSONObject body, String deviceKey) throws IOException {
        HttpURLConnection h = (HttpURLConnection) new URL(BuildConfig.SERVER.replaceAll("/+$", "") + path).openConnection();
        try {
            h.setConnectTimeout(15000);
            h.setReadTimeout(20000);
            h.setRequestMethod("POST");
            h.setDoOutput(true);
            h.setRequestProperty("Content-Type", "application/json");
            if (deviceKey != null) h.setRequestProperty("Authorization", "Device " + deviceKey);
            try (OutputStream o = h.getOutputStream()) { o.write((body == null ? "{}" : body.toString()).getBytes(StandardCharsets.UTF_8)); }
            int code = h.getResponseCode();
            InputStream in = code >= 400 ? h.getErrorStream() : h.getInputStream();
            String s = "";
            if (in != null) {
                ByteArrayOutputStream b = new ByteArrayOutputStream();
                byte[] buf = new byte[4096]; int n;
                while ((n = in.read(buf)) > 0) b.write(buf, 0, n);
                in.close();
                s = b.toString("UTF-8");
            }
            JSONObject j;
            try { j = new JSONObject(s.isEmpty() ? "{}" : s); } catch (JSONException e) { j = new JSONObject(); }
            return new Res(code, j);
        } finally {
            h.disconnect();
        }
    }

    /** Trades the code from Kept for a device key. Returns the HTTP status (200 = linked). */
    static int link(Context c, String code) throws IOException {
        JSONObject b = new JSONObject();
        try { b.put("code", code); b.put("device", Build.MANUFACTURER + " " + Build.MODEL); } catch (JSONException ignored) {}
        Res r = post("/offer/link", b, null);
        if (r.status == 200) Store.saveStatus(c, r.json);
        return r.status;
    }

    /** Re-checks Offer Check on the account. A removed device key means this phone was unlinked from Kept. */
    static void refresh(Context c) throws IOException {
        String key = Store.key(c);
        if (key == null || !configured()) return;
        Res r = post("/offer/status", null, key);
        if (r.status == 200) Store.saveStatus(c, r.json);
        else if (r.status == 401) Store.unlink(c);
    }

    static void unlink(Context c) {
        String key = Store.key(c);
        Store.unlink(c);
        if (key != null && configured()) try { post("/offer/unlink", null, key); } catch (IOException ignored) {}
    }
}
