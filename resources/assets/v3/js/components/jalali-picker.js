/*
 * Jalali date / datetime picker with segmented year-month-day (like datetime-local)
 * and a calendar popup styled like the browser Gregorian picker.
 * The paired input keeps a Gregorian value.
 */

import { jalaaliMonthLength, toGregorian, toJalaali } from "jalaali-js";
import formatDate from "../util/format-date.js";
import { fromPersianDigits, PERSIAN_MONTHS, PERSIAN_WEEKDAYS_SHORT, toPersianDigits } from "../util/jalali.js";

const YEAR_LIST_MIN = 1200;
const YEAR_LIST_MAX = 1500;

let stylesInjected = false;

function injectStyles() {
    if (stylesInjected) {
        return;
    }
    stylesInjected = true;
    const style = document.createElement("style");
    style.textContent = `
        .jalali-picker { position: relative; }
        .jalali-picker-control { display: flex; }
        .jalali-picker-date {
            display: flex;
            align-items: center;
            gap: 0;
            flex: 1 1 auto;
            min-width: 0;
            border-start-end-radius: 0;
            border-end-end-radius: 0;
            background: var(--bs-body-bg);
            direction: ltr;
            cursor: text;
            user-select: none;
        }
        .jalali-sep {
            color: var(--bs-secondary-color);
            padding: 0 1px;
        }
        .jalali-segment {
            border: 0;
            background: transparent;
            color: inherit;
            padding: 0 2px;
            font: inherit;
            line-height: inherit;
            border-radius: 2px;
        }
        .jalali-segment.is-active {
            background: Highlight;
            color: HighlightText;
        }
        .jalali-segment.is-placeholder {
            color: var(--bs-secondary-color);
        }
        .jalali-picker-time-field {
            width: 6.75rem;
            flex: 0 0 6.75rem;
            border-radius: 0;
            direction: ltr;
        }
        .jalali-picker-button {
            border-start-start-radius: 0;
            border-end-start-radius: 0;
        }
        .jalali-popover {
            position: absolute;
            z-index: 1080;
            top: calc(100% + 4px);
            inset-inline-start: 0;
            width: max-content;
            max-width: calc(100vw - 1rem);
            padding: 0.5rem 0.625rem 0.625rem;
            background: var(--bs-body-bg);
            color: var(--bs-body-color);
            border: 1px solid var(--bs-border-color);
            border-radius: 0.375rem;
            box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.12);
        }
        .jalali-popover-body {
            display: flex;
            align-items: stretch;
            gap: 0.75rem;
        }
        .jalali-cal {
            width: 17.5rem;
            flex: 0 0 17.5rem;
        }
        .jalali-cal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            min-height: 1.75rem;
        }
        .jalali-cal-header-center {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            justify-content: center;
            flex: 1;
        }
        .jalali-cal-nav {
            border: 0;
            background: transparent;
            color: inherit;
            width: 1.75rem;
            height: 1.75rem;
            padding: 0;
            line-height: 1;
            font-size: 1.125rem;
            border-radius: 0.25rem;
        }
        .jalali-cal-nav:hover {
            background: var(--bs-secondary-bg);
        }
        .jalali-cal-title {
            border: 0;
            background: transparent;
            color: inherit;
            font-weight: 600;
            padding: 0.125rem 0.35rem;
            border-radius: 0.25rem;
            font-size: 0.9375rem;
        }
        .jalali-cal-title:hover {
            background: var(--bs-secondary-bg);
        }
        .jalali-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
            text-align: center;
        }
        .jalali-picker-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 4px;
        }
        .jalali-year-scroll {
            max-height: 16rem;
            overflow-y: auto;
            margin: 0 -0.125rem;
            padding: 0 0.125rem;
        }
        .jalali-weekday {
            font-size: 0.75rem;
            color: var(--bs-secondary-color);
            padding: 0.25rem 0;
        }
        .jalali-day, .jalali-blank, .jalali-picker-cell {
            border: 0;
            background: transparent;
            color: inherit;
            border-radius: 0.375rem;
            padding: 0.35rem 0.25rem;
            margin-inline: auto;
        }
        .jalali-day {
            border-radius: 50%;
            width: 2rem;
            height: 2rem;
            padding: 0;
        }
        .jalali-day:hover, .jalali-picker-cell:hover {
            background: var(--bs-secondary-bg);
        }
        .jalali-day.is-today { box-shadow: inset 0 0 0 1px var(--bs-primary); }
        .jalali-day.is-selected, .jalali-day.is-selected:hover,
        .jalali-picker-cell.is-selected, .jalali-picker-cell.is-selected:hover {
            background: var(--bs-primary);
            color: #fff;
        }
        .jalali-field-gap {
            width: 0.65rem;
            flex: 0 0 0.65rem;
        }
        .jalali-side-clock {
            display: flex;
            align-items: stretch;
            gap: 0.35rem;
            height: 16rem;
            padding-inline-start: 0.5rem;
            border-inline-start: 1px solid var(--bs-border-color);
        }
        .jalali-time-spinner {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 3.25rem;
            height: 100%;
        }
        .jalali-time-col {
            width: 100%;
            flex: 1 1 auto;
            min-height: 0;
            overflow: hidden;
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 2px;
            direction: ltr;
        }
        .jalali-time-col--ampm {
            width: 3.25rem;
            flex: 0 0 auto;
            height: 100%;
            justify-content: center;
            overflow: visible;
        }
        .jalali-clock-spin {
            border: 0;
            background: transparent;
            color: inherit;
            width: 1.75rem;
            height: 1.5rem;
            padding: 0;
            line-height: 1;
            font-size: 0.75rem;
            border-radius: 0.25rem;
            flex: 0 0 auto;
        }
        .jalali-clock-spin:hover {
            background: var(--bs-secondary-bg);
        }
        .jalali-time-option {
            border: 0;
            background: transparent;
            color: inherit;
            border-radius: 0.375rem;
            padding: 0.35rem 0;
            font: inherit;
            line-height: 1.2;
        }
        .jalali-time-option:hover {
            background: var(--bs-secondary-bg);
        }
        .jalali-time-option.is-selected,
        .jalali-time-option.is-selected:hover {
            background: var(--bs-primary);
            color: #fff;
        }
    `;
    document.head.appendChild(style);
}

