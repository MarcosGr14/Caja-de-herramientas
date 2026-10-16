import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Layers,
  Sparkles,
} from 'lucide-react';
import { TOOLS_REGISTRY, CATEGORIES_LIST } from '../../data/tools';
import { ToolCategory } from '../../types/tools';

export interface SidebarProps {
  currentToolId: string | null;
  onSelectTool: (id: string) => void;
  favorites: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentToolId,
  onSelectTool,
  favorites,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 transition-all duration-200 sticky top-16 h-[calc(100vh-4rem)] z-30 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top: Collapse toggle */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800">
        {!collapsed && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pl-1">
            Herramientas ({TOOLS_REGISTRY.length})
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ${
            collapsed ? 'mx-auto' : ''
          }`}
          title={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          aria-label={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {CATEGORIES_LIST.map((category) => {
          const categoryTools = TOOLS_REGISTRY.filter((t) => t.category === category.id);
          if (categoryTools.length === 0) return null;

          return (
            <div key={category.id} className="space-y-1">
              {!collapsed && (
                <p className="px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mt-2 mb-1">
                  {category.name}
                </p>
              )}

              {categoryTools.map((tool) => {
                const IconComp = tool.icon;
                const isCurrent = currentToolId === tool.id;
                const isFav = favorites.includes(tool.id);

                return (
                  <button
                    key={tool.id}
                    onClick={() => onSelectTool(tool.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                      isCurrent
                        ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)] border border-[var(--accent-border)] font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                    title={collapsed ? tool.name : undefined}
                  >
                    <IconComp
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isCurrent ? 'text-[var(--accent-text)]' : 'text-slate-400'
                      }`}
                    />
                    {!collapsed && (
                      <span className="truncate flex-1 text-left">{tool.shortName}</span>
                    )}
                    {!collapsed && isFav && (
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
