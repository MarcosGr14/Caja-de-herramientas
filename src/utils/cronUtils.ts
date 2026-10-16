// Pure logic utility for Cron Expression Parsing, Natural Spanish Explanation, and Schedule calculation

export const MONTH_NAMES_MAP: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
  ENE: 1, ABR: 4, AGO: 8, DIC: 12,
};

export const DAY_NAMES_MAP: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
  DOM: 0, LUN: 1, MAR_D: 2, MIE: 3, JUE: 4, VIE: 5, SAB: 6,
};

export const CRON_ALIASES: Record<string, string> = {
  '@hourly': '0 * * * *',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@weekly': '0 0 * * 0',
  '@monthly': '0 0 1 * *',
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
};

export interface CronPreset {
  expression: string;
  label: string;
  description: string;
}

export const CRON_PRESETS: CronPreset[] = [
  { expression: '* * * * *', label: 'Cada minuto', description: 'Se ejecuta al inicio de cada minuto continuamente.' },
  { expression: '*/5 * * * *', label: 'Cada 5 minutos', description: '0, 5, 10, 15... en cada hora.' },
  { expression: '*/15 * * * *', label: 'Cada 15 minutos', description: 'En el minuto 0, 15, 30 y 45.' },
  { expression: '0 * * * *', label: 'Cada hora en punto', description: 'Al inicio del minuto 0 de cada hora.' },
  { expression: '0 0 * * *', label: 'Todos los días a medianoche', description: 'A las 00:00 exactas cada día.' },
  { expression: '0 9 * * 1-5', label: 'Días laborales a las 9:00 AM', description: 'De lunes a viernes a las 09:00.' },
  { expression: '0 0 * * 0', label: 'Semanalmente (Domingos)', description: 'Cada domingo a las 00:00.' },
  { expression: '0 0 1 * *', label: 'Primer día de cada mes', description: 'El día 1 de cada mes a las 00:00.' },
];

/**
 * Expand single field expression into array of allowed integer values
 */
export function expandCronField(fieldStr: string, min: number, max: number, namesMap?: Record<string, number>): number[] | null {
  let clean = fieldStr.trim().toUpperCase();
  if (namesMap) {
    for (const [name, val] of Object.entries(namesMap)) {
      clean = clean.replace(new RegExp(`\\b${name}\\b`, 'g'), String(val));
    }
  }

  const values = new Set<number>();
  const subparts = clean.split(',');

  for (const part of subparts) {
    if (part === '*') {
      for (let i = min; i <= max; i++) values.add(i);
      continue;
    }

    // Step pattern: */step or range/step (e.g. */15 or 10-30/5)
    if (part.includes('/')) {
      const [rangePart, stepPart] = part.split('/');
      const step = parseInt(stepPart, 10);
      if (isNaN(step) || step <= 0) return null;

      let start = min;
      let end = max;
      if (rangePart !== '*') {
        if (rangePart.includes('-')) {
          const [sStr, eStr] = rangePart.split('-');
          start = parseInt(sStr, 10);
          end = parseInt(eStr, 10);
        } else {
          start = parseInt(rangePart, 10);
        }
      }

      if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) return null;
      for (let i = start; i <= end; i += step) {
        values.add(i);
      }
      continue;
    }

    // Range pattern: start-end (e.g. 1-5)
    if (part.includes('-')) {
      const [sStr, eStr] = part.split('-');
      const start = parseInt(sStr, 10);
      const end = parseInt(eStr, 10);
      if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) return null;
      for (let i = start; i <= end; i++) {
        values.add(i);
      }
      continue;
    }

    // Single number
    const num = parseInt(part, 10);
    if (isNaN(num) || num < min || num > max) return null;
    values.add(num);
  }

  // Handle day of week 7 as 0 (Sunday)
  if (min === 0 && max === 6 && values.has(7)) {
    values.delete(7);
    values.add(0);
  }

  return Array.from(values).sort((a, b) => a - b);
}