function pad(value) {
    return String(value).padStart(2, "0");
}

function parseDigitKey(key) {
    if (key >= "0" && key <= "9") {
        return Number(key);
    }
    const fromPersian = fromPersianDigits(key);
    if (fromPersian.length === 1 && fromPersian >= "0" && fromPersian <= "9") {
        return Number(fromPersian);
    }
    const arabic = "٠١٢٣٤٥٦٧٨٩".indexOf(key);
    if (arabic >= 0) {
        return arabic;
    }
    return null;
}

function uses12HourClock() {
    const parts = new Intl.DateTimeFormat(undefined, { hour: "numeric" }).formatToParts(
        new Date(2020, 0, 1, 13, 0),
    );
    return parts.some((part) => part.type === "dayPeriod");
}

function dayPeriodLabel(pm) {
    const date = new Date(2020, 0, 1, pm ? 13 : 9, 0);
    const part = new Intl.DateTimeFormat(undefined, { hour: "numeric" }).formatToParts(date).find(
        (p) => p.type === "dayPeriod",
    );
    return part?.value ?? (pm ? "PM" : "AM");
}

function readDate(value, withTime) {
    if (!value) {
        return new Date();
    }
    const normalized = withTime ? String(value).trim().replace(" ", "T") : `${value}T12:00:00`;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? new Date() : date;
}

function writeValue(date, withTime) {
    if (withTime) {
        return formatDate(date, "yyyy-MM-dd'T'HH:mm:ssxxx");
    }
    return formatDate(date, "yyyy-MM-dd");
}

function getClockParts(date, use12) {
    const hours24 = date.getHours();
    const minute = date.getMinutes();
    if (!use12) {
        return { hours24, hour: hours24, minute, pm: hours24 >= 12 };
    }
    let hour = hours24 % 12;
    if (hour === 0) {
        hour = 12;
    }
    return { hours24, hour, minute, pm: hours24 >= 12 };
}

function hours24FromParts(hour, minute, pm, use12) {
    if (!use12) {
        return { hours: hour, minutes: minute };
    }
    let hours = hour % 12;
    if (hour === 12) {
        hours = 0;
    }
    if (pm) {
        hours += 12;
    }
    return { hours, minutes: minute };
}

function clampDay(jy, jm, jd) {
    const max = jalaaliMonthLength(jy, jm);
    return Math.min(max, Math.max(1, jd));
}

function weekdayOffset(jy, jm) {
    const g = toGregorian(jy, jm, 1);
    const jsDay = new Date(g.gy, g.gm - 1, g.gd).getDay();
    return (jsDay + 1) % 7;
}

function selectedParts(value, withTime) {
    if (!value) {
        return null;
    }
    const date = readDate(value, withTime);
    return toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function dayFirstDigitCommits(digit, jy, jm) {
    const max = jalaaliMonthLength(jy, jm);
    if (digit < 1) {
        return false;
    }
    if (digit * 10 > max) {
        return true;
    }
    if (digit > Math.floor(max / 10)) {
        return true;
    }
    return false;
}

function hourFirstDigitCommits(digit, use12) {
    if (use12) {
        return digit >= 2 && digit <= 9;
    }
    return digit >= 3 && digit <= 9;
}

function minuteFirstDigitCommits(digit) {
    return digit >= 6 && digit <= 9;
}

function createCalNavButton(label, ariaLabel) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "jalali-cal-nav";
    button.textContent = label;
    button.setAttribute("aria-label", ariaLabel);
    return button;
}

