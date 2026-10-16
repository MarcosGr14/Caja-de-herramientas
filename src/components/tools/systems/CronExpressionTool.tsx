import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarClock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Terminal,
  Sliders,
  Sparkles,
  RotateCcw,
  BookOpen,
  Calendar,
  Globe,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Tabs } from '../../ui/Tabs';
import { Button } from '../../ui/Button';
import { CopyButton } from '../../ui/CopyButton';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useToast } from '../../ui/Toast';
import {
  parseCron,
  explainCronInSpanish,
  getNextCronRuns,
  CRON_PRESETS,
  CRON_ALIASES,
} from '../../../utils/cronUtils';
import { COMMON_TIMEZONES } from '../../../utils/timeDateUtils';

type TabId = 'runs' | 'builder' | 'presets';

export default function CronExpressionTool() {
  const [activeTab, setActiveTab] = useLocalStorage<TabId>('app-cron-tab', 'runs');
  const [expression, setExpression] = useLocalStorage<string>('app-cron-expr', '*/15 * * * *');
  const [timeZone, setTimeZone] = useLocalStorage<string>('app-cron-tz', 'UTC');
  const [nextRunsCount, setNextRunsCount] = useState<number>(10);
  const [cronCommand, setCronCommand] = useState('/usr/bin/curl -s https://api.ejemplo.com/tarea');

  const { success, error: toastError } = useToast();

  // Parse expression
  const parsed = useMemo(() => parseCron(expression), [expression]);
  const explanation = useMemo(() => explainCronInSpanish(expression), [expression]);

  // Next runs
  const nextRuns = useMemo(() => {
    if (!parsed.isValid) return [];
    return getNextCronRuns(expression, nextRunsCount, timeZone);
  }, [expression, parsed.isValid, nextRunsCount, timeZone]);

  // Format a date with the selected timezone
  const formatRunDate = (d: Date) => {
    try {
      return new Intl.DateTimeFormat('es-ES', {
        timeZone,
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        weekday: 'short',
      }).format(d);
    } catch {
      return d.toLocaleString('es-ES');
    }
  };

  // Target next run timestamp
  const nextRunTarget = nextRuns.length > 0 ? nextRuns[0].getTime() : 0;

  // Relative time countdown string
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (!nextRunTarget) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const diffMs = nextRunTarget - now;
      if (diffMs <= 0) {
        setCountdown((prev) =>
          prev === '¡Ejecutándose en este momento!' ? prev : '¡Ejecutándose en este momento!'
        );
        return;
      }
      const diffSec = Math.floor(diffMs / 1000);
      const days = Math.floor(diffSec / 86400);
      const hours = Math.floor((diffSec % 86400) / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;

      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      const text = parts.join(' ');
      setCountdown((prev) => (prev === text ? prev : text));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextRunTarget]);

  // Split expression into individual field parts
  const exprParts = useMemo(() => {
    const tokens = expression.trim().split(/\s+/);
    return {
      minute: tokens[0] || '',
      hour: tokens[1] || '',
      dom: tokens[2] || '',
      month: tokens[3] || '',
      dow: tokens[4] || '',
    };
  }, [expression]);

  const updateField = (index: number, val: string) => {
    const parts = expression.trim().split(/\s+/);
    while (parts.length < 5) parts.push('*');
    parts[index] = val.trim() || '*';
    setExpression(parts.slice(0, 5).join(' '));
  };

  // Builder states
  const [builderMinuteType, setBuilderMinuteType] = useState<'every' | 'interval' | 'specific'>('interval');
  const [builderMinuteInterval, setBuilderMinuteInterval] = useState('15');
  const [builderHourType, setBuilderHourType] = useState<'every' | 'interval' | 'specific'>('every');
  const [builderHourInterval, setBuilderHourInterval] = useState('2');
  const [builderDowType, setBuilderDowType] = useState<'every' | 'workdays' | 'weekend' | 'specific'>('every');
  const [builderSelectedDows, setBuilderSelectedDows] = useState<number[]>([1, 2, 3, 4, 5]);

  const applyBuilder = () => {
    let minPart = '*';
    if (builderMinuteType === 'interval') {
      minPart = `*/${builderMinuteInterval}`;
    } else if (builderMinuteType === 'specific') {
      minPart = '0';
    }

    let hourPart = '*';
    if (builderHourType === 'interval') {
      hourPart = `*/${builderHourInterval}`;
    } else if (builderHourType === 'specific') {
      hourPart = '9';
    }

    let dowPart = '*';
    if (builderDowType === 'workdays') {
      dowPart = '1-5';
    } else if (builderDowType === 'weekend') {
      dowPart = '0,6';
    } else if (builderDowType === 'specific') {
      dowPart = builderSelectedDows.length > 0 ? builderSelectedDows.sort().join(',') : '*';
    }

    setExpression(`${minPart} ${hourPart} * * ${dowPart}`);
    success('Expresión cron actualizada desde el constructor visual');
    setActiveTab('runs');
  };

  const copyAllRuns = () => {
    if (nextRuns.length === 0) return;
    const text = nextRuns
      .map((d, i) => `${i + 1}. ${formatRunDate(d)}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    success('Lista de próximas ejecuciones copiada al portapapeles');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <CalendarClock className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Parser y Planificador de Expresiones Cron
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analiza, traduce al español, construye visualmente y simula las próximas ejecuciones en cualquier zona horaria.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CopyButton text={expression} label="Copiar expresión" />
        </div>
      </div>

      {/* Main Cron Input Card */}
      <Card className="p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Expresión Cron (5 campos estándar)
            </label>
            <div className="flex items-center gap-2">
              {parsed.isValid ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Expresión válida
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  <AlertTriangle className="w-3.5 h-3.5" /> Expresión inválida
                </span>
              )}
            </div>
          </div>

          {/* Big Input */}
          <div className="relative">
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="* * * * *"
              className={`w-full font-mono text-xl sm:text-3xl tracking-widest font-black py-3.5 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border transition-all text-center ${
                parsed.isValid
                  ? 'border-slate-200 dark:border-slate-700 focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-subtle)]'
                  : 'border-rose-300 dark:border-rose-700 bg-rose-50/20 text-rose-600'
              }`}
            />
          </div>

          {/* 5 Field Badges below */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 text-center text-[10px] sm:text-xs">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="block font-bold text-slate-700 dark:text-slate-300 font-mono">
                {exprParts.minute || '-'}
              </span>
              <span className="text-slate-400">Minuto (0-59)</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="block font-bold text-slate-700 dark:text-slate-300 font-mono">
                {exprParts.hour || '-'}
              </span>
              <span className="text-slate-400">Hora (0-23)</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="block font-bold text-slate-700 dark:text-slate-300 font-mono">
                {exprParts.dom || '-'}
              </span>
              <span className="text-slate-400">Día Mes (1-31)</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="block font-bold text-slate-700 dark:text-slate-300 font-mono">
                {exprParts.month || '-'}
              </span>
              <span className="text-slate-400">Mes (1-12)</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="block font-bold text-slate-700 dark:text-slate-300 font-mono">
                {exprParts.dow || '-'}
              </span>
              <span className="text-slate-400">Día Sem (0-6)</span>
            </div>
          </div>

          {/* Human Explanation in Spanish */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              parsed.isValid
                ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/60 text-indigo-900 dark:text-indigo-200'
                : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-1 rounded-lg bg-white/70 dark:bg-slate-900/70 shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-75 block">
                  Traducción a lenguaje natural
                </span>
                <p className="text-sm sm:text-base font-semibold leading-relaxed mt-0.5">
                  {explanation}
                </p>
              </div>
            </div>
          </div>

          {/* Crontab Line Generator */}
          <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                Línea completa para crontab
              </span>
              <CopyButton
                text={`${expression} ${cronCommand}`}
                label="Copiar comando"
                size="sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={cronCommand}
                onChange={(e) => setCronCommand(e.target.value)}
                placeholder="/ruta/a/tu/script.sh"
                className="flex-1 font-mono text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <p className="font-mono text-xs text-slate-600 dark:text-slate-300 px-1 truncate select-all">
              {expression} {cronCommand}
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
        tabs={[
          {
            id: 'runs',
            label: 'Próximas Ejecuciones',
            icon: <Calendar className="w-4 h-4" />,
            badge: nextRuns.length > 0 ? nextRuns.length : undefined,
          },
          {
            id: 'builder',
            label: 'Constructor Visual',
            icon: <Sliders className="w-4 h-4" />,
          },
          {
            id: 'presets',
            label: 'Biblioteca y Presets',
            icon: <BookOpen className="w-4 h-4" />,
          },
        ]}
      />

      {/* TAB 1: RUNS & SCHEDULE */}
      {activeTab === 'runs' && (
        <Card className="p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Calendario de Ejecuciones Futuras
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calculadas en tiempo real sin desfases astronómicos ni dependencias pesadas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Timezone selector */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
                >
                  <option value="UTC">UTC (Tiempo Universal)</option>
                  {COMMON_TIMEZONES.filter((tz) => tz !== 'UTC').map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              {/* Count selector */}
              <select
                value={nextRunsCount}
                onChange={(e) => setNextRunsCount(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value={5}>5 ejecuciones</option>
                <option value={10}>10 ejecuciones</option>
                <option value={15}>15 ejecuciones</option>
                <option value={20}>20 ejecuciones</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                icon={<Copy className="w-3.5 h-3.5" />}
                onClick={copyAllRuns}
                disabled={nextRuns.length === 0}
              >
                Copiar lista
              </Button>
            </div>
          </div>

          {/* Countdown card for the very next run */}
          {nextRuns.length > 0 && countdown && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Próxima ejecución estimada
                  </span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {formatRunDate(nextRuns[0])}
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200/60 dark:border-emerald-800/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Falta</span>
                <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {countdown}
                </span>
              </div>
            </div>
          )}

          {/* Runs Table */}
          {nextRuns.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4 font-extrabold w-12 text-center">#</th>
                    <th className="py-3 px-4 font-extrabold">Fecha y Hora ({timeZone})</th>
                    <th className="py-3 px-4 font-extrabold">Formato ISO 8601</th>
                    <th className="py-3 px-4 font-extrabold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {nextRuns.map((date, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {formatRunDate(date)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {date.toISOString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <CopyButton
                          text={formatRunDate(date)}
                          label=""
                          copiedLabel=""
                          size="sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              No se han podido calcular ejecuciones. Asegúrate de que la expresión cron sea válida.
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: VISUAL BUILDER */}
      {activeTab === 'builder' && (
        <Card className="p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Constructor Asistido de Cron
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configura intervalos amigables sin tener que memorizar comodines ni sintaxis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Minutos */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                1. Frecuencia de Minutos
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="builderMin"
                    checked={builderMinuteType === 'every'}
                    onChange={() => setBuilderMinuteType('every')}
                    className="text-[var(--accent-primary)]"
                  />
                  <span>Cada minuto (*)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="builderMin"
                    checked={builderMinuteType === 'interval'}
                    onChange={() => setBuilderMinuteType('interval')}
                    className="text-[var(--accent-primary)]"
                  />
                  <span>Cada intervalo de minutos:</span>
                  <select
                    value={builderMinuteInterval}
                    onChange={(e) => {
                      setBuilderMinuteInterval(e.target.value);
                      setBuilderMinuteType('interval');
                    }}
                    className="ml-auto px-2 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    <option value="2">Cada 2 min</option>
                    <option value="5">Cada 5 min</option>
                    <option value="10">Cada 10 min</option>
                    <option value="15">Cada 15 min</option>
                    <option value="30">Cada 30 min</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="builderMin"
                    checked={builderMinuteType === 'specific'}
                    onChange={() => setBuilderMinuteType('specific')}
                    className="text-[var(--accent-primary)]"
                  />
                  <span>En el minuto 0 en punto (en la hora)</span>
                </label>
              </div>
            </div>

            {/* Horas */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                2. Frecuencia de Horas
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="builderHour"
                    checked={builderHourType === 'every'}
                    onChange={() => setBuilderHourType('every')}
                    className="text-[var(--accent-primary)]"
                  />
                  <span>Todas las horas (*)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="builderHour"
                    checked={builderHourType === 'interval'}
                    onChange={() => setBuilderHourType('interval')}
                    className="text-[var(--accent-primary)]"
                  />
                  <span>Cada intervalo de horas:</span>
                  <select
                    value={builderHourInterval}
                    onChange={(e) => {
                      setBuilderHourInterval(e.target.value);
                      setBuilderHourType('interval');
                    }}
                    className="ml-auto px-2 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    <option value="2">Cada 2 horas</option>
                    <option value="3">Cada 3 horas</option>
                    <option value="4">Cada 4 horas</option>
                    <option value="6">Cada 6 horas</option>
                    <option value="12">Cada 12 horas</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="builderHour"
                    checked={builderHourType === 'specific'}
                    onChange={() => setBuilderHourType('specific')}
                    className="text-[var(--accent-primary)]"
                  />
                  <span>A las 09:00 de la mañana</span>
                </label>
              </div>
            </div>

            {/* Días de la semana */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                3. Días de la Semana
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setBuilderDowType('every')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center cursor-pointer transition ${
                    builderDowType === 'every'
                      ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)] border-[var(--accent-border)] font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Todos los días (*)
                </button>
                <button
                  type="button"
                  onClick={() => setBuilderDowType('workdays')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center cursor-pointer transition ${
                    builderDowType === 'workdays'
                      ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)] border-[var(--accent-border)] font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Lunes a Viernes (1-5)
                </button>
                <button
                  type="button"
                  onClick={() => setBuilderDowType('weekend')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center cursor-pointer transition ${
                    builderDowType === 'weekend'
                      ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)] border-[var(--accent-border)] font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Fines de semana (Sáb y Dom)
                </button>
                <button
                  type="button"
                  onClick={() => setBuilderDowType('specific')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center cursor-pointer transition ${
                    builderDowType === 'specific'
                      ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)] border-[var(--accent-border)] font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Selección manual
                </button>
              </div>

              {builderDowType === 'specific' && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {[
                    { id: 1, label: 'Lun' },
                    { id: 2, label: 'Mar' },
                    { id: 3, label: 'Mié' },
                    { id: 4, label: 'Jue' },
                    { id: 5, label: 'Vie' },
                    { id: 6, label: 'Sáb' },
                    { id: 0, label: 'Dom' },
                  ].map((day) => {
                    const isSelected = builderSelectedDows.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setBuilderSelectedDows(builderSelectedDows.filter((d) => d !== day.id));
                          } else {
                            setBuilderSelectedDows([...builderSelectedDows, day.id]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--accent-primary)] text-white border-transparent'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="lg"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={applyBuilder}
            >
              Aplicar al planificador
            </Button>
          </div>
        </Card>
      )}

      {/* TAB 3: PRESETS & CHEAT SHEET */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Presets library */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Expresiones Habituales
              </h2>
              <span className="text-xs text-slate-400">Haz clic para cargar</span>
            </div>

            <div className="space-y-2">
              {CRON_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setExpression(preset.expression);
                    success(`Preset "${preset.label}" cargado`);
                  }}
                  className="w-full text-left p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-[var(--accent-primary)] hover:bg-slate-50 dark:hover:bg-slate-800/60 transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[var(--accent-text)]">
                      {preset.label}
                    </span>
                    <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {preset.expression}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </Card>

          {/* Cheat Sheet & Aliases */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Guía de Caracteres Especiales
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                  *
                </span>
                <p className="text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                  <strong>Comodín (Cualquier valor):</strong> coincide con todos los valores posibles de ese campo (todos los minutos, todas las horas, etc.).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                  ,
                </span>
                <p className="text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                  <strong>Lista de valores:</strong> permite definir múltiples momentos específicos. Ej: <code className="font-bold">1,15,30</code>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                  -
                </span>
                <p className="text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                  <strong>Rango continuo:</strong> define un conjunto consecutivo de valores. Ej: <code className="font-bold">1-5</code> (de lunes a viernes o horas de 1 a 5).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                  /
                </span>
                <p className="text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                  <strong>Paso o intervalo:</strong> salta valores en incrementos periódicos. Ej: <code className="font-bold">*/10</code> (cada 10 minutos).
                </p>
              </div>

              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Alias soportados por cron
                </h3>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                  {Object.entries(CRON_ALIASES).map(([alias, val]) => (
                    <button
                      key={alias}
                      onClick={() => setExpression(val)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    >
                      <span className="font-bold text-[var(--accent-text)]">{alias}</span> → {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
