// Pure logic utility for Unix Timestamps, Date conversions, Timezones, and Relative time

export const COMMON_TIMEZONES = [
  'UTC',
  'Europe/Madrid',
  'America/Bogota',
  'America/Mexico_City',
  'America/Buenos_Aires',
  'America/Santiago',
  'America/Lima',
  'America/Caracas',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Australia/Sydney',
];

/**
 * Autodetect whether input timestamp is in seconds, milliseconds, microseconds or nanoseconds
 */
export function detectTimestampUnit(val: number | bigint): {
  unit: 's' | 'ms' | 'us' | 'ns';
  date: Date;
  seconds: number;
  milliseconds: number;
} {
  const num = typeof val === 'bigint' ? Number(val) : val;
  const digits = Math.abs(num).toString().length;

  let ms = 0;
  let unit: 's' | 'ms' | 'us' | 'ns' = 'ms';

  if (digits <= 11) {
    // Seconds (e.g. 1700000000)
    unit = 's';
    ms = num * 1000;
  } else if (digits <= 14) {
    // Milliseconds (e.g. 1700000000000)
    unit = 'ms';
    ms = num;
  } else if (digits <= 17) {
    // Microseconds
    unit = 'us';
    ms = Math.round(num / 1000);
  } else {
    // Nanoseconds
    unit = 'ns';
    ms = Math.round(num / 1e6);
  }

  const date = new Date(ms);
  return {
    unit,
    date,
    seconds: Math.floor(ms / 1000),
    milliseconds: ms,
  };
}

/**
 * Format a Date object across multiple standards (ISO 8601, RFC 2822, SQL, UTC, Local, Timezone)
 */
export function formatAllDateStyles(date: Date, timeZone = 'UTC') {
  if (isNaN(date.getTime())) {
    return null;
  }

  const iso = date.toISOString();
  const rfc2822 = date.toUTCString();

  // SQL format: YYYY-MM-DD HH:mm:ss
  const pad = (n: number) => String(n).padStart(2, '0');
  const sql = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;

  // Formatter in selected timezone
  let tzFormatted = '';
  try {
    const formatter = new Intl.DateTimeFormat('es-ES', {
      timeZone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'long',
      timeZoneName: 'short',
    });
    tzFormatted = formatter.format(date);
  } catch {
    tzFormatted = date.toLocaleString('es-ES');
  }

  const localFormatted = new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'long',
  }).format(date);

  const utcFormatted = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'long',
  }).format(date);

  return {
    iso,
    rfc2822,
    sql,
    localFormatted,
    utcFormatted,
    tzFormatted,
    relative: getRelativeTimeString(date),
  };
}

/**
 * Calculate natural relative time string in Spanish ("hace 2 horas", "en 3 días")
 */
export function getRelativeTimeString(date: Date): string {
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

  const absDiff = Math.abs(diffSec);
  if (absDiff < 60) return rtf.format(diffSec, 'second');
  if (absDiff < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (absDiff < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (absDiff < 2592000) return rtf.format(Math.round(diffSec / 86400), 'day');
  if (absDiff < 31536000) return rtf.format(Math.round(diffSec / 2592000), 'month');
  return rtf.format(Math.round(diffSec / 31536000), 'year');
}

/**
 * Calculate difference between two dates
 */
export function computeDateDifference(d1: Date, d2: Date) {
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  // Breakdown calculation
  const start = d1 < d2 ? d1 : d2;
  const end = d1 < d2 ? d2 : d1;

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months--;
    const prevMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const seconds = Math.floor((diffMs / 1000) % 60);

  return {
    totalSeconds,
    totalMinutes,
    totalHours,
    totalDays,
    breakdown: {
      years,
      months,
      days,
      hours,
      minutes,
      seconds,
    },
  };
}

/**
 * Add or subtract interval to a Date
 */
export function addDateInterval(
  baseDate: Date,
  op: 'add' | 'subtract',
  values: {
    years?: number;
    months?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
  }
): Date {
  const sign = op === 'add' ? 1 : -1;
  const result = new Date(baseDate.getTime());

  if (values.years) result.setFullYear(result.getFullYear() + sign * values.years);
  if (values.months) result.setMonth(result.getMonth() + sign * values.months);
  if (values.days) result.setDate(result.getDate() + sign * values.days);
  if (values.hours) result.setHours(result.getHours() + sign * values.hours);
  if (values.minutes) result.setMinutes(result.getMinutes() + sign * values.minutes);
  if (values.seconds) result.setSeconds(result.getSeconds() + sign * values.seconds);

  return result;
}
