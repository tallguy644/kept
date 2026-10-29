package com.desertcircuitapps.keptoffercheck;

import java.util.Arrays;
import java.util.List;

/**
 * Checks the offer reader on sample Uber and Lyft offer screens. Runs without Android:
 *   javac -d /tmp/oc offercheck/app/src/main/java/com/desertcircuitapps/keptoffercheck/{OfferParser,Verdict}.java offercheck/test/ParserTest.java
 *   java -cp /tmp/oc com.desertcircuitapps.keptoffercheck.ParserTest
 */
public final class ParserTest {
    private static int n = 0;

    public static void main(String[] args) {
        // Uber: today's earnings pill at the top, offer card at the bottom
        OfferParser.Offer u = OfferParser.parse(List.of("$84.20", "Today", "UberX", "Exclusive", "$12.47", "Includes expected surge",
                "4.92 ★ Verified", "4 mins (1.3 mi) away", "123 Main St, Phoenix", "Trip: 18 mins (9.8 mi)", "456 Oak Ave, Tempe", "Accept"));
        check(u != null, "Uber offer found");
        near(u.fare, 12.47, "Uber fare is the offer, not today's earnings");
        near(u.pickupMi, 1.3, "Uber pickup miles"); near(u.tripMi, 9.8, "Uber trip miles"); near(u.totalMi, 11.1, "Uber total miles");
        check(u.totalMin == 22, "Uber total minutes " + u.totalMin);

        // Lyft: bonus add-on next to the fare
        OfferParser.Offer l = OfferParser.parse(List.of("Lyft", "$15.80", "+$2.00 bonus", "6 min · 2.1 mi", "Pickup", "24 min · 13.4 mi", "Drop-off", "Tap to accept"));
        check(l != null, "Lyft offer found");
        near(l.fare, 15.80, "Lyft fare ignores the +$2.00 add-on");
        near(l.totalMi, 15.5, "Lyft total miles"); check(l.totalMin == 30, "Lyft total minutes " + l.totalMin);

        // Times and distances in separate pieces
        OfferParser.Offer s = OfferParser.parse(Arrays.asList("$9.10", "3 min", "0.8 mi", "11 min", "4.2 mi", "Accept"));
        check(s != null && s.pickupMin == 3 && s.tripMin == 11, "separate time pieces pair with their distance");
        near(s.totalMi, 5.0, "separate pieces total");

        // Kilometres, hours, other languages
        OfferParser.Offer k = OfferParser.parse(List.of("$10.00", "5 min (2 km) away", "1 hr 5 min (16 km) trip", "Aceptar"));
        check(k != null, "km offer found (Spanish accept button)");
        near(k.totalMi, 11.18, "km become miles"); check(k.tripMin == 65, "1 hr 5 min = 65 minutes, got " + k.tripMin);
        OfferParser.Offer one = OfferParser.parse(List.of("$7.25", "Trip: 9 mins (3.4 mi)", "Accept"));
        check(one != null && one.pickupMi < 0, "a single distance is the trip");
        near(one.totalMi, 3.4, "single distance total"); check(one.totalMin == 9, "single distance minutes");

        // Not offers
        check(OfferParser.parse(List.of("$84.20", "0.3 mi", "Turn left onto Main St", "12 min")) == null, "navigation screen (no accept button) is not an offer");
        check(OfferParser.parse(List.of("Accept", "+$3.00", "2.1 mi")) == null, "add-on alone is not a fare");
        check(OfferParser.parse(List.of("Today's earnings $84.20", "Accept", "2.1 mi")) == null, "earnings are not a fare");
        check(OfferParser.parse(List.of("$12.00", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "Accept", "2.1 mi")) == null, "money far from the distances is ignored");
        check(OfferParser.parse(List.of()) == null && OfferParser.parse(null) == null, "empty screen");

        // Signature repeats for the same offer
        check(u.signature().equals(OfferParser.parse(List.of("$12.47", "4 mins (1.3 mi) away", "Trip: 18 mins (9.8 mi)", "Accept")).signature()), "same offer, same signature");

        // Verdicts: cost per mile $0.45, goal $0.50 profit per mile
        Verdict g = new Verdict(u, 0.45, 0.50);
        near(g.cost, 4.995, "cost = miles x cost per mile"); near(g.profit, 7.475, "profit");
        check(g.level == Verdict.GOOD, "$12.47 for 11.1 mi is worth it");
        near(g.perHour, 7.475 / (22 / 60.0), "profit per hour");
        OfferParser.Offer low = OfferParser.parse(List.of("$6.00", "8 min (3.0 mi) away", "Trip: 14 min (8.0 mi)", "Accept"));
        check(new Verdict(low, 0.45, 0.50).level == Verdict.OK, "$6.00 for 11 mi makes money but is below the goal");
        OfferParser.Offer bad = OfferParser.parse(List.of("$4.10", "12 min (6.0 mi) away", "Trip: 9 min (4.0 mi)", "Accept"));
        Verdict b = new Verdict(bad, 0.45, 0.50);
        check(b.level == Verdict.BAD && b.profit < 0, "$4.10 for 10 mi loses money");
        check(Double.isNaN(new Verdict(OfferParser.parse(List.of("$7.00", "2.0 mi", "Accept")), 0.45, 0.5).perHour), "no minutes, no per hour");

        System.out.println("\nAll " + n + " offer reader checks passed.");
    }

    private static void check(boolean ok, String what) {
        if (!ok) throw new AssertionError("FAILED: " + what);
        System.out.println("  ✓ " + what); n++;
    }
    private static void near(double a, double b, String what) { check(Math.abs(a - b) < 0.011, what + " (" + a + ")"); }
}
