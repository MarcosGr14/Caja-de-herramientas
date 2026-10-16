import React, { useState, useMemo, useRef } from 'react';
import {
  FileText,
  Clock,
  Mic,
  Copy,
  Trash2,
  ClipboardPaste,
  Upload,
  Sliders,
  Check,
  Filter,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { CopyButton } from '../../ui/CopyButton';
import { useToast } from '../../ui/Toast';
import { SPANISH_STOPWORDS } from '../../../data/spanishStopwords';

interface LimitConfig {
  name: string;
  limit: number;
}

export default function WordCounter() {
  const [text, setText] = useState('');
  const [ignoreStopwords, setIgnoreStopwords] = useState(true);
  const [customLimit, setCustomLimit] = useState(500);
  const [selectedLimitIdx, setSelectedLimitIdx] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error } = useToast();

  const limits: LimitConfig[] = useMemo(
    () => [
      { name: 'X / Twitter', limit: 280 },
      { name: 'Instagram', limit: 2200 },
      { name: 'SMS', limit: 160 },
      { name: 'Meta Descripción', limit: 160 },
      { name: 'Límite Personalizado', limit: customLimit },
    ],
    [customLimit]
  );

  // Statistics calculation
  const stats = useMemo(() => {
    const charsWithSpaces = text.length;
    const charsWithoutSpaces = text.replace(/\s/g, '').length;

    // Words
    const wordMatches = text.trim().match(/[\p{L}\p{N}'-]+/gu);
    const words = wordMatches ? wordMatches.length : 0;

    // Sentences
    const sentencesMatches = text
      .split(/[.!?]+(\s+|$)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !/[.!?]+/.test(s));
    const sentences = text.trim() ? Math.max(1, sentencesMatches.length) : 0;

    // Paragraphs
    const paragraphs = text
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0).length;

    // Lines
    const lines = text.length === 0 ? 0 : text.split('\n').length;

    // Reading & Speaking times
    const readingSeconds = Math.round((words / 200) * 60);
    const speakingSeconds = Math.round((words / 130) * 60);

    const formatTime = (secs: number) => {
      if (secs < 60) return `${secs} seg`;
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return s > 0 ? `${m} min ${s} s` : `${m} min`;
    };

    // Word density
    const frequencyMap = new Map<string, number>();
    if (wordMatches) {
      for (const w of wordMatches) {
        const cleaned = w.toLowerCase();
        if (cleaned.length < 2) continue;
        if (ignoreStopwords && SPANISH_STOPWORDS.has(cleaned)) continue;
        frequencyMap.set(cleaned, (frequencyMap.get(cleaned) || 0) + 1);
      }
    }

    const sortedWords = Array.from(frequencyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({
        word,
        count,
        percent: words > 0 ? ((count / words) * 100).toFixed(1) : '0',
      }));

    return {
      charsWithSpaces,
      charsWithoutSpaces,
      words,
      sentences,
      paragraphs,
      lines,
      readingTime: formatTime(readingSeconds),
      speakingTime: formatTime(speakingSeconds),
      topWords: sortedWords,
    };
  }, [text, ignoreStopwords]);

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        setText(clipboardText);
        success('Texto pegado desde el portapapeles');
      }
    } catch {
      error('No se pudo acceder al portapapeles. Pega usando Ctrl+V.');
    }
  };

  // Upload .txt
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setText(content);
      success(`Archivo "${file.name}" cargado`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const currentLimit = limits[selectedLimitIdx];
  const charProgress = Math.min(100, (stats.charsWithSpaces / currentLimit.limit) * 100);
  const isOverLimit = stats.charsWithSpaces > currentLimit.limit;

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--accent-text)]" />
            Contador de Palabras y Caracteres
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Análisis de métricas, tiempos de locución y densidad léxica en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.rtf"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            size="sm"
            variant="outline"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => fileInputRef.current?.click()}
          >
            Cargar .txt
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<ClipboardPaste className="w-4 h-4" />}
            onClick={handlePaste}
          >
            Pegar
          </Button>
          <CopyButton text={text} size="sm" label="Copiar texto" />
          <Button
            size="sm"
            variant="ghost"
            icon={<Trash2 className="w-4 h-4 text-rose-500" />}
            onClick={() => {
              setText('');
              success('Texto limpiado');
            }}
            disabled={!text}
          >
            Limpiar
          </Button>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Text Area */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <Card className="flex-1 flex flex-col p-4 sm:p-5">
            <label htmlFor="word-counter-input" className="sr-only">
              Escribe o pega tu texto aquí
            </label>
            <textarea
              id="word-counter-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe o pega aquí el texto que deseas analizar..."
              className="w-full h-80 sm:h-96 p-4 rounded-xl resize-none bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm sm:text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-transparent transition-all"
            />

            {/* Quick stats bar at bottom of textarea */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
              <div className="flex gap-4">
                <span>
                  <strong className="text-slate-700 dark:text-slate-300">{stats.words}</strong> palabras
                </span>
                <span>
                  <strong className="text-slate-700 dark:text-slate-300">{stats.charsWithSpaces}</strong> caracteres
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1" title="Tiempo de lectura a 200 palabras/minuto">
                  <Clock className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                  Lectura: <strong className="text-slate-700 dark:text-slate-300">{stats.readingTime}</strong>
                </span>
                <span className="flex items-center gap-1" title="Tiempo de habla a 130 palabras/minuto">
                  <Mic className="w-3.5 h-3.5 text-amber-500" />
                  Habla: <strong className="text-slate-700 dark:text-slate-300">{stats.speakingTime}</strong>
                </span>
              </div>
            </div>
          </Card>

          {/* Reference Limits & Progress */}
          <Card className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Límites de Redes y Mensajería
              </span>
              {selectedLimitIdx === 4 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Límite:</span>
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={customLimit}
                    onChange={(e) => setCustomLimit(Math.max(1, Number(e.target.value) || 1))}
                    className="w-20 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-bold"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {limits.map((lim, idx) => (
                <button
                  key={lim.name}
                  onClick={() => setSelectedLimitIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedLimitIdx === idx
                      ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)] border border-[var(--accent-border)] shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60'
                  }`}
                >
                  {lim.name} ({lim.limit})
                </button>
              ))}
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className={isOverLimit ? 'text-rose-500 font-bold' : 'text-slate-600 dark:text-slate-400'}>
                  {stats.charsWithSpaces} / {currentLimit.limit} caracteres
                </span>
                <span className={isOverLimit ? 'text-rose-500 font-bold' : 'text-slate-500'}>
                  {isOverLimit
                    ? `Excedido por ${stats.charsWithSpaces - currentLimit.limit}`
                    : `Restan ${currentLimit.limit - stats.charsWithSpaces}`}
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isOverLimit ? 'bg-rose-500' : charProgress > 85 ? 'bg-amber-500' : 'bg-[var(--accent-color)]'
                  }`}
                  style={{ width: `${charProgress}%` }}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Detailed Metric Cards & Word Density */}
        <div className="lg:col-span-5 space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card className="p-3.5 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400">Palabras</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats.words.toLocaleString('es-ES')}
              </p>
            </Card>

            <Card className="p-3.5 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400">Caracteres (total)</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats.charsWithSpaces.toLocaleString('es-ES')}
              </p>
            </Card>

            <Card className="p-3.5 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400">Sin espacios</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats.charsWithoutSpaces.toLocaleString('es-ES')}
              </p>
            </Card>

            <Card className="p-3.5 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400">Oraciones</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats.sentences.toLocaleString('es-ES')}
              </p>
            </Card>

            <Card className="p-3.5 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400">Párrafos</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats.paragraphs.toLocaleString('es-ES')}
              </p>
            </Card>

            <Card className="p-3.5 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400">Líneas</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {stats.lines.toLocaleString('es-ES')}
              </p>
            </Card>
          </div>

          {/* Word Density */}
          <Card className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Densidad de Palabras
              </h3>
              <button
                onClick={() => setIgnoreStopwords(!ignoreStopwords)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  ignoreStopwords
                    ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
                title="Ignorar palabras comunes como 'de', 'la', 'que', etc."
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{ignoreStopwords ? 'Ignorando conectores' : 'Todas las palabras'}</span>
              </button>
            </div>

            {stats.topWords.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-6 text-center">
                Escribe texto para ver las 10 palabras más frecuentes.
              </p>
            ) : (
              <div className="space-y-2">
                {stats.topWords.map((item, idx) => (
                  <div key={item.word} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {idx + 1}. {item.word}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {item.count} ({item.percent}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent-color)] rounded-full"
                        style={{ width: `${Math.min(100, Number(item.percent) * 3)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
