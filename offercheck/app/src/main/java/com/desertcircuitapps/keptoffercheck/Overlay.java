package com.desertcircuitapps.keptoffercheck;

import android.content.Context;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Handler;
import android.os.Looper;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.util.Locale;

/** The popup over the Uber or Lyft offer: green (worth it), amber (below your goal) or red (losing money). Tap to close. */
final class Overlay {
    private final Context ctx;
    private final WindowManager wm;
    private final Handler h = new Handler(Looper.getMainLooper());
    private final Runnable autoHide = this::hide;
    private View view;

    Overlay(Context c) { ctx = c; wm = (WindowManager) c.getSystemService(Context.WINDOW_SERVICE); }

    boolean showing() { return view != null; }

    void show(Verdict v) {
        hide();
        View card = card(ctx, v, true);
        card.setOnClickListener(x -> hide());
        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                        | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
        lp.y = dp(ctx, 52);   // below the status bar, away from the offer card at the bottom
        lp.width = Math.min(ctx.getResources().getDisplayMetrics().widthPixels - dp(ctx, 24), dp(ctx, 440));
        try { wm.addView(card, lp); view = card; } catch (RuntimeException e) { view = null; return; }
        h.postDelayed(autoHide, 30_000);
    }

    void hide() {
        h.removeCallbacks(autoHide);
        if (view != null) { try { wm.removeView(view); } catch (RuntimeException ignored) {} view = null; }
    }

    /** Builds the card. Also used inside the app for the sample popup. */
    static View card(Context c, Verdict v, boolean floating) {
        int color = v.level == Verdict.GOOD ? 0xFF1C6B47 : v.level == Verdict.OK ? 0xFF8A5A00 : 0xFFA12C2C;
        LinearLayout box = new LinearLayout(c);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(c, 16), dp(c, 12), dp(c, 16), dp(c, 12));
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(color);
        bg.setCornerRadius(dp(c, 18));
        box.setBackground(bg);
        if (floating) box.setElevation(dp(c, 10));

        LinearLayout top = new LinearLayout(c);
        top.setGravity(Gravity.CENTER_VERTICAL);
        String mark = v.level == Verdict.GOOD ? "✓  " : v.level == Verdict.OK ? "!  " : "✕  ";
        int title = v.level == Verdict.GOOD ? R.string.v_good : v.level == Verdict.OK ? R.string.v_ok : R.string.v_bad;
        TextView t = text(c, mark + c.getString(title), 17, true);
        top.addView(t, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));
        top.addView(text(c, (v.profit < 0 ? "−" : "+") + money(Math.abs(v.profit)), 22, true));
        box.addView(top);

        TextView l2 = text(c, c.getString(R.string.v_line2, money(v.fare), miles(v.miles), money(v.perMile)), 14, false);
        l2.setAlpha(0.95f);
        box.addView(l2);

        LinearLayout bottom = new LinearLayout(c);
        bottom.setGravity(Gravity.CENTER_VERTICAL);
        String l3 = c.getString(R.string.v_line3, (v.profitPerMile < 0 ? "−" : "") + money(Math.abs(v.profitPerMile)));
        if (!Double.isNaN(v.perHour)) l3 += "  ·  " + c.getString(R.string.v_hour, (v.perHour < 0 ? "−" : "") + money0(Math.abs(v.perHour)));
        TextView t3 = text(c, l3, 13, false);
        t3.setAlpha(0.9f);
        bottom.addView(t3, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));
        TextView brand = text(c, "Kept", 12, true);
        brand.setAlpha(0.75f);
        bottom.addView(brand);
        box.addView(bottom);
        box.setContentDescription(t.getText() + ". " + l2.getText() + ". " + l3);
        return box;
    }

    private static TextView text(Context c, String s, int sp, boolean bold) {
        TextView t = new TextView(c);
        t.setText(s);
        t.setTextColor(0xFFFFFFFF);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        if (bold) t.setTypeface(Typeface.DEFAULT_BOLD);
        return t;
    }
    static String money(double v) { return String.format(Locale.US, "$%.2f", v); }
    static String money0(double v) { return String.format(Locale.US, "$%.0f", v); }
    static String miles(double v) { return String.format(Locale.US, "%.1f", v); }
    static int dp(Context c, float v) { return Math.round(v * c.getResources().getDisplayMetrics().density); }
}
