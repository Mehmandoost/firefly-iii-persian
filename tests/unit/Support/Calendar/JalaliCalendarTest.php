<?php

/*
 * JalaliCalendarTest.php
 */

declare(strict_types=1);

namespace Tests\unit\Support\Calendar;

use Carbon\Carbon;
use FireflyIII\Support\Calendar\JalaliCalendar;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class JalaliCalendarTest extends TestCase
{
    #[Test]
    public function convertsGregorianToJalali(): void
    {
        $result = JalaliCalendar::toJalaali(2026, 10, 11);

        self::assertSame(1405, $result['jy']);
        self::assertSame(7, $result['jm']);
        self::assertSame(19, $result['jd']);
    }

    #[Test]
    public function convertsJalaliToGregorian(): void
    {
        $result = JalaliCalendar::toGregorian(1395, 1, 23);

        self::assertSame(2016, $result['gy']);
        self::assertSame(4, $result['gm']);
        self::assertSame(11, $result['gd']);
    }

    #[Test]
    public function formatsDateWithPersianMonthName(): void
    {
        $date   = Carbon::create(2026, 10, 11, 14, 30, 0, 'UTC');
        $formatted = JalaliCalendar::format($date, true);

        self::assertStringContainsString('مهر', $formatted);
        self::assertStringContainsString('۱۴۰۵', $formatted);
        self::assertStringContainsString('۱۴:۳۰:۰۰', $formatted);
    }

    #[Test]
    public function monthBoundsFollowJalaliMonth(): void
    {
        $today  = Carbon::create(2026, 10, 11, 12, 0, 0, 'UTC');
        $bounds = JalaliCalendar::viewBounds('1M', $today);

        self::assertNotNull($bounds);
        self::assertSame('2026-09-23', $bounds[0]->format('Y-m-d'));
        self::assertSame('2026-10-22', $bounds[1]->format('Y-m-d'));
    }

    #[Test]
    public function esfandLengthFollowsLeapYear(): void
    {
        self::assertSame(30, JalaliCalendar::monthLength(1403, 12));
        self::assertSame(29, JalaliCalendar::monthLength(1404, 12));
    }
}
