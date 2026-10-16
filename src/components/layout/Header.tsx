import React from 'react';
import {
  Wrench,
  Search,
  Sun,
  Moon,
  Laptop,
  Settings,
  Sparkles,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { PWAInstallButton } from './PWAInstallButton';
import { Button } from '../ui/Button';

export interface HeaderProps {
  currentToolId: string | null;
  onNavigateHome: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentToolId,
  onNavigateHome,
  onOpenSearch,
  onOpenSettings,
}) => {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const isMac =
    typeof window !== 'undefined' &&
    /mac|iphone|ipad|ipod/i.test(window.navigator.userAgent);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Branding & Back Button */}
        <div className="flex items-center gap-3">
          {currentToolId && (
            <button
              onClick={onNavigateHome}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Volver al inicio"
              aria-label="Volver al inicio"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-2xl bg-[var(--accent-color)] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none block">
                Caja de Herramientas
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                100% en el navegador
              </span>
            </div>
          </div>
        </div>

        {/* Center: Search input button (Command Palette trigger) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-slate-400 bg-slate-100/70 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span>Buscar herramientas o utilidades...</span>
            </div>
            <kbd className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 font-bold shadow-2xs">
              {isMac ? '⌘K' : 'Ctrl+K'}
            </kbd>
          </button>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search button */}
          <button
            onClick={onOpenSearch}
            className="md:hidden p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Buscar"
            aria-label="Buscar herramienta"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton variant="header" />

          {/* Theme Quick Toggle */}
          <button
            onClick={cycleTheme}
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={`Tema actual: ${theme} (haz clic para cambiar)`}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-sky-400" />
            ) : theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Laptop className="w-4 h-4 text-[var(--accent-text)]" />
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Ajustes de personalización y copias de seguridad"
            aria-label="Ajustes"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
