/*
 * jalali.js — Gregorian ↔ Jalali for display and pickers.
 */

import { addWeeks, endOfDay, endOfWeek, startOfDay, startOfWeek } from "date-fns";
import { jalaaliMonthLength, toGregorian, toJalaali } from "jalaali-js";

const PERSIAN_MONTHS = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
];

const PERSIAN_WEEKDAYS_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

export function toPersianDigits(value) {
    return String(value).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
}

export function fromPersianDigits(value) {
    return String(value).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
}

export function formatJalaliDate(date, withTime = false) {
    const d = date instanceof Date ? date : new Date(date);
    const { jy, jm, jd } = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const month = PERSIAN_MONTHS[jm - 1] ?? "";
    let text = `${jd} ${month} ${jy}`;
    if (withTime) {
        const pad = (n) => String(n).padStart(2, "0");
        text += `، ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
    return toPersianDigits(text);
}

export function formatRangeLabel(gregorianLabel, start, end, withTime = false) {
    const jStart = formatJalaliDate(start, withTime);
    const jEnd = formatJalaliDate(end, withTime);
    return `${gregorianLabel} · ${jStart} - ${jEnd}`;
}

export function formatWithJalali(gregorianText, date, withTime = false) {
    if (!date || Number.isNaN(new Date(date).getTime())) {
        return gregorianText;
    }
    return `${gregorianText} · ${formatJalaliDate(date, withTime)}`;
}

export function isoFormatIncludesTime(isoFormat) {
    return /[HhmsSA]/.test(isoFormat ?? "");
}

export function gregorianToJalaliParts(year, month, day) {
    return toJalaali(year, month, day);
}

export function jalaliToGregorianParts(jy, jm, jd) {
    return toGregorian(jy, jm, jd);
}

export function jalaliMonthLength(jy, jm) {
    return jalaaliMonthLength(jy, jm);
}

/**
 * Gregorian start/end for a full Jalali month (local timezone).
 *
 * @returns {{ start: Date, end: Date }}
 */
export function jalaliMonthRange(jy, jm) {
    const { gy: startGy, gm: startGm, gd: startGd } = toGregorian(jy, jm, 1);
    const lastDay = jalaaliMonthLength(jy, jm);
    const { gy: endGy, gm: endGm, gd: endGd } = toGregorian(jy, jm, lastDay);
    const start = startOfDay(new Date(startGy, startGm - 1, startGd));
    const end = endOfDay(new Date(endGy, endGm - 1, endGd));

    return { start, end };
}

/**
 * If start/end are exactly one Jalali month, return { jy, jm }; otherwise null.
 */
export function parseExactJalaliMonthRange(start, end) {
    const s = start instanceof Date ? start : new Date(start);
    const e = end instanceof Date ? end : new Date(end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
        return null;
    }
    const startParts = toJalaali(s.getFullYear(), s.getMonth() + 1, s.getDate());
    const endParts = toJalaali(e.getFullYear(), e.getMonth() + 1, e.getDate());
    if (startParts.jd !== 1) {
        return null;
    }
    if (startParts.jy !== endParts.jy || startParts.jm !== endParts.jm) {
        return null;
    }
    if (endParts.jd !== jalaaliMonthLength(startParts.jy, startParts.jm)) {
        return null;
    }

    return { jy: startParts.jy, jm: startParts.jm };
}

export function addJalaliMonth(jy, jm, delta) {
    let month = jm + delta;
    let year = jy;
    while (month > 12) {
        month -= 12;
        year += 1;
    }
    while (month < 1) {
        month += 12;
        year -= 1;
    }

    return { jy: year, jm: month };
}

function partsOf(date) {
    const value = date instanceof Date ? date : new Date(date);
    const { jy, jm, jd } = toJalaali(value.getFullYear(), value.getMonth() + 1, value.getDate());

    return { date: value, jy, jm, jd };
}

function dateFromJalali(jy, jm, jd) {
    const { gy, gm, gd } = toGregorian(jy, jm, jd);

    return new Date(gy, gm - 1, gd);
}

export function jalaliYearRange(jy) {
    return {
        start: jalaliMonthRange(jy, 1).start,
        end: jalaliMonthRange(jy, 12).end,
    };
}

export function jalaliQuarterRange(jy, jm) {
    const startMonth = Math.floor((jm - 1) / 3) * 3 + 1;

    return {
        start: jalaliMonthRange(jy, startMonth).start,
        end: jalaliMonthRange(jy, startMonth + 2).end,
    };
}

export function jalaliHalfRange(jy, jm) {
    if (jm <= 6) {
        return {
            start: jalaliMonthRange(jy, 1).start,
            end: jalaliMonthRange(jy, 6).end,
        };
    }

    return {
        start: jalaliMonthRange(jy, 7).start,
        end: jalaliMonthRange(jy, 12).end,
    };
}

function jalaliWeekRange(date) {
    return {
        start: startOfDay(startOfWeek(date, { weekStartsOn: 6 })),
        end: endOfDay(endOfWeek(date, { weekStartsOn: 6 })),
    };
}

/**
 * Default window for a view range, using Jalali month/year boundaries.
 * Returns null for day-count ranges that are the same in both calendars.
 */
export function getJalaliViewRange(viewRange, today) {
    const { date, jy, jm } = partsOf(today);
    switch (viewRange) {
        case "1W":
            return jalaliWeekRange(date);
        case "1M":
            return jalaliMonthRange(jy, jm);
        case "MTD":
            return { start: jalaliMonthRange(jy, jm).start, end: endOfDay(date) };
        case "3M":
            return jalaliQuarterRange(jy, jm);
        case "QTD":
            return { start: jalaliQuarterRange(jy, jm).start, end: endOfDay(date) };
        case "6M":
            return jalaliHalfRange(jy, jm);
        case "1Y":
            return jalaliYearRange(jy);
        case "YTD":
            return { start: jalaliYearRange(jy).start, end: endOfDay(date) };
        default:
            return null;
    }
}

/**
 * Step a date by one view-range period on the Jalali calendar.
 * Returns null when that range is not calendar-specific.
 */
export function addJalaliViewPeriod(date, viewRange, delta) {
    const { jy, jm, jd } = partsOf(date);
    switch (viewRange) {
        case "1W":
            return jalaliWeekRange(addWeeks(partsOf(date).date, delta));
        case "1M": {
            const next = addJalaliMonth(jy, jm, delta);
            return jalaliMonthRange(next.jy, next.jm);
        }
        case "MTD": {
            const next = addJalaliMonth(jy, jm, delta);
            const day = Math.min(jd, jalaaliMonthLength(next.jy, next.jm));
            return {
                start: jalaliMonthRange(next.jy, next.jm).start,
                end: endOfDay(dateFromJalali(next.jy, next.jm, day)),
            };
        }
        case "3M":
        case "QTD": {
            const next = addJalaliMonth(jy, jm, delta * 3);
            if (viewRange === "3M") {
                return jalaliQuarterRange(next.jy, next.jm);
            }
            const day = Math.min(jd, jalaaliMonthLength(next.jy, next.jm));
            return {
                start: jalaliQuarterRange(next.jy, next.jm).start,
                end: endOfDay(dateFromJalali(next.jy, next.jm, day)),
            };
        }
        case "6M": {
            const secondHalf = jm > 6;
            let year = jy;
            let nextIsSecond = secondHalf;
            if (delta > 0) {
                if (secondHalf) {
                    year += 1;
                    nextIsSecond = false;
                } else {
                    nextIsSecond = true;
                }
            } else if (!secondHalf) {
                year -= 1;
                nextIsSecond = true;
            } else {
                nextIsSecond = false;
            }
            return jalaliHalfRange(year, nextIsSecond ? 7 : 1);
        }
        case "1Y":
            return jalaliYearRange(jy + delta);
        case "YTD": {
            const year = jy + delta;
            const day = Math.min(jd, jalaaliMonthLength(year, jm));
            return {
                start: jalaliYearRange(year).start,
                end: endOfDay(dateFromJalali(year, jm, day)),
            };
        }
        default:
            return null;
    }
}

export { PERSIAN_MONTHS, PERSIAN_WEEKDAYS_SHORT };
