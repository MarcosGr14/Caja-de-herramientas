import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Code2,
  Play,
  RotateCcw,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Sliders,
  Replace,
  BookOpen,
  Zap,
  Info,
  Clock,
  Check,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Tabs } from '../../ui/Tabs';
import { Button } from '../../ui/Button';
import { CopyButton } from '../../ui/CopyButton';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useDebounce } from '../../../hooks/useDebounce';
import { useToast } from '../../ui/Toast';
import {
  RegexWorkerRequest,
  RegexWorkerResponse,
  RegexMatchItem,
} from '../../../workers/regexWorker';

type TabId = 'matches' | 'replace' | 'cheatsheet';

interface RegexPreset {
  name: string;
  category: string;
  pattern: string;
  flags: string;
  description: string;
  sampleText: string;
}

const REGEX_PRESETS: RegexPreset[] = [
  {
    name: 'Correo Electrónico (Email)',
    category: 'Validación',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    flags: 'g',
    description: 'Detecta direcciones de correo estándar con dominio válido.',
    sampleText: 'Contacta a soporte@empresa.com o a ventas.internacionales@global-tech.es para más información.',
  },
  {
    name: 'URL Web Completa',
    category: 'Web',
    pattern: 'https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)',
    flags: 'gi',
    description: 'Detecta URLs HTTP y HTTPS con subdominios y query params.',
    sampleText: 'Visita https://mi-sitio.org/articulos?id=42&ref=newsletter o http://localhost:3000/api/v1',
  },
  {
    name: 'Dirección IPv4 Válida',
    category: 'Redes',
    pattern: '\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
    flags: 'g',
    description: 'Valida octetos en el rango 0 a 255.',
    sampleText: 'Servidor DNS 1.1.1.1, gateway 192.168.1.1 y host de prueba 10.0.0.254.',
  },
  {
    name: 'Fecha ISO 8601 (YYYY-MM-DD)',
    category: 'Datos',
    pattern: '(?<year>\\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\\d|3[01])',
    flags: 'g',
    description: 'Captura año, mes y día en grupos nombrados (?<year>, etc.).',
    sampleText: 'Facturas generadas el 2026-03-15 y 2026-10-24.',
  },
  {
    name: 'Código de Color Hexadecimal',
    category: 'Diseño',
    pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b',
    flags: 'gi',
    description: 'Detecta colores #RGB y #RRGGBB.',
    sampleText: 'Paleta: primario #6366F1, fondo #fff, acento #ec4899.',
  },
  {
    name: 'Teléfono Internacional',
    category: 'Validación',
    pattern: '\\+?[1-9]\\d{1,14}',
    flags: 'g',
    description: 'Formato estándar E.164 para números telefónicos internacionales.',
    sampleText: 'Llama al +34600123456 o desde USA al +14155552671.',
  },
  {
    name: 'Nombre de Usuario Seguro',
    category: 'Validación',
    pattern: '^[a-zA-Z0-9_-]{3,16}$',
    flags: '',
    description: 'Alfanumérico con guiones de 3 a 16 caracteres.',
    sampleText: 'usuario_pro99',
  },
  {
    name: 'Contraseña Robusta (Lookaheads)',
    category: 'Seguridad',
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
    flags: '',
    description: 'Mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial.',
    sampleText: 'ClaveSegura#2026',
  },
];

