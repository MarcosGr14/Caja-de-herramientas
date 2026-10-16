import React, { useState, useMemo, useCallback } from 'react';
import {
  Cpu,
  Binary,
  Layers,
  Calculator,
  Compass,
  Type,
  Copy,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Check,
  Search,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Tabs } from '../../ui/Tabs';
import { Button } from '../../ui/Button';
import { CopyButton } from '../../ui/CopyButton';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useToast } from '../../ui/Toast';
import {
  BASE_CHARS,
  validateForBase,
  bigIntToBase,
  baseToBigInt,
  fractionalToBase,
  baseToFractional,
  formatBitGroups,
  toExactBitString,
  toSigned,
  computeBitwiseOp,
  computeComplements,
  decodeTwosComplement,
  stepBinaryAddition,
  stepBinaryMultiplication,
  numberToIEEE754,
  ieee754ToNumber,
  ASCII_CONTROL_NAMES,
} from '../../../utils/baseBitUtils';

type TabId = 'bases' | 'bitwise' | 'complements' | 'arithmetic' | 'ieee754' | 'ascii';

export default function BaseBitCalculator() {
  const [activeTab, setActiveTab] = useLocalStorage<TabId>('app-basebit-tab', 'bases');
  const { success, error: toastError } = useToast();

  // ----------------------------------------------------
  // TAB 1: CONVERSOR DE BASES
  // ----------------------------------------------------
  const [baseInput, setBaseInput] = useState('255');
  const [activeInputBase, setActiveInputBase] = useState<number>(10);
  const [customBase, setCustomBase] = useState<number>(12);
  const [includeFractions, setIncludeFractions] = useState(false);
  const [fractionInput, setFractionInput] = useState('');
  const [bitGrouping, setBitGrouping] = useState<4 | 8>(4);
  const [hexUppercase, setHexUppercase] = useState(true);
  const [showPrefixes, setShowPrefixes] = useState(false);

  // Validation
  const validation = useMemo(() => {
    return validateForBase(baseInput, activeInputBase);
  }, [baseInput, activeInputBase]);

  // Convert to BigInt & fractional decimal
  const parsedValue = useMemo(() => {
    if (!validation.isValid) return null;
    const intPart = baseToBigInt(baseInput, activeInputBase);
    let fracPart = 0;
    if (includeFractions && fractionInput.trim()) {
      fracPart = baseToFractional(fractionInput, activeInputBase);
    }
    return { intPart: intPart ?? 0n, fracPart };
  }, [baseInput, activeInputBase, validation.isValid, includeFractions, fractionInput]);

  // Target base outputs
  const baseOutputs = useMemo(() => {
    if (!parsedValue) {
      return { bin: '', oct: '', dec: '', hex: '', custom: '' };
    }
    const { intPart, fracPart } = parsedValue;

    const formatOutput = (radix: number, prefix: string, isHex = false) => {
      let s = bigIntToBase(intPart, radix);
      if (isHex && !hexUppercase) s = s.toLowerCase();
      if (includeFractions && fracPart > 0) {
        const fStr = fractionalToBase(fracPart, radix, 12);
        if (fStr) s += '.' + (isHex && !hexUppercase ? fStr.toLowerCase() : fStr);
      }
      return showPrefixes ? prefix + s : s;
    };

    return {
      bin: formatOutput(2, '0b'),
      oct: formatOutput(8, '0o'),
      dec: formatOutput(10, ''),
      hex: formatOutput(16, '0x', true),
      custom: formatOutput(customBase, `base${customBase}:`),
    };
  }, [parsedValue, customBase, hexUppercase, showPrefixes, includeFractions]);

  // ----------------------------------------------------
  // TAB 2: BIT A BIT
  // ----------------------------------------------------
  const [bitWidth, setBitWidth] = useState<8 | 16 | 32 | 64>(8);
  const [bitAInput, setBitAInput] = useState('170'); // 10101010 in 8-bit
  const [bitBInput, setBitBInput] = useState('85');  // 01010101 in 8-bit
  const [inputBaseMode, setInputBaseMode] = useState<'dec' | 'hex' | 'bin'>('dec');
  const [selectedBitwiseOp, setSelectedBitwiseOp] = useState<
    'AND' | 'OR' | 'XOR' | 'NOT' | 'NAND' | 'NOR' | 'XNOR' | 'SHL' | 'SHR_A' | 'SHR_L' | 'ROTL' | 'ROTR'
  >('AND');

  const parseBitOperand = (valStr: string) => {
    try {
      const clean = valStr.trim();
      if (inputBaseMode === 'hex') return BigInt('0x' + (clean || '0'));
      if (inputBaseMode === 'bin') return BigInt('0b' + (clean || '0'));
      return BigInt(clean || '0');
    } catch {
      return 0n;
    }
  };

  const operandA = useMemo(() => parseBitOperand(bitAInput), [bitAInput, inputBaseMode]);
  const operandB = useMemo(() => parseBitOperand(bitBInput), [bitBInput, inputBaseMode]);

  const bitwiseResult = useMemo(() => {
    return computeBitwiseOp(selectedBitwiseOp, operandA, operandB, bitWidth);
  }, [selectedBitwiseOp, operandA, operandB, bitWidth]);

  const aBitString = useMemo(() => toExactBitString(operandA, bitWidth), [operandA, bitWidth]);
  const bBitString = useMemo(() => toExactBitString(operandB, bitWidth), [operandB, bitWidth]);

  // Invert bit on click
  const handleToggleBitA = (idx: number) => {
    const bitPos = BigInt(bitWidth - 1 - idx);
    const toggled = operandA ^ (1n << bitPos);
    setBitAInput(inputBaseMode === 'hex' ? toggled.toString(16) : inputBaseMode === 'bin' ? toggled.toString(2) : toggled.toString(10));
  };
  const handleToggleBitB = (idx: number) => {
    const bitPos = BigInt(bitWidth - 1 - idx);
    const toggled = operandB ^ (1n << bitPos);
    setBitBInput(inputBaseMode === 'hex' ? toggled.toString(16) : inputBaseMode === 'bin' ? toggled.toString(2) : toggled.toString(10));
  };

  // ----------------------------------------------------
  // TAB 3: COMPLEMENTO A 1 Y A 2
  // ----------------------------------------------------
  const [compWidth, setCompWidth] = useState<4 | 8 | 16 | 32 | 64>(8);
  const [compDecInput, setCompDecInput] = useState('-42');
  const [reverseBitsInput, setReverseBitsInput] = useState('11010110');

  const compVal = useMemo(() => {
    try {
      return BigInt(compDecInput.trim() || '0');
    } catch {
      return 0n;
    }
  }, [compDecInput]);

  const complementData = useMemo(() => {
    return computeComplements(compVal, compWidth);
  }, [compVal, compWidth]);

  const reverseDecoded = useMemo(() => {
    try {
      return decodeTwosComplement(reverseBitsInput);
    } catch {
      return 0n;
    }
  }, [reverseBitsInput]);

  // ----------------------------------------------------
  // TAB 4: ARITMÉTICA BINARIA
  // ----------------------------------------------------
  const [arithA, setArithA] = useState('1011'); // 11
  const [arithB, setArithB] = useState('0101'); // 5
  const [arithWidth, setArithWidth] = useState<number>(8);
  const [arithOp, setArithOp] = useState<'add' | 'sub' | 'mul' | 'div'>('add');
  const [arithSigned, setArithSigned] = useState(false);

  const parsedArithA = useMemo(() => {
    try {
      return BigInt('0b' + (arithA.replace(/\s/g, '') || '0'));
    } catch {
      return 0n;
    }
  }, [arithA]);

  const parsedArithB = useMemo(() => {
    try {
      return BigInt('0b' + (arithB.replace(/\s/g, '') || '0'));
    } catch {
      return 0n;
    }
  }, [arithB]);

  const addStep = useMemo(() => {
    return stepBinaryAddition(parsedArithA, parsedArithB, arithWidth, arithSigned);
  }, [parsedArithA, parsedArithB, arithWidth, arithSigned]);

  const mulStep = useMemo(() => {
    return stepBinaryMultiplication(parsedArithA, parsedArithB, arithWidth);
  }, [parsedArithA, parsedArithB, arithWidth]);

  // ----------------------------------------------------
  // TAB 5: IEEE 754
  // ----------------------------------------------------
  const [floatDecInput, setFloatDecInput] = useState('0.1');
  const [floatPrecision, setFloatPrecision] = useState<32 | 64>(32);
  const [floatHexInput, setFloatHexInput] = useState('3DCCCCCD');

  const ieeeData = useMemo(() => {
    const num = parseFloat(floatDecInput) || 0;
    return numberToIEEE754(num, floatPrecision);
  }, [floatDecInput, floatPrecision]);

  const decodedFloat = useMemo(() => {
    return ieee754ToNumber(floatHexInput, floatPrecision);
  }, [floatHexInput, floatPrecision]);

  // ----------------------------------------------------
  // TAB 6: ASCII / UNICODE
  // ----------------------------------------------------
  const [charInput, setCharInput] = useState('Ñ');
  const [asciiSearch, setAsciiSearch] = useState('');

  const charAnalysis = useMemo(() => {
    if (!charInput) return null;
    const codePoint = charInput.codePointAt(0) || 0;
    const utf8Bytes = Array.from(new TextEncoder().encode(charInput)).map((b) =>
      b.toString(16).padStart(2, '0').toUpperCase()
    );
    const utf16Units = [];
    for (let i = 0; i < charInput.length; i++) {
      utf16Units.push('0x' + charInput.charCodeAt(i).toString(16).padStart(4, '0').toUpperCase());
    }

    return {
      char: charInput,
      codePoint,
      dec: codePoint.toString(10),
      hex: 'U+' + codePoint.toString(16).padStart(4, '0').toUpperCase(),
      bin: codePoint.toString(2).padStart(8, '0'),
      utf8Hex: utf8Bytes.map((b) => `0x${b}`).join(' '),
      utf16Hex: utf16Units.join(' '),
      isAstral: codePoint > 0xffff,
    };
  }, [charInput]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[var(--accent-text)]" />
            Calculadora de Bases, Bits y Arquitectura
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Conversor binario/hex/dec, operaciones lógicas, complementos a 1 y 2, IEEE 754 y ASCII.
          </p>
        </div>

        <Tabs
          tabs={[
            { id: 'bases', label: 'Conversor de Bases' },
            { id: 'bitwise', label: 'Bit a Bit' },
            { id: 'complements', label: 'Complemento 1 y 2' },
            { id: 'arithmetic', label: 'Aritmética' },
            { id: 'ieee754', label: 'IEEE 754' },
            { id: 'ascii', label: 'ASCII / Unicode' },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as TabId)}
        />
      </div>

      {/* ---------------- PESTAÑA 1: CONVERSOR DE BASES ---------------- */}
      {activeTab === 'bases' && (
        <div className="space-y-6">
          <Card className="p-4 sm:p-5 space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeFractions}
                    onChange={(e) => setIncludeFractions(e.target.checked)}
                    className="rounded accent-[var(--accent-color)]"
                  />
                  <span>Parte fraccionaria (decimales)</span>
                </label>

                <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPrefixes}
                    onChange={(e) => setShowPrefixes(e.target.checked)}
                    className="rounded accent-[var(--accent-color)]"
                  />
                  <span>Prefijos (0b, 0o, 0x)</span>
                </label>

                <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hexUppercase}
                    onChange={(e) => setHexUppercase(e.target.checked)}
                    className="rounded accent-[var(--accent-color)]"
                  />
                  <span>HEX en MAYÚSCULAS</span>
                </label>
              </div>

              {/* Quick Examples */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Ejemplos:</span>
                {[
                  { label: '255', val: '255', base: 10 },
                  { label: '1024', val: '1024', base: 10 },
                  { label: '0xFF', val: 'FF', base: 16 },
                  { label: '0b1010', val: '1010', base: 2 },
                ].map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => {
                      setActiveInputBase(ex.base);
                      setBaseInput(ex.val);
                      setFractionInput('');
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-mono"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Validation Alert */}
            {!validation.isValid && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-200 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>
                  Caracteres inválidos para la base {activeInputBase}: <strong>{validation.invalidChars.join(', ')}</strong>. Solo se permiten dígitos de 0 a {BASE_CHARS[activeInputBase - 1]}.
                </span>
              </div>
            )}

            {/* Synchronized Base Fields */}
            <div className="space-y-3">
              {/* Decimal */}
              <BaseInputRow
                label="Decimal (Base 10)"
                base={10}
                value={activeInputBase === 10 ? baseInput : baseOutputs.dec}
                isActive={activeInputBase === 10}
                onFocus={() => setActiveInputBase(10)}
                onChange={(v) => setBaseInput(v)}
              />

              {/* Hexadecimal */}
              <BaseInputRow
                label="Hexadecimal (Base 16)"
                base={16}
                value={activeInputBase === 16 ? baseInput : baseOutputs.hex}
                isActive={activeInputBase === 16}
                onFocus={() => setActiveInputBase(16)}
                onChange={(v) => setBaseInput(v)}
              />

              {/* Binary */}
              <BaseInputRow
                label="Binario (Base 2)"
                base={2}
                value={
                  activeInputBase === 2
                    ? baseInput
                    : formatBitGroups(baseOutputs.bin, bitGrouping)
                }
                isActive={activeInputBase === 2}
                onFocus={() => setActiveInputBase(2)}
                onChange={(v) => setBaseInput(v)}
                extraAction={
                  <button
                    onClick={() => setBitGrouping(bitGrouping === 4 ? 8 : 4)}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                    title="Alternar grupos de 4 u 8 bits"
                  >
                    Agrupar en {bitGrouping}
                  </button>
                }
              />

              {/* Octal */}
              <BaseInputRow
                label="Octal (Base 8)"
                base={8}
                value={activeInputBase === 8 ? baseInput : baseOutputs.oct}
                isActive={activeInputBase === 8}
                onFocus={() => setActiveInputBase(8)}
                onChange={(v) => setBaseInput(v)}
              />

              {/* Custom Base */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Base personalizada:</span>
                    <input
                      type="number"
                      min="2"
                      max="36"
                      value={customBase}
                      onChange={(e) => setCustomBase(Math.max(2, Math.min(36, Number(e.target.value) || 2)))}
                      className="w-14 px-2 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-center text-xs"
                    />
                    <span className="text-slate-400 font-mono">(2 a 36)</span>
                  </div>
                  <CopyButton text={baseOutputs.custom} size="sm" label="Copiar" />
                </div>
                <input
                  type="text"
                  value={activeInputBase === customBase ? baseInput : baseOutputs.custom}
                  onFocus={() => setActiveInputBase(customBase)}
                  onChange={(e) => setBaseInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm font-bold text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------- PESTAÑA 2: BIT A BIT ---------------- */}
      {activeTab === 'bitwise' && (
        <div className="space-y-6">
          <Card className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Ancho de palabra:</span>
                {[8, 16, 32, 64].map((w) => (
                  <button
                    key={w}
                    onClick={() => setBitWidth(w as any)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      bitWidth === w
                        ? 'bg-[var(--accent-color)] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {w} bits
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Formato de entrada:</span>
                {(['dec', 'hex', 'bin'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setInputBaseMode(fmt)}
                    className={`px-2 py-0.5 rounded-md font-bold text-xs uppercase ${
                      inputBaseMode === fmt
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Operands Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Operando A ({inputBaseMode.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={bitAInput}
                  onChange={(e) => setBitAInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Operando B ({inputBaseMode.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={bitBInput}
                  onChange={(e) => setBitBInput(e.target.value)}
                  disabled={selectedBitwiseOp === 'NOT'}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm font-bold disabled:opacity-40"
                />
              </div>
            </div>

            {/* Operations Pills */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Operación Lógica
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(['AND', 'OR', 'XOR', 'NOT', 'NAND', 'NOR', 'XNOR', 'SHL', 'SHR_L', 'SHR_A', 'ROTL', 'ROTR'] as const).map(
                  (op) => (
                    <button
                      key={op}
                      onClick={() => setSelectedBitwiseOp(op)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                        selectedBitwiseOp === op
                          ? 'bg-[var(--accent-color)] text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {op}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Interactive Vertical Bit Alignment Table */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl overflow-x-auto font-mono text-xs space-y-2">
              <p className="text-[11px] text-slate-400 mb-2">
                Haz clic sobre cualquier bit de A o B para alternarlo (0 ↔ 1):
              </p>

              {/* Row A */}
              <div className="flex items-center gap-1.5">
                <span className="w-12 text-slate-400 shrink-0 font-bold">A:</span>
                <div className="flex gap-1">
                  {aBitString.split('').map((b, idx) => (
                    <button
                      key={`a-${idx}`}
                      onClick={() => handleToggleBitA(idx)}
                      className={`w-6 h-7 rounded flex items-center justify-center font-bold text-xs transition cursor-pointer ${
                        b === '1' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row B (if not unary NOT) */}
              {selectedBitwiseOp !== 'NOT' && (
                <div className="flex items-center gap-1.5">
                  <span className="w-12 text-slate-400 shrink-0 font-bold">B:</span>
                  <div className="flex gap-1">
                    {bBitString.split('').map((b, idx) => (
                      <button
                        key={`b-${idx}`}
                        onClick={() => handleToggleBitB(idx)}
                        className={`w-6 h-7 rounded flex items-center justify-center font-bold text-xs transition cursor-pointer ${
                          b === '1' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-slate-700 my-1 ml-14" />

              {/* Result Row */}
              <div className="flex items-center gap-1.5">
                <span className="w-12 text-amber-400 shrink-0 font-bold">{selectedBitwiseOp}:</span>
                <div className="flex gap-1">
                  {bitwiseResult.bitString.split('').map((b, idx) => (
                    <div
                      key={`res-${idx}`}
                      className={`w-6 h-7 rounded flex items-center justify-center font-bold text-xs ${
                        b === '1' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800/80 text-slate-500'
                      }`}
                    >
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Results in Multiple Formats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 font-bold">Hexadecimal</span>
                <p className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  0x{bitwiseResult.result.toString(16).toUpperCase()}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 font-bold">Dec (Sin signo)</span>
                <p className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {bitwiseResult.result.toString()}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 font-bold">Dec (Con signo C2)</span>
                <p className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {toSigned(bitwiseResult.result, bitWidth).toString()}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <span className="text-slate-400 font-bold">Copiar resultado</span>
                <CopyButton text={bitwiseResult.bitString} size="sm" label="Copiar bits" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------- PESTAÑA 3: COMPLEMENTO A 1 Y A 2 ---------------- */}
      {activeTab === 'complements' && (
        <div className="space-y-6">
          <Card className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Ancho en bits:</span>
                {[4, 8, 16, 32, 64].map((w) => (
                  <button
                    key={w}
                    onClick={() => setCompWidth(w as any)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      compWidth === w
                        ? 'bg-[var(--accent-color)] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {w} bits
                  </button>
                ))}
              </div>

              <span className="text-slate-400">
                Rango representable: <strong>[{complementData.minVal.toString()}, {complementData.maxVal.toString()}]</strong>
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Número decimal con o sin signo
              </label>
              <input
                type="text"
                value={compDecInput}
                onChange={(e) => setCompDecInput(e.target.value)}
                placeholder="-42 o 25"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm font-bold"
              />
            </div>

            {!complementData.inRange && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-200 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>
                  ¡Desbordamiento! El valor {compDecInput} no cabe en {compWidth} bits con signo (máx: {complementData.maxVal.toString()}, mín: {complementData.minVal.toString()}).
                </span>
              </div>
            )}

            {/* Complements Display */}
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-500 block">Signo y Magnitud</span>
                  <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                    <span className="text-rose-500">{complementData.signMagnitudeBits[0]}</span>{' '}
                    {complementData.signMagnitudeBits.slice(1)}
                  </span>
                </div>
                <CopyButton text={complementData.signMagnitudeBits} size="sm" />
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-500 block">Complemento a 1 (Bits invertidos si es negativo)</span>
                  <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                    {complementData.onesComplementBits}
                  </span>
                </div>
                <CopyButton text={complementData.onesComplementBits} size="sm" />
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-500 block">Complemento a 2 (Estándar computacional moderno)</span>
                  <span className="font-mono text-sm font-bold text-[var(--accent-text)]">
                    {complementData.twosComplementBits}
                  </span>
                  {complementData.twosSteps && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Paso 1: Invertir bits ({complementData.twosSteps.invertedBits}) → Paso 2: Sumar 1 ({complementData.twosSteps.addedOne})
                    </p>
                  )}
                </div>
                <CopyButton text={complementData.twosComplementBits} size="sm" variant="primary" />
              </div>
            </div>

            {/* Reverse Mode: Bits to 2's Complement Decimal */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Modo Inverso: Cadena de Bits a Decimal (C2)
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={reverseBitsInput}
                  onChange={(e) => setReverseBitsInput(e.target.value)}
                  placeholder="Pega una cadena binaria (ej. 11010110)..."
                  className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs"
                />
                <div className="p-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center">
                  Decimal: {reverseDecoded.toString()}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------- PESTAÑA 4: ARITMÉTICA BINARIA ---------------- */}
      {activeTab === 'arithmetic' && (
        <div className="space-y-6">
          <Card className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Operación:</span>
                {(['add', 'mul'] as const).map((op) => (
                  <button
                    key={op}
                    onClick={() => setArithOp(op)}
                    className={`px-3 py-1 rounded-xl font-bold uppercase transition ${
                      arithOp === op
                        ? 'bg-[var(--accent-color)] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {op === 'add' ? 'Suma (+)' : 'Multiplicación (×)'}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={arithSigned}
                  onChange={(e) => setArithSigned(e.target.checked)}
                  className="rounded accent-[var(--accent-color)]"
                />
                <span>Aritmética con signo (C2)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Número A (Binario)
                </label>
                <input
                  type="text"
                  value={arithA}
                  onChange={(e) => setArithA(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm font-bold"
                />
                <span className="text-[11px] text-slate-400">Decimal: {parsedArithA.toString()}</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Número B (Binario)
                </label>
                <input
                  type="text"
                  value={arithB}
                  onChange={(e) => setArithB(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm font-bold"
                />
                <span className="text-[11px] text-slate-400">Decimal: {parsedArithB.toString()}</span>
              </div>
            </div>

            {/* Notebook style step-by-step rendering */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl font-mono text-sm space-y-2 overflow-x-auto">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-2">
                Procedimiento estilo cuaderno
              </span>

              {arithOp === 'add' ? (
                <div className="space-y-1 w-max">
                  {/* Acarreos */}
                  <div className="text-rose-400 text-xs tracking-widest pl-12">
                    {addStep.carries} (Acarreos)
                  </div>
                  <div className="tracking-widest">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{addStep.aBits}
                  </div>
                  <div className="tracking-widest flex items-center">
                    <span className="text-amber-400 font-bold mr-2">+</span>
                    &nbsp;&nbsp;&nbsp;&nbsp;{addStep.bBits}
                  </div>
                  <div className="border-t border-slate-600 my-1 w-full" />
                  <div className="tracking-widest text-emerald-400 font-bold">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{addStep.sumBits}
                  </div>

                  {addStep.overflow && (
                    <div className="text-rose-400 text-xs mt-3 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>¡Desbordamiento (Overflow)! El resultado excede la capacidad del registro.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1 w-max">
                  <div className="tracking-widest">&nbsp;&nbsp;&nbsp;&nbsp;{mulStep.aBits}</div>
                  <div className="tracking-widest flex items-center">
                    <span className="text-amber-400 font-bold mr-2">×</span>
                    &nbsp;&nbsp;{mulStep.bBits}
                  </div>
                  <div className="border-t border-slate-600 my-1 w-full" />
                  {mulStep.partialProducts.map((p, idx) => (
                    <div key={idx} className="tracking-widest text-slate-400 text-xs">
                      {' '.repeat(p.shift)}
                      {p.bits}
                    </div>
                  ))}
                  <div className="border-t border-slate-600 my-1 w-full" />
                  <div className="tracking-widest text-emerald-400 font-bold">
                    {mulStep.resultBits}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ---------------- PESTAÑA 5: IEEE 754 ---------------- */}
      {activeTab === 'ieee754' && (
        <div className="space-y-6">
          <Card className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Precisión:</span>
                <button
                  onClick={() => setFloatPrecision(32)}
                  className={`px-3 py-1 rounded-xl font-bold transition ${
                    floatPrecision === 32
                      ? 'bg-[var(--accent-color)] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Simple (32 bits / float)
                </button>
                <button
                  onClick={() => setFloatPrecision(64)}
                  className={`px-3 py-1 rounded-xl font-bold transition ${
                    floatPrecision === 64
                      ? 'bg-[var(--accent-color)] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Doble (64 bits / double)
                </button>
              </div>

              <span className="text-slate-400">
                Tipo detectado: <strong className="text-[var(--accent-text)]">{ieeeData.specialType}</strong>
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Número Decimal Float
              </label>
              <input
                type="text"
                value={floatDecInput}
                onChange={(e) => setFloatDecInput(e.target.value)}
                placeholder="0.1, -125.75, 1e-10, Infinity..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm font-bold"
              />
            </div>

            {/* Colored Bit Fields Breakdown */}
            <div className="p-4 bg-slate-900 rounded-2xl text-white font-mono space-y-3 overflow-x-auto">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <span className="text-slate-400">Representación Hexadecimal:</span>
                <span className="text-amber-400 font-bold text-sm">0x{ieeeData.hex}</span>
              </div>

              {/* Bit blocks */}
              <div className="flex gap-2 text-xs">
                {/* Sign bit */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-rose-400 font-bold mb-1">Signo (1b)</span>
                  <div className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500 text-rose-300 font-bold">
                    {ieeeData.sign.bit}
                  </div>
                </div>

                {/* Exponent bits */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-sky-400 font-bold mb-1">
                    Exponente ({floatPrecision === 32 ? '8b' : '11b'})
                  </span>
                  <div className="px-3 py-1.5 rounded-lg bg-sky-500/20 border border-sky-500 text-sky-300 font-bold tracking-wider">
                    {ieeeData.exponent.bits}
                  </div>
                </div>

                {/* Mantissa bits */}
                <div className="flex flex-col items-center flex-1 min-w-[200px]">
                  <span className="text-[10px] text-emerald-400 font-bold mb-1">
                    Mantisa / Fracción ({floatPrecision === 32 ? '23b' : '52b'})
                  </span>
                  <div className="w-full px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500 text-emerald-300 font-bold tracking-wider truncate">
                    {ieeeData.mantissa.bits}
                  </div>
                </div>
              </div>

              {/* Exponent breakdown */}
              <div className="text-xs text-slate-400 space-y-1 pt-1">
                <p>
                  Exponente sesgado: <strong>{ieeeData.exponent.biased}</strong> — Sesgo:{' '}
                  <strong>{ieeeData.exponent.bias}</strong> = Exponente real:{' '}
                  <strong className="text-sky-300">{ieeeData.exponent.unbiased}</strong>
                </p>
                <p>
                  Valor exacto reconstruido en memoria: <strong>{ieeeData.reconstituted}</strong>
                </p>
                {ieeeData.representationError > 0 && (
                  <p className="text-amber-300">
                    Error de representación por precisión finita:{' '}
                    <strong>{ieeeData.representationError.toExponential(4)}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Reverse Decoder */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Decodificador Inverso: Hex o Bits a Decimal
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={floatHexInput}
                  onChange={(e) => setFloatHexInput(e.target.value)}
                  placeholder="3DCCCCCD o cadena de 32 bits"
                  className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs"
                />
                <div className="p-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center">
                  Resultado: {decodedFloat !== null ? decodedFloat.toString() : 'Inválido'}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------- PESTAÑA 6: ASCII / UNICODE ---------------- */}
      {activeTab === 'ascii' && (
        <div className="space-y-6">
          <Card className="p-4 sm:p-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Ingresa cualquier carácter o emoji (soporte multilingüe y plano astral)
              </label>
              <input
                type="text"
                value={charInput}
                onChange={(e) => setCharInput(e.target.value)}
                placeholder="A, ñ, 🚀, €, etc."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xl font-bold"
              />
            </div>

            {charAnalysis && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold">Code Point (Hex)</span>
                  <p className="font-mono text-sm font-bold text-[var(--accent-text)] mt-1">
                    {charAnalysis.hex}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold">Decimal</span>
                  <p className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {charAnalysis.dec}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold">Bytes UTF-8</span>
                  <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {charAnalysis.utf8Hex}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold">Unidades UTF-16</span>
                  <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                    {charAnalysis.utf16Hex}
                  </p>
                </div>
              </div>
            )}

            {/* Searchable ASCII 0-127 Table */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tabla de Códigos ASCII Estándar (0 a 127)
                </span>
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={asciiSearch}
                    onChange={(e) => setAsciiSearch(e.target.value)}
                    placeholder="Filtrar por nombre o hex..."
                    className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                  />
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 font-bold text-slate-500">
                    <tr>
                      <th className="p-2">Dec</th>
                      <th className="p-2">Hex</th>
                      <th className="p-2">Binario</th>
                      <th className="p-2">Glifo</th>
                      <th className="p-2">Descripción</th>
                      <th className="p-2 text-right">Copiar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {Array.from({ length: 128 }, (_, i) => i)
                      .filter((code) => {
                        if (!asciiSearch) return true;
                        const q = asciiSearch.toLowerCase();
                        const hex = code.toString(16);
                        const desc = ASCII_CONTROL_NAMES[code]?.desc || '';
                        const name = ASCII_CONTROL_NAMES[code]?.name || '';
                        return (
                          code.toString().includes(q) ||
                          hex.includes(q) ||
                          desc.toLowerCase().includes(q) ||
                          name.toLowerCase().includes(q)
                        );
                      })
                      .map((code) => {
                        const glyph = code <= 32 || code === 127 ? '' : String.fromCharCode(code);
                        const info = ASCII_CONTROL_NAMES[code];
                        return (
                          <tr key={code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2 font-bold text-slate-700 dark:text-slate-300">{code}</td>
                            <td className="p-2 text-slate-500">0x{code.toString(16).padStart(2, '0').toUpperCase()}</td>
                            <td className="p-2 text-slate-400">{code.toString(2).padStart(8, '0')}</td>
                            <td className="p-2 font-bold text-[var(--accent-text)]">{glyph || info?.name}</td>
                            <td className="p-2 text-slate-400 text-[11px] font-sans">{info?.desc || 'Carácter imprimible'}</td>
                            <td className="p-2 text-right">
                              <CopyButton
                                text={glyph || String.fromCharCode(code)}
                                size="sm"
                                variant="ghost"
                                label=""
                              />
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// Subcomponent for Base Row
function BaseInputRow({
  label,
  base,
  value,
  isActive,
  onFocus,
  onChange,
  extraAction,
}: {
  label: string;
  base: number;
  value: string;
  isActive: boolean;
  onFocus: () => void;
  onChange: (val: string) => void;
  extraAction?: React.ReactNode;
}) {
  return (
    <div
      className={`p-3 rounded-2xl border transition-all ${
        isActive
          ? 'bg-[var(--accent-subtle)]/40 border-[var(--accent-border)] ring-1 ring-[var(--accent-ring)]'
          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between text-xs mb-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-300">{label}</span>
          {extraAction}
        </div>
        <CopyButton text={value} size="sm" label="Copiar" />
      </div>
      <input
        type="text"
        value={value}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
      />
    </div>
  );
}
