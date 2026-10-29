package com.desertcircuitapps.keptoffercheck;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.text.InputFilter;
import android.text.InputType;
import android.text.format.DateUtils;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;
import java.io.IOException;
import java.util.Arrays;

/**
 * The app's one screen: link to Kept, turn on offer reading (after the disclosure Google Play requires),
 * see your numbers, a sample popup and the last offer read.
 */
public class MainActivity extends Activity {
    static final String KEPT = "com.desertcircuitapps.kept";
    private LinearLayout box;
    private String note;           // message under the link card (error or success)
    private boolean busy;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        ScrollView sv = new ScrollView(this);
        sv.setFillViewport(true);
        box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        int pad = dp(20);
        box.setPadding(pad, pad, pad, pad);
        sv.addView(box);
        setContentView(sv);
        // Draw behind the status and navigation bars, and keep the content clear of them.
        int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
        if (!night()) flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        getWindow().getDecorView().setSystemUiVisibility(flags);
        sv.setOnApplyWindowInsetsListener((v, ins) -> {
            v.setPadding(ins.getSystemWindowInsetLeft(), ins.getSystemWindowInsetTop(), ins.getSystemWindowInsetRight(), ins.getSystemWindowInsetBottom());
            return ins;
        });
        sv.setClipToPadding(false);
        handle(getIntent());
    }

    @Override protected void onNewIntent(Intent i) { super.onNewIntent(i); setIntent(i); handle(i); }

    @Override protected void onResume() {
        super.onResume();
        render();
        if (Store.linked(this) && Api.configured() && Store.stale(this, 60_000)) background(() -> Api.refresh(this));
    }

    /** Kept opens this app with keptoffercheck://link?code=XXXXXXXX after the driver taps "Set up on this phone". */
    private void handle(Intent i) {
        Uri d = i == null ? null : i.getData();
        if (d == null || !"keptoffercheck".equals(d.getScheme())) return;
        String code = d.getQueryParameter("code");
        i.setData(null);
        if (code != null && !code.isEmpty()) link(code);
    }

    private void link(String code) {
        if (busy || !Api.configured()) return;
        busy = true; note = getString(R.string.linking); render();
        new Thread(() -> {
            String msg;
            try {
                int s = Api.link(this, code);
                msg = s == 200 ? getString(R.string.linked_ok) : s == 410 ? getString(R.string.err_expired) : getString(R.string.err_code);
            } catch (IOException e) { msg = getString(R.string.err_net); }
            String m = msg;
            runOnUiThread(() -> { busy = false; note = m; render(); });
        }).start();
    }

    private interface Job { void run() throws Exception; }
    private void background(Job j) {
        new Thread(() -> { try { j.run(); } catch (Exception ignored) {} runOnUiThread(this::render); }).start();
    }

    /* ---------- Screen ---------- */
    private void render() {
        box.removeAllViews();
        TextView h = text(getString(R.string.app_name), 26, true, R.color.fg);
        box.addView(h);
        TextView sub = text(getString(R.string.tagline), 15, false, R.color.muted);
        sub.setPadding(0, dp(4), 0, dp(16));
        box.addView(sub);

        if (!Api.configured()) {
            LinearLayout c = card();
            c.addView(text(getString(R.string.soon), 15, false, R.color.fg));
            box.addView(c);
        } else if (!Store.linked(this)) {
            linkCard();
        } else {
            statusCard();
            numbersCard();
        }
        sampleCard();
        if (Store.linked(this)) lastCard();
        footer();
    }

    private void linkCard() {
        LinearLayout c = card();
        c.addView(title(getString(R.string.link_title)));
        c.addView(body(getString(R.string.link_body)));
        c.addView(button(getString(R.string.open_kept), true, v -> openKept()));
        EditText code = new EditText(this);
        code.setHint(R.string.code_hint);
        code.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS | InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS);
        code.setFilters(new InputFilter[]{new InputFilter.LengthFilter(9), new InputFilter.AllCaps()});
        code.setTextColor(color(R.color.fg));
        code.setHintTextColor(color(R.color.muted));
        code.setTextSize(TypedValue.COMPLEX_UNIT_SP, 20);
        code.setLetterSpacing(0.15f);
        LinearLayout row = new LinearLayout(this);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(0, dp(8), 0, 0);
        row.addView(code, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
        Button go = button(getString(R.string.link_btn), false, v -> link(code.getText().toString()));
        go.setEnabled(!busy);
        row.addView(go, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        c.addView(row);
        if (note != null) c.addView(text(note, 14, true, R.color.fg));
        box.addView(c);
    }

    private void statusCard() {
        LinearLayout c = card();
        if (note != null) { c.addView(text(note, 14, true, R.color.accent)); note = null; }
        if (!Store.active(this)) {
            c.addView(title(getString(R.string.inactive_title)));
            c.addView(body(getString(R.string.inactive_body)));
            c.addView(button(getString(R.string.open_kept), true, v -> openKept()));
            c.addView(button(getString(R.string.check_again), false, v -> background(() -> Api.refresh(this))));
        } else if (!serviceOn(this)) {
            c.addView(title(getString(R.string.step_title)));
            c.addView(body(getString(R.string.step_body)));
            c.addView(button(getString(R.string.turn_on), true, v -> disclose()));
        } else {
            c.addView(title("✓  " + getString(R.string.ready_title)));
            c.addView(body(getString(R.string.ready_body)));
            Switch sw = new Switch(this);
            sw.setText(R.string.show_popups);
            sw.setTextColor(color(R.color.fg));
            sw.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
            sw.setChecked(Store.popups(this));
            sw.setPadding(0, dp(10), 0, 0);
            sw.setOnCheckedChangeListener((x, on) -> Store.setPopups(this, on));
            c.addView(sw);
        }
        box.addView(c);
    }

    private void numbersCard() {
        LinearLayout c = card();
        c.addView(title(getString(R.string.numbers_title)));
        c.addView(pair(getString(R.string.cpm_label), getString(R.string.per_mile, Overlay.money(Store.cpm(this)))));
        c.addView(small(getString(Store.fromCar(this) ? R.string.cpm_car : R.string.cpm_logs)));
        c.addView(pair(getString(R.string.goal_label), getString(R.string.per_mile, Overlay.money(Store.target(this)))));
        c.addView(small(getString(R.string.change_in_kept)));
        box.addView(c);
    }

    private void sampleCard() {
        LinearLayout c = card();
        c.addView(title(getString(R.string.sample_title)));
        OfferParser.Offer o = OfferParser.parse(Arrays.asList("$14.20", "6 min (1.6 mi) away", "Trip: 19 min (9.7 mi)", "Accept"));
        double cpm = Store.linked(this) && Store.cpm(this) > 0 ? Store.cpm(this) : 0.45;
        double goal = Store.linked(this) ? Store.target(this) : 0.50;
        View pop = Overlay.card(this, new Verdict(o, cpm, goal), false);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(10);
        c.addView(pop, lp);
        c.addView(small(getString(R.string.sample_note)));
        box.addView(c);
    }

    private void lastCard() {
        LinearLayout c = card();
        c.addView(title(getString(R.string.last_title)));
        String sum = Store.lastSummary(this);
        if (sum == null) {
            c.addView(body(getString(R.string.last_none)));
        } else {
            c.addView(text(sum, 16, true, R.color.fg));
            c.addView(small(DateUtils.getRelativeTimeSpanString(Store.lastAt(this)).toString()));
            LinearLayout row = new LinearLayout(this);
            row.addView(button(getString(R.string.copy_text), false, v -> {
                ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                cm.setPrimaryClip(ClipData.newPlainText("Kept Offer Check", sum + "\n\n" + Store.lastRaw(this)));
                Toast.makeText(this, R.string.copied, Toast.LENGTH_SHORT).show();
            }));
            row.addView(button(getString(R.string.clear), false, v -> { Store.clearLast(this); render(); }));
            c.addView(row);
            c.addView(small(getString(R.string.last_note)));
        }
        box.addView(c);
    }

    private void footer() {
        LinearLayout c = card();
        c.addView(title(getString(R.string.privacy_title)));
        c.addView(body(getString(R.string.privacy_body)));
        c.addView(body(getString(R.string.risk)));
        if (Store.linked(this)) c.addView(button(getString(R.string.unlink), false, v -> background(() -> {
            Api.unlink(this);
            runOnUiThread(() -> Toast.makeText(this, R.string.unlinked, Toast.LENGTH_SHORT).show());
        })));
        c.addView(small(getString(R.string.version, BuildConfig.VERSION_NAME)));
        box.addView(c);
    }

    /* ---------- Turning on offer reading: Google Play's prominent disclosure first ---------- */
    private void disclose() {
        new AlertDialog.Builder(this)
                .setTitle(R.string.dis_title)
                .setMessage(getString(R.string.dis_body) + "\n\n" + getString(R.string.risk))
                .setPositiveButton(R.string.dis_agree, (d, w) -> {
                    Store.setDisclosed(this);
                    Toast.makeText(this, R.string.dis_find, Toast.LENGTH_LONG).show();
                    startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
                })
                .setNegativeButton(R.string.dis_no, null)
                .show();
    }

    static boolean serviceOn(Context c) {
        String s = Settings.Secure.getString(c.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        if (s == null) return false;
        ComponentName me = new ComponentName(c, OfferService.class);
        for (String part : s.split(":")) if (me.equals(ComponentName.unflattenFromString(part))) return true;
        return false;
    }

    private void openKept() {
        Intent i = getPackageManager().getLaunchIntentForPackage(KEPT);
        if (i == null) i = new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + KEPT));
        try { startActivity(i); } catch (RuntimeException ignored) {}
    }

    /* ---------- Small view helpers ---------- */
    private LinearLayout card() {
        LinearLayout c = new LinearLayout(this);
        c.setOrientation(LinearLayout.VERTICAL);
        c.setPadding(dp(18), dp(16), dp(18), dp(16));
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(color(R.color.surface));
        bg.setCornerRadius(dp(18));
        bg.setStroke(dp(1), color(R.color.line));
        c.setBackground(bg);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.bottomMargin = dp(14);
        c.setLayoutParams(lp);
        return c;
    }
    private TextView title(String s) { TextView t = text(s, 18, true, R.color.fg); t.setPadding(0, 0, 0, dp(6)); return t; }
    private TextView body(String s) { TextView t = text(s, 15, false, R.color.fg); t.setPadding(0, 0, 0, dp(8)); t.setLineSpacing(0, 1.15f); return t; }
    private TextView small(String s) { TextView t = text(s, 13, false, R.color.muted); t.setPadding(0, dp(4), 0, dp(6)); return t; }
    private View pair(String k, String v) {
        LinearLayout r = new LinearLayout(this);
        r.setPadding(0, dp(6), 0, 0);
        r.addView(text(k, 15, false, R.color.fg), new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
        r.addView(text(v, 15, true, R.color.fg));
        return r;
    }
    private TextView text(String s, int sp, boolean bold, int colorRes) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        t.setTextColor(color(colorRes));
        if (bold) t.setTypeface(Typeface.DEFAULT_BOLD);
        return t;
    }
    private Button button(String s, boolean primary, View.OnClickListener l) {
        Button b = new Button(this);
        b.setText(s);
        b.setAllCaps(false);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        b.setTextColor(color(primary ? R.color.accent_fg : R.color.fg));
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(color(primary ? R.color.accent : R.color.surface));
        bg.setCornerRadius(dp(14));
        bg.setStroke(dp(1), color(primary ? R.color.accent : R.color.line));
        b.setBackground(bg);
        b.setPadding(dp(16), dp(10), dp(16), dp(10));
        b.setOnClickListener(l);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(8); lp.rightMargin = dp(8);
        b.setLayoutParams(lp);
        return b;
    }
    private int color(int res) { return getColor(res); }
    private int dp(float v) { return Overlay.dp(this, v); }
    private boolean night() { return (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES; }
}
