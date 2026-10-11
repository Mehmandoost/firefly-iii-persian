/*
 * date-input-calendar.js — Jalali/Gregorian date input preference and picker mounting.
 */

import formatDate from "../../../util/format-date.js";
import { attachJalaliPicker, mountJalaliPickerHosts } from "../../../components/jalali-picker.js";

export function dateInputCalendarState() {
    return {
        dateInputCalendar: "gregorian",

        initDateInputCalendar() {
            this.dateInputCalendar = window.store.get("dateInputCalendar") || "gregorian";
            queueMicrotask(() => mountJalaliPickerHosts());
        },

        async setDateInputCalendar(mode) {
            if (mode !== "gregorian" && mode !== "jalali") {
                return;
            }
            if (mode === this.dateInputCalendar) {
                return;
            }
            await window.axios.put("api/v1/preferences/dateInputCalendar", { data: mode });
            window.store.set("dateInputCalendar", mode);
            this.dateInputCalendar = mode;
            window.location.reload();
        },
    };
}

export function mountJalaliSingleDateTargets() {
    if ((window.store.get("dateInputCalendar") || "gregorian") !== "jalali") {
        return;
    }
    document.querySelectorAll("[data-jalali-date-target]").forEach((root) => {
        const hidden = document.getElementById(root.getAttribute("data-jalali-date-target"));
        if (!hidden) {
            return;
        }
        if (hidden.id === "customStart" && window.store.get("start") && hidden.value === "") {
            hidden.value = formatDate(new Date(window.store.get("start")), "yyyy-MM-dd");
        }
        if (hidden.id === "customEnd" && window.store.get("end") && hidden.value === "") {
            hidden.value = formatDate(new Date(window.store.get("end")), "yyyy-MM-dd");
        }
        attachJalaliPicker(root, hidden, { withTime: false });
    });
    document.querySelectorAll("[data-jalali-datetime-target]").forEach((root) => {
        const hidden = document.getElementById(root.getAttribute("data-jalali-datetime-target"));
        if (!hidden) {
            return;
        }
        attachJalaliPicker(root, hidden, { withTime: true });
    });
    mountJalaliPickerHosts();
}
