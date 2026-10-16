import React, { useState, useMemo, useEffect } from 'react';
import {
  Palette,
  Pipette,
  CheckCircle2,
  XCircle,
  Copy,
  Bookmark,
  Trash2,
  Edit2,
  Download,
  Share2,
  Sparkles,
  Shuffle,
  Eye,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { CopyButton } from '../../ui/CopyButton';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useToast } from '../../ui/Toast';

// Color conversions
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

// Relative luminance for WCAG
function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1) || { r: 0, g: 0, b: 0 };
  const rgb2 = hexToRgb(hex2) || { r: 255, g: 255, b: 255 };
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

interface SavedPalette {
  id: string;
  name: string;
  colors: string[];
  createdAt: number;
}

export default function ColorPaletteTool() {
  const [baseColor, setBaseColor] = useState('#0ea5e9');
  const [contrastText, setContrastText] = useState('#ffffff');
  const [savedPalettes, setSavedPalettes] = useLocalStorage<SavedPalette[]>('app-saved-palettes', [
    {
      id: 'default-cozy',
      name: 'Pasteles Cálidos',
      colors: ['#f472b6', '#a78bfa', '#38bdf8', '#34d399', '#fb923c'],
      createdAt: Date.now(),
    },
  ]);
  const [paletteNameInput, setPaletteNameInput] = useState('');
  const { success, error: toastError } = useToast();

  const hasEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;

  const rgb = useMemo(() => hexToRgb(baseColor) || { r: 14, g: 165, b: 233 }, [baseColor]);
  const hsl = useMemo(() => rgbToHsl(rgb.r, rgb.g, rgb.b), [rgb]);

  // Handle EyeDropper
  const handleEyeDropper = async () => {
    if (!hasEyeDropper) return;
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      if (result?.sRGBHex) {
        setBaseColor(result.sRGBHex.toLowerCase());
        success(`Color capturado: ${result.sRGBHex}`);
      }
    } catch {
      // User cancelled picker
    }
  };

  // Generate palettes from base
  const palettes = useMemo(() => {
    const { h, s, l } = hsl;

    const complementary = [baseColor, hslToHex(h + 180, s, l)];
    const analogous = [hslToHex(h - 30, s, l), baseColor, hslToHex(h + 30, s, l)];
    const triadic = [baseColor, hslToHex(h + 120, s, l), hslToHex(h + 240, s, l)];
    const tetradic = [
      baseColor,
      hslToHex(h + 90, s, l),
      hslToHex(h + 180, s, l),
      hslToHex(h + 270, s, l),
    ];
    const monochromatic = [
      hslToHex(h, s, Math.max(15, l - 35)),
      hslToHex(h, s, Math.max(25, l - 20)),
      baseColor,
      hslToHex(h, Math.max(20, s - 15), Math.min(85, l + 18)),
      hslToHex(h, Math.max(15, s - 30), Math.min(95, l + 32)),
    ];

    return {
      complementary,
      analogous,
      triadic,
      tetradic,
      monochromatic,
    };
  }, [baseColor, hsl]);

  // Contrast Calculation
  const contrastRatio = useMemo(() => {
    return getContrastRatio(contrastText, baseColor);
  }, [contrastText, baseColor]);

  const wcagResults = useMemo(() => {
    const r = contrastRatio;
    return {
      ratio: r.toFixed(2),
      normalAA: r >= 4.5,
      normalAAA: r >= 7.0,
      largeAA: r >= 3.0,
      largeAAA: r >= 4.5,
    };
  }, [contrastRatio]);

  // Random color generator
  const handleRandomColor = () => {
    const rndH = Math.floor(Math.random() * 360);
    const rndS = 65 + Math.floor(Math.random() * 25);
    const rndL = 50 + Math.floor(Math.random() * 20);
    setBaseColor(hslToHex(rndH, rndS, rndL));
    success('Nuevo color base aleatorio generado');
  };

  // Save current palette
  const handleSavePalette = () => {
    const name = paletteNameInput.trim() || `Paleta ${hsl.h}°`;
    const newPalette: SavedPalette = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      colors: palettes.monochromatic,
      createdAt: Date.now(),
    };
    setSavedPalettes((prev) => [newPalette, ...prev]);
    setPaletteNameInput('');
    success(`Paleta "${name}" guardada en favoritos`);
  };

  // Delete saved palette
  const handleDeletePalette = (id: string) => {
    setSavedPalettes((prev) => prev.filter((p) => p.id !== id));
    success('Paleta eliminada');
  };

  // Export as CSS Variables
  const getCssVarsString = (colors: string[], prefix = 'color') => {
    return colors.map((c, i) => `--${prefix}-${i + 1}: ${c};`).join('\n');
  };

  // Export all palettes as JSON
  const handleExportPalettesJson = () => {
    const dataStr = JSON.stringify(savedPalettes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'paletas-guardadas.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success('Paletas exportadas a JSON');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Palette className="w-5 h-5 text-[var(--accent-text)]" />
            Selector de Color, Paletas Armónicas y Contraste WCAG
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Conversión HEX/RGB/HSL, cuentagotas, verificación de accesibilidad y guardado de temas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasEyeDropper && (
            <Button
              size="sm"
              variant="outline"
              icon={<Pipette className="w-4 h-4" />}
              onClick={handleEyeDropper}
            >
              Cuentagotas
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            icon={<Shuffle className="w-4 h-4" />}
            onClick={handleRandomColor}
          >
            Aleatorio
          </Button>
        </div>
      </div>

      {/* Main Color Picker Card */}
      <Card className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Visual Swatch & Native Color Picker */}
          <div className="md:col-span-5 flex flex-col items-center justify-center space-y-3">
            <div
              className="w-full h-36 sm:h-44 rounded-2xl shadow-inner border border-black/10 dark:border-white/10 flex items-center justify-center relative overflow-hidden group transition-all"
              style={{ backgroundColor: baseColor }}
            >
              <input
                type="color"
                value={baseColor}
                onChange={(e) => setBaseColor(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                aria-label="Seleccionar color base"
              />
              <span
                className="px-3 py-1.5 rounded-xl text-xs font-bold font-mono shadow-sm backdrop-blur-md transition group-hover:scale-105"
                style={{
                  backgroundColor: contrastText === '#ffffff' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)',
                  color: contrastText,
                }}
              >
                Toca para cambiar
              </span>
            </div>
            <p className="text-xs text-slate-400">Haz clic en el cuadro para abrir el selector nativo</p>
          </div>

          {/* Formats Inputs */}
          <div className="md:col-span-7 space-y-3">
            {/* HEX */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold w-12 text-slate-500">HEX</span>
              <input
                type="text"
                value={baseColor.toUpperCase()}
                onChange={(e) => {
                  let v = e.target.value;
                  if (!v.startsWith('#')) v = '#' + v;
                  if (hexToRgb(v)) {
                    setBaseColor(v.toLowerCase());
                  }
                }}
                className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs font-bold"
              />
              <CopyButton text={baseColor.toUpperCase()} size="sm" label="HEX" />
              <CopyButton text={`--color-primary: ${baseColor.toUpperCase()};`} size="sm" label="CSS" />
            </div>

            {/* RGB */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold w-12 text-slate-500">RGB</span>
              <div className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200">
                rgb({rgb.r}, {rgb.g}, {rgb.b})
              </div>
              <CopyButton text={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} size="sm" label="RGB" />
            </div>

            {/* HSL */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold w-12 text-slate-500">HSL</span>
              <div className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200">
                hsl({hsl.h}, {hsl.s}%, {hsl.l}%)
              </div>
              <CopyButton text={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} size="sm" label="HSL" />
            </div>
          </div>
        </div>
      </Card>

      {/* Harmonic Palettes Generator */}
      <Card className="p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-text)]" />
              Paletas Armónicas Derivadas
            </h3>
            <p className="text-xs text-slate-500">
              Haz clic en cualquier color para seleccionarlo como nuevo color base.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={paletteNameInput}
              onChange={(e) => setPaletteNameInput(e.target.value)}
              placeholder="Nombre de la paleta..."
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 w-44"
            />
            <Button
              size="sm"
              variant="primary"
              icon={<Bookmark className="w-3.5 h-3.5" />}
              onClick={handleSavePalette}
            >
              Guardar
            </Button>
          </div>
        </div>

        {/* 5 Harmonies */}
        <div className="space-y-4">
          {[
            { name: 'Monocromática', colors: palettes.monochromatic },
            { name: 'Análoga', colors: palettes.analogous },
            { name: 'Complementaria', colors: palettes.complementary },
            { name: 'Triádica', colors: palettes.triadic },
            { name: 'Tetrádica', colors: palettes.tetradic },
          ].map((h) => (
            <div key={h.name} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">{h.name}</span>
                <CopyButton
                  text={getCssVarsString(h.colors, h.name.toLowerCase())}
                  size="sm"
                  label="Copiar CSS"
                />
              </div>
              <div className="flex rounded-2xl overflow-hidden shadow-xs h-12 border border-slate-200 dark:border-slate-800">
                {h.colors.map((c, i) => (
                  <button
                    key={`${c}-${i}`}
                    onClick={() => setBaseColor(c)}
                    title={`Fijar ${c} como base`}
                    className="flex-1 flex flex-col items-center justify-center transition hover:opacity-90 cursor-pointer relative group"
                    style={{ backgroundColor: c }}
                  >
                    <span className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/60 text-white transition">
                      {c.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* WCAG Contrast Checker Card */}
      <Card className="p-4 sm:p-6 space-y-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Eye className="w-4 h-4 text-[var(--accent-text)]" />
          Verificador de Contraste y Accesibilidad (WCAG 2.1)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-500 font-bold block mb-1">Color de Fondo</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg border border-black/10 shrink-0" style={{ backgroundColor: baseColor }} />
                  <input
                    type="text"
                    value={baseColor.toUpperCase()}
                    onChange={(e) => setBaseColor(e.target.value.toLowerCase())}
                    className="w-full p-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="flex-1">
                <label className="text-xs text-slate-500 font-bold block mb-1">Color de Texto</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg border border-black/10 shrink-0" style={{ backgroundColor: contrastText }} />
                  <input
                    type="text"
                    value={contrastText.toUpperCase()}
                    onChange={(e) => setContrastText(e.target.value.toLowerCase())}
                    className="w-full p-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>
              </div>
            </div>

            {/* Quick Presets for text */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Texto rápido:</span>
              <button
                onClick={() => setContrastText('#ffffff')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-medium cursor-pointer"
              >
                Blanco (#FFF)
              </button>
              <button
                onClick={() => setContrastText('#0f172a')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-900 font-medium cursor-pointer"
              >
                Negro (#0F172A)
              </button>
            </div>

            {/* WCAG Score Badges */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="text-xs text-slate-500 mb-1">Texto Normal (&lt; 18pt)</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">AA (≥ 4.5:1)</span>
                  {wcagResults.normalAA ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Pasa</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">Falla</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-bold">AAA (≥ 7:1)</span>
                  {wcagResults.normalAAA ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Pasa</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">Falla</span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="text-xs text-slate-500 mb-1">Texto Grande (≥ 18pt / negrita)</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">AA (≥ 3:1)</span>
                  {wcagResults.largeAA ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Pasa</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">Falla</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-bold">AAA (≥ 4.5:1)</span>
                  {wcagResults.largeAAA ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Pasa</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">Falla</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Live Preview Box */}
          <div className="md:col-span-6 flex flex-col">
            <div
              className="flex-1 p-6 rounded-2xl border border-black/10 dark:border-white/10 flex flex-col justify-center space-y-3 shadow-inner"
              style={{ backgroundColor: baseColor, color: contrastText }}
            >
              <div className="text-xs font-bold uppercase tracking-widest opacity-80">
                Ratio de Contraste: {wcagResults.ratio} : 1
              </div>
              <h4 className="text-xl font-bold leading-tight">
                Título con texto grande de muestra
              </h4>
              <p className="text-xs leading-relaxed opacity-95">
                Este párrafo demuestra la legibilidad de un texto regular sobre el color de fondo elegido.
                Un contraste alto reduce la fatiga visual y garantiza inclusión para todos los usuarios.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Saved Palettes in LocalStorage */}
      {savedPalettes.length > 0 && (
        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[var(--accent-text)]" />
              Mis Paletas Guardadas ({savedPalettes.length})
            </h3>
            <Button
              size="sm"
              variant="outline"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportPalettesJson}
            >
              Exportar JSON
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedPalettes.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {p.name}
                  </span>
                  <button
                    onClick={() => handleDeletePalette(p.id)}
                    className="text-slate-400 hover:text-rose-500 transition p-1"
                    title="Eliminar paleta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex h-9 rounded-xl overflow-hidden shadow-2xs border border-slate-200 dark:border-slate-700">
                  {p.colors.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setBaseColor(c)}
                      className="flex-1 cursor-pointer transition hover:opacity-90"
                      style={{ backgroundColor: c }}
                      title={`Fijar ${c} como base`}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                  <span>{p.colors.length} tonos</span>
                  <CopyButton
                    text={p.colors.join(', ')}
                    size="sm"
                    variant="ghost"
                    label="Copiar"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