export interface ParsedCron {
  expression: string;
  minutes: number[];
  hours: number[];
  daysOfMonth: number[];
  months: number[];
  daysOfWeek: number[];
  isDayOrCombined: boolean;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Parse full cron expression
 */
export function parseCron(expr: string): ParsedCron {
  let clean = expr.trim();
  if (CRON_ALIASES[clean.toLowerCase()]) {
    clean = CRON_ALIASES[clean.toLowerCase()];
  }

  const parts = clean.split(/\s+/);
  if (parts.length !== 5) {
    return {
      expression: expr,
      minutes: [],
      hours: [],
      daysOfMonth: [],
      months: [],
      daysOfWeek: [],
      isDayOrCombined: false,
      isValid: false,
      errorMessage: 'La expresión debe contener exactamente 5 campos separados por espacio.',
    };
  }

  const minutes = expandCronField(parts[0], 0, 59);
  const hours = expandCronField(parts[1], 0, 23);
  const daysOfMonth = expandCronField(parts[2], 1, 31);
  const months = expandCronField(parts[3], 1, 12, MONTH_NAMES_MAP);
  const daysOfWeek = expandCronField(parts[4], 0, 7, DAY_NAMES_MAP);

  if (!minutes) return { expression: expr, minutes: [], hours: [], daysOfMonth: [], months: [], daysOfWeek: [], isDayOrCombined: false, isValid: false, errorMessage: 'Minuto inválido (0-59).' };
  if (!hours) return { expression: expr, minutes: [], hours: [], daysOfMonth: [], months: [], daysOfWeek: [], isDayOrCombined: false, isValid: false, errorMessage: 'Hora inválida (0-23).' };
  if (!daysOfMonth) return { expression: expr, minutes: [], hours: [], daysOfMonth: [], months: [], daysOfWeek: [], isDayOrCombined: false, isValid: false, errorMessage: 'Día del mes inválido (1-31).' };
  if (!months) return { expression: expr, minutes: [], hours: [], daysOfMonth: [], months: [], daysOfWeek: [], isDayOrCombined: false, isValid: false, errorMessage: 'Mes inválido (1-12 o JAN-DEC).' };
  if (!daysOfWeek) return { expression: expr, minutes: [], hours: [], daysOfMonth: [], months: [], daysOfWeek: [], isDayOrCombined: false, isValid: false, errorMessage: 'Día de la semana inválido (0-7 o SUN-SAT).' };

  const isDayOrCombined = parts[2] !== '*' && parts[4] !== '*';

  return {
    expression: clean,
    minutes,
    hours,
    daysOfMonth,
    months,
    daysOfWeek,
    isDayOrCombined,
    isValid: true,
  };
}

/**
 * Natural Spanish explanation generator
 */
export function explainCronInSpanish(expr: string): string {
  const parsed = parseCron(expr);
  if (!parsed.isValid) return parsed.errorMessage || 'Expresión no válida';

  const parts = parsed.expression.split(/\s+/);
  const [minP, hourP, domP, monthP, dowP] = parts;

  // 1. Minute part
  let minText = '';
  if (minP === '*') minText = 'cada minuto';
  else if (minP.startsWith('*/')) minText = `cada ${minP.slice(2)} minutos`;
  else if (parsed.minutes.length === 1) minText = `en el minuto ${parsed.minutes[0]}`;
  else minText = `en los minutos ${parsed.minutes.join(', ')}`;

  // 2. Hour part
  let hourText = '';
  if (hourP === '*') hourText = 'de cada hora';
  else if (hourP.startsWith('*/')) hourText = `cada ${hourP.slice(2)} horas`;
  else if (parsed.hours.length === 1) {
    const hh = String(parsed.hours[0]).padStart(2, '0');
    const mm = parsed.minutes.length === 1 ? String(parsed.minutes[0]).padStart(2, '0') : '';
    if (mm) {
      return `A las ${hh}:${mm}` + (domP === '*' && dowP === '*' ? ' todos los días' : '') + getDaysText(domP, dowP, parsed) + getMonthText(monthP, parsed);
    }
    hourText = `a las ${hh} horas`;
  } else {
    hourText = `en las horas ${parsed.hours.join(', ')}`;
  }

  const daysText = getDaysText(domP, dowP, parsed);
  const monthsText = getMonthText(monthP, parsed);

  return `${capitalize(minText)} ${hourText}${daysText}${monthsText}.`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getDaysText(domP: string, dowP: string, parsed: ParsedCron): string {
  const DOW_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  let dowText = '';
  if (dowP === '*') {
    dowText = '';
  } else if (dowP === '1-5') {
    dowText = 'de lunes a viernes';
  } else if (dowP === '0,6' || dowP === '6,0') {
    dowText = 'los fines de semana';
  } else {
    dowText = `los ${parsed.daysOfWeek.map((d) => DOW_NAMES[d]).join(', ')}`;
  }

  let domText = '';
  if (domP !== '*') {
    domText = `el día ${parsed.daysOfMonth.join(', ')} del mes`;
  }

  if (domText && dowText) {
    return `, tanto ${domText} como ${dowText} (unión OR)`;
  }
  if (domText) return `, ${domText}`;
  if (dowText) return `, ${dowText}`;
  return '';
}

function getMonthText(monthP: string, parsed: ParsedCron): string {
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  if (monthP === '*') return '';
  return ` en ${parsed.months.map((m) => MONTHS[m - 1]).join(', ')}`;
}

/**
 * Calculate the next N run timestamps based on cron structure
 */
export function getNextCronRuns(expr: string, count = 10, timeZone?: string): Date[] {
  const parsed = parseCron(expr);
  if (!parsed.isValid) return [];

  const results: Date[] = [];
  const minSet = new Set(parsed.minutes);
  const hourSet = new Set(parsed.hours);
  const domSet = new Set(parsed.daysOfMonth);
  const monthSet = new Set(parsed.months);
  const dowSet = new Set(parsed.daysOfWeek);

  const parts = parsed.expression.split(/\s+/);
  const domIsWild = parts[2] === '*';
  const dowIsWild = parts[4] === '*';

  let current = new Date();
  // Round to next full minute
  current.setSeconds(0, 0);
  current.setMinutes(current.getMinutes() + 1);

  let iterations = 0;
  const maxIterations = 50000; // guard against runaway loop

  while (results.length < count && iterations < maxIterations) {
    iterations++;

    const m = current.getMonth() + 1;
    if (!monthSet.has(m)) {
      current.setMonth(current.getMonth() + 1, 1);
      current.setHours(0, 0, 0, 0);
      continue;
    }

    const dom = current.getDate();
    const dow = current.getDay();

    // Standard Cron OR logic when both are specified
    let dayMatch = false;
    if (domIsWild && dowIsWild) {
      dayMatch = true;
    } else if (!domIsWild && !dowIsWild) {
      dayMatch = domSet.has(dom) || dowSet.has(dow);
    } else if (!domIsWild) {
      dayMatch = domSet.has(dom);
    } else {
      dayMatch = dowSet.has(dow);
    }

    if (!dayMatch) {
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
      continue;
    }

    const h = current.getHours();
    if (!hourSet.has(h)) {
      current.setHours(current.getHours() + 1, 0, 0, 0);
      continue;
    }

    const min = current.getMinutes();
    if (!minSet.has(min)) {
      current.setMinutes(current.getMinutes() + 1, 0, 0);
      continue;
    }

    results.push(new Date(current));
    current.setMinutes(current.getMinutes() + 1);
  }

  return results;
}
