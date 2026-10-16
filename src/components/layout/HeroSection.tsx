import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowDown,
  Sparkles,
  ArrowRight,
  Star,
  Clock,
  Layers,
  Wrench,
  Check,
} from 'lucide-react';
import { TOOLS_REGISTRY } from '../../data/tools';
import { ToolDefinition } from '../../types/tools';

export interface HeroSectionProps {
  onSelectTool: (id: string) => void;
  favorites: string[];
  recentToolIds: string[];
  onScrollToGrid: () => void;
}

type HeroTab = 'recientes' | 'nuevas' | 'favoritas';

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSelectTool,
  favorites,
  recentToolIds,
  onScrollToGrid,
}) => {
  const [activeTab, setActiveTab] = useState<HeroTab>('nuevas');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [hasHeroImage, setHasHeroImage] = useState<boolean | null>(null);

  // Check if optional /hero/hero.webp or /hero/hero.jpg exists without showing broken images
  useEffect(() => {
    const img = new Image();
    img.src = '/hero/hero.webp';
    img.onload = () => setHasHeroImage(true);
    img.onerror = () => {
      const img2 = new Image();
      img2.src = '/hero/hero.jpg';
      img2.onload = () => setHasHeroImage(true);
      img2.onerror = () => setHasHeroImage(false);
    };
  }, []);

  // Cycle CSS previews every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Deterministic "Herramienta del día" based on today's date
  const toolOfTheDay = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = (hash << 5) - hash + today.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % TOOLS_REGISTRY.length;
    return TOOLS_REGISTRY[idx];
  }, []);

  // Compute count for decorative number
  const countNumber = useMemo(() => {
    if (activeTab === 'recientes') {
      const c = recentToolIds.length;
      return c < 10 ? `0${c}` : `${c}`;
    }
    if (activeTab === 'favoritas') {
      const c = favorites.length;
      return c < 10 ? `0${c}` : `${c}`;
    }
    // 'nuevas' - 6 new tools in v2
    return '06';
  }, [activeTab, recentToolIds, favorites]);

  // Featured card based on activeTab
  const featuredTool: ToolDefinition = useMemo(() => {
    if (activeTab === 'recientes' && recentToolIds.length > 0) {
      const found = TOOLS_REGISTRY.find((t) => t.id === recentToolIds[0]);
      if (found) return found;
    }
    if (activeTab === 'favoritas' && favorites.length > 0) {
      const found = TOOLS_REGISTRY.find((t) => t.id === favorites[0]);
      if (found) return found;
    }
    return toolOfTheDay;
  }, [activeTab, recentToolIds, favorites, toolOfTheDay]);

  const FeaturedIcon = featuredTool.icon;

  return (
    <section className="relative w-full overflow-hidden border-b border-hairline bg-[var(--bg-panel)] min-h-[580px] lg:min-h-[72vh] flex flex-col justify-between">
      {/* Background Subtle Noise / Tonal Layers */}
      <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20 bg-[radial-gradient(#000000_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Main Two-Zone Composition */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-8 sm:py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">
        
        {/* Left Area: Giant Editorial Overlay Text */}
        <div className="lg:col-span-7 xl:col-span-7 z-20 flex flex-col justify-center">
          {/* Tagline */}
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-6 h-[1px] bg-[var(--accent-color)]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Edición 2026 — 100% en el Navegador
            </span>
          </div>

          {/* Giant Display Title Overlapping Right */}
          <h1 className="text-display-giant select-none text-[var(--text-main)] mb-6 drop-shadow-2xs">
            <span className="block font-extralight tracking-tight">CAJA DE</span>
            <span className="block font-light text-[var(--text-main)] opacity-95">
              HERRAMIENTAS
            </span>
          </h1>

          <p className="max-w-md text-sm sm:text-base text-[var(--text-muted)] font-normal leading-relaxed mb-8">
            Hub de utilidades web privadas, sin rastreo y sin backend. Procesamiento nativo
            en tu dispositivo para ingeniería, desarrollo, sistemas y diseño.
          </p>

          {/* Action Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={onScrollToGrid}
              className="px-8 py-3.5 bg-[#111113] hover:bg-[#26262B] text-white dark:bg-[#F4F4F5] dark:hover:bg-[#E4E4E7] dark:text-[#111113] text-xs font-semibold uppercase tracking-[0.18em] rounded-[6px] transition-all duration-150 active:scale-95 shadow-sm cursor-pointer flex items-center gap-3 min-h-[44px]"
            >
              <span>Explorar</span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--accent-color)]" />
            </button>

            <span className="text-[11px] uppercase tracking-wider text-[var(--text-faint)]">
              {TOOLS_REGISTRY.length} utilidades activas
            </span>
          </div>
        </div>

        {/* Right Area: Diagonal Split Panels & Decorative Number */}
        <div className="lg:col-span-5 xl:col-span-5 relative w-full h-[360px] sm:h-[420px] lg:h-[480px] flex items-center justify-end">
          
          {/* Decorative Giant Number (e.g. "06" or "02") */}
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 text-[10rem] sm:text-[13rem] font-bold tracking-tighter text-[var(--deco-number)] opacity-70 select-none pointer-events-none leading-none -mt-8 sm:-mt-12"
          >
            {countNumber}
          </div>

          {/* Vertical Navigation Selector (Inspired by "Latest / New Collection") */}
          <div className="absolute top-2 right-2 sm:top-6 sm:right-6 z-30 flex flex-col items-end gap-2 text-right">
            {(
              [
                { id: 'nuevas', label: 'Nuevas v2' },
                { id: 'recientes', label: 'Recientes' },
                { id: 'favoritas', label: 'Favoritas' },
              ] as const
            ).map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? 'text-[var(--text-main)] font-bold'
                      : 'text-[var(--text-faint)] hover:text-[var(--text-muted)]'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="w-3 h-[2px] bg-[var(--accent-color)]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Visual Display: Diagonal Split Panels with CSS previews (or hero image slot) */}
          <div className="relative w-full h-[280px] sm:h-[340px] lg:h-[390px] rounded-[16px] overflow-hidden border border-hairline bg-[#F1F1F3] dark:bg-[#1A1A20] shadow-sm">
            {hasHeroImage ? (
              <img
                src="/hero/hero.webp"
                alt="Caja de Herramientas Hero"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  setHasHeroImage(false);
                }}
              />
            ) : (
              <div className="relative w-full h-full grid grid-cols-1 md:grid-cols-2 overflow-hidden">
                {/* Left Diagonal Panel: Bit stream & Math */}
                <div className="clip-diagonal-left h-full bg-[#EAEAEA] dark:bg-[#1E1E24] p-5 flex flex-col justify-between border-r border-hairline/60">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[var(--text-faint)]">
                    <span>PANEL 01 // BITS</span>
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-color)] animate-pulse" />
                  </div>

                  {/* Monospace Interactive Bit Grid */}
                  <div className="space-y-2 py-4">
                    <div className="font-mono text-xs tracking-widest text-[var(--text-main)] font-semibold flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded-[4px] bg-[var(--accent-color)] text-white">1</span>
                      <span className="px-1.5 py-0.5 rounded-[4px] bg-black/5 dark:bg-white/10">0</span>
                      <span className="px-1.5 py-0.5 rounded-[4px] bg-[var(--accent-color)] text-white">1</span>
                      <span className="px-1.5 py-0.5 rounded-[4px] bg-[var(--accent-color)] text-white">1</span>
                      <span className="px-1.5 py-0.5 rounded-[4px] bg-black/5 dark:bg-white/10">0</span>
                      <span className="px-1.5 py-0.5 rounded-[4px] bg-black/5 dark:bg-white/10">0</span>
                      <span className="px-1.5 py-0.5 rounded-[4px] bg-[var(--accent-color)] text-white">1</span>
                      <span className="px-1.5 py-0.5 rounded-[4px] bg-black/5 dark:bg-white/10">0</span>
                    </div>
                    <p className="text-[11px] font-mono text-[var(--text-muted)]">
                      0b10110010 = 178 (0xB2)
                    </p>
                    <div className="h-[1px] w-full bg-hairline my-2" />
                    <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--accent-text)]">
                      Aritmética & IEEE 754
                    </p>
                  </div>

                  <div className="text-[9px] font-mono text-[var(--text-faint)]">
                    SYS_NET // CIDR /24
                  </div>
                </div>

                {/* Right Diagonal Panel: Color swatch / JSON Preview / QR */}
                <div className="clip-diagonal-right h-full bg-[#F4F4F6] dark:bg-[#141418] p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[var(--text-faint)]">
                    <span>PANEL 02 // VECTOR</span>
                    <span className="text-[var(--accent-color)] font-bold">LIVE</span>
                  </div>

                  {previewIndex === 0 && (
                    /* Preview 0: Palette Swatches */
                    <div className="space-y-2 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Paleta Armónica
                      </p>
                      <div className="flex items-center gap-1.5 h-12 rounded-[6px] overflow-hidden p-1 bg-white/70 dark:bg-black/30 border border-hairline">
                        <div className="flex-1 h-full rounded-[4px] bg-[#E11D2E]" title="#E11D2E" />
                        <div className="flex-1 h-full rounded-[4px] bg-[#111113] dark:bg-[#F4F4F5]" />
                        <div className="flex-1 h-full rounded-[4px] bg-[#9A9AA2]" />
                        <div className="flex-1 h-full rounded-[4px] bg-[#F1F1F3] dark:bg-[#26262B]" />
                        <div className="flex-1 h-full rounded-[4px] bg-[#2563EB]" />
                      </div>
                      <p className="text-[10px] font-mono text-[var(--text-faint)] text-right">
                        WCAG AAA Compliant
                      </p>
                    </div>
                  )}

                  {previewIndex === 1 && (
                    /* Preview 1: Clean SVG QR Code */
                    <div className="flex items-center justify-center py-2">
                      <div className="w-20 h-20 bg-white p-2 rounded-[6px] border border-hairline flex flex-col justify-between shadow-2xs">
                        <div className="flex justify-between">
                          <div className="w-5 h-5 bg-[#111113] rounded-[2px] p-0.5">
                            <div className="w-full h-full bg-white p-0.5">
                              <div className="w-full h-full bg-[var(--accent-color)]" />
                            </div>
                          </div>
                          <div className="w-5 h-5 bg-[#111113] rounded-[2px] p-0.5">
                            <div className="w-full h-full bg-white p-0.5">
                              <div className="w-full h-full bg-[#111113]" />
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="w-5 h-5 bg-[#111113] rounded-[2px] p-0.5">
                            <div className="w-full h-full bg-white p-0.5">
                              <div className="w-full h-full bg-[#111113]" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                            <div className="bg-[#111113]" />
                            <div className="bg-[var(--accent-color)]" />
                            <div className="bg-[var(--accent-color)]" />
                            <div className="bg-[#111113]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {previewIndex === 2 && (
                    /* Preview 2: JSON Code Snippet */
                    <div className="font-mono text-[10px] leading-tight space-y-0.5 bg-black/5 dark:bg-white/5 p-2 rounded-[6px]">
                      <span className="text-[var(--text-faint)]">{'{'}</span>
                      <div className="pl-2">
                        <span className="text-[var(--accent-color)]">"status"</span>: <span className="text-emerald-600 dark:text-emerald-400">200</span>,
                      </div>
                      <div className="pl-2">
                        <span className="text-[var(--accent-color)]">"offline"</span>: <span className="text-sky-600 dark:text-sky-400">true</span>,
                      </div>
                      <div className="pl-2">
                        <span className="text-[var(--accent-color)]">"vault"</span>: <span className="text-amber-600 dark:text-amber-400">"local"</span>
                      </div>
                      <span className="text-[var(--text-faint)]">{'}'}</span>
                    </div>
                  )}

                  {previewIndex === 3 && (
                    /* Preview 3: Regex Pattern Token */
                    <div className="space-y-1.5 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        RegEx Engine
                      </p>
                      <div className="p-2 bg-black/5 dark:bg-white/5 rounded-[6px] font-mono text-[11px] text-[var(--text-main)]">
                        /<span className="text-[var(--accent-color)]">^[\w-.]+@</span>([\w-]+.)+[\w-]{'{2,4}'}$/
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-mono text-[var(--text-faint)]">Worker safe (2s timeout)</span>
                      </div>
                    </div>
                  )}

                  <div className="text-[9px] font-mono text-[var(--text-faint)] text-right">
                    PREVIEW {previewIndex + 1}/4
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Area: Subtle Scroll Line (Left) & Floating Polaroid Card (Right) */}
      <div className="relative z-20 w-full max-w-[1440px] mx-auto px-4 sm:px-8 pb-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        
        {/* Scroll Indicator */}
        <button
          onClick={onScrollToGrid}
          className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer group select-none min-h-[44px]"
        >
          <span className="relative w-8 h-[1px] bg-[var(--text-faint)] overflow-hidden">
            <span className="absolute inset-0 bg-[var(--accent-color)] -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
          </span>
          <span>Desplázate y explora</span>
          <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
        </button>

        {/* Floating Polaroid Card (Mounted over boundary, 1-2deg rotation, straight on hover) */}
        <div
          onClick={() => onSelectTool(featuredTool.id)}
          className="floating-polaroid w-full sm:w-80 p-4 rounded-[12px] bg-[var(--bg-panel)] border border-hairline shadow-xl cursor-pointer rotate-1 sm:rotate-2 hover:rotate-0 transition-all duration-300 self-end"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[var(--accent-subtle)] text-[var(--accent-text)] text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Herramienta del día</span>
            </div>
            <span className="text-[10px] font-mono uppercase text-[var(--text-faint)]">
              {featuredTool.category}
            </span>
          </div>

          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-11 h-11 rounded-[8px] bg-[#F1F1F3] dark:bg-[#1E1E23] border border-hairline flex items-center justify-center text-[var(--accent-color)] shrink-0">
              <FeaturedIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] truncate">
                {featuredTool.name}
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                {featuredTool.description}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-hairline">
            <span className="text-[10px] font-mono text-[var(--text-faint)]">
              ID // {featuredTool.id}
            </span>
            <button className="px-3 py-1 bg-[#F1F1F3] dark:bg-[#1E1E23] hover:bg-[#E7E7EA] dark:hover:bg-[#26262B] text-[var(--text-main)] text-[10px] font-bold uppercase tracking-wider rounded-[4px] border border-hairline transition cursor-pointer">
              ABRIR
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
