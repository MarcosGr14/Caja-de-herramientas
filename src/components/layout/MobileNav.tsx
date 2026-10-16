import React, { useState } from 'react';
import {
  Home,
  Search,
  Star,
  Menu,
  X,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { TOOLS_REGISTRY, CATEGORIES_LIST } from '../../data/tools';
import { ToolCategory } from '../../types/tools';

export interface MobileNavProps {
  currentToolId: string | null;
  onNavigateHome: () => void;
  onOpenSearch: () => void;
  onSelectTool: (id: string) => void;
  favorites: string[];
  onFilterFavorites: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentToolId,
  onNavigateHome,
  onOpenSearch,
  onSelectTool,
  favorites,
  onFilterFavorites,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
        <div className="grid grid-cols-4 h-16 items-center px-2">
          {/* Inicio */}
          <button
            onClick={() => {
              setDrawerOpen(false);
              onNavigateHome();
            }}
            className={`flex flex-col items-center justify-center min-h-[44px] py-1 rounded-xl transition cursor-pointer ${
              currentToolId === null && !drawerOpen
                ? 'text-[var(--accent-text)] font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Inicio</span>
          </button>

          {/* Buscar */}
          <button
            onClick={onOpenSearch}
            className="flex flex-col items-center justify-center min-h-[44px] py-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 transition cursor-pointer"
          >
            <Search className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Buscar</span>
          </button>

          {/* Favoritos */}
          <button
            onClick={() => {
              setDrawerOpen(false);
              onFilterFavorites();
            }}
            className="flex flex-col items-center justify-center min-h-[44px] py-1 rounded-xl text-slate-500 dark:text-slate-400 transition cursor-pointer relative"
          >
            <Star className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Favoritos</span>
            {favorites.length > 0 && (
              <span className="absolute top-1.5 right-6 w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          {/* Menú drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`flex flex-col items-center justify-center min-h-[44px] py-1 rounded-xl transition cursor-pointer ${
              drawerOpen ? 'text-[var(--accent-text)] font-bold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Menú</span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="flex-1" onClick={() => setDrawerOpen(false)} />

          <div className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200 pb-safe">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Todas las Herramientas ({TOOLS_REGISTRY.length})
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-4 flex-1">
              {CATEGORIES_LIST.map((cat) => {
                const tools = TOOLS_REGISTRY.filter((t) => t.category === cat.id);
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
                      {cat.name}
                    </p>
                    <div className="space-y-1">
                      {tools.map((t) => {
                        const IconComp = t.icon;
                        const isCurrent = currentToolId === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => {
                              onSelectTool(t.id);
                              setDrawerOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-2xl min-h-[48px] text-xs font-semibold transition cursor-pointer ${
                              isCurrent
                                ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)] border border-[var(--accent-border)] font-bold'
                                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <IconComp className="w-4 h-4 shrink-0 text-[var(--accent-text)]" />
                              <span className="truncate">{t.name}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
