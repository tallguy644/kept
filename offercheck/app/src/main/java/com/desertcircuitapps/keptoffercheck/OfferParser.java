package com.desertcircuitapps.keptoffercheck;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Finds a ride offer in the text Android reports for the Uber Driver or Lyft Driver screen.
 * Plain Java (no Android classes) so it can be tested on any computer: see offercheck/test/ParserTest.java.
 *
 * An offer needs all three: an accept button ("Accept", "Tap to accept", "Match"... in the driver's language),
 * at least one distance ("1.3 mi", "2 km"), and a fare ("$12.47") near the first distance.
 * With two distances, the first is the pickup and the second is the trip. A "+$2.00" add-on is never taken as the fare.
 */
public final class OfferParser {
    private OfferParser() {}

    public static final class Offer {
        public double fare;
        public double pickupMi = -1, tripMi = -1, totalMi;
        public int pickupMin = -1, tripMin = -1, totalMin = -1;

        /** Same offer on screen again (Android sends many updates per offer): don't redraw the popup. */
        public String signature() {
            return String.format(Locale.US, "%.2f|%.2f|%.2f|%d", fare, pickupMi, tripMi, totalMin);
        }
    }

    private static final Pattern MONEY = Pattern.compile("(\\+\\s*)?\\$\\s?(\\d{1,4}(?:,\\d{3})*(?:\\.\\d{1,2})?)");
    private static final Pattern DIST = Pattern.compile("(\\d{1,3}(?:[.,]\\d{1,2})?)\\s*(mi|mile|miles|km|kms)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern TIME = Pattern.compile("(?:(\\d{1,2})\\s*(?:h|hr|hrs|hour|hours)\\s*)?(\\d{1,3})\\s*(?:min|mins|minute|minutes|phút|мин|分钟)", Pattern.CASE_INSENSITIVE);
    private static final Pattern HOURS_ONLY = Pattern.compile("(\\d{1,2})\\s*(?:hr|hrs|hour|hours)\\b(?!\\s*\\d)", Pattern.CASE_INSENSITIVE);
    private static final Pattern ACCEPT = Pattern.compile("accept|match|aceptar|aceitar|accepter|принять|接受|chấp nhận", Pattern.CASE_INSENSITIVE);
    private static final Pattern NOT_FARE = Pattern.compile("today|earnings|this week|balance|cash out|ganancias|hoy", Pattern.CASE_INSENSITIVE);
    private static final int NEAR = 15;   // the fare must be within this many text pieces of the first distance

    private static final class Tok { double value; int idx; int pos; boolean used; }

    public static Offer parse(List<String> texts) {
        if (texts == null || texts.isEmpty()) return null;
        boolean accept = false;
        List<Tok> money = new ArrayList<>(), dists = new ArrayList<>(), times = new ArrayList<>();
        for (int i = 0; i < texts.size(); i++) {
            String s = texts.get(i);
            if (s == null || s.isEmpty()) continue;
            if (!accept && ACCEPT.matcher(s).find()) accept = true;
            boolean notFare = NOT_FARE.matcher(s).find();
            Matcher m = MONEY.matcher(s);
            while (m.find()) {
                if (m.group(1) != null || notFare) continue;   // "+$2.00 bonus" or "Today $84.20" is not the fare
                double v = num(m.group(2));
                if (v >= 2 && v <= 1500) money.add(tok(v, i, m.start()));
            }
            Matcher d = DIST.matcher(s);
            while (d.find()) {
                double v = num(d.group(1));
                if (d.group(2).toLowerCase(Locale.US).startsWith("k")) v *= 0.621371;
                if (v > 0 && v <= 300) dists.add(tok(v, i, d.start()));
            }
            Matcher t = TIME.matcher(s);
            while (t.find()) {
                int mins = (t.group(1) != null ? Integer.parseInt(t.group(1)) * 60 : 0) + Integer.parseInt(t.group(2));
                times.add(tok(mins, i, t.start()));
            }
            Matcher h = HOURS_ONLY.matcher(s);
            while (h.find()) times.add(tok(Integer.parseInt(h.group(1)) * 60, i, h.start()));
        }
        if (!accept || dists.isEmpty() || money.isEmpty()) return null;

        Offer o = new Offer();
        int first = dists.get(0).idx;
        Tok fare = null;
        for (Tok m : money) {
            int gap = Math.abs(m.idx - first);
            if (gap > NEAR) continue;
            if (fare == null || gap < Math.abs(fare.idx - first)) fare = m;   // closest to the distances; ties keep the earlier one
        }
        if (fare == null) return null;
        o.fare = fare.value;

        Tok pick = dists.size() >= 2 ? dists.get(0) : null;
        Tok trip = dists.size() >= 2 ? dists.get(1) : dists.get(0);
        if (pick != null) { o.pickupMi = pick.value; o.pickupMin = timeFor(pick, times); }
        o.tripMi = trip.value; o.tripMin = timeFor(trip, times);
        o.totalMi = round2(Math.max(0, o.pickupMi) + o.tripMi);
        if (o.tripMin >= 0 && (pick == null || o.pickupMin >= 0)) o.totalMin = o.tripMin + Math.max(0, o.pickupMin);
        if (o.totalMi < 0.1) return null;
        return o;
    }

    /** The time that goes with a distance: in the same text piece first, otherwise the next or previous piece. */
    private static int timeFor(Tok dist, List<Tok> times) {
        Tok best = null; int bestGap = 99;
        for (Tok t : times) {
            if (t.used) continue;
            int gap = Math.abs(t.idx - dist.idx);
            if (gap > 1) continue;
            if (gap < bestGap || (gap == bestGap && t.idx < best.idx)) { best = t; bestGap = gap; }
        }
        if (best == null) return -1;
        best.used = true;
        return (int) best.value;
    }

    private static Tok tok(double v, int idx, int pos) { Tok t = new Tok(); t.value = v; t.idx = idx; t.pos = pos; return t; }
    private static double num(String s) {
        String n = s.replace(",", s.matches("\\d{1,3},\\d{1,2}") ? "." : "");   // "2,5 km" in some languages; "1,250" dollars
        try { return Double.parseDouble(n); } catch (NumberFormatException e) { return 0; }
    }
    private static double round2(double v) { return Math.round(v * 100) / 100.0; }
}
