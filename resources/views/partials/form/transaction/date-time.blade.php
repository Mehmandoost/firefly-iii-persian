<div class="row mb-2">
    <label :for="'date_' + index" class="col-sm-1 col-form-label d-none d-sm-block">
        <em title="{{ __('firefly.date_and_time') }}" class="bi bi-calendar"></em>
    </label>
    <div class="col-sm-10">
        @include('partials.form.transaction.jalali-calendar-toggle')

        <template x-if="dateInputCalendar === 'gregorian'">
            <input type="datetime-local" class="form-control" :id="'date_' + index"
                   @change="changedDateTime"
                   @keyup.enter="save()"
                   x-bind:disabled="true===transaction.date_disabled"
                   x-bind:readonly="true===transaction.date_disabled"
                   x-model="transaction.date"
            >
        </template>

        <template x-if="dateInputCalendar === 'jalali'">
            <div data-jalali-picker="datetime">
                <input type="hidden" data-jalali-value :id="'date_' + index" x-model="transaction.date">
            </div>
        </template>
    </div>
</div>
