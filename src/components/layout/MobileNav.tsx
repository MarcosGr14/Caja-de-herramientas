import React, { useState } from 'react';
import {
  Home,
  Search,
  Star,
  Menu,
  X,
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
      {/* Minimal Bottom Bar in Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-panel)]/95 backdrop-blur-md border-t border-hairline pb-safe">
        <div className="grid grid-cols-4 h-16 items-center px-2">
          {/* Inicio */}
          <button
            onClick={() => {
              setDrawerOpen(false);
              onNavigateHome();
            }}
            className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition cursor-pointer ${
              currentToolId === null && !drawerOpen
                ? 'text-[var(--accent-text)] font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Home className="w-4 h-4 mb-1" />
            <span className="text-[10px] uppercase tracking-wider font-semibold">Inicio</span>
          </button>

          {/* Buscar */}
          <button
            onClick={onOpenSearch}
            className="flex flex-col items-center justify-center min-h-[44px] py-1 text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
          >
            <Search className="w-4 h-4 mb-1" />
            <span className="text-[10px] uppercase tracking-wider font-semibold">Buscar</span>
          </button>

          {/* Favoritos */}
          <button
            onClick={() => {
              setDrawerOpen(false);
              onFilterFavorites();
            }}
            className="flex flex-col items-center justify-center min-h-[44px] py-1 text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer relative"
          >
            <Star className="w-4 h-4 mb-1" />
            <span className="text-[10px] uppercase tracking-wider font-semibold">Favoritas</span>
            {favorites.length > 0 && (
              <span className="absolute top-1 right-6 w-1.5 h-1.5 rounded-full bg-[var(--accent-color)]" />
            )}
          </button>

          {/* Menú drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition cursor-pointer ${
              drawerOpen ? 'text-[var(--accent-text)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Menu className="w-4 h-4 mb-1" />
            <span className="text-[10px] uppercase tracking-wider font-semibold">Menú</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="flex-1" onClick={() => setDrawerOpen(false)} />

          <div className="bg-[var(--bg-panel)] rounded-t-[16px] border-t border-hairline p-5 max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200 pb-safe">
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                Directorio ({TOOLS_REGISTRY.length})
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-[6px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-4 flex-1">
              {CATEGORIES_LIST.map((cat, catIdx) => {
                const tools = TOOLS_REGISTRY.filter((t) => t.category === cat.id);
                const catNum = catIdx < 9 ? `0${catIdx + 1}` : `${catIdx + 1}`;
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-baseline gap-2 px-1">
                      <span className="font-mono text-[10px] text-[var(--text-faint)]">{catNum}</span>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        {cat.name}
                      </p>
                    </div>
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
                            className={`w-full flex items-center justify-between p-3 rounded-[8px] min-h-[48px] text-xs transition cursor-pointer ${
                              isCurrent
                                ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)] border border-[var(--accent-border)] font-bold'
                                : 'bg-[#F7F7F8] dark:bg-[#1A1A1E] text-[var(--text-main)] hover:bg-[#EAEAEA]'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-7 h-7 rounded-full border border-hairline flex items-center justify-center text-[var(--accent-color)] shrink-0">
                                <IconComp className="w-3.5 h-3.5" />
                              </div>
                              <span className="truncate uppercase tracking-wider text-[11px]">
                                {t.name}
                              </span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-faint)] shrink-0 ml-2" />
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
