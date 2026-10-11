/*
 * jalali.js — Gregorian ↔ Jalali for display and pickers.
 */

import { toGregorian, toJalaali } from "jalaali-js";

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
    if (jm <= 6) {
        return 31;
    }
    if (jm <= 11) {
        return 30;
    }
    return toJalaali(jy + 1, 1, 1).jd === 1 ? 30 : 29;
}

export { PERSIAN_MONTHS, PERSIAN_WEEKDAYS_SHORT };