export default function RegexTesterTool() {
  const [activeTab, setActiveTab] = useLocalStorage<TabId>('app-regex-tab', 'matches');
  const [pattern, setPattern] = useLocalStorage<string>('app-regex-pattern', '(?<tag><\\w+>)(.*?)(<\\/\\w+>)');
  const [testText, setTestText] = useLocalStorage<string>(
    'app-regex-text',
    '<title>Caja de Herramientas</title>\n<h1>Bienvenido al Hub</h1>\n<p>Herramientas rápidas y seguras.</p>'
  );

  // Flags
  const [flagGlobal, setFlagGlobal] = useState(true);
  const [flagInsensitive, setFlagInsensitive] = useState(false);
  const [flagMultiline, setFlagMultiline] = useState(true);
  const [flagDotAll, setFlagDotAll] = useState(false);
  const [flagUnicode, setFlagUnicode] = useState(false);

  // Replace
  const [replacement, setReplacement] = useState('$1[CONTENIDO]$3');

  // Debounced values
  const debouncedPattern = useDebounce(pattern, 150);
  const debouncedText = useDebounce(testText, 150);
  const debouncedReplacement = useDebounce(replacement, 150);

  // Computed flags string
  const flags = useMemo(() => {
    let f = '';
    if (flagGlobal) f += 'g';
    if (flagInsensitive) f += 'i';
    if (flagMultiline) f += 'm';
    if (flagDotAll) f += 's';
    if (flagUnicode) f += 'u';
    return f;
  }, [flagGlobal, flagInsensitive, flagMultiline, flagDotAll, flagUnicode]);

  // Worker state
  const workerRef = useRef<Worker | null>(null);
  const [workerResult, setWorkerResult] = useState<RegexWorkerResponse>({
    id: '',
    success: true,
    matches: [],
    replacedText: '',
    totalMatchesCount: 0,
    isTruncated: false,
    executionTimeMs: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const { success, error: toastError } = useToast();

  // Initialize Web Worker safely
  useEffect(() => {
    try {
      workerRef.current = new Worker(new URL('../../../workers/regexWorker.ts', import.meta.url), {
        type: 'module',
      });

      workerRef.current.onmessage = (e: MessageEvent<RegexWorkerResponse>) => {
        setWorkerResult(e.data);
        setIsProcessing(false);
      };
    } catch {
      // Fallback in-thread if worker creation fails
      workerRef.current = null;
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Dispatch work to worker or perform in-thread fallback
  useEffect(() => {
    if (!debouncedPattern) {
      setWorkerResult({
        id: '',
        success: true,
        matches: [],
        replacedText: debouncedText,
        totalMatchesCount: 0,
        isTruncated: false,
        executionTimeMs: 0,
      });
      return;
    }

    setIsProcessing(true);
    const reqId = String(Date.now());
    const payload: RegexWorkerRequest = {
      id: reqId,
      pattern: debouncedPattern,
      flags,
      text: debouncedText,
      replacement: debouncedReplacement,
      isReplaceMode: activeTab === 'replace',
    };

    if (workerRef.current) {
      workerRef.current.postMessage(payload);
    } else {
      // In-thread fallback
      const start = performance.now();
      try {
        const regex = new RegExp(debouncedPattern, flags);
        const matches: RegexMatchItem[] = [];
        let replacedText = '';

        if (regex.global) {
          let m: RegExpExecArray | null;
          let count = 0;
          while ((m = regex.exec(debouncedText)) !== null && count < 1000) {
            count++;
            matches.push({
              index: m.index,
              length: m[0].length,
              text: m[0],
              groups: [],
            });
            if (regex.lastIndex === m.index) regex.lastIndex++;
          }
        }
        if (activeTab === 'replace') {
          replacedText = debouncedText.replace(regex, debouncedReplacement);
        }
        setWorkerResult({
          id: reqId,
          success: true,
          matches,
          replacedText,
          totalMatchesCount: matches.length,
          isTruncated: false,
          executionTimeMs: Math.round((performance.now() - start) * 10) / 10,
        });
      } catch (err: any) {
        setWorkerResult({
          id: reqId,
          success: false,
          matches: [],
          totalMatchesCount: 0,
          isTruncated: false,
          errorMessage: err.message,
          executionTimeMs: 0,
        });
      }
      setIsProcessing(false);
    }
  }, [debouncedPattern, flags, debouncedText, debouncedReplacement, activeTab]);

  // Highlight matches in test text
  const highlightedHtml = useMemo(() => {
    if (!workerResult.success || workerResult.matches.length === 0 || !testText) {
      return null;
    }

    // Sort matches by index ascending
    const sorted = [...workerResult.matches].sort((a, b) => a.index - b.index);
    let lastIndex = 0;
    const fragments: React.ReactNode[] = [];

    sorted.forEach((m, idx) => {
      if (m.index > lastIndex) {
        fragments.push(
          <span key={`text-${idx}`}>{testText.slice(lastIndex, m.index)}</span>
        );
      }
      fragments.push(
        <mark
          key={`match-${idx}`}
          className="bg-indigo-300/60 dark:bg-indigo-500/50 text-slate-900 dark:text-white rounded-xs px-0.5 border-b-2 border-indigo-600 dark:border-indigo-400 font-bold"
          title={`Coincidencia #${idx + 1}`}
        >
          {testText.slice(m.index, m.index + m.length)}
        </mark>
      );
      lastIndex = m.index + m.length;
    });

    if (lastIndex < testText.length) {
      fragments.push(
        <span key="text-end">{testText.slice(lastIndex)}</span>
      );
    }

    return fragments;
  }, [workerResult.matches, workerResult.success, testText]);

  // Quick helper to load preset
  const loadPreset = (preset: RegexPreset) => {
    setPattern(preset.pattern);
    setTestText(preset.sampleText);
    setFlagGlobal(preset.flags.includes('g'));
    setFlagInsensitive(preset.flags.includes('i'));
    setFlagMultiline(preset.flags.includes('m'));
    setFlagDotAll(preset.flags.includes('s'));
    setFlagUnicode(preset.flags.includes('u'));
    success(`Patrón "${preset.name}" cargado`);
    setActiveTab('matches');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Code2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Tester y Evaluador de Expresiones Regulares
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Prueba, resalta y reemplaza expresiones regulares en tiempo real. Ejecución aislada en Web Worker sin congelar la interfaz.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CopyButton text={`/${pattern}/${flags}`} label="Copiar RegEx literal" />
        </div>
      </div>

      {/* Main Pattern Bar */}
      <Card className="p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>Expresión Regular</span>
            {isProcessing && (
              <span className="inline-flex items-center gap-1 text-[10px] text-indigo-500">
                <Clock className="w-3 h-3 animate-spin" /> Procesando...
              </span>
            )}
          </label>
          <div className="flex items-center gap-2 text-xs">
            {workerResult.success ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {workerResult.totalMatchesCount} coincidencia
                {workerResult.totalMatchesCount !== 1 ? 's' : ''} ({workerResult.executionTimeMs} ms)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" /> Error de sintaxis
              </span>
            )}
          </div>
        </div>

        {/* Pattern input with slashes & flags */}
        <div className="flex items-center rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-subtle)] transition">
          <span className="pl-4 font-mono font-black text-slate-400 text-lg sm:text-xl select-none">
            /
          </span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="[a-zA-Z0-9]+..."
            className="flex-1 font-mono text-sm sm:text-base font-bold py-3.5 px-2 bg-transparent focus:outline-hidden text-slate-800 dark:text-slate-100"
          />
          <span className="font-mono font-black text-slate-400 text-lg sm:text-xl select-none">
            /
          </span>
          <span className="pr-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm select-none">
            {flags || '-'}
          </span>
        </div>

        {/* Error notification if any */}
        {!workerResult.success && workerResult.errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{workerResult.errorMessage}</span>
          </div>
        )}

        {/* Flags toggles */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2">
            Modificadores (Flags):
          </span>

          {[
            {
              id: 'g',
              label: 'global (g)',
              checked: flagGlobal,
              setter: setFlagGlobal,
              desc: 'No se detiene tras la primera coincidencia',
            },
            {
              id: 'i',
              label: 'ignore case (i)',
              checked: flagInsensitive,
              setter: setFlagInsensitive,
              desc: 'Ignora diferencias entre mayúsculas y minúsculas',
            },
            {
              id: 'm',
              label: 'multiline (m)',
              checked: flagMultiline,
              setter: setFlagMultiline,
              desc: '^ y $ coinciden con inicios y finales de línea',
            },
            {
              id: 's',
              label: 'dotAll (s)',
              checked: flagDotAll,
              setter: setFlagDotAll,
              desc: 'El punto (.) coincide también con saltos de línea',
            },
            {
              id: 'u',
              label: 'unicode (u)',
              checked: flagUnicode,
              setter: setFlagUnicode,
              desc: 'Soporte completo para caracteres Unicode',
            },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => f.setter(!f.checked)}
              title={f.desc}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                f.checked
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {f.checked && <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
        tabs={[
          {
            id: 'matches',
            label: 'Coincidencias',
            icon: <Sparkles className="w-4 h-4" />,
            badge: workerResult.totalMatchesCount > 0 ? workerResult.totalMatchesCount : undefined,
          },
          {
            id: 'replace',
            label: 'Reemplazo',
            icon: <Replace className="w-4 h-4" />,
          },
          {
            id: 'cheatsheet',
            label: 'Biblioteca y Chuleta',
            icon: <BookOpen className="w-4 h-4" />,
          },
        ]}
      />

      {/* TAB 1: MATCHES */}
      {activeTab === 'matches' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input Text and Live Highlight */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Texto de Prueba
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={() => setTestText('')}
                >
                  Limpiar
                </Button>
              </div>
            </div>

            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Introduce o pega el texto a analizar..."
              rows={8}
              className="w-full font-mono text-xs sm:text-sm p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-subtle)] resize-y leading-relaxed"
            />

            {/* Visual Highlight Output */}
            {testText && highlightedHtml && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Vista Resaltada en Vivo
                </span>
                <div className="font-mono text-xs sm:text-sm p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                  {highlightedHtml}
                </div>
              </div>
            )}
          </Card>

          {/* Right: Match Explorer & Groups */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Explorador de Coincidencias
                </h2>
                <span className="text-xs text-slate-400">
                  {workerResult.totalMatchesCount} encontradas
                </span>
              </div>
              {workerResult.matches.length > 0 && (
                <CopyButton
                  text={workerResult.matches.map((m) => m.text).join('\n')}
                  label="Copiar todas"
                  size="sm"
                />
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 max-h-[480px] pr-1">
              {workerResult.matches.length > 0 ? (
                workerResult.matches.map((match, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                          #{idx + 1}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          índice: {match.index}..{match.index + match.length}
                        </span>
                      </div>
                      <CopyButton text={match.text} size="sm" label="" copiedLabel="" />
                    </div>

                    <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 break-all">
                      {match.text}
                    </div>

                    {/* Groups */}
                    {match.groups && match.groups.length > 0 && (
                      <div className="pt-1 space-y-1">
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 block">
                          Grupos capturados ({match.groups.length}):
                        </span>
                        <div className="grid grid-cols-1 gap-1">
                          {match.groups.map((grp, gIdx) => (
                            <div
                              key={gIdx}
                              className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono"
                            >
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                {grp.name}:
                              </span>
                              <span className="truncate text-slate-700 dark:text-slate-300 font-semibold">
                                {grp.value || '<vacío>'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-16 text-slate-400 text-xs">
                  {debouncedPattern
                    ? 'No se encontraron coincidencias en el texto actual.'
                    : 'Introduce una expresión regular para comenzar.'}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: REPLACE */}
      {activeTab === 'replace' && (
        <Card className="p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Modo Reemplazo y Sustitución
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sustituye coincidencias usando referencias a grupos ($1, $2, $&, etc.) o texto estático.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Patrón de Reemplazo
              </label>
              <input
                type="text"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder="Ejemplo: $1_REEMPLAZO o [CENSURADO]"
                className="w-full font-mono text-sm px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-subtle)]"
              />
              <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mt-2">
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">
                  $1, $2
                </span>{' '}
                Grupos capturados |{' '}
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">
                  $&
                </span>{' '}
                Toda la coincidencia |{' '}
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">
                  $$
                </span>{' '}
                Símbolo $ literal
              </div>
            </div>

            {/* Replaced Result Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Resultado del Reemplazo
                </label>
                <CopyButton
                  text={workerResult.replacedText || ''}
                  label="Copiar resultado"
                  size="sm"
                />
              </div>

              <textarea
                readOnly
                value={workerResult.replacedText || ''}
                rows={8}
                className="w-full font-mono text-xs sm:text-sm p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 resize-y leading-relaxed select-all"
              />
            </div>
          </div>
        </Card>
      )}

      {/* TAB 3: CHEATSHEET & PRESETS */}
      {activeTab === 'cheatsheet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Presets library */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Biblioteca de Expresiones Populares
            </h2>

            <div className="space-y-3">
              {REGEX_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => loadPreset(p)}
                  className="w-full text-left p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-[var(--accent-primary)] hover:bg-slate-50 dark:hover:bg-slate-800/60 transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[var(--accent-text)]">
                      {p.name}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      {p.category}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate mt-1">
                    /{p.pattern}/{p.flags}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">{p.description}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Quick Cheatsheet Guide */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Chuleta de Referencia Rápida
            </h2>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  Clases de Caracteres
                </span>
                <div className="grid grid-cols-2 gap-1.5 font-mono">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <strong className="text-indigo-600 dark:text-indigo-400">\d</strong> Cualquier dígito (0-9)
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <strong className="text-indigo-600 dark:text-indigo-400">\w</strong> Alfanumérico y guion bajo
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <strong className="text-indigo-600 dark:text-indigo-400">\s</strong> Espacio en blanco o tab
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <strong className="text-indigo-600 dark:text-indigo-400">.</strong> Cualquier carácter
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  Anclas y Posición
                </span>
                <div className="grid grid-cols-2 gap-1.5 font-mono">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <strong className="text-indigo-600 dark:text-indigo-400">^</strong> Inicio de línea/cadena
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <strong className="text-indigo-600 dark:text-indigo-400">$</strong> Final de línea/cadena
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <strong className="text-indigo-600 dark:text-indigo-400">\b</strong> Límite de palabra
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <strong className="text-indigo-600 dark:text-indigo-400">[a-z]</strong> Rango de caracteres
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  Cuantificadores
                </span>
                <div className="grid grid-cols-2 gap-1.5 font-mono">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <strong className="text-indigo-600 dark:text-indigo-400">+</strong> 1 o más veces
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <strong className="text-indigo-600 dark:text-indigo-400">*</strong> 0 o más veces
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <strong className="text-indigo-600 dark:text-indigo-400">?</strong> Opcional (0 o 1)
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <strong className="text-indigo-600 dark:text-indigo-400">&#123;3,8&#125;</strong> Entre 3 y 8 veces
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
