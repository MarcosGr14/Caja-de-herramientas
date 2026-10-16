import React, { useRef, useState, useEffect } from 'react';
import {
  Search,
  Sun,
  Moon,
  Laptop,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { CATEGORIES_LIST } from '../../data/tools';
import { PWAInstallButton } from './PWAInstallButton';

export interface HeaderProps {
  currentToolId: string | null;
  activeCategory: string;
  onSelectCategory: (catId: string) => void;
  onNavigateHome: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentToolId,
  activeCategory,
  onSelectCategory,
  onNavigateHome,
  onOpenSearch,
  onOpenSettings,
}) => {
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const isMac =
    typeof window !== 'undefined' &&
    /mac|iphone|ipad|ipod/i.test(window.navigator.userAgent);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 border-b border-hairline ${
        isScrolled
          ? 'bg-[var(--bg-panel)]/90 backdrop-blur-md shadow-xs'
          : 'bg-[var(--bg-panel)]'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-18 flex items-center justify-between gap-4">
        {/* Left: Logo (CAJA.tools inspired by SKATE.pro) */}
        <div className="flex items-center gap-3 shrink-0">
          {currentToolId && (
            <button
              onClick={onNavigateHome}
              className="p-2 rounded-[6px] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[#F1F1F3] dark:hover:bg-[#1E1E23] transition cursor-pointer"
              title="Volver al inicio"
              aria-label="Volver al inicio"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onNavigateHome}
            className="flex items-baseline gap-0.5 group cursor-pointer text-left focus:outline-none"
          >
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-main)]">
              CAJA
            </span>
            <span className="text-xl sm:text-2xl font-light text-[var(--accent-color)] tracking-normal">
              .tools
            </span>
          </button>
        </div>

        {/* Center: Editorial Categories Links with Active Accent Underline (Desktop) */}
        <nav
          ref={scrollContainerRef}
          aria-label="Categorías de herramientas"
          className="hidden lg:flex items-center gap-6 overflow-x-auto scrollbar-none py-1 mx-2 relative max-w-2xl"
        >
          <button
            onClick={() => onSelectCategory('all')}
            className={`relative py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
              activeCategory === 'all'
                ? 'text-[var(--text-main)] font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <span>Todas</span>
            {activeCategory === 'all' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent-color)]" />
            )}
          </button>

          {CATEGORIES_LIST.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`relative py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                  isActive
                    ? 'text-[var(--text-main)] font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <span>{cat.name}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent-color)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Search Trigger Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-2 rounded-[6px] border border-hairline hover:bg-[#F1F1F3] dark:hover:bg-[#1E1E23] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer min-h-[40px]"
            title="Buscar herramienta (Ctrl+K)"
            aria-label="Buscar herramienta"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline text-xs uppercase tracking-wider">Buscar</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-faint)] bg-[#F1F1F3] dark:bg-[#1E1E23] rounded-[4px] border border-hairline">
              {isMac ? '⌘K' : 'Ctrl+K'}
            </kbd>
          </button>

          {/* PWA Button */}
          <PWAInstallButton variant="header" />

          {/* Theme Switcher */}
          <button
            onClick={cycleTheme}
            className="p-2.5 rounded-[6px] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[#F1F1F3] dark:hover:bg-[#1E1E23] transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center border border-hairline"
            title={`Tema actual: ${theme} (haz clic para alternar)`}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-sky-400" />
            ) : theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Laptop className="w-4 h-4 text-[var(--accent-color)]" />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-[6px] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[#F1F1F3] dark:hover:bg-[#1E1E23] transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center border border-hairline"
            title="Ajustes de apariencia y datos"
            aria-label="Ajustes"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Horizontal Category Chips */}
      <div className="lg:hidden border-t border-hairline px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none bg-[var(--bg-panel)]">
        <button
          onClick={() => onSelectCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider shrink-0 transition cursor-pointer min-h-[36px] ${
            activeCategory === 'all'
              ? 'bg-[var(--accent-color)] text-white'
              : 'bg-[#F1F1F3] dark:bg-[#1E1E23] text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          Todas
        </button>
        {CATEGORIES_LIST.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider shrink-0 transition cursor-pointer min-h-[36px] ${
                isActive
                  ? 'bg-[var(--accent-color)] text-white'
                  : 'bg-[#F1F1F3] dark:bg-[#1E1E23] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </header>
  );
};
