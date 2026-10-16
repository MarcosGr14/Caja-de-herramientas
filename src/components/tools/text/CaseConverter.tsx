import React, { useState, useMemo } from 'react';
import {
  Type,
  ArrowRightLeft,
  Undo2,
  Trash2,
  ArrowDownAZ,
  ArrowUpZA,
  Scissors,
  Sparkles,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { CopyButton } from '../../ui/CopyButton';
import { useToast } from '../../ui/Toast';

type CaseMode =
  | 'upper'
  | 'lower'
  | 'title'
  | 'sentence'
  | 'alternating'
  | 'invert'
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'kebab'
  | 'constant';

export default function CaseConverter() {
  const [inputText, setInputText] = useState('Texto de ejemplo con tildes, la letra ñ y caracteres en español.');
  const [activeMode, setActiveMode] = useState<CaseMode>('upper');
  const [history, setHistory] = useState<string[]>([]);
  const { success } = useToast();

  const pushHistory = (newVal: string) => {
    setHistory((prev) => [inputText, ...prev].slice(0, 20));
    setInputText(newVal);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const [previous, ...rest] = history;
    setInputText(previous);
    setHistory(rest);
    success('Acción deshecha');
  };

  // Convert text according to selected mode
  const convertedText = useMemo(() => {
    if (!inputText) return '';

    switch (activeMode) {
      case 'upper':
        return inputText.toLocaleUpperCase('es-ES');

      case 'lower':
        return inputText.toLocaleLowerCase('es-ES');

      case 'title': {
        const minorWords = new Set(['de', 'la', 'el', 'en', 'y', 'a', 'del', 'las', 'los', 'un', 'una', 'con', 'por', 'o', 'al']);
        return inputText.replace(/(\p{L}+)/gu, (match, word: string, offset: number) => {
          const lower = word.toLocaleLowerCase('es-ES');
          if (offset > 0 && minorWords.has(lower)) {
            return lower;
          }
          return lower.charAt(0).toLocaleUpperCase('es-ES') + lower.slice(1);
        });
      }

      case 'sentence': {
        // Capitalize first letter of each sentence
        return inputText
          .toLocaleLowerCase('es-ES')
          .replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (match, sep, char) => {
            return sep + char.toLocaleUpperCase('es-ES');
          });
      }

      case 'alternating': {
        let isUpper = false;
        return Array.from(inputText)
          .map((char) => {
            if (/\p{L}/u.test(char)) {
              isUpper = !isUpper;
              return isUpper ? char.toLocaleUpperCase('es-ES') : char.toLocaleLowerCase('es-ES');
            }
            return char;
          })
          .join('');
      }

      case 'invert': {
        return Array.from(inputText)
          .map((char) => {
            const upper = char.toLocaleUpperCase('es-ES');
            const lower = char.toLocaleLowerCase('es-ES');
            return char === upper ? lower : upper;
          })
          .join('');
      }

      case 'camel': {
        const words = inputText
          .replace(/[^\p{L}\p{N}]+/gu, ' ')
          .trim()
          .split(/\s+/);
        if (!words[0]) return '';
        return words
          .map((w, idx) => {
            const lower = w.toLocaleLowerCase('es-ES');
            if (idx === 0) return lower;
            return lower.charAt(0).toLocaleUpperCase('es-ES') + lower.slice(1);
          })
          .join('');
      }

      case 'pascal': {
        const words = inputText
          .replace(/[^\p{L}\p{N}]+/gu, ' ')
          .trim()
          .split(/\s+/);
        return words
          .map((w) => {
            const lower = w.toLocaleLowerCase('es-ES');
            return lower.charAt(0).toLocaleUpperCase('es-ES') + lower.slice(1);
          })
          .join('');
      }

      case 'snake': {
        return inputText
          .trim()
          .replace(/[^\p{L}\p{N}]+/gu, '_')
          .replace(/^_+|_+$/g, '')
          .toLocaleLowerCase('es-ES');
      }

      case 'kebab': {
        return inputText
          .trim()
          .replace(/[^\p{L}\p{N}]+/gu, '-')
          .replace(/^-+|-+$/g, '')
          .toLocaleLowerCase('es-ES');
      }

      case 'constant': {
        return inputText
          .trim()
          .replace(/[^\p{L}\p{N}]+/gu, '_')
          .replace(/^_+|_+$/g, '')
          .toLocaleUpperCase('es-ES');
      }

      default:
        return inputText;
    }
  }, [inputText, activeMode]);

  // One-click text clean utilities
  const handleRemoveExtraSpaces = () => {
    const cleaned = inputText
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .join('\n')
      .trim();
    pushHistory(cleaned);
    success('Espacios extra eliminados');
  };

  const handleRemoveLineBreaks = () => {
    const cleaned = inputText.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
    pushHistory(cleaned);
    success('Saltos de línea eliminados');
  };

  const handleRemoveDuplicateLines = () => {
    const lines = inputText.split(/\r?\n/);
    const seen = new Set<string>();
    const uniqueLines: string[] = [];
    for (const line of lines) {
      if (!seen.has(line)) {
        seen.add(line);
        uniqueLines.push(line);
      }
    }
    pushHistory(uniqueLines.join('\n'));
    success('Líneas duplicadas eliminadas');
  };

  const handleSortLines = (direction: 'asc' | 'desc') => {
    const lines = inputText.split(/\r?\n/);
    const sorted = [...lines].sort((a, b) =>
      direction === 'asc' ? a.localeCompare(b, 'es') : b.localeCompare(a, 'es')
    );
    pushHistory(sorted.join('\n'));
    success(`Líneas ordenadas (${direction === 'asc' ? 'A-Z' : 'Z-A'})`);
  };

  const handleRemoveAccents = () => {
    // Keep 'ñ' and 'Ñ' while removing á, é, í, ó, ú, ü, etc.
    const cleaned = inputText
      .normalize('NFD')
      .replace(/[\u0300-\u0302\u0304-\u036f]/g, '') // keeps \u0303 (tilde on ñ)
      .normalize('NFC');
    pushHistory(cleaned);
    success('Acentos y tildes removidos (conservando la ñ)');
  };

  const handleReverseText = () => {
    const reversed = Array.from(inputText).reverse().join('');
    pushHistory(reversed);
    success('Texto invertido');
  };

  const handleApplyResultAsInput = () => {
    pushHistory(convertedText);
    success('Resultado fijado como nueva entrada');
  };

  const modes: { id: CaseMode; label: string; sample: string }[] = [
    { id: 'upper', label: 'MAYÚSCULAS', sample: 'TEXTO' },
    { id: 'lower', label: 'minúsculas', sample: 'texto' },
    { id: 'title', label: 'Tipo Título', sample: 'Texto De Título' },
    { id: 'sentence', label: 'Tipo oración', sample: 'Texto de oración' },
    { id: 'alternating', label: 'aLtErNaDo', sample: 'tExTo aLtErNaDo' },
    { id: 'invert', label: 'iNVERTIR', sample: 'iNVERTIR cASE' },
    { id: 'camel', label: 'camelCase', sample: 'camelCaseText' },
    { id: 'pascal', label: 'PascalCase', sample: 'PascalCaseText' },
    { id: 'snake', label: 'snake_case', sample: 'snake_case_text' },
    { id: 'kebab', label: 'kebab-case', sample: 'kebab-case-text' },
    { id: 'constant', label: 'CONSTANT_CASE', sample: 'CONSTANT_TEXT' },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Type className="w-5 h-5 text-[var(--accent-text)]" />
            Mayúsculas, Minúsculas y Casos de Texto
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Transformación rápida de formatos, limpieza de espacios, ordenamiento y utilidades.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<Undo2 className="w-4 h-4" />}
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Deshacer último cambio"
          >
            Deshacer ({history.length})
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<Trash2 className="w-4 h-4 text-rose-500" />}
            onClick={() => {
              pushHistory('');
              success('Entrada limpiada');
            }}
            disabled={!inputText}
          >
            Limpiar
          </Button>
        </div>
      </div>

      {/* Case Mode Selector Grid */}
      <Card className="p-3.5 sm:p-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 block">
          Formato de destino
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMode(m.id)}
              className={`p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                activeMode === m.id
                  ? 'bg-[var(--accent-subtle)] border-[var(--accent-border)] text-[var(--accent-text)] shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-bold truncate">{m.label}</div>
              <div className="text-[11px] opacity-75 truncate mt-0.5 font-mono">{m.sample}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Two Column Layout: Entrada | Resultado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card className="flex flex-col p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Texto Original
            </span>
            <span className="text-xs text-slate-400">
              {inputText.length} caracteres
            </span>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe o pega aquí el texto a transformar..."
            className="w-full h-72 sm:h-80 p-3.5 rounded-xl resize-none bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] transition"
          />

          {/* Quick Clean Actions Toolbar */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">
              Utilidades rápidas
            </span>
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant="outline" onClick={handleRemoveExtraSpaces} title="Quita dobles espacios">
                Quitar espacios extra
              </Button>
              <Button size="sm" variant="outline" onClick={handleRemoveLineBreaks} title="Une todo en una sola línea">
                Quitar saltos
              </Button>
              <Button size="sm" variant="outline" onClick={handleRemoveDuplicateLines} title="Elimina líneas repetidas">
                Quitar líneas duplicadas
              </Button>
              <Button size="sm" variant="outline" icon={<ArrowDownAZ className="w-3.5 h-3.5" />} onClick={() => handleSortLines('asc')}>
                A-Z
              </Button>
              <Button size="sm" variant="outline" icon={<ArrowUpZA className="w-3.5 h-3.5" />} onClick={() => handleSortLines('desc')}>
                Z-A
              </Button>
              <Button size="sm" variant="outline" onClick={handleRemoveAccents} title="Quita tildes conservando la ñ">
                Quitar tildes
              </Button>
              <Button size="sm" variant="outline" icon={<ArrowRightLeft className="w-3.5 h-3.5" />} onClick={handleReverseText}>
                Invertir
              </Button>
            </div>
          </div>
        </Card>

        {/* Output */}
        <Card className="flex flex-col p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Resultado Convertido
            </span>
            <span className="text-xs text-slate-400">
              {convertedText.length} caracteres
            </span>
          </div>

          <textarea
            readOnly
            value={convertedText}
            placeholder="El resultado aparecerá aquí automáticamente..."
            className="w-full h-72 sm:h-80 p-3.5 rounded-xl resize-none bg-slate-50/40 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none"
          />

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={handleApplyResultAsInput}
              disabled={!convertedText}
              title="Cargar el resultado en la caja de entrada para seguir editándolo"
            >
              Usar resultado como entrada
            </Button>

            <CopyButton text={convertedText} size="md" variant="primary" label="Copiar resultado" />
          </div>
        </Card>
      </div>
    </div>
  );
}
