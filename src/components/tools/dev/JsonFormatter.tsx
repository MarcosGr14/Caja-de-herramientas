import React, { useState, useMemo, useRef } from 'react';
import {
  FileJson,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  Minimize2,
  Maximize2,
  ArrowUpDown,
  ChevronRight,
  ChevronDown,
  Trash2,
  Sparkles,
  Layers,
  Code2,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { CopyButton } from '../../ui/CopyButton';
import { useToast } from '../../ui/Toast';

// Deep sort keys recursively
function sortObjectKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  } else if (obj !== null && typeof obj === 'object') {
    const sortedKeys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
    const result: Record<string, any> = {};
    for (const key of sortedKeys) {
      result[key] = sortObjectKeys(obj[key]);
    }
    return result;
  }
  return obj;
}

// Tree view node component
const JsonTreeNode: React.FC<{
  dataKey?: string;
  value: any;
  isLast?: boolean;
}> = ({ dataKey, value, isLast = true }) => {
  const [collapsed, setCollapsed] = useState(false);
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);

  if (!isObject) {
    let displayValue = String(value);
    let valColor = 'text-amber-600 dark:text-amber-400';

    if (typeof value === 'string') {
      displayValue = `"${value}"`;
      valColor = 'text-emerald-600 dark:text-emerald-400';
    } else if (typeof value === 'number') {
      valColor = 'text-sky-600 dark:text-sky-400';
    } else if (typeof value === 'boolean') {
      valColor = 'text-purple-600 dark:text-purple-400';
    } else if (value === null) {
      valColor = 'text-slate-400';
    }

    return (
      <div className="flex items-center text-xs font-mono py-0.5 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 rounded px-1">
        {dataKey !== undefined && (
          <span className="text-slate-700 dark:text-slate-300 mr-1.5 font-medium">
            "{dataKey}":
          </span>
        )}
        <span className={valColor}>{displayValue}</span>
        {!isLast && <span className="text-slate-400">,</span>}
      </div>
    );
  }

  const entries = isArray ? value.map((v: any, i: number) => [i, v]) : Object.entries(value);
  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';

  return (
    <div className="text-xs font-mono py-0.5">
      <div
        className="flex items-center gap-1 cursor-pointer select-none hover:bg-slate-100/60 dark:hover:bg-slate-800/40 rounded px-1 py-0.5"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="text-slate-400">
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
        {dataKey !== undefined && (
          <span className="text-slate-800 dark:text-slate-200 font-bold mr-1">
            "{dataKey}":
          </span>
        )}
        <span className="text-slate-500 font-bold">
          {openBracket}
          {collapsed && (
            <span className="text-slate-400 font-normal px-1">
              ... {entries.length} {isArray ? 'elementos' : 'claves'} ...
            </span>
          )}
          {collapsed && closeBracket}
        </span>
        {!collapsed && (
          <span className="text-[10px] text-slate-400 ml-1">
            ({entries.length})
          </span>
        )}
      </div>

      {!collapsed && (
        <div className="pl-4 border-l border-slate-200 dark:border-slate-800 ml-2">
          {entries.map(([k, v], idx) => (
            <JsonTreeNode
              key={k}
              dataKey={isArray ? undefined : String(k)}
              value={v}
              isLast={idx === entries.length - 1}
            />
          ))}
          <div className="text-slate-500 font-bold px-1 py-0.5">
            {closeBracket}
            {!isLast && <span className="text-slate-400">,</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default function JsonFormatter() {
  const [inputJson, setInputJson] = useState(`{
  "nombre": "Caja de Herramientas",
  "version": 1.0,
  "activo": true,
  "caracteristicas": [
    "100% en el navegador",
    "Sin APIs externas",
    "PWA instalable"
  ],
  "autor": {
    "rol": "Frontend Senior",
    "seguridad": "Web Crypto API"
  }
}`);
  const [indentOption, setIndentOption] = useState<'2' | '4' | 'tab'>('2');
  const [sortKeys, setSortKeys] = useState(false);
  const [viewMode, setViewMode] = useState<'text' | 'tree'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: toastError } = useToast();

  // Parsing & validation
  const validationResult = useMemo(() => {
    if (!inputJson.trim()) {
      return { isValid: false, data: null, error: null, formatted: '', minified: '' };
    }

    try {
      const parsed = JSON.parse(inputJson);
      const processed = sortKeys ? sortObjectKeys(parsed) : parsed;
      const indent = indentOption === 'tab' ? '\t' : Number(indentOption);
      const formatted = JSON.stringify(processed, null, indent);
      const minified = JSON.stringify(processed);

      return {
        isValid: true,
        data: processed,
        error: null,
        formatted,
        minified,
      };
    } catch (err: any) {
      // Extract line and column from JSON error message
      const msg = err.message || 'JSON inválido';
      const posMatch = msg.match(/at position (\d+)/i) || msg.match(/line (\d+) column (\d+)/i);
      let line = 1;
      let column = 1;

      if (posMatch && posMatch[1]) {
        const pos = parseInt(posMatch[1], 10);
        const sub = inputJson.slice(0, pos);
        const lines = sub.split('\n');
        line = lines.length;
        column = lines[lines.length - 1].length + 1;
      }

      return {
        isValid: false,
        data: null,
        error: { message: msg, line, column },
        formatted: '',
        minified: '',
      };
    }
  }, [inputJson, indentOption, sortKeys]);

  // Format button
  const handleFormat = () => {
    if (validationResult.isValid) {
      setInputJson(validationResult.formatted);
      success('JSON formateado correctamente');
    } else {
      toastError('Corrige los errores de sintaxis antes de formatear');
    }
  };

  // Minify button
  const handleMinify = () => {
    if (validationResult.isValid) {
      setInputJson(validationResult.minified);
      success('JSON minificado');
    } else {
      toastError('El JSON tiene errores de sintaxis');
    }
  };

  // Validate button
  const handleValidate = () => {
    if (validationResult.isValid) {
      success('¡JSON válido y bien estructurado!');
    } else {
      toastError(`Error en línea ${validationResult.error?.line || 1}, col ${validationResult.error?.column || 1}`);
    }
  };

  // File upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputJson(content);
      success(`Archivo "${file.name}" cargado`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // File download
  const handleDownload = () => {
    if (!inputJson) return;
    const blob = new Blob([inputJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'archivo.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success('JSON descargado');
  };

  const inputSize = new Blob([inputJson]).size;
  const minifiedSize = validationResult.isValid ? new Blob([validationResult.minified]).size : 0;
  const savingsPercent =
    inputSize > 0 && minifiedSize > 0 && inputSize > minifiedSize
      ? Math.round(((inputSize - minifiedSize) / inputSize) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileJson className="w-5 h-5 text-[var(--accent-text)]" />
            Formateador y Validador de JSON
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Formatea, minifica, ordena claves alfabéticamente y explora con vista de árbol.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            size="sm"
            variant="outline"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => fileInputRef.current?.click()}
          >
            Subir .json
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<Download className="w-4 h-4" />}
            onClick={handleDownload}
            disabled={!inputJson}
          >
            Descargar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<Trash2 className="w-4 h-4 text-rose-500" />}
            onClick={() => setInputJson('')}
            disabled={!inputJson}
          >
            Limpiar
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Main Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              icon={<Sparkles className="w-4 h-4" />}
              onClick={handleFormat}
            >
              Formatear
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={<Minimize2 className="w-4 h-4" />}
              onClick={handleMinify}
            >
              Minificar
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleValidate}
            >
              Validar
            </Button>
          </div>

          {/* Indentation & Sort Options */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Sangría:</span>
              <select
                value={indentOption}
                onChange={(e) => setIndentOption(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
              >
                <option value="2">2 espacios</option>
                <option value="4">4 espacios</option>
                <option value="tab">Tabulación</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={sortKeys}
                onChange={(e) => setSortKeys(e.target.checked)}
                className="rounded accent-[var(--accent-color)]"
              />
              <span>Ordenar claves A-Z</span>
            </label>

            {/* View Mode Toggle: Text vs Tree */}
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setViewMode('text')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  viewMode === 'text'
                    ? 'bg-white dark:bg-slate-900 text-[var(--accent-text)] shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                Texto
              </button>
              <button
                onClick={() => setViewMode('tree')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  viewMode === 'tree'
                    ? 'bg-white dark:bg-slate-900 text-[var(--accent-text)] shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Árbol
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Display: Side by Side on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor / Input */}
        <Card className="flex flex-col p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Entrada JSON
            </span>
            <span className="text-xs text-slate-400">
              Tamaño: {(inputSize / 1024).toFixed(2)} KB ({inputSize} bytes)
            </span>
          </div>

          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            placeholder="Pega o escribe tu JSON aquí..."
            className="w-full h-80 sm:h-96 p-3.5 rounded-xl resize-none bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
          />

          {/* Validation Status Banner */}
          {validationResult.isValid ? (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Sintaxis JSON válida</span>
              {savingsPercent > 0 && (
                <span className="ml-auto font-normal text-emerald-600 dark:text-emerald-400">
                  Ahorro en minificado: {savingsPercent}%
                </span>
              )}
            </div>
          ) : validationResult.error ? (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>
                  Error en línea {validationResult.error.line}, columna {validationResult.error.column}
                </span>
              </div>
              <p className="text-[11px] font-mono pl-6 opacity-90 break-words">
                {validationResult.error.message}
              </p>
            </div>
          ) : null}
        </Card>

        {/* Formatted View or Tree View */}
        <Card className="flex flex-col p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {viewMode === 'text' ? 'Vista Formateada / Salida' : 'Explorador de Árbol'}
            </span>
            {validationResult.isValid && (
              <span className="text-xs text-slate-400">
                Minificado: {(minifiedSize / 1024).toFixed(2)} KB
              </span>
            )}
          </div>

          {viewMode === 'text' ? (
            <textarea
              readOnly
              value={validationResult.isValid ? validationResult.formatted : ''}
              placeholder="El JSON formateado aparecerá aquí..."
              className="w-full h-80 sm:h-96 p-3.5 rounded-xl resize-none bg-slate-50/40 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none"
            />
          ) : (
            <div className="w-full h-80 sm:h-96 p-3.5 rounded-xl overflow-auto bg-slate-50/40 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800">
              {validationResult.isValid && validationResult.data ? (
                <JsonTreeNode value={validationResult.data} />
              ) : (
                <p className="text-xs text-slate-400 italic py-10 text-center">
                  Ingresa un JSON válido para visualizar la estructura en árbol.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400">
              {validationResult.isValid ? `${validationResult.formatted.length} caracteres` : 'Sin procesar'}
            </span>
            <CopyButton
              text={validationResult.isValid ? validationResult.formatted : ''}
              size="sm"
              variant="primary"
              label="Copiar JSON formateado"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
