import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarClock,
  Clock,
  Calendar,
  Globe,
  Copy,
  RotateCcw,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  Pause,
  Play,
  CheckCircle2,
  CalendarDays,
  Compass,
  ArrowLeftRight,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Tabs } from '../../ui/Tabs';
import { Button } from '../../ui/Button';
import { CopyButton } from '../../ui/CopyButton';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useToast } from '../../ui/Toast';
import {
  detectTimestampUnit,
  formatAllDateStyles,
  getRelativeTimeString,
  computeDateDifference,
  addDateInterval,
  COMMON_TIMEZONES,
} from '../../../utils/timeDateUtils';

type TabId = 'convert' | 'timezones' | 'diff_arithmetic';

export default function DateTimeConverterTool() {
  const [activeTab, setActiveTab] = useLocalStorage<TabId>('app-datetime-tab', 'convert');
  const { success, error: toastError } = useToast();

  // Live ticker for current time
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isTickerPaused, setIsTickerPaused] = useState<boolean>(false);

  useEffect(() => {
    if (isTickerPaused) return;
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [isTickerPaused]);

  // Main converter inputs
  const [timestampInput, setTimestampInput] = useState<string>(() =>
    String(Math.floor(Date.now() / 1000))
  );
  const [manualUnit, setManualUnit] = useState<'auto' | 's' | 'ms'>('auto');
  const [selectedTimeZone, setSelectedTimeZone] = useLocalStorage<string>(
    'app-datetime-tz',
    'UTC'
  );

  // Compute active date from timestampInput
  const parsedTimestamp = useMemo(() => {
    const clean = timestampInput.trim();
    if (!clean || isNaN(Number(clean))) return null;
    const num = Number(clean);

    if (manualUnit === 's') {
      const d = new Date(num * 1000);
      return {
        date: d,
        unit: 's' as const,
        seconds: num,
        milliseconds: num * 1000,
      };
    } else if (manualUnit === 'ms') {
      const d = new Date(num);
      return {
        date: d,
        unit: 'ms' as const,
        seconds: Math.floor(num / 1000),
        milliseconds: num,
      };
    }

    return detectTimestampUnit(num);
  }, [timestampInput, manualUnit]);

  // Formatted date representations
  const formattedStyles = useMemo(() => {
    if (!parsedTimestamp || isNaN(parsedTimestamp.date.getTime())) return null;
    return formatAllDateStyles(parsedTimestamp.date, selectedTimeZone);
  }, [parsedTimestamp, selectedTimeZone]);

  // Handle datetime-local picker change
  const handleDateLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      setTimestampInput(String(Math.floor(d.getTime() / 1000)));
    }
  };

  // Quick timestamp adjustments
  const setNow = () => {
    const now = Math.floor(Date.now() / 1000);
    setTimestampInput(String(now));
    success('Timestamp fijado al momento actual');
  };

  const adjustTimestampSeconds = (deltaSeconds: number) => {
    const current = parsedTimestamp ? parsedTimestamp.seconds : Math.floor(Date.now() / 1000);
    setTimestampInput(String(current + deltaSeconds));
  };

  // ----------------------------------------------------
  // TAB 3: DATE DIFFERENCE & ARITHMETIC STATE
  // ----------------------------------------------------
  const [diffDate1, setDiffDate1] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 16);
  });
  const [diffDate2, setDiffDate2] = useState<string>(() =>
    new Date().toISOString().slice(0, 16)
  );

  const diffResult = useMemo(() => {
    const d1 = new Date(diffDate1);
    const d2 = new Date(diffDate2);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
    return computeDateDifference(d1, d2);
  }, [diffDate1, diffDate2]);

  // Arithmetic State
  const [arithBaseDate, setArithBaseDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 16)
  );
  const [arithOp, setArithOp] = useState<'add' | 'subtract'>('add');
  const [arithAmount, setArithAmount] = useState<number>(7);
  const [arithUnit, setArithUnit] = useState<'days' | 'weeks' | 'months' | 'years' | 'hours'>(
    'days'
  );

  const arithResultDate = useMemo(() => {
    const base = new Date(arithBaseDate);
    if (isNaN(base.getTime())) return null;

    let payload: any = {};
    if (arithUnit === 'days') payload.days = arithAmount;
    else if (arithUnit === 'weeks') payload.days = arithAmount * 7;
    else if (arithUnit === 'months') payload.months = arithAmount;
    else if (arithUnit === 'years') payload.years = arithAmount;
    else if (arithUnit === 'hours') payload.hours = arithAmount;

    return addDateInterval(base, arithOp, payload);
  }, [arithBaseDate, arithOp, arithAmount, arithUnit]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <CalendarClock className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Conversor de Fecha, Hora y Timestamp Unix
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Conversión bidireccional entre marcas de tiempo Epoch, fechas ISO 8601, RFC 2822, SQL y husos horarios mundiales.
          </p>
        </div>

        {/* Live Ticker Box */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 pl-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isTickerPaused ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <div className="text-left font-mono">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Epoch en vivo
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">
                {Math.floor(currentDate.getTime() / 1000)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-100 dark:border-slate-800 pl-2">
            <button
              onClick={() => setIsTickerPaused(!isTickerPaused)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={isTickerPaused ? 'Reanudar reloj' : 'Pausar reloj'}
            >
              {isTickerPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <CopyButton
              text={String(Math.floor(currentDate.getTime() / 1000))}
              size="sm"
              label=""
              copiedLabel=""
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
        tabs={[
          {
            id: 'convert',
            label: 'Conversor Bidireccional',
            icon: <ArrowLeftRight className="w-4 h-4" />,
          },
          {
            id: 'timezones',
            label: 'Comparador de Zonas Horarias',
            icon: <Globe className="w-4 h-4" />,
          },
          {
            id: 'diff_arithmetic',
            label: 'Diferencia y Aritmética',
            icon: <CalendarDays className="w-4 h-4" />,
          },
        ]}
      />

      {/* TAB 1: BIDIRECTIONAL CONVERTER */}
      {activeTab === 'convert' && (
        <div className="space-y-6">
          {/* Inputs Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timestamp input */}
            <Card className="p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Marca de Tiempo Unix (Epoch)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 mr-1">Unidad:</span>
                  {(['auto', 's', 'ms'] as const).map((u) => (
                    <button
                      key={u}
                      onClick={() => setManualUnit(u)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                        manualUnit === u
                          ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)] border-[var(--accent-border)]'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {u === 'auto'
                        ? `Auto (${parsedTimestamp?.unit || 's'})`
                        : u === 's'
                        ? 'Segundos (s)'
                        : 'Milisegundos (ms)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={timestampInput}
                  onChange={(e) => setTimestampInput(e.target.value)}
                  placeholder="1700000000"
                  className="w-full font-mono text-lg sm:text-2xl font-black py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition"
                />
              </div>

              {/* Quick Actions Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <Button size="sm" variant="secondary" onClick={setNow}>
                  Ahora
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustTimestampSeconds(-86400)}
                >
                  -1 día
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustTimestampSeconds(-3600)}
                >
                  -1 hora
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustTimestampSeconds(3600)}
                >
                  +1 hora
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustTimestampSeconds(86400)}
                >
                  +1 día
                </Button>
              </div>
            </Card>

            {/* Date-picker input */}
            <Card className="p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Selector de Fecha y Hora
                </label>
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedTimeZone}
                    onChange={(e) => setSelectedTimeZone(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
                  >
                    <option value="UTC">Zona UTC</option>
                    {COMMON_TIMEZONES.filter((tz) => tz !== 'UTC').map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <input
                  type="datetime-local"
                  step="1"
                  value={
                    parsedTimestamp && !isNaN(parsedTimestamp.date.getTime())
                      ? new Date(
                          parsedTimestamp.date.getTime() -
                            parsedTimestamp.date.getTimezoneOffset() * 60000
                        )
                          .toISOString()
                          .slice(0, 19)
                      : ''
                  }
                  onChange={handleDateLocalChange}
                  className="w-full font-mono text-base sm:text-xl font-bold py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition"
                />
              </div>

              {formattedStyles?.relative && (
                <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 flex items-center gap-2 text-indigo-900 dark:text-indigo-200 text-xs font-semibold">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>
                    Tiempo relativo:{' '}
                    <strong className="font-bold underline capitalize">
                      {formattedStyles.relative}
                    </strong>
                  </span>
                </div>
              )}
            </Card>
          </div>

          {/* All Standard Formats Output Card */}
          {formattedStyles && (
            <Card className="p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Formatos Estándar y Representaciones
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ISO 8601 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      ISO 8601 / JSON Date
                    </span>
                    <CopyButton text={formattedStyles.iso} size="sm" />
                  </div>
                  <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 select-all break-all">
                    {formattedStyles.iso}
                  </p>
                </div>

                {/* RFC 2822 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      RFC 2822 / HTTP Header
                    </span>
                    <CopyButton text={formattedStyles.rfc2822} size="sm" />
                  </div>
                  <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 select-all break-all">
                    {formattedStyles.rfc2822}
                  </p>
                </div>

                {/* SQL Timestamp */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      SQL Timestamp (UTC)
                    </span>
                    <CopyButton text={formattedStyles.sql} size="sm" />
                  </div>
                  <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 select-all break-all">
                    {formattedStyles.sql}
                  </p>
                </div>

                {/* Selected Timezone */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Zona Elegida ({selectedTimeZone})
                    </span>
                    <CopyButton text={formattedStyles.tzFormatted} size="sm" />
                  </div>
                  <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 select-all break-all">
                    {formattedStyles.tzFormatted}
                  </p>
                </div>

                {/* Local Browser */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Local del Navegador
                    </span>
                    <CopyButton text={formattedStyles.localFormatted} size="sm" />
                  </div>
                  <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 select-all break-all">
                    {formattedStyles.localFormatted}
                  </p>
                </div>

                {/* Milliseconds Epoch */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Milisegundos Epoch (JavaScript ms)
                    </span>
                    <CopyButton text={String(parsedTimestamp?.milliseconds || 0)} size="sm" />
                  </div>
                  <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 select-all break-all">
                    {parsedTimestamp?.milliseconds}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: TIMEZONE COMPARATOR */}
      {activeTab === 'timezones' && (
        <Card className="p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Comparador Global de Husos Horarios
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualiza la misma marca temporal en las principales ciudades del mundo hispanohablante y global.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={setNow}
            >
              Sincronizar a &quot;Ahora&quot;
            </Button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4 font-extrabold">Zona Horaria / Ciudad</th>
                  <th className="py-3 px-4 font-extrabold">Fecha y Hora Formateada</th>
                  <th className="py-3 px-4 font-extrabold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {COMMON_TIMEZONES.map((tz) => {
                  let formatted = '';
                  const targetDate = parsedTimestamp?.date || new Date();
                  try {
                    formatted = new Intl.DateTimeFormat('es-ES', {
                      timeZone: tz,
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      timeZoneName: 'short',
                    }).format(targetDate);
                  } catch {
                    formatted = '-';
                  }

                  const isMatchSelected = tz === selectedTimeZone;

                  return (
                    <tr
                      key={tz}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                        isMatchSelected
                          ? 'bg-[var(--accent-subtle)]/40 font-bold'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-bold">
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tz}</span>
                          {tz === 'UTC' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-black">
                              BASE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {formatted}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <CopyButton text={formatted} size="sm" label="" copiedLabel="" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: DIFFERENCE & ARITHMETIC */}
      {activeTab === 'diff_arithmetic' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Difference between two dates */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Diferencia entre Dos Fechas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calcula el lapso exacto en días, horas, minutos y desglose humano.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
                  Fecha 1
                </label>
                <input
                  type="datetime-local"
                  value={diffDate1}
                  onChange={(e) => setDiffDate1(e.target.value)}
                  className="w-full text-xs font-mono py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
                  Fecha 2
                </label>
                <input
                  type="datetime-local"
                  value={diffDate2}
                  onChange={(e) => setDiffDate2(e.target.value)}
                  className="w-full text-xs font-mono py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            {diffResult && (
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
                <div className="text-center pb-2 border-b border-indigo-200/60 dark:border-indigo-900/60">
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
                    Total Transcurrido
                  </span>
                  <span className="text-2xl font-black text-indigo-950 dark:text-indigo-100 font-mono">
                    {diffResult.totalDays} días
                  </span>
                  <span className="text-xs text-indigo-600 dark:text-indigo-300 block font-semibold mt-0.5">
                    ({diffResult.totalHours.toLocaleString()} horas ·{' '}
                    {diffResult.totalMinutes.toLocaleString()} minutos)
                  </span>
                </div>

                <div className="space-y-1 pt-1 text-xs font-medium text-indigo-900 dark:text-indigo-200">
                  <span className="font-extrabold block text-[10px] uppercase opacity-75">
                    Desglose de calendario:
                  </span>
                  <p>
                    {diffResult.breakdown.years > 0 && `${diffResult.breakdown.years} años, `}
                    {diffResult.breakdown.months > 0 && `${diffResult.breakdown.months} meses, `}
                    {`${diffResult.breakdown.days} días, `}
                    {`${diffResult.breakdown.hours} horas, `}
                    {`${diffResult.breakdown.minutes} minutos`}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Date Arithmetic (Add/Subtract) */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Aritmética de Fechas (Sumar / Restar)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Añade o sustrae días, semanas, meses o años a partir de cualquier fecha.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
                  Fecha Base
                </label>
                <input
                  type="datetime-local"
                  value={arithBaseDate}
                  onChange={(e) => setArithBaseDate(e.target.value)}
                  className="w-full text-xs font-mono py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
                    Operación
                  </label>
                  <select
                    value={arithOp}
                    onChange={(e) => setArithOp(e.target.value as 'add' | 'subtract')}
                    className="w-full text-xs font-semibold py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <option value="add">+ Sumar</option>
                    <option value="subtract">- Restar</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={arithAmount}
                    onChange={(e) => setArithAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-xs font-mono font-bold py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold uppercase text-slate-400 block mb-1">
                    Unidad
                  </label>
                  <select
                    value={arithUnit}
                    onChange={(e) => setArithUnit(e.target.value as any)}
                    className="w-full text-xs font-semibold py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <option value="days">Días</option>
                    <option value="weeks">Semanas</option>
                    <option value="months">Meses</option>
                    <option value="years">Años</option>
                    <option value="hours">Horas</option>
                  </select>
                </div>
              </div>
            </div>

            {arithResultDate && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Fecha Resultante
                  </span>
                  <CopyButton text={arithResultDate.toISOString()} size="sm" />
                </div>
                <p className="font-mono text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 select-all">
                  {new Intl.DateTimeFormat('es-ES', {
                    dateStyle: 'full',
                    timeStyle: 'medium',
                  }).format(arithResultDate)}
                </p>
                <div className="text-xs text-slate-500 font-mono select-all">
                  ISO: {arithResultDate.toISOString()}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
