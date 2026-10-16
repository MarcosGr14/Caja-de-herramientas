import React, { useState, useMemo } from 'react';
import {
  Shield,
  Terminal,
  Lock,
  Copy,
  AlertTriangle,
  FolderLock,
  FileCode,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { CopyButton } from '../../ui/CopyButton';
import { useToast } from '../../ui/Toast';
import {
  PermissionState,
  DEFAULT_PERMISSIONS,
  CHMOD_PRESETS,
  stateToOctal,
  octalToState,
  stateToSymbolic,
  explainPermissions,
  computeFromUmask,
} from '../../../utils/chmodUtils';

export default function ChmodCalculator() {
  const [state, setState] = useState<PermissionState>(DEFAULT_PERMISSIONS);
  const [octalInput, setOctalInput] = useState('755');
  const [filename, setFilename] = useState('archivo.sh');
  const [isRecursive, setIsRecursive] = useState(false);
  const [isDirectory, setIsDirectory] = useState(false);

  // Umask mini calculator
  const [umaskInput, setUmaskInput] = useState('022');

  const { success } = useToast();

  // Sync state to octal
  const currentOctal = useMemo(() => stateToOctal(state), [state]);
  const currentSymbolic = useMemo(() => stateToSymbolic(state, isDirectory), [state, isDirectory]);
  const explanation = useMemo(() => explainPermissions(state), [state]);

  // Generated command
  const generatedCommand = useMemo(() => {
    const flags = isRecursive ? '-R ' : '';
    const target = filename.trim() || 'archivo';
    return `chmod ${flags}${currentOctal} ${target}`;
  }, [currentOctal, isRecursive, filename]);

  // Handle direct octal text input
  const handleOctalChange = (val: string) => {
    setOctalInput(val);
    const parsed = octalToState(val);
    if (parsed) {
      setState(parsed);
    }
  };

  // Preset selector
  const handleSelectPreset = (octal: string) => {
    setOctalInput(octal);
    const parsed = octalToState(octal);
    if (parsed) {
      setState(parsed);
      success(`Preset ${octal} aplicado`);
    }
  };

  // Umask calculation
  const umaskResult = useMemo(() => {
    return computeFromUmask(umaskInput);
  }, [umaskInput]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Lock className="w-5 h-5 text-[var(--accent-text)]" />
            Calculadora de Permisos Linux (CHMOD y Umask)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generador visual bidireccional entre casillas r/w/x, valores octales, notación simbólica y comandos bash.
          </p>
        </div>
      </div>

      {/* Main 2-Column: Matrix & Inputs | Results & Explanations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Checkbox Matrix */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Matriz de Permisos
              </span>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDirectory}
                  onChange={(e) => setIsDirectory(e.target.checked)}
                  className="rounded accent-[var(--accent-color)]"
                />
                <span>Es directorio (prefijo &apos;d&apos;)</span>
              </label>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="text-left pb-2 font-bold">Nivel / Entidad</th>
                    <th className="pb-2">Lectura (r = 4)</th>
                    <th className="pb-2">Escritura (w = 2)</th>
                    <th className="pb-2">Ejecución (x = 1)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {/* Propietario (User) */}
                  <tr>
                    <td className="py-3 text-left font-bold text-slate-800 dark:text-slate-200">
                      Propietario (u)
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={state.userRead}
                        onChange={(e) => setState({ ...state, userRead: e.target.checked })}
                        className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={state.userWrite}
                        onChange={(e) => setState({ ...state, userWrite: e.target.checked })}
                        className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={state.userExecute}
                        onChange={(e) => setState({ ...state, userExecute: e.target.checked })}
                        className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
                      />
                    </td>
                  </tr>

                  {/* Grupo */}
                  <tr>
                    <td className="py-3 text-left font-bold text-slate-800 dark:text-slate-200">
                      Grupo (g)
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={state.groupRead}
                        onChange={(e) => setState({ ...state, groupRead: e.target.checked })}
                        className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={state.groupWrite}
                        onChange={(e) => setState({ ...state, groupWrite: e.target.checked })}
                        className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={state.groupExecute}
                        onChange={(e) => setState({ ...state, groupExecute: e.target.checked })}
                        className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
                      />
                    </td>
                  </tr>

                  {/* Otros */}
                  <tr>
                    <td className="py-3 text-left font-bold text-slate-800 dark:text-slate-200">
                      Otros (o)
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={state.othersRead}
                        onChange={(e) => setState({ ...state, othersRead: e.target.checked })}
                        className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={state.othersWrite}
                        onChange={(e) => setState({ ...state, othersWrite: e.target.checked })}
                        className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={state.othersExecute}
                        onChange={(e) => setState({ ...state, othersExecute: e.target.checked })}
                        className="w-4 h-4 rounded accent-[var(--accent-color)] cursor-pointer"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Special Bits */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Bits Especiales (Avanzado)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.setuid}
                    onChange={(e) => setState({ ...state, setuid: e.target.checked })}
                    className="rounded accent-[var(--accent-color)]"
                  />
                  <span>SUID (4000)</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.setgid}
                    onChange={(e) => setState({ ...state, setgid: e.target.checked })}
                    className="rounded accent-[var(--accent-color)]"
                  />
                  <span>SGID (2000)</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.sticky}
                    onChange={(e) => setState({ ...state, sticky: e.target.checked })}
                    className="rounded accent-[var(--accent-color)]"
                  />
                  <span>Sticky Bit (1000)</span>
                </label>
              </div>
            </div>

            {/* Direct Octal & Filename inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Editar Valor Octal Directamente
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={currentOctal}
                  onChange={(e) => handleOctalChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-base font-bold text-center text-[var(--accent-text)]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nombre de Archivo / Carpeta
                </label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="script.sh"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs font-medium"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={isRecursive}
                onChange={(e) => setIsRecursive(e.target.checked)}
                className="rounded accent-[var(--accent-color)]"
              />
              <span>Aplicar de forma recursiva (-R) a todo el contenido interno</span>
            </label>
          </Card>
        </div>

        {/* Right Column: Output Command, Presets & Explanations */}
        <div className="lg:col-span-5 space-y-4">
          {/* Shell Command Card */}
          <Card className="p-4 sm:p-5 space-y-3 bg-slate-900 text-white font-mono">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Comando Bash Generado</span>
              </div>
              <CopyButton text={generatedCommand} size="sm" variant="ghost" label="Copiar" />
            </div>

            <p className="text-sm sm:text-base font-bold text-emerald-400 break-all select-all py-1">
              {generatedCommand}
            </p>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Notación Simbólica:</span>
              <span className="text-amber-400 font-bold tracking-widest">{currentSymbolic}</span>
            </div>
          </Card>

          {/* Dangerous Permission Warning */}
          {explanation.isDangerous && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-2xl text-rose-800 dark:text-rose-200 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Advertencia de Seguridad</p>
                <p className="text-[11px] leading-relaxed opacity-90 mt-0.5">
                  El permiso de escritura para &quot;Otros&quot; permite que cualquier usuario del sistema modifique o elimine este archivo. Evita 777 en servidores de producción.
                </p>
              </div>
            </div>
          )}

          {/* Explanations in Spanish */}
          <Card className="p-4 sm:p-5 space-y-3 text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-500 block">
              Significado en Español Claro
            </span>

            <div className="space-y-2">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <strong className="text-slate-700 dark:text-slate-200 block mb-0.5">Propietario:</strong>
                <p className="text-slate-500 dark:text-slate-400">{explanation.userSummary}</p>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <strong className="text-slate-700 dark:text-slate-200 block mb-0.5">Miembros del Grupo:</strong>
                <p className="text-slate-500 dark:text-slate-400">{explanation.groupSummary}</p>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <strong className="text-slate-700 dark:text-slate-200 block mb-0.5">Cualquier Otro Usuario:</strong>
                <p className="text-slate-500 dark:text-slate-400">{explanation.othersSummary}</p>
              </div>

              {explanation.specialSummary && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200">
                  <strong>Especiales activos:</strong> {explanation.specialSummary}
                </div>
              )}
            </div>
          </Card>

          {/* Presets List */}
          <Card className="p-4 sm:p-5 space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Presets de Permisos Frecuentes
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CHMOD_PRESETS.map((p) => (
                <button
                  key={p.octal}
                  onClick={() => handleSelectPreset(p.octal)}
                  className={`p-2 rounded-xl border text-left cursor-pointer transition ${
                    currentOctal === p.octal
                      ? 'border-[var(--accent-color)] bg-[var(--accent-subtle)] font-bold text-[var(--accent-text)]'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-mono text-xs font-bold">{p.octal}</span>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{p.name}</p>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Mini Umask Calculator */}
      <Card className="p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FolderLock className="w-4 h-4 text-[var(--accent-text)]" />
              Calculadora de Umask (Permisos por Defecto de Creación)
            </h3>
            <p className="text-xs text-slate-500">
              Determina los permisos automáticos que el sistema asignará a nuevos archivos (base 0666) y carpetas (base 0777).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Valor umask:</span>
            <input
              type="text"
              maxLength={3}
              value={umaskInput}
              onChange={(e) => setUmaskInput(e.target.value)}
              placeholder="022"
              className="w-16 p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-center font-mono text-xs font-bold"
            />
          </div>
        </div>

        {umaskResult && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-sans font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Nuevos Archivos (Base 0666 &amp; ~{umaskResult.umaskOctal}):
              </span>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                Octal: {umaskResult.fileOctal} • Simbólico: {umaskResult.fileSymbolic}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-sans font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Nuevas Carpetas (Base 0777 &amp; ~{umaskResult.umaskOctal}):
              </span>
              <p className="text-base font-bold text-[var(--accent-text)]">
                Octal: {umaskResult.dirOctal} • Simbólico: {umaskResult.dirSymbolic}
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
