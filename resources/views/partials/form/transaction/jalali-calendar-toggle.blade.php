<div class="btn-group btn-group-sm mb-2" role="group" aria-label="{{ __('firefly.pref_date_input_calendar') }}">
    <button type="button" class="btn"
            :class="dateInputCalendar === 'jalali' ? 'btn-primary' : 'btn-outline-secondary'"
            @click="setDateInputCalendar('jalali')">شمسی</button>
    <button type="button" class="btn"
            :class="dateInputCalendar === 'gregorian' ? 'btn-primary' : 'btn-outline-secondary'"
            @click="setDateInputCalendar('gregorian')">میلادی</button>
</div>
