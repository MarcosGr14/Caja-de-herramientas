import React, { useState } from 'react';
import {
  ChevronRight,
  Star,
  Layers,
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import { TOOLS_REGISTRY, CATEGORIES_LIST } from '../../data/tools';
import { ToolDefinition } from '../../types/tools';

export interface ToolPageContainerProps {
  tool: ToolDefinition;
  onSelectTool: (id: string) => void;
  onNavigateHome: () => void;
  favorites: string[];
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  children: React.ReactNode;
}

export const ToolPageContainer: React.FC<ToolPageContainerProps> = ({
  tool,
  onSelectTool,
  onNavigateHome,
  favorites,
  onToggleFavorite,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Category info
  const categoryIdx = CATEGORIES_LIST.findIndex((c) => c.id === tool.category);
  const categoryObj = CATEGORIES_LIST[categoryIdx] || {
    id: tool.category,
    name: tool.category,
  };
  const categoryNumber = categoryIdx >= 0 ? (categoryIdx < 9 ? `0${categoryIdx + 1}` : `${categoryIdx + 1}`) : '00';

  // Sibling tools in the same category
  const siblingTools = TOOLS_REGISTRY.filter((t) => t.category === tool.category);
  const isFavorite = favorites.includes(tool.id);

  return (
    <div className="w-full flex flex-col">
      {/* Editorial Tool Header */}
      <div className="relative border-b border-hairline bg-[var(--bg-panel)] overflow-hidden">
        
        {/* Giant Category Number on the Side (Deco) */}
        <div
          aria-hidden="true"
          className="absolute right-4 sm:right-12 -top-6 text-[8rem] sm:text-[11rem] font-bold font-mono text-[var(--deco-number)] opacity-60 select-none pointer-events-none leading-none"
        >
          {categoryNumber}
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-8 py-6 sm:py-10">
          {/* Breadcrumb */}
          <nav
            aria-label="Migas de pan"
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--text-faint)] mb-4"
          >
            <button
              onClick={onNavigateHome}
              className="hover:text-[var(--text-main)] transition cursor-pointer"
            >
              Inicio
            </button>
            <ChevronRight className="w-3 h-3 text-[var(--text-faint)]" />
            <span className="text-[var(--text-muted)]">
              {categoryObj.name}
            </span>
            <ChevronRight className="w-3 h-3 text-[var(--text-faint)]" />
            <span className="text-[var(--text-main)] font-semibold truncate max-w-[180px] sm:max-w-none">
              {tool.name}
            </span>
          </nav>

          {/* Title Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-4xl">
            <div>
              <h1 className="text-display-lg text-[var(--text-main)] font-light tracking-tight">
                {tool.name}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-2 font-normal leading-relaxed max-w-2xl">
                {tool.description}
              </p>
            </div>

            {/* Favorite & Sibling Quick Action */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={(e) => onToggleFavorite(tool.id, e)}
                className={`p-2.5 rounded-[6px] border border-hairline transition cursor-pointer min-h-[40px] flex items-center gap-2 text-xs uppercase tracking-wider ${
                  isFavorite
                    ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)] border-[var(--accent-border)] font-semibold'
                    : 'bg-[#F1F1F3] dark:bg-[#1E1E23] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
                title={isFavorite ? 'Quitar de favoritas' : 'Añadir a favoritas'}
                aria-label={isFavorite ? 'Quitar de favoritas' : 'Añadir a favoritas'}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-current text-[var(--accent-color)]' : ''}`} />
                <span className="hidden sm:inline">
                  {isFavorite ? 'Favorita' : 'Favorita'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Category Tool Selector */}
      <div className="lg:hidden border-b border-hairline px-4 py-2 bg-[#F7F7F8] dark:bg-[#1A1A1E] flex items-center justify-between text-xs">
        <span className="font-mono uppercase text-[10px] text-[var(--text-faint)]">
          Más en {categoryObj.name}:
        </span>
        <select
          value={tool.id}
          onChange={(e) => onSelectTool(e.target.value)}
          className="bg-[var(--bg-panel)] text-[var(--text-main)] border border-hairline rounded-[4px] px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-[var(--accent-color)]"
        >
          {siblingTools.map((sibling, sIdx) => (
            <option key={sibling.id} value={sibling.id}>
              {sIdx + 1 < 10 ? `0${sIdx + 1}` : sIdx + 1}. {sibling.name}
            </option>
          ))}
        </select>
      </div>

      {/* Main Tool Workspace Layout: Sidebar + Active Tool Content */}
      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 flex gap-8 items-start">
        
        {/* Desktop Category Sibling Tools Sidebar (collapsible) */}
        <aside
          className={`hidden lg:flex flex-col border border-hairline rounded-[12px] bg-[var(--bg-panel)] transition-all duration-200 sticky top-24 shrink-0 overflow-hidden ${
            sidebarOpen ? 'w-64 p-3' : 'w-12 p-2 items-center'
          }`}
        >
          {/* Header toggle */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-hairline w-full">
            {sidebarOpen && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
                {categoryObj.name} ({siblingTools.length})
              </span>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-[4px] text-[var(--text-faint)] hover:text-[var(--text-main)] cursor-pointer"
              title={sidebarOpen ? 'Colapsar menú lateral' : 'Expandir menú lateral'}
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-3.5 h-3.5" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* List of tools */}
          <div className="space-y-1 w-full overflow-y-auto max-h-[calc(100vh-14rem)] scrollbar-none">
            {siblingTools.map((sibling, idx) => {
              const isCurrent = sibling.id === tool.id;
              const num = idx < 9 ? `0${idx + 1}` : `${idx + 1}`;
              const IconComp = sibling.icon;

              if (!sidebarOpen) {
                return (
                  <button
                    key={sibling.id}
                    onClick={() => onSelectTool(sibling.id)}
                    className={`w-8 h-8 rounded-[6px] flex items-center justify-center transition cursor-pointer mb-1 ${
                      isCurrent
                        ? 'bg-[var(--accent-color)] text-white'
                        : 'text-[var(--text-muted)] hover:bg-[#F1F1F3] dark:hover:bg-[#1E1E23]'
                    }`}
                    title={sibling.name}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                  </button>
                );
              }

              return (
                <button
                  key={sibling.id}
                  onClick={() => onSelectTool(sibling.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[6px] text-left transition cursor-pointer text-xs ${
                    isCurrent
                      ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)] font-semibold border border-[var(--accent-border)]'
                      : 'hover:bg-[#F1F1F3] dark:hover:bg-[#1E1E23] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[10px] text-[var(--text-faint)]">
                      {num}
                    </span>
                    <span className="truncate">{sibling.name}</span>
                  </div>
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Tool Main Canvas Area */}
        <div className="flex-1 min-w-0 w-full">
          {children}
        </div>

      </div>
    </div>
  );
};
