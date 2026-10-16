import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  KeyRound,
  Shield,
  RotateCw,
  Copy,
  Eye,
  EyeOff,
  History,
  Sliders,
  Check,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { CopyButton } from '../../ui/CopyButton';
import { useToast } from '../../ui/Toast';
import { PASSPHRASE_WORDS_ES } from '../../../data/passphraseWords';

// Cryptographically secure random integer in range [0, max)
function getSecureRandomInt(max: number): number {
  if (max <= 0) return 0;
  const array = new Uint32Array(1);
  const maxUint32 = 0xffffffff;
  const limit = maxUint32 - (maxUint32 % max);
  let val: number;
  do {
    crypto.getRandomValues(array);
    val = array[0];
  } while (val >= limit);
  return val % max;
}

export default function PasswordGenerator() {
  const [mode, setMode] = useState<'password' | 'passphrase'>('password');

  // Password options
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [noRepeat, setNoRepeat] = useState(false);

  // Passphrase options
  const [wordCount, setWordCount] = useState(4);
  const [separator, setSeparator] = useState('-');
  const [capitalizeWords, setCapitalizeWords] = useState(true);
  const [appendNumber, setAppendNumber] = useState(true);

  // Batch & visibility
  const [batchCount, setBatchCount] = useState(1);
  const [showPasswords, setShowPasswords] = useState(true);
  const [generatedList, setGeneratedList] = useState<string[]>([]);

  // Session-only history (never in localStorage for security)
  const [sessionHistory, setSessionHistory] = useState<string[]>([]);
  const { success } = useToast();

  // Character sets
  const charPool = useMemo(() => {
    let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let lower = 'abcdefghijklmnopqrstuvwxyz';
    let numbers = '0123456789';
    let symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (excludeAmbiguous) {
      upper = upper.replace(/[OI]/g, '');
      lower = lower.replace(/[ol]/g, '');
      numbers = numbers.replace(/[01]/g, '');
    }

    let pool = '';
    const guaranteed: string[] = [];

    if (useUpper && upper) {
      pool += upper;
      guaranteed.push(upper[getSecureRandomInt(upper.length)]);
    }
    if (useLower && lower) {
      pool += lower;
      guaranteed.push(lower[getSecureRandomInt(lower.length)]);
    }
    if (useNumbers && numbers) {
      pool += numbers;
      guaranteed.push(numbers[getSecureRandomInt(numbers.length)]);
    }
    if (useSymbols && symbols) {
      pool += symbols;
      guaranteed.push(symbols[getSecureRandomInt(symbols.length)]);
    }

    return { pool, guaranteed };
  }, [useUpper, useLower, useNumbers, useSymbols, excludeAmbiguous]);

  // Generate single password
  const generateOnePassword = useCallback((): string => {
    const { pool } = charPool;
    if (!pool) return '';

    const effectiveLength = noRepeat ? Math.min(length, pool.length) : length;
    const availablePool = pool.split('');
    const resultChars: string[] = [];

    for (let i = 0; i < effectiveLength; i++) {
      if (noRepeat) {
        if (availablePool.length === 0) break;
        const idx = getSecureRandomInt(availablePool.length);
        resultChars.push(availablePool[idx]);
        availablePool.splice(idx, 1);
      } else {
        const idx = getSecureRandomInt(pool.length);
        resultChars.push(pool[idx]);
      }
    }

    return resultChars.join('');
  }, [charPool, length, noRepeat]);

  // Generate single passphrase
  const generateOnePassphrase = useCallback((): string => {
    const words: string[] = [];
    const totalWords = PASSPHRASE_WORDS_ES.length;

    for (let i = 0; i < wordCount; i++) {
      let word = PASSPHRASE_WORDS_ES[getSecureRandomInt(totalWords)];
      if (capitalizeWords) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      words.push(word);
    }

    let result = words.join(separator);
    if (appendNumber) {
      const rndNum = getSecureRandomInt(90) + 10; // 2 digits
      result += separator + rndNum;
    }

    return result;
  }, [wordCount, separator, capitalizeWords, appendNumber]);

  // Main generator trigger
  const generate = useCallback(() => {
    const newList: string[] = [];
    for (let i = 0; i < batchCount; i++) {
      const pwd = mode === 'password' ? generateOnePassword() : generateOnePassphrase();
      if (pwd) newList.push(pwd);
    }

    setGeneratedList(newList);
    if (newList.length > 0) {
      setSessionHistory((prev) => [...newList, ...prev].slice(0, 30));
    }
  }, [batchCount, mode, generateOnePassword, generateOnePassphrase]);

  useEffect(() => {
    generate();
  }, [generate]);

  // Calculate entropy & crack time
  const primaryPassword = generatedList[0] || '';

  const strength = useMemo(() => {
    let entropy = 0;

    if (mode === 'password') {
      const poolSize = charPool.pool.length || 1;
      entropy = primaryPassword.length * Math.log2(poolSize);
    } else {
      // Passphrase entropy
      const baseCombinations = Math.pow(PASSPHRASE_WORDS_ES.length, wordCount);
      entropy = Math.log2(baseCombinations) + (appendNumber ? Math.log2(90) : 0);
    }

    // Estimate crack time assuming 100 billion guesses / sec (modern GPU cluster)
    const guessesPerSec = 1e11;
    const secondsToCrack = Math.pow(2, entropy - 1) / guessesPerSec;

    let crackTime = '';
    if (secondsToCrack < 1) crackTime = 'Menos de un segundo';
    else if (secondsToCrack < 60) crackTime = `${Math.round(secondsToCrack)} segundos`;
    else if (secondsToCrack < 3600) crackTime = `${Math.round(secondsToCrack / 60)} minutos`;
    else if (secondsToCrack < 86400) crackTime = `${Math.round(secondsToCrack / 3600)} horas`;
    else if (secondsToCrack < 31536000) crackTime = `${Math.round(secondsToCrack / 86400)} días`;
    else if (secondsToCrack < 31536000 * 1000)
      crackTime = `${Math.round(secondsToCrack / 31536000)} años`;
    else if (secondsToCrack < 31536000 * 1e6)
      crackTime = `${Math.round(secondsToCrack / (31536000 * 1000))} milenios`;
    else crackTime = 'Millones de años';

    let label = 'Muy débil';
    let color = 'bg-rose-500';
    let textColor = 'text-rose-500';
    let percent = 20;

    if (entropy >= 80) {
      label = 'Excelente / Militar';
      color = 'bg-emerald-500';
      textColor = 'text-emerald-500';
      percent = 100;
    } else if (entropy >= 60) {
      label = 'Muy Fuerte';
      color = 'bg-emerald-400';
      textColor = 'text-emerald-500';
      percent = 80;
    } else if (entropy >= 45) {
      label = 'Buena';
      color = 'bg-amber-500';
      textColor = 'text-amber-500';
      percent = 60;
    } else if (entropy >= 30) {
      label = 'Moderada';
      color = 'bg-amber-400';
      textColor = 'text-amber-500';
      percent = 40;
    }

    return {
      entropy: Math.round(entropy),
      crackTime,
      label,
      color,
      textColor,
      percent,
    };
  }, [mode, charPool.pool.length, primaryPassword.length, wordCount, appendNumber]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[var(--accent-text)]" />
            Generador de Contraseñas y Frases Seguras
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generación criptográfica con crypto.getRandomValues, medidor de entropía y modo frase de paso.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            onClick={() => setMode('password')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === 'password'
                ? 'bg-white dark:bg-slate-900 text-[var(--accent-text)] shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Contraseña
          </button>
          <button
            onClick={() => setMode('passphrase')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === 'passphrase'
                ? 'bg-white dark:bg-slate-900 text-[var(--accent-text)] shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Frase de paso (Passphrase)
          </button>
        </div>
      </div>

      {/* Main Display: Generated Password Card */}
      <Card className="p-5 sm:p-6 space-y-4 bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Contraseña generada
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPasswords(!showPasswords)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition rounded-lg"
              title={showPasswords ? 'Ocultar' : 'Mostrar'}
            >
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <Button
              size="sm"
              variant="outline"
              icon={<RotateCw className="w-3.5 h-3.5" />}
              onClick={generate}
            >
              Nueva
            </Button>
            <CopyButton text={primaryPassword} size="sm" variant="primary" label="Copiar" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800">
          <p className="font-mono text-base sm:text-xl font-bold tracking-wider text-slate-900 dark:text-slate-100 break-all select-all text-center">
            {showPasswords
              ? primaryPassword
              : '•'.repeat(Math.min(primaryPassword.length, 32))}
          </p>
        </div>

        {/* Strength Meter */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Fortaleza: <strong className={strength.textColor}>{strength.label}</strong> ({strength.entropy} bits)
            </span>
            <span className="text-slate-500">
              Tiempo estimado para descifrar: <strong>{strength.crackTime}</strong>
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${strength.color} transition-all duration-300 rounded-full`}
              style={{ width: `${strength.percent}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Options Panel: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Parámetros de configuración
            </h3>

            {mode === 'password' ? (
              <div className="space-y-4">
                {/* Length slider & number */}
                <div>
                  <div className="flex justify-between items-center text-xs font-bold mb-2">
                    <span className="text-slate-700 dark:text-slate-300">Longitud de caracteres</span>
                    <input
                      type="number"
                      min="4"
                      max="64"
                      value={length}
                      onChange={(e) => setLength(Math.max(4, Math.min(64, Number(e.target.value) || 4)))}
                      className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-bold text-xs"
                    />
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="64"
                    value={length}
                    onChange={(e) => setLength(Number(e.target.value))}
                    className="w-full accent-[var(--accent-color)]"
                  />
                </div>

                {/* Character Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useUpper}
                      onChange={(e) => setUseUpper(e.target.checked)}
                      className="rounded accent-[var(--accent-color)]"
                    />
                    <span>Mayúsculas (A-Z)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useLower}
                      onChange={(e) => setUseLower(e.target.checked)}
                      className="rounded accent-[var(--accent-color)]"
                    />
                    <span>Minúsculas (a-z)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useNumbers}
                      onChange={(e) => setUseNumbers(e.target.checked)}
                      className="rounded accent-[var(--accent-color)]"
                    />
                    <span>Números (0-9)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useSymbols}
                      onChange={(e) => setUseSymbols(e.target.checked)}
                      className="rounded accent-[var(--accent-color)]"
                    />
                    <span>Símbolos (!@#$%^&*)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={excludeAmbiguous}
                      onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                      className="rounded accent-[var(--accent-color)]"
                    />
                    <span>Excluir ambiguos (0, O, 1, l, I)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noRepeat}
                      onChange={(e) => setNoRepeat(e.target.checked)}
                      className="rounded accent-[var(--accent-color)]"
                    />
                    <span>No repetir caracteres</span>
                  </label>
                </div>
              </div>
            ) : (
              /* Passphrase options */
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center text-xs font-bold mb-2">
                    <span className="text-slate-700 dark:text-slate-300">Cantidad de palabras: {wordCount}</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="8"
                    value={wordCount}
                    onChange={(e) => setWordCount(Number(e.target.value))}
                    className="w-full accent-[var(--accent-color)]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Separador
                    </label>
                    <select
                      value={separator}
                      onChange={(e) => setSeparator(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    >
                      <option value="-">Guion (-)</option>
                      <option value="_">Guion bajo (_)</option>
                      <option value=".">Punto (.)</option>
                      <option value=" ">Espacio</option>
                      <option value="/">Barra (/)</option>
                    </select>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={capitalizeWords}
                        onChange={(e) => setCapitalizeWords(e.target.checked)}
                        className="rounded accent-[var(--accent-color)]"
                      />
                      <span>Capitalizar palabras</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={appendNumber}
                        onChange={(e) => setAppendNumber(e.target.checked)}
                        className="rounded accent-[var(--accent-color)]"
                      />
                      <span>Añadir número aleatorio</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Batch Count */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Generar en lote: {batchCount} a la vez
              </span>
              <input
                type="range"
                min="1"
                max="20"
                value={batchCount}
                onChange={(e) => setBatchCount(Number(e.target.value))}
                className="w-36 accent-[var(--accent-color)]"
              />
            </div>
          </Card>
        </div>

        {/* Batch Output & Session History */}
        <div className="lg:col-span-5 space-y-4">
          {batchCount > 1 && (
            <Card className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Lote de {generatedList.length} contraseñas
                </span>
                <CopyButton
                  text={generatedList.join('\n')}
                  size="sm"
                  label="Copiar todas"
                />
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {generatedList.map((pwd, idx) => (
                  <div
                    key={`${pwd}-${idx}`}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <span className="font-mono text-slate-800 dark:text-slate-200 truncate mr-2 select-all">
                      {showPasswords ? pwd : '•'.repeat(Math.min(pwd.length, 20))}
                    </span>
                    <CopyButton text={pwd} size="sm" variant="ghost" label="" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Session History (In-Memory Only) */}
          <Card className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Historial de esta sesión (no se almacena)
              </span>
              {sessionHistory.length > 0 && (
                <button
                  onClick={() => setSessionHistory([])}
                  className="text-xs text-rose-500 hover:underline"
                >
                  Vaciar
                </button>
              )}
            </div>

            {sessionHistory.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Las contraseñas generadas en esta sesión aparecerán aquí para tu conveniencia.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {sessionHistory.slice(0, 8).map((pwd, idx) => (
                  <div
                    key={`${pwd}-${idx}`}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <span className="font-mono text-slate-700 dark:text-slate-300 truncate mr-2 select-all">
                      {showPasswords ? pwd : '•'.repeat(Math.min(pwd.length, 16))}
                    </span>
                    <CopyButton text={pwd} size="sm" variant="ghost" label="" />
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
