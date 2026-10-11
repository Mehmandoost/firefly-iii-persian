/*
 * Popup Jalali date / datetime picker. The closed control looks like a native
 * date input; the calendar opens on click. The paired input keeps a Gregorian value.
 */

import { jalaaliMonthLength, toGregorian, toJalaali } from "jalaali-js";
import formatDate from "../util/format-date.js";
import { PERSIAN_MONTHS, PERSIAN_WEEKDAYS_SHORT, toPersianDigits } from "../util/jalali.js";

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
        .jalali-picker-display {
            border-start-end-radius: 0;
            border-end-end-radius: 0;
            background: var(--bs-body-bg);
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
            width: 18.5rem;
            padding: 0.75rem;
            background: var(--bs-body-bg);
            color: var(--bs-body-color);
            border: 1px solid var(--bs-border-color);
            border-radius: 0.375rem;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        }
        .jalali-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
            text-align: center;
        }
        .jalali-weekday {
            font-size: 0.75rem;
            color: var(--bs-secondary-color);
            padding: 0.25rem 0;
        }
        .jalali-day, .jalali-blank {
            border: 0;
            background: transparent;
            color: inherit;
            border-radius: 50%;
            width: 2rem;
            height: 2rem;
            margin-inline: auto;
            padding: 0;
        }
        .jalali-day:hover { background: var(--bs-secondary-bg); }
        .jalali-day.is-today { box-shadow: inset 0 0 0 1px var(--bs-primary); }
        .jalali-day.is-selected, .jalali-day.is-selected:hover {
            background: var(--bs-primary);
            color: #fff;
        }
        .jalali-time {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-top: 0.75rem;
            padding-top: 0.75rem;
            border-top: 1px solid var(--bs-border-color);
        }
    `;
    document.head.appendChild(style);
}

function pad(value) {
    return String(value).padStart(2, "0");
}

function formatInput(date, withTime) {
    const { jy, jm, jd } = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    let text = `${jy}/${pad(jm)}/${pad(jd)}`;
    if (withTime) {
        text += ` ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
    return toPersianDigits(text);
}

function readDate(value, withTime) {
    if (!value) {
        return new Date();
    }
    const date = withTime ? new Date(value) : new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? new Date() : date;
}

function writeValue(date, withTime) {
    if (withTime) {
        return formatDate(date, "yyyy-MM-dd'T'HH:mm:ssxxx");
    }
    return formatDate(date, "yyyy-MM-dd");
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
    host.classList.add("jalali-picker");

    const control = document.createElement("div");
    control.className = "input-group jalali-picker-control";
    const display = document.createElement("input");
    display.type = "text";
    display.readOnly = true;
    display.className = "form-control jalali-picker-display";
    display.autocomplete = "off";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-outline-secondary jalali-picker-button";
    button.innerHTML = '<span class="bi bi-calendar"></span>';
    control.append(display, button);

    const popover = document.createElement("div");
    popover.className = "jalali-popover d-none";
    popover.addEventListener("mousedown", (event) => event.preventDefault());

    host.append(control, popover);

    let viewJy = 1404;
    let viewJm = 1;

    const syncView = () => {
        const date = readDate(hidden.value, withTime);
        const parts = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
        viewJy = parts.jy;
        viewJm = parts.jm;
    };

    const syncDisplay = () => {
        if (!hidden.value) {
            display.value = "";
            return;
        }
        display.value = formatInput(readDate(hidden.value, withTime), withTime);
    };

    const commit = (date, close) => {
        hidden.value = writeValue(date, withTime);
        hidden.dispatchEvent(new Event("input", { bubbles: true }));
        hidden.dispatchEvent(new Event("change", { bubbles: true }));
        syncDisplay();
        render();
        if (close) {
            popover.classList.add("d-none");
        }
    };

    const render = () => {
        popover.replaceChildren();
        const header = document.createElement("div");
        header.className = "d-flex justify-content-between align-items-center mb-2";
        const prev = document.createElement("button");
        prev.type = "button";
        prev.className = "btn btn-sm btn-outline-secondary";
        prev.textContent = "‹";
        prev.addEventListener("click", () => {
            if (viewJm === 1) {
                viewJm = 12;
                viewJy -= 1;
            } else {
                viewJm -= 1;
            }
            render();
        });
        const title = document.createElement("strong");
        title.textContent = toPersianDigits(`${PERSIAN_MONTHS[viewJm - 1]} ${viewJy}`);
        const next = document.createElement("button");
        next.type = "button";
        next.className = "btn btn-sm btn-outline-secondary";
        next.textContent = "›";
        next.addEventListener("click", () => {
            if (viewJm === 12) {
                viewJm = 1;
                viewJy += 1;
            } else {
                viewJm += 1;
            }
            render();
        });
        header.append(prev, title, next);
        popover.appendChild(header);

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
                const nextDate = new Date(g.gy, g.gm - 1, g.gd, current.getHours(), current.getMinutes(), 0);
                commit(nextDate, !withTime);
            });
            grid.appendChild(cell);
        }
        popover.appendChild(grid);

        if (withTime) {
            const current = readDate(hidden.value, true);
            const row = document.createElement("div");
            row.className = "jalali-time";
            const label = document.createElement("span");
            label.textContent = "ساعت";
            const hour = document.createElement("input");
            hour.type = "number";
            hour.min = "0";
            hour.max = "23";
            hour.className = "form-control form-control-sm";
            hour.value = pad(current.getHours());
            const minute = document.createElement("input");
            minute.type = "number";
            minute.min = "0";
            minute.max = "59";
            minute.className = "form-control form-control-sm";
            minute.value = pad(current.getMinutes());
            const applyTime = () => {
                const nextDate = readDate(hidden.value, true);
                nextDate.setHours(Math.min(23, Math.max(0, parseInt(hour.value, 10) || 0)));
                nextDate.setMinutes(Math.min(59, Math.max(0, parseInt(minute.value, 10) || 0)));
                nextDate.setSeconds(0);
                commit(nextDate, false);
            };
            hour.addEventListener("change", applyTime);
            minute.addEventListener("change", applyTime);
            row.append(label, hour, document.createTextNode(":"), minute);
            popover.appendChild(row);
        }
    };

    const open = () => {
        syncView();
        render();
        popover.classList.remove("d-none");
    };

    display.addEventListener("click", open);
    button.addEventListener("click", () => {
        if (popover.classList.contains("d-none")) {
            open();
        } else {
            popover.classList.add("d-none");
        }
    });
    document.addEventListener("click", (event) => {
        if (!host.contains(event.target)) {
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
