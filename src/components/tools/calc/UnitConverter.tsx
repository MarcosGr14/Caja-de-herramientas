import React, { useState, useMemo } from 'react';
import {
  ArrowRightLeft,
  Scale,
  Ruler,
  Thermometer,
  Boxes,
  Compass,
  Gauge,
  Clock,
  HardDrive,
  Zap,
  Activity,
  Layers,
  Copy,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { CopyButton } from '../../ui/CopyButton';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

interface UnitDef {
  id: string;
  name: string;
  symbol: string;
  toBase: (val: number) => number;
  fromBase: (val: number) => number;
}

interface CategoryDef {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  units: UnitDef[];
}

const CATEGORIES: CategoryDef[] = [
  {
    id: 'longitud',
    name: 'Longitud',
    icon: Ruler,
    units: [
      { id: 'm', name: 'Metro', symbol: 'm', toBase: (v) => v, fromBase: (v) => v },
      { id: 'km', name: 'Kilómetro', symbol: 'km', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'cm', name: 'Centímetro', symbol: 'cm', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { id: 'mm', name: 'Milímetro', symbol: 'mm', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'mi', name: 'Milla', symbol: 'mi', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
      { id: 'yd', name: 'Yarda', symbol: 'yd', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      { id: 'ft', name: 'Pie', symbol: 'ft', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { id: 'in', name: 'Pulgada', symbol: 'in', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { id: 'nmi', name: 'Milla Náutica', symbol: 'NM', toBase: (v) => v * 1852, fromBase: (v) => v / 1852 },
    ],
  },
  {
    id: 'masa',
    name: 'Masa y Peso',
    icon: Scale,
    units: [
      { id: 'kg', name: 'Kilogramo', symbol: 'kg', toBase: (v) => v, fromBase: (v) => v },
      { id: 'g', name: 'Gramo', symbol: 'g', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'mg', name: 'Miligramo', symbol: 'mg', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      { id: 't', name: 'Tonelada Métrica', symbol: 't', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'lb', name: 'Libra', symbol: 'lb', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
      { id: 'oz', name: 'Onza', symbol: 'oz', toBase: (v) => v * 0.02834952, fromBase: (v) => v / 0.02834952 },
      { id: 'cwt', name: 'Quintal (100 lb)', symbol: 'cwt', toBase: (v) => v * 45.359237, fromBase: (v) => v / 45.359237 },
    ],
  },
  {
    id: 'temperatura',
    name: 'Temperatura',
    icon: Thermometer,
    units: [
      { id: 'c', name: 'Celsius', symbol: '°C', toBase: (v) => v, fromBase: (v) => v },
      { id: 'f', name: 'Fahrenheit', symbol: '°F', toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
      { id: 'k', name: 'Kelvin', symbol: 'K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
      { id: 'r', name: 'Rankine', symbol: '°R', toBase: (v) => ((v - 491.67) * 5) / 9, fromBase: (v) => (v + 273.15) * 1.8 },
    ],
  },
  {
    id: 'volumen',
    name: 'Volumen y Capacidad',
    icon: Boxes,
    units: [
      { id: 'l', name: 'Litro', symbol: 'L', toBase: (v) => v, fromBase: (v) => v },
      { id: 'ml', name: 'Mililitro', symbol: 'mL', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'm3', name: 'Metro Cúbico', symbol: 'm³', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'gal_us', name: 'Galón (EE.UU.)', symbol: 'gal', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
      { id: 'qt_us', name: 'Cuarto (EE.UU.)', symbol: 'qt', toBase: (v) => v * 0.946353, fromBase: (v) => v / 0.946353 },
      { id: 'pt_us', name: 'Pinta (EE.UU.)', symbol: 'pt', toBase: (v) => v * 0.473176, fromBase: (v) => v / 0.473176 },
      { id: 'cup_us', name: 'Taza', symbol: 'cup', toBase: (v) => v * 0.24, fromBase: (v) => v / 0.24 },
      { id: 'floz_us', name: 'Onza Líquida (EE.UU.)', symbol: 'fl oz', toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
    ],
  },
  {
    id: 'area',
    name: 'Área',
    icon: Layers,
    units: [
      { id: 'm2', name: 'Metro Cuadrado', symbol: 'm²', toBase: (v) => v, fromBase: (v) => v },
      { id: 'km2', name: 'Kilómetro Cuadrado', symbol: 'km²', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      { id: 'ha', name: 'Hectárea', symbol: 'ha', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
      { id: 'ac', name: 'Acre', symbol: 'ac', toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
      { id: 'sqft', name: 'Pie Cuadrado', symbol: 'ft²', toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
      { id: 'sqin', name: 'Pulgada Cuadrada', symbol: 'in²', toBase: (v) => v * 0.00064516, fromBase: (v) => v / 0.00064516 },
    ],
  },
  {
    id: 'velocidad',
    name: 'Velocidad',
    icon: Gauge,
    units: [
      { id: 'kmh', name: 'Kilómetros por hora', symbol: 'km/h', toBase: (v) => v, fromBase: (v) => v },
      { id: 'ms', name: 'Metros por segundo', symbol: 'm/s', toBase: (v) => v * 3.6, fromBase: (v) => v / 3.6 },
      { id: 'mph', name: 'Millas por hora', symbol: 'mph', toBase: (v) => v * 1.60934, fromBase: (v) => v / 1.60934 },
      { id: 'knot', name: 'Nudos', symbol: 'kn', toBase: (v) => v * 1.852, fromBase: (v) => v / 1.852 },
      { id: 'fps', name: 'Pies por segundo', symbol: 'ft/s', toBase: (v) => v * 1.09728, fromBase: (v) => v / 1.09728 },
      { id: 'mach', name: 'Mach (en aire standard)', symbol: 'M', toBase: (v) => v * 1234.8, fromBase: (v) => v / 1234.8 },
    ],
  },
  {
    id: 'tiempo',
    name: 'Tiempo',
    icon: Clock,
    units: [
      { id: 's', name: 'Segundo', symbol: 's', toBase: (v) => v, fromBase: (v) => v },
      { id: 'ms', name: 'Milisegundo', symbol: 'ms', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'min', name: 'Minuto', symbol: 'min', toBase: (v) => v * 60, fromBase: (v) => v / 60 },
      { id: 'h', name: 'Hora', symbol: 'h', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      { id: 'd', name: 'Día', symbol: 'd', toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
      { id: 'wk', name: 'Semana', symbol: 'sem', toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
      { id: 'mo', name: 'Mes (30 días)', symbol: 'mes', toBase: (v) => v * 2592000, fromBase: (v) => v / 2592000 },
      { id: 'yr', name: 'Año (365 días)', symbol: 'año', toBase: (v) => v * 31536000, fromBase: (v) => v / 31536000 },
    ],
  },
  {
    id: 'datos',
    name: 'Datos Digitales',
    icon: HardDrive,
    units: [
      { id: 'b', name: 'Byte', symbol: 'B', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kb', name: 'Kilobyte (decimal)', symbol: 'KB', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'mb', name: 'Megabyte (decimal)', symbol: 'MB', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      { id: 'gb', name: 'Gigabyte (decimal)', symbol: 'GB', toBase: (v) => v * 1e9, fromBase: (v) => v / 1e9 },
      { id: 'tb', name: 'Terabyte (decimal)', symbol: 'TB', toBase: (v) => v * 1e12, fromBase: (v) => v / 1e12 },
      { id: 'kib', name: 'Kibibyte (binario)', symbol: 'KiB', toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
      { id: 'mib', name: 'Mebibyte (binario)', symbol: 'MiB', toBase: (v) => v * 1048576, fromBase: (v) => v / 1048576 },
      { id: 'gib', name: 'Gibibyte (binario)', symbol: 'GiB', toBase: (v) => v * 1073741824, fromBase: (v) => v / 1073741824 },
      { id: 'tib', name: 'Tebibyte (binario)', symbol: 'TiB', toBase: (v) => v * 1099511627776, fromBase: (v) => v / 1099511627776 },
    ],
  },
  {
    id: 'energia',
    name: 'Energía',
    icon: Zap,
    units: [
      { id: 'j', name: 'Julio (Joule)', symbol: 'J', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kj', name: 'Kilojulio', symbol: 'kJ', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'cal', name: 'Caloría', symbol: 'cal', toBase: (v) => v * 4.184, fromBase: (v) => v / 4.184 },
      { id: 'kcal', name: 'Kilocaloría (Cal)', symbol: 'kcal', toBase: (v) => v * 4184, fromBase: (v) => v / 4184 },
      { id: 'wh', name: 'Vatio-hora', symbol: 'Wh', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      { id: 'kwh', name: 'Kilovatio-hora', symbol: 'kWh', toBase: (v) => v * 3.6e6, fromBase: (v) => v / 3.6e6 },
      { id: 'btu', name: 'BTU', symbol: 'BTU', toBase: (v) => v * 1055.06, fromBase: (v) => v / 1055.06 },
      { id: 'ev', name: 'Electronvoltio', symbol: 'eV', toBase: (v) => v * 1.60218e-19, fromBase: (v) => v / 1.60218e-19 },
    ],
  },
  {
    id: 'presion',
    name: 'Presión',
    icon: Activity,
    units: [
      { id: 'pa', name: 'Pascal', symbol: 'Pa', toBase: (v) => v, fromBase: (v) => v },
      { id: 'hpa', name: 'Hectopascal', symbol: 'hPa', toBase: (v) => v * 100, fromBase: (v) => v / 100 },
      { id: 'bar', name: 'Bar', symbol: 'bar', toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
      { id: 'mbar', name: 'Milibar', symbol: 'mbar', toBase: (v) => v * 100, fromBase: (v) => v / 100 },
      { id: 'psi', name: 'PSI (lb/in²)', symbol: 'psi', toBase: (v) => v * 6894.76, fromBase: (v) => v / 6894.76 },
      { id: 'atm', name: 'Atmósfera Estándar', symbol: 'atm', toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
      { id: 'torr', name: 'Torr (mmHg)', symbol: 'Torr', toBase: (v) => v * 133.322, fromBase: (v) => v / 133.322 },
    ],
  },
  {
    id: 'angulos',
    name: 'Ángulos',
    icon: Compass,
    units: [
      { id: 'deg', name: 'Grado sexagesimal', symbol: '°', toBase: (v) => v, fromBase: (v) => v },
      { id: 'rad', name: 'Radián', symbol: 'rad', toBase: (v) => (v * 180) / Math.PI, fromBase: (v) => (v * Math.PI) / 180 },
      { id: 'grad', name: 'Grado centesimal (Gradián)', symbol: 'grad', toBase: (v) => v * 0.9, fromBase: (v) => v / 0.9 },
      { id: 'arcmin', name: 'Minuto de arco', symbol: "'", toBase: (v) => v / 60, fromBase: (v) => v * 60 },
      { id: 'arcsec', name: 'Segundo de arco', symbol: "''", toBase: (v) => v / 3600, fromBase: (v) => v * 3600 },
    ],
  },
];

export default function UnitConverter() {
  const [selectedCatId, setSelectedCatId] = useLocalStorage<string>('app-unit-category', 'longitud');
  const [inputValue, setInputValue] = useState('1');
  const [fromUnitId, setFromUnitId] = useState('');
  const [toUnitId, setToUnitId] = useState('');
  const [precision, setPrecision] = useState(4);

  const category = useMemo(() => {
    return CATEGORIES.find((c) => c.id === selectedCatId) || CATEGORIES[0];
  }, [selectedCatId]);

  // Keep from/to in sync when category changes
  const { fromUnit, toUnit } = useMemo(() => {
    const from = category.units.find((u) => u.id === fromUnitId) || category.units[0];
    const to = category.units.find((u) => u.id === toUnitId) || category.units[1] || category.units[0];
    return { fromUnit: from, toUnit: to };
  }, [category, fromUnitId, toUnitId]);

  // Clean numerical input parsing
  const numericInput = useMemo(() => {
    const parsed = parseFloat(inputValue.replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }, [inputValue]);

  // Base value
  const baseValue = useMemo(() => {
    return fromUnit.toBase(numericInput);
  }, [fromUnit, numericInput]);

  // Target value
  const targetValue = useMemo(() => {
    return toUnit.fromBase(baseValue);
  }, [toUnit, baseValue]);

  // Format number avoiding floating point artifacts
  const formatNum = (num: number, prec = precision): string => {
    if (isNaN(num)) return '0';
    if (!isFinite(num)) return 'Infinito';
    if (Math.abs(num) < 1e-6 && num !== 0) {
      return num.toExponential(4);
    }
    const factor = Math.pow(10, prec);
    const rounded = Math.round((num + Number.EPSILON) * factor) / factor;
    return rounded.toLocaleString('es-ES', {
      maximumFractionDigits: prec,
      minimumFractionDigits: 0,
    });
  };

  // Swap units
  const handleSwap = () => {
    const temp = fromUnit.id;
    setFromUnitId(toUnit.id);
    setToUnitId(temp);
  };

  // Equivalencies table
  const allEquivalents = useMemo(() => {
    return category.units.map((u) => ({
      ...u,
      converted: u.fromBase(baseValue),
      formatted: formatNum(u.fromBase(baseValue)),
    }));
  }, [category, baseValue, precision]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Scale className="w-5 h-5 text-[var(--accent-text)]" />
          Convertidor de Unidades Multidimensional
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Conversión precisa en tiempo real entre 11 categorías de magnitud física y datos digitales.
        </p>
      </div>

      {/* Category Horizontal Scrolling Carousel / Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const IconComp = cat.icon;
          const isSelected = cat.id === category.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCatId(cat.id);
                setFromUnitId(cat.units[0].id);
                setToUnitId(cat.units[1]?.id || cat.units[0].id);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[var(--accent-color)] text-white shadow-sm shadow-[var(--accent-ring)]'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Conversion Card */}
      <Card className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* FROM Unit */}
          <div className="md:col-span-5 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
              <span>De</span>
              <span>{fromUnit.symbol}</span>
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="0"
              className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xl font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
            />
            <select
              value={fromUnit.id}
              onChange={(e) => setFromUnitId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer"
            >
              {category.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center py-2 md:py-0">
            <button
              onClick={handleSwap}
              className="p-3 rounded-2xl bg-slate-100 hover:bg-[var(--accent-subtle)] text-slate-700 hover:text-[var(--accent-text)] border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 transition active:rotate-180 duration-200 cursor-pointer shadow-xs"
              title="Intercambiar unidades"
              aria-label="Intercambiar unidades"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* TO Unit */}
          <div className="md:col-span-5 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
              <span>A</span>
              <span>{toUnit.symbol}</span>
            </div>
            <div className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/60 text-xl font-bold font-mono text-[var(--accent-text)] truncate flex items-center justify-between">
              <span>{formatNum(targetValue)}</span>
              <CopyButton text={String(targetValue)} size="sm" variant="ghost" label="" />
            </div>
            <select
              value={toUnit.id}
              onChange={(e) => setToUnitId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer"
            >
              {category.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Precision Settings */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-2">
            <span>Decimales:</span>
            {[2, 4, 6, 8].map((p) => (
              <button
                key={p}
                onClick={() => setPrecision(p)}
                className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                  precision === p
                    ? 'bg-[var(--accent-color)] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <span className="font-mono text-slate-600 dark:text-slate-400">
            1 {fromUnit.symbol} = {formatNum(toUnit.fromBase(fromUnit.toBase(1)))} {toUnit.symbol}
          </span>
        </div>
      </Card>

      {/* All Equivalents Table */}
      <Card className="p-4 sm:p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Equivalencias simultáneas en todas las unidades de {category.name}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <th className="pb-2 font-bold">Unidad</th>
                <th className="pb-2 font-bold">Símbolo</th>
                <th className="pb-2 font-bold text-right">Valor Calculado</th>
                <th className="pb-2 font-bold text-right pr-2">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {allEquivalents.map((item) => {
                const isCurrent = item.id === toUnit.id;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                      isCurrent ? 'bg-[var(--accent-subtle)] font-bold' : ''
                    }`}
                  >
                    <td className="py-2.5 text-slate-800 dark:text-slate-200 font-medium">
                      {item.name}
                    </td>
                    <td className="py-2.5 font-mono text-slate-500">{item.symbol}</td>
                    <td className="py-2.5 text-right font-mono text-slate-900 dark:text-slate-100 font-bold">
                      {item.formatted}
                    </td>
                    <td className="py-2.5 text-right pr-1">
                      <CopyButton
                        text={`${item.formatted} ${item.symbol}`}
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
      </Card>
    </div>
  );
}
