<div class="modal-dialog modal-lg" role="document">
    <div class="modal-content">
        <div class="modal-header">
            <h5 class="modal-title" id="balanceAmountTitle">{{ trans('firefly.balance_amount',
                    ['budget' => $budget->name, 'account' => $account->name,  'start' => ff_date($start, $monthAndDayFormat), 'end' => ff_date($end, $monthAndDayFormat)]
                ) }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="{{ __('firefly.close') }}"></button>
        </div>
        <div class="modal-body">
            @php
                $hideSource = true;
                $hideBudget = true;
            @endphp
            @include('popup.list.journals')
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">{{ __('firefly.close') }}</button>
        </div>
    </div>
</div>