/**
 * @param {HTMLElement} host
 * @param {HTMLInputElement} hidden
 * @param {{ withTime?: boolean }} options
 */
export function attachJalaliPicker(host, hidden, options = {}) {
    if (host.dataset.jalaliMounted === "1" || !(hidden instanceof HTMLInputElement)) {
        return;
    }
    host.dataset.jalaliMounted = "1";
    injectStyles();

    const withTime = options.withTime === true;
    const use12Hour = uses12HourClock();
    host.classList.add("jalali-picker");

    const control = document.createElement("div");
    control.className = "input-group jalali-picker-control";
    if (withTime) {
        control.classList.add("jalali-picker-control--datetime");
    }

    const dateContainer = document.createElement("div");
    dateContainer.className = "form-control jalali-picker-date";
    dateContainer.tabIndex = 0;
    dateContainer.setAttribute("role", "group");
    dateContainer.setAttribute("aria-label", "تاریخ شمسی");

    const segmentYear = document.createElement("button");
    segmentYear.type = "button";
    segmentYear.className = "jalali-segment";
    segmentYear.dataset.part = "year";
    const sep1 = document.createElement("span");
    sep1.className = "jalali-sep";
    sep1.textContent = "/";
    const segmentMonth = document.createElement("button");
    segmentMonth.type = "button";
    segmentMonth.className = "jalali-segment";
    segmentMonth.dataset.part = "month";
    const sep2 = document.createElement("span");
    sep2.className = "jalali-sep";
    sep2.textContent = "/";
    const segmentDay = document.createElement("button");
    segmentDay.type = "button";
    segmentDay.className = "jalali-segment";
    segmentDay.dataset.part = "day";
    dateContainer.append(segmentYear, sep1, segmentMonth, sep2, segmentDay);

    const segments = { year: segmentYear, month: segmentMonth, day: segmentDay };
    let partOrder = ["year", "month", "day"];

    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-outline-secondary jalali-picker-button";
    button.innerHTML = '<span class="bi bi-calendar"></span>';

    let hourColumn = null;
    let minuteColumn = null;
    let ampmColumn = null;
    let activeTimePart = "hour";
    let timeDigitBuffer = "";

    const popover = document.createElement("div");
    popover.className = "jalali-popover d-none";
    popover.addEventListener("mousedown", (event) => {
        const tag = event.target?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
            return;
        }
        event.preventDefault();
    });

    const popoverBody = document.createElement("div");
    popoverBody.className = "jalali-popover-body";
    const calendarHost = document.createElement("div");
    calendarHost.className = "jalali-cal";
    popoverBody.appendChild(calendarHost);
    popover.appendChild(popoverBody);

    const makeTimeSegment = (part) => {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "jalali-segment";
        el.dataset.part = part;
        return el;
    };

    if (withTime) {
        const gap = document.createElement("span");
        gap.className = "jalali-field-gap";
        const fieldHour = makeTimeSegment("hour");
        const fieldColon = document.createElement("span");
        fieldColon.className = "jalali-sep";
        fieldColon.textContent = ":";
        const fieldMinute = makeTimeSegment("minute");
        dateContainer.append(gap, fieldHour, fieldColon, fieldMinute);
        segments.hour = fieldHour;
        segments.minute = fieldMinute;
        partOrder = ["year", "month", "day", "hour", "minute"];
        if (use12Hour) {
            const fieldAmPm = makeTimeSegment("ampm");
            dateContainer.appendChild(fieldAmPm);
            segments.ampm = fieldAmPm;
            partOrder.push("ampm");
        }

        const sideWrap = document.createElement("div");
        sideWrap.className = "jalali-side-clock";
        const fillColumn = (column, values, onPick) => {
            values.forEach((value) => {
                const option = document.createElement("button");
                option.type = "button";
                option.className = "jalali-time-option";
                option.dataset.value = String(value);
                option.textContent = toPersianDigits(typeof value === "number" ? (use12Hour && column !== minuteColumn ? String(value) : pad(value)) : value);
                option.addEventListener("click", (event) => {
                    event.stopPropagation();
                    onPick(value);
                });
                column.appendChild(option);
            });
        };
        hourColumn = document.createElement("div");
        hourColumn.className = "jalali-time-col";
        hourColumn.setAttribute("aria-label", "ساعت");
        minuteColumn = document.createElement("div");
        minuteColumn.className = "jalali-time-col";
        minuteColumn.setAttribute("aria-label", "دقیقه");
        const hourValues = use12Hour
            ? Array.from({ length: 12 }, (_, index) => index + 1)
            : Array.from({ length: 24 }, (_, index) => index);
        fillColumn(hourColumn, hourValues, (hour) => {
            const base = hidden.value ? readDate(hidden.value, true) : new Date();
            const clock = getClockParts(base, use12Hour);
            applyClockParts(hour, clock.minute, clock.pm);
        });
        fillColumn(minuteColumn, Array.from({ length: 60 }, (_, index) => index), (minute) => {
            const base = hidden.value ? readDate(hidden.value, true) : new Date();
            const clock = getClockParts(base, use12Hour);
            applyClockParts(clock.hour, minute, clock.pm);
        });
        const scrollColumn = (column, direction) => {
            const option = column.querySelector(".jalali-time-option");
            const step = (option?.offsetHeight || 28) + 2;
            const max = column.scrollHeight - column.clientHeight;
            column.scrollTop = Math.max(0, Math.min(max, column.scrollTop + direction * step));
        };
        const spinnerFor = (column, label) => {
            const spinner = document.createElement("div");
            spinner.className = "jalali-time-spinner";
            const up = document.createElement("button");
            up.type = "button";
            up.className = "jalali-clock-spin";
            up.textContent = "▲";
            up.setAttribute("aria-label", `${label} بالا`);
            const down = document.createElement("button");
            down.type = "button";
            down.className = "jalali-clock-spin";
            down.textContent = "▼";
            down.setAttribute("aria-label", `${label} پایین`);
            up.addEventListener("click", (event) => {
                event.stopPropagation();
                scrollColumn(column, -1);
            });
            down.addEventListener("click", (event) => {
                event.stopPropagation();
                scrollColumn(column, 1);
            });
            spinner.append(up, column, down);
            return spinner;
        };
        sideWrap.append(spinnerFor(hourColumn, "ساعت"), spinnerFor(minuteColumn, "دقیقه"));
        if (use12Hour) {
            ampmColumn = document.createElement("div");
            ampmColumn.className = "jalali-time-col jalali-time-col--ampm";
            ["AM", "PM"].forEach((label, index) => {
                const option = document.createElement("button");
                option.type = "button";
                option.className = "jalali-time-option";
                option.dataset.value = index === 1 ? "1" : "0";
                option.textContent = dayPeriodLabel(index === 1);
                option.addEventListener("click", (event) => {
                    event.stopPropagation();
                    const base = hidden.value ? readDate(hidden.value, true) : new Date();
                    const clock = getClockParts(base, true);
                    applyClockParts(clock.hour, clock.minute, index === 1);
                });
                ampmColumn.appendChild(option);
            });
            sideWrap.appendChild(ampmColumn);
        }
        popoverBody.appendChild(sideWrap);
    }

    control.append(dateContainer, button);
    host.append(control, popover);

    let viewJy = 1404;
    let viewJm = 1;
    let calendarView = "days";
    let activePart = "year";
    let digitBuffer = "";

    const isDateFocused = () => dateContainer.contains(document.activeElement) || document.activeElement === dateContainer;
    const isTimePart = (part) => part === "hour" || part === "minute" || part === "ampm";

    const getPartsFromHidden = () => {
        if (!hidden.value) {
            return null;
        }
        const date = readDate(hidden.value, withTime);
        return toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    };

    const getWorkingParts = () => {
        const fromHidden = getPartsFromHidden();
        if (fromHidden) {
            return fromHidden;
        }
        const now = toJalaali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
        return { jy: now.jy, jm: now.jm, jd: now.jd };
    };

    const setActivePart = (part) => {
        activePart = part;
        digitBuffer = "";
        if (isTimePart(part)) {
            activeTimePart = part;
            timeDigitBuffer = "";
        }
        Object.entries(segments).forEach(([name, el]) => {
            el.classList.toggle("is-active", name === part && isDateFocused());
        });
    };

    const setActiveTimePart = (part) => {
        activeTimePart = part;
        activePart = part;
        timeDigitBuffer = "";
        digitBuffer = "";
    };

    const applyDateTime = (nextDate) => {
        const written = writeValue(nextDate, withTime);
        if (hidden.value !== written) {
            hidden.value = written;
            hidden.dispatchEvent(new Event("input", { bubbles: true }));
            hidden.dispatchEvent(new Event("change", { bubbles: true }));
        }
        syncSegments(true);
        syncPopupTimeSegments(true);
    };

    const applyJalaliParts = (jy, jm, jd) => {
        const jdClamped = clampDay(jy, jm, jd);
        const g = toGregorian(jy, jm, jdClamped);
        const base = hidden.value ? readDate(hidden.value, withTime) : new Date();
        const nextDate = new Date(
            g.gy,
            g.gm - 1,
            g.gd,
            withTime ? base.getHours() : 12,
            withTime ? base.getMinutes() : 0,
            withTime ? base.getSeconds() : 0,
        );
        viewJy = jy;
        viewJm = jm;
        applyDateTime(nextDate);
        if (!popover.classList.contains("d-none") && calendarView === "days") {
            render();
        }
    };

    const syncSegmentLabels = (parts) => {
        if (!parts) {
            segmentYear.textContent = "yyyy";
            segmentMonth.textContent = "mm";
            segmentDay.textContent = "dd";
            segmentYear.classList.add("is-placeholder");
            segmentMonth.classList.add("is-placeholder");
            segmentDay.classList.add("is-placeholder");
            return;
        }
        segmentYear.classList.remove("is-placeholder");
        segmentMonth.classList.remove("is-placeholder");
        segmentDay.classList.remove("is-placeholder");
        if (activePart === "year" && digitBuffer !== "") {
            segmentYear.textContent = toPersianDigits(digitBuffer);
        } else {
            segmentYear.textContent = toPersianDigits(String(parts.jy));
        }
        if (activePart === "month" && digitBuffer !== "") {
            segmentMonth.textContent = toPersianDigits(digitBuffer);
        } else {
            segmentMonth.textContent = toPersianDigits(pad(parts.jm));
        }
        if (activePart === "day" && digitBuffer !== "") {
            segmentDay.textContent = toPersianDigits(digitBuffer);
        } else {
            segmentDay.textContent = toPersianDigits(pad(parts.jd));
        }
    };

    const syncSegments = (force = false) => {
        if (!force && isDateFocused() && digitBuffer !== "") {
            return;
        }
        const parts = getPartsFromHidden();
        syncSegmentLabels(parts);
        Object.entries(segments).forEach(([name, el]) => {
            el.classList.toggle("is-active", name === activePart && isDateFocused());
        });
    };

    const paintTimeControl = (hourEl, minuteEl, ampmEl, focused) => {
        if (!hourEl) {
            return;
        }
        const base = hidden.value ? readDate(hidden.value, true) : new Date();
        const clock = getClockParts(base, use12Hour);
        const showBuffer = focused && timeDigitBuffer !== "";
        hourEl.textContent = showBuffer && activeTimePart === "hour"
            ? toPersianDigits(timeDigitBuffer)
            : toPersianDigits(use12Hour ? String(clock.hour) : pad(clock.hour));
        minuteEl.textContent = showBuffer && activeTimePart === "minute"
            ? toPersianDigits(timeDigitBuffer)
            : toPersianDigits(pad(clock.minute));
        if (ampmEl) {
            ampmEl.textContent = dayPeriodLabel(clock.pm);
        }
        hourEl.classList.toggle("is-active", focused && activeTimePart === "hour");
        minuteEl.classList.toggle("is-active", focused && activeTimePart === "minute");
        if (ampmEl) {
            ampmEl.classList.toggle("is-active", focused && activeTimePart === "ampm");
        }
    };

    const syncPopupTimeSegments = (force = false) => {
        if (!withTime) {
            return;
        }
        const fieldFocused = isDateFocused() && isTimePart(activePart);
        if (!force && fieldFocused && timeDigitBuffer !== "") {
            return;
        }
        paintTimeControl(segments.hour, segments.minute, segments.ampm, fieldFocused);
        if (!hourColumn) {
            return;
        }
        const base = hidden.value ? readDate(hidden.value, true) : new Date();
        const clock = getClockParts(base, use12Hour);
        const markColumn = (column, selectedValue) => {
            let selected = null;
            column.querySelectorAll(".jalali-time-option").forEach((option) => {
                const on = option.dataset.value === String(selectedValue);
                option.classList.toggle("is-selected", on);
                if (on) {
                    selected = option;
                }
            });
            if (selected && !popover.classList.contains("d-none")) {
                column.scrollTop = Math.max(0, selected.offsetTop - (column.clientHeight - selected.offsetHeight) / 2);
            }
        };
        markColumn(hourColumn, clock.hour);
        markColumn(minuteColumn, clock.minute);
        if (ampmColumn) {
            markColumn(ampmColumn, clock.pm ? "1" : "0");
        }
    };

    const syncView = () => {
        const parts = getWorkingParts();
        viewJy = parts.jy;
        viewJm = parts.jm;
    };

    const syncDisplay = (force = false) => {
        if (!force && isDateFocused()) {
            return;
        }
        digitBuffer = "";
        syncSegments(true);
        syncPopupTimeSegments(true);
    };

    const setHidden = (next) => {
        if (hidden.value !== next) {
            hidden.value = next;
            hidden.dispatchEvent(new Event("input", { bubbles: true }));
            hidden.dispatchEvent(new Event("change", { bubbles: true }));
        }
        syncDisplay(true);
    };

    const applyClockParts = (hour, minute, pm) => {
        const base = hidden.value ? readDate(hidden.value, true) : new Date();
        const { hours, minutes } = hours24FromParts(hour, minute, pm, use12Hour);
        const nextDate = new Date(
            base.getFullYear(),
            base.getMonth(),
            base.getDate(),
            hours,
            minutes,
            base.getSeconds(),
        );
        applyDateTime(nextDate);
    };

    const stepTimePart = (delta) => {
        const base = hidden.value ? readDate(hidden.value, true) : new Date();
        const clock = getClockParts(base, use12Hour);
        if (activeTimePart === "hour") {
            if (use12Hour) {
                let hour = clock.hour + delta;
                while (hour < 1) {
                    hour += 12;
                }
                while (hour > 12) {
                    hour -= 12;
                }
                applyClockParts(hour, clock.minute, clock.pm);
            } else {
                let hour = (clock.hour + delta + 24) % 24;
                applyClockParts(hour, clock.minute, clock.pm);
            }
        } else if (activeTimePart === "minute") {
            let minute = (clock.minute + delta + 60) % 60;
            applyClockParts(clock.hour, minute, clock.pm);
        } else if (use12Hour) {
            applyClockParts(clock.hour, clock.minute, !clock.pm);
        }
        syncPopupTimeSegments(true);
    };

    const timePartOrder = () => (use12Hour ? ["hour", "minute", "ampm"] : ["hour", "minute"]);

    const focusNextTimePart = (direction) => {
        const order = timePartOrder();
        const idx = order.indexOf(activeTimePart);
        const nextIdx = idx + direction;
        if (nextIdx >= 0 && nextIdx < order.length) {
            setActiveTimePart(order[nextIdx]);
            syncPopupTimeSegments(true);
            dateContainer.focus();
        }
    };

    const commitTimeDigit = (digit) => {
        const base = hidden.value ? readDate(hidden.value, true) : new Date();
        const clock = getClockParts(base, use12Hour);
        if (activeTimePart === "hour") {
            if (timeDigitBuffer === "") {
                if (hourFirstDigitCommits(digit, use12Hour)) {
                    applyClockParts(digit, clock.minute, clock.pm);
                    setActiveTimePart("minute");
                    syncPopupTimeSegments(true);
                    return;
                }
                timeDigitBuffer = String(digit);
            } else {
                const hour = Number(timeDigitBuffer + String(digit));
                timeDigitBuffer = "";
                const max = use12Hour ? 12 : 23;
                const min = use12Hour ? 1 : 0;
                if (hour >= min && hour <= max) {
                    applyClockParts(hour, clock.minute, clock.pm);
                    setActiveTimePart("minute");
                }
            }
        } else if (activeTimePart === "minute") {
            if (timeDigitBuffer === "") {
                if (minuteFirstDigitCommits(digit)) {
                    applyClockParts(clock.hour, digit, clock.pm);
                    timeDigitBuffer = "";
                    if (use12Hour) {
                        setActiveTimePart("ampm");
                    }
                    syncPopupTimeSegments(true);
                    return;
                }
                timeDigitBuffer = String(digit);
            } else {
                const minute = Number(timeDigitBuffer + String(digit));
                timeDigitBuffer = "";
                if (minute >= 0 && minute <= 59) {
                    applyClockParts(clock.hour, minute, clock.pm);
                    if (use12Hour) {
                        setActiveTimePart("ampm");
                    }
                }
            }
        }
        syncPopupTimeSegments(true);
    };

    const stepPart = (delta) => {
        if (isTimePart(activePart)) {
            activeTimePart = activePart;
            stepTimePart(delta);
            return;
        }
        const parts = getWorkingParts();
        if (activePart === "year") {
            applyJalaliParts(parts.jy + delta, parts.jm, parts.jd);
        } else if (activePart === "month") {
            let jm = parts.jm + delta;
            let jy = parts.jy;
            while (jm < 1) {
                jm += 12;
                jy -= 1;
            }
            while (jm > 12) {
                jm -= 12;
                jy += 1;
            }
            applyJalaliParts(jy, jm, parts.jd);
        } else {
            const max = jalaaliMonthLength(parts.jy, parts.jm);
            let jd = parts.jd + delta;
            if (jd < 1) {
                jd = max;
            } else if (jd > max) {
                jd = 1;
            }
            applyJalaliParts(parts.jy, parts.jm, jd);
        }
    };

    const focusNextPart = (direction) => {
        const idx = partOrder.indexOf(activePart);
        const nextIdx = idx + direction;
        if (nextIdx >= 0 && nextIdx < partOrder.length) {
            setActivePart(partOrder[nextIdx]);
            syncSegments(true);
            syncPopupTimeSegments(true);
            dateContainer.focus();
            return;
        }
    };

    const commitDigit = (digit) => {
        if (isTimePart(activePart)) {
            activeTimePart = activePart;
            commitTimeDigit(digit);
            return;
        }
        const parts = getWorkingParts();
        if (activePart === "year") {
            digitBuffer += String(digit);
            if (digitBuffer.length >= 4) {
                const jy = Number(digitBuffer.slice(0, 4));
                digitBuffer = "";
                applyJalaliParts(jy, parts.jm, parts.jd);
                setActivePart("month");
            }
            syncSegmentLabels(getPartsFromHidden() ?? parts);
            return;
        }
        if (activePart === "month") {
            if (digitBuffer === "") {
                if (digit >= 2 && digit <= 9) {
                    applyJalaliParts(parts.jy, digit, parts.jd);
                    setActivePart("day");
                    syncSegments(true);
                    return;
                }
                digitBuffer = String(digit);
            } else {
                const jm = Number(digitBuffer + String(digit));
                digitBuffer = "";
                if (jm >= 1 && jm <= 12) {
                    applyJalaliParts(parts.jy, jm, parts.jd);
                    setActivePart("day");
                }
            }
            syncSegmentLabels(getPartsFromHidden() ?? parts);
            return;
        }
        if (digitBuffer === "") {
            if (dayFirstDigitCommits(digit, parts.jy, parts.jm)) {
                applyJalaliParts(parts.jy, parts.jm, digit);
                digitBuffer = "";
                if (withTime) {
                    setActivePart("hour");
                }
                syncSegments(true);
                syncPopupTimeSegments(true);
                return;
            }
            digitBuffer = String(digit);
        } else {
            const jd = Number(digitBuffer + String(digit));
            digitBuffer = "";
            const max = jalaaliMonthLength(parts.jy, parts.jm);
            if (jd >= 1 && jd <= max) {
                applyJalaliParts(parts.jy, parts.jm, jd);
                if (withTime) {
                    setActivePart("hour");
                }
            }
        }
        syncSegmentLabels(getPartsFromHidden() ?? parts);
    };

    Object.entries(segments).forEach(([part, el]) => {
        el.addEventListener("mousedown", (event) => {
            event.preventDefault();
            setActivePart(part);
            dateContainer.focus();
            syncSegments(true);
        });
    });

    dateContainer.addEventListener("focus", () => syncSegments(true));
    dateContainer.addEventListener("blur", () => {
        digitBuffer = "";
        syncSegments(true);
    });

    dateContainer.addEventListener("keydown", (event) => {
        if (event.key === "ArrowUp") {
            event.preventDefault();
            stepPart(1);
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            stepPart(-1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            focusNextPart(1);
        } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            focusNextPart(-1);
        } else if (event.key === "Escape") {
            popover.classList.add("d-none");
            digitBuffer = "";
            syncSegments(true);
        } else {
            const digit = parseDigitKey(event.key);
            if (digit !== null) {
                event.preventDefault();
                commitDigit(digit);
            }
        }
    });

    const shiftMonth = (delta) => {
        if (viewJm === 1 && delta < 0) {
            viewJm = 12;
            viewJy -= 1;
        } else if (viewJm === 12 && delta > 0) {
            viewJm = 1;
            viewJy += 1;
        } else {
            viewJm += delta;
        }
    };

    const renderDays = () => {
        const header = document.createElement("div");
        header.className = "jalali-cal-header";
        const prev = createCalNavButton("‹", "ماه قبل");
        prev.addEventListener("click", () => {
            shiftMonth(-1);
            render();
        });
        const center = document.createElement("div");
        center.className = "jalali-cal-header-center";
        const monthBtn = document.createElement("button");
        monthBtn.type = "button";
        monthBtn.className = "jalali-cal-title";
        monthBtn.textContent = PERSIAN_MONTHS[viewJm - 1];
        monthBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            calendarView = "months";
            render();
        });
        const yearBtn = document.createElement("button");
        yearBtn.type = "button";
        yearBtn.className = "jalali-cal-title";
        yearBtn.textContent = toPersianDigits(String(viewJy));
        yearBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            calendarView = "years";
            render();
        });
        center.append(monthBtn, yearBtn);
        const next = createCalNavButton("›", "ماه بعد");
        next.addEventListener("click", () => {
            shiftMonth(1);
            render();
        });
        header.append(prev, center, next);
        calendarHost.appendChild(header);

        const grid = document.createElement("div");
        grid.className = "jalali-grid";
        PERSIAN_WEEKDAYS_SHORT.forEach((name) => {
            const cell = document.createElement("div");
            cell.className = "jalali-weekday";
            cell.textContent = name;
            grid.appendChild(cell);
        });
        const offset = weekdayOffset(viewJy, viewJm);
        for (let i = 0; i < offset; i += 1) {
            const blank = document.createElement("div");
            blank.className = "jalali-blank";
            grid.appendChild(blank);
        }
        const length = jalaaliMonthLength(viewJy, viewJm);
        const selected = selectedParts(hidden.value, withTime);
        const today = toJalaali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
        for (let day = 1; day <= length; day += 1) {
            const cell = document.createElement("button");
            cell.type = "button";
            cell.className = "jalali-day";
            cell.textContent = toPersianDigits(String(day));
            if (selected && selected.jy === viewJy && selected.jm === viewJm && selected.jd === day) {
                cell.classList.add("is-selected");
            }
            if (today.jy === viewJy && today.jm === viewJm && today.jd === day) {
                cell.classList.add("is-today");
            }
            cell.addEventListener("click", () => {
                const g = toGregorian(viewJy, viewJm, day);
                const current = readDate(hidden.value, withTime);
                const nextDate = new Date(
                    g.gy,
                    g.gm - 1,
                    g.gd,
                    current.getHours(),
                    current.getMinutes(),
                    current.getSeconds(),
                );
                setHidden(writeValue(nextDate, withTime));
                calendarView = "days";
                render();
                if (!withTime) {
                    popover.classList.add("d-none");
                }
            });
            grid.appendChild(cell);
        }
        calendarHost.appendChild(grid);
    };

    const renderMonths = () => {
        const header = document.createElement("div");
        header.className = "jalali-cal-header";
        const prev = createCalNavButton("‹", "سال قبل");
        prev.addEventListener("click", () => {
            viewJy -= 1;
            render();
        });
        const center = document.createElement("div");
        center.className = "jalali-cal-header-center";
        const yearBtn = document.createElement("button");
        yearBtn.type = "button";
        yearBtn.className = "jalali-cal-title";
        yearBtn.textContent = toPersianDigits(String(viewJy));
        yearBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            calendarView = "years";
            render();
        });
        center.appendChild(yearBtn);
        const next = createCalNavButton("›", "سال بعد");
        next.addEventListener("click", () => {
            viewJy += 1;
            render();
        });
        header.append(prev, center, next);
        calendarHost.appendChild(header);

        const grid = document.createElement("div");
        grid.className = "jalali-picker-grid";
        const selected = selectedParts(hidden.value, withTime);
        PERSIAN_MONTHS.forEach((name, index) => {
            const jm = index + 1;
            const cell = document.createElement("button");
            cell.type = "button";
            cell.className = "jalali-picker-cell";
            cell.textContent = name;
            if (selected && selected.jy === viewJy && selected.jm === jm) {
                cell.classList.add("is-selected");
            }
            cell.addEventListener("click", () => {
                viewJm = jm;
                calendarView = "days";
                render();
            });
            grid.appendChild(cell);
        });
        calendarHost.appendChild(grid);
    };

    const renderYears = () => {
        const header = document.createElement("div");
        header.className = "jalali-cal-header";
        const title = document.createElement("strong");
        title.className = "px-2";
        title.textContent = "انتخاب سال";
        header.appendChild(title);
        calendarHost.appendChild(header);

        const scroll = document.createElement("div");
        scroll.className = "jalali-year-scroll";
        const grid = document.createElement("div");
        grid.className = "jalali-picker-grid";
        const selected = selectedParts(hidden.value, withTime);
        for (let y = YEAR_LIST_MIN; y <= YEAR_LIST_MAX; y += 1) {
            const cell = document.createElement("button");
            cell.type = "button";
            cell.className = "jalali-picker-cell";
            cell.dataset.year = String(y);
            cell.textContent = toPersianDigits(String(y));
            if (selected && selected.jy === y) {
                cell.classList.add("is-selected");
            }
            cell.addEventListener("click", () => {
                viewJy = y;
                calendarView = "months";
                render();
            });
            grid.appendChild(cell);
        }
        scroll.appendChild(grid);
        calendarHost.appendChild(scroll);
        requestAnimationFrame(() => {
            const target = scroll.querySelector(".is-selected")
                || scroll.querySelector(`[data-year="${viewJy}"]`);
            target?.scrollIntoView({ block: "center" });
        });
    };

    const render = () => {
        calendarHost.replaceChildren();
        if (calendarView === "months") {
            renderMonths();
        } else if (calendarView === "years") {
            renderYears();
        } else {
            renderDays();
        }
        syncPopupTimeSegments(true);
    };

    const open = () => {
        syncView();
        calendarView = "days";
        render();
        popover.classList.remove("d-none");
    };

    button.addEventListener("click", () => {
        if (popover.classList.contains("d-none")) {
            open();
        } else {
            popover.classList.add("d-none");
        }
    });
    document.addEventListener("mousedown", (event) => {
        if (!event.composedPath().includes(host)) {
            popover.classList.add("d-none");
        }
    });

    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
    Object.defineProperty(hidden, "value", {
        configurable: true,
        get() {
            return descriptor.get.call(this);
        },
        set(next) {
            descriptor.set.call(this, next);
            syncDisplay();
        },
    });

    setActivePart("year");
    syncDisplay();
}

export function mountJalaliPickerHosts(root = document) {
    root.querySelectorAll("[data-jalali-picker]").forEach((host) => {
        const hidden = host.querySelector("[data-jalali-value]");
        if (!hidden) {
            return;
        }
        attachJalaliPicker(host, hidden, { withTime: host.getAttribute("data-jalali-picker") === "datetime" });
    });
}
