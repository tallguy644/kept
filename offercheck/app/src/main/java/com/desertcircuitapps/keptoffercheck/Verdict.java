package com.desertcircuitapps.keptoffercheck;

/**
 * Is the offer worth it? Uses the driver's cost per mile from Kept (gas, repairs and the wear on their car)
 * and their profit goal per mile. Plain Java so it can be tested with the parser.
 *   GOOD: profit per mile at or above the goal.  OK: makes money, but below the goal.  BAD: loses money.
 */
public final class Verdict {
    public static final int BAD = 0, OK = 1, GOOD = 2;
    public final double fare, miles, cost, profit, perMile, profitPerMile, perHour;
    public final int minutes, level;

    public Verdict(OfferParser.Offer o, double costPerMile, double goalPerMile) {
        fare = o.fare;
        miles = o.totalMi;
        minutes = o.totalMin;
        cost = miles * Math.max(0, costPerMile);
        profit = fare - cost;
        perMile = miles > 0 ? fare / miles : 0;
        profitPerMile = miles > 0 ? profit / miles : 0;
        perHour = minutes > 0 ? profit / (minutes / 60.0) : Double.NaN;
        level = profit < 0 ? BAD : profitPerMile >= goalPerMile ? GOOD : OK;
    }
}
