<div class="row mb-2" id="{{ $name }}_holder">
    <div class="input-group has-validation">
    <label for="{{ $options['id'] }}" class="col-sm-3 col-form-label">{{ $label }}</label>
        <div class="col-sm-9">
        <div class="input-group">
            <span class="input-group-text">
                <span class="bi bi-calendar"></span>
            </span>
            @if(($dateInputCalendar ?? 'gregorian') === 'jalali')
                <input type="hidden" name="{{ $name }}" id="{{ $options['id'] }}" value="{{ $value }}">
                <div class="flex-grow-1" data-jalali-date-target="{{ $options['id'] }}"></div>
            @else
            {{ Html::input('date', $name, $value)->id($options['id'])->class('form-control')->attribute('autocomplete','off')->attribute('spellcheck','false')
            ->attribute('min', $options['min'] ?? null)->attribute('lang','nl-NL')
            }}
            @endif
        </div>
        @include('form.help')
        @include('form.feedback')
    </div>
</div>
</div>
