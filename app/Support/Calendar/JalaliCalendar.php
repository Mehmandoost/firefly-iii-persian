<?php

/*
 * JalaliCalendar.php
 *
 * Gregorian ↔ Jalali conversion and Persian formatting for display.
 */

declare(strict_types=1);

namespace FireflyIII\Support\Calendar;

use Carbon\Carbon;

final class JalaliCalendar
{
    private const PERSIAN_MONTHS = [
        1  => 'فروردین',
        2  => 'اردیبهشت',
        3  => 'خرداد',
        4  => 'تیر',
        5  => 'مرداد',
        6  => 'شهریور',
        7  => 'مهر',
        8  => 'آبان',
        9  => 'آذر',
        10 => 'دی',
        11 => 'بهمن',
        12 => 'اسفند',
    ];

    /**
     * @return array{jy: int, jm: int, jd: int}
     */
    public static function toJalaali(int $gy, int $gm, int $gd): array
    {
        $gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        $jy           = ($gy <= 1600) ? 0 : 979;
        $gy           -= ($gy <= 1600) ? 621 : 1600;
        $gy2          = ($gm > 2) ? ($gy + 1) : $gy;
        $days         = (365 * $gy)
            + (int) (($gy2 + 3) / 4)
            - (int) (($gy2 + 99) / 100)
            + (int) (($gy2 + 399) / 400)
            - 80
            + $gd
            + array_sum(array_slice($gDaysInMonth, 0, $gm - 1));
        $jy           += 33 * (int) ($days / 12053);
        $days         %= 12053;
        $jy           += 4 * (int) ($days / 1461);
        $days         %= 1461;
        $jy           += (int) (($days - 1) / 365);
        if ($days > 365) {
            $days = ($days - 1) % 365;
        }
        $jm           = ($days < 186) ? 1 + (int) ($days / 31) : 7 + (int) (($days - 186) / 30);
        $jd           = 1 + (($days < 186) ? ($days % 31) : (($days - 186) % 30));

        return ['jy' => $jy, 'jm' => $jm, 'jd' => $jd];
    }

    /**
     * @return array{gy: int, gm: int, gd: int}
     */
    public static function toGregorian(int $jy, int $jm, int $jd): array
    {
        $jy -= ($jy <= 979) ? 0 : 979;
        $days = (365 * $jy) + ((int) ($jy / 33) * 8) + (int) ((($jy % 33) + 3) / 4) + 78 + $jd
            + (($jm < 7) ? ($jm - 1) * 31 : (($jm - 7) * 30) + 186);
        $gy   = 1600 + 400 * (int) ($days / 146097);
        $days %= 146097;
        $leap = true;
        if ($days >= 36525) {
            $days--;
            $gy += 100 * (int) ($days / 36524);
            $days %= 36524;
            if ($days >= 365) {
                $days++;
            }
            $leap = false;
        }
        $gy += 4 * (int) ($days / 1461);
        $days %= 1461;
        if ($days >= 366) {
            $leap = false;
            $days--;
            $gy += (int) ($days / 365);
            $days %= 365;
        }
        $salA = [0, 31, ($leap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        $gm   = 0;
        for ($gm = 0; $gm < 13; ++$gm) {
            $v = $salA[$gm];
            if ($days < $v) {
                break;
            }
            $days -= $v;
        }

        return ['gy' => $gy, 'gm' => $gm, 'gd' => $days + 1];
    }

    public static function format(Carbon $date, bool $withTime = false): string
    {
        $parts = self::toJalaali(
            (int) $date->format('Y'),
            (int) $date->format('m'),
            (int) $date->format('d'),
        );
        $month = self::PERSIAN_MONTHS[$parts['jm']] ?? '';
        $text  = sprintf('%d %s %d', $parts['jd'], $month, $parts['jy']);
        if ($withTime) {
            $text .= sprintf('، %s', $date->format('H:i:s'));
        }

        return self::toPersianDigits($text);
    }

    public static function formatIsoFormat(Carbon $date, string $isoFormat): string
    {
        $withTime = self::isoFormatIncludesTime($isoFormat);

        return self::format($date, $withTime);
    }

    public static function toPersianDigits(string $value): string
    {
        return strtr($value, [
            '0' => '۰',
            '1' => '۱',
            '2' => '۲',
            '3' => '۳',
            '4' => '۴',
            '5' => '۵',
            '6' => '۶',
            '7' => '۷',
            '8' => '۸',
            '9' => '۹',
        ]);
    }

    public static function fromPersianDigits(string $value): string
    {
        return strtr($value, [
            '۰' => '0',
            '۱' => '1',
            '۲' => '2',
            '۳' => '3',
            '۴' => '4',
            '۵' => '5',
            '۶' => '6',
            '۷' => '7',
            '۸' => '8',
            '۹' => '9',
        ]);
    }

    private static function isoFormatIncludesTime(string $isoFormat): bool
    {
        return (bool) preg_match('/[HhmsSA]/', $isoFormat);
    }
}
