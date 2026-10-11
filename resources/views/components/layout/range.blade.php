<li class="nav-item dropdown" id="date-dropdown">
    <a
        href="#"
        class="nav-link"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        id="date-range"
    >
        <em class="bi bi-calendar"></em>
        <span class="daterange-holder d-none d-md-inline"></span>
    </a>
    <ul
        x-data="dates" x-bind="eventListeners"
        class="dropdown-menu"

        aria-labelledby="date-range"
        style="--bs-dropdown-min-width: 8rem"
    >
        <li>
            <a href="#" class="dropdown-item daterange-current" @click="changeDateRange">current</a>
        </li>
        <li>
            <a href="#" @click="changeDateRange" class="dropdown-item daterange-next">next</a>
        </li>
        <li>
            <a href="#" class="dropdown-item daterange-prev" @click="changeDateRange">prev</a>
        </li>
        <li>
            <a href="#" class="dropdown-item daterange-today" @click="changeDateRange">today</a>
        </li>
        <li>
            <a href="#" class="dropdown-item daterange-7d" @click="changeDateRange">{{ __('firefly.last_seven_days') }}</a>
        </li>
        <li>
            <a href="#" class="dropdown-item daterange-30d" @click="changeDateRange">
                {{ __('firefly.last_thirty_days') }}
            </a>
        </li>
        <li>
            <a href="#" class="dropdown-item daterange-mtd" @click="changeDateRange">
                {{ __('firefly.month_to_date') }}
            </a>
        </li>
        <li>
            <a href="#" class="dropdown-item daterange-ytd" @click="changeDateRange">
                {{ __('firefly.year_to_date') }}
            </a>
        </li>
        <li>
            <a href="#" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#customDateRangeModal">
                {{ __('firefly.customRange') }}
            </a>
        </li>
        <li><hr class="dropdown-divider"></li>
        <li class="dropdown-header">{{ __('firefly.view_calendar') }}</li>
        <li class="px-3 pb-2">
            <div class="btn-group btn-group-sm w-100" role="group" aria-label="{{ __('firefly.view_calendar') }}">
                <button type="button" class="btn"
                        :class="viewCalendar === 'jalali' ? 'btn-primary' : 'btn-outline-secondary'"
                        @click.prevent="setViewCalendar('jalali')">شمسی</button>
                <button type="button" class="btn"
                        :class="viewCalendar === 'gregorian' ? 'btn-primary' : 'btn-outline-secondary'"
                        @click.prevent="setViewCalendar('gregorian')">میلادی</button>
            </div>
        </li>
    </ul>
</li>


