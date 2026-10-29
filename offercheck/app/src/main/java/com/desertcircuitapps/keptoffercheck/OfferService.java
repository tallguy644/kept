package com.desertcircuitapps.keptoffercheck;

import android.accessibilityservice.AccessibilityService;
import android.os.Handler;
import android.os.Looper;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.view.accessibility.AccessibilityWindowInfo;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Reads ride offers on the Uber Driver and Lyft Driver screens (and nothing else: see res/xml/offer_service.xml)
 * and shows the profit popup. Read-only: it never taps or types anything. Nothing it reads leaves the phone.
 */
public class OfferService extends AccessibilityService {
    static final Set<String> APPS = new HashSet<>(Arrays.asList("com.ubercab.driver", "com.lyft.android.driver"));
    private final Handler h = new Handler(Looper.getMainLooper());
    private final Runnable scan = this::scan;
    private Overlay overlay;
    private String lastSig;
    private long lastOfferAt;
    private volatile boolean refreshing;

    @Override protected void onServiceConnected() { overlay = new Overlay(this); }

    @Override public void onAccessibilityEvent(AccessibilityEvent e) {
        if (e == null || e.getPackageName() == null || !APPS.contains(e.getPackageName().toString())) return;
        h.removeCallbacks(scan);
        h.postDelayed(scan, 250);   // Android sends bursts of updates; read the screen once it settles
    }

    private void scan() {
        if (overlay == null) return;
        refreshIfOld();
        if (!Store.canShow(this)) { overlay.hide(); return; }
        List<String> texts = new ArrayList<>();
        try {
            for (AccessibilityWindowInfo w : getWindows()) {
                AccessibilityNodeInfo root = w.getRoot();
                if (root != null && root.getPackageName() != null && APPS.contains(root.getPackageName().toString())) collect(root, texts, 0);
            }
            if (texts.isEmpty()) {
                AccessibilityNodeInfo root = getRootInActiveWindow();
                if (root != null && root.getPackageName() != null && APPS.contains(root.getPackageName().toString())) collect(root, texts, 0);
            }
        } catch (RuntimeException ignored) { return; }

        OfferParser.Offer o = OfferParser.parse(texts);
        long now = System.currentTimeMillis();
        if (o == null) {
            if (overlay.showing() && now - lastOfferAt > 1500) { overlay.hide(); lastSig = null; }   // offer gone
            if (looksLikeOffer(texts) && now - Store.lastAt(this) > 5000) Store.saveLast(this, getString(R.string.last_unread), String.join("\n", texts));
            return;
        }
        lastOfferAt = now;
        String sig = o.signature();
        if (sig.equals(lastSig) && overlay.showing()) return;
        lastSig = sig;
        Verdict v = new Verdict(o, Store.cpm(this), Store.target(this));
        overlay.show(v);
        String summary = Overlay.money(o.fare) + " · " + Overlay.miles(o.totalMi) + " mi" + (o.totalMin > 0 ? " · " + o.totalMin + " min" : "")
                + " → " + (v.profit < 0 ? "−" : "+") + Overlay.money(Math.abs(v.profit));
        Store.saveLast(this, summary, String.join("\n", texts));
    }

    /** An accept button on screen but no fare/miles read: saved so the driver can send it in to fix the reader. */
    private static boolean looksLikeOffer(List<String> texts) {
        for (String s : texts) if (s.toLowerCase().contains("accept")) return true;
        return false;
    }

    private static void collect(AccessibilityNodeInfo n, List<String> out, int depth) {
        if (n == null || depth > 40 || out.size() > 400) return;
        add(out, n.getText());
        add(out, n.getContentDescription());
        for (int i = 0; i < n.getChildCount(); i++) collect(n.getChild(i), out, depth + 1);
    }
    private static void add(List<String> out, CharSequence cs) {
        if (cs == null) return;
        String s = cs.toString().trim();
        if (!s.isEmpty() && s.length() <= 200 && (out.isEmpty() || !out.get(out.size() - 1).equals(s))) out.add(s);
    }

    private void refreshIfOld() {
        if (refreshing || !Store.linked(this) || !Store.stale(this, 6 * 3600_000L)) return;
        refreshing = true;
        new Thread(() -> { try { Api.refresh(this); } catch (Exception ignored) {} finally { refreshing = false; } }).start();
    }

    @Override public void onInterrupt() { if (overlay != null) overlay.hide(); }
    @Override public void onDestroy() { if (overlay != null) overlay.hide(); h.removeCallbacksAndMessages(null); super.onDestroy(); }
}
