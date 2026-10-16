import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CornerDownLeft } from 'lucide-react';
import { TOOLS_REGISTRY } from '../../data/tools';
import { ToolDefinition } from '../../types/tools';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (toolId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTool,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter tools
  const filteredTools = React.useMemo(() => {
    if (!query.trim()) {
      return TOOLS_REGISTRY;
    }
    const q = query.toLowerCase().trim();
    return TOOLS_REGISTRY.filter((tool) => {
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.shortName.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q) ||
        tool.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [query]);

  // Focus input and reset when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredTools.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredTools.length) % Math.max(1, filteredTools.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredTools[selectedIndex]) {
          onSelectTool(filteredTools[selectedIndex].id);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredTools, selectedIndex, onSelectTool, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xl bg-[var(--bg-panel)] rounded-[12px] border border-hairline shadow-2xl overflow-hidden z-10 transition-all transform animate-in zoom-in-95 duration-150 flex flex-col max-h-[75vh]"
      >
        {/* Large Borderless Search Bar */}
        <div className="flex items-center px-4 py-4 border-b border-hairline gap-3">
          <Search className="w-5 h-5 text-[var(--text-faint)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Escribe para buscar cualquier herramienta..."
            className="flex-1 bg-transparent text-sm sm:text-base text-[var(--text-main)] placeholder:text-[var(--text-faint)] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[var(--text-faint)] hover:text-[var(--text-main)]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-[var(--text-faint)] bg-[#F1F1F3] dark:bg-[#1E1E23] rounded-[4px] border border-hairline">
            ESC
          </kbd>
        </div>

        {/* Results List with numbers and icons */}
        <div className="p-2 overflow-y-auto flex-1 divide-y divide-hairline/40">
          {filteredTools.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-faint)]">
              No se encontraron herramientas con "{query}".
            </div>
          ) : (
            filteredTools.map((tool, idx) => {
              const IconComp = tool.icon;
              const isSelected = idx === selectedIndex;
              const num = idx < 9 ? `0${idx + 1}` : `${idx + 1}`;

              return (
                <div
                  key={tool.id}
                  onClick={() => {
                    onSelectTool(tool.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-[8px] cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)]'
                      : 'hover:bg-[#F1F1F3] dark:hover:bg-[#1E1E23] text-[var(--text-main)]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="font-mono text-[10px] text-[var(--text-faint)] w-4 text-right">
                      {num}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full border border-hairline flex items-center justify-center shrink-0 transition ${
                        isSelected
                          ? 'border-[var(--accent-color)] text-[var(--accent-color)]'
                          : 'bg-[#F7F7F8] dark:bg-[#1A1A1E] text-[var(--text-muted)]'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider truncate">
                        {tool.name}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] font-mono uppercase text-[var(--text-faint)] hidden sm:inline">
                      {tool.category}
                    </span>
                    {isSelected && (
                      <kbd className="px-1.5 py-0.5 rounded-[4px] bg-[var(--accent-color)] text-white text-[10px] font-mono">
                        ↵
                      </kbd>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2.5 bg-[#F7F7F8] dark:bg-[#1A1A1E] border-t border-hairline text-[11px] text-[var(--text-faint)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-black/40 font-mono text-[10px] border border-hairline">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-black/40 font-mono text-[10px] border border-hairline">↓</kbd> Navegar
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-black/40 font-mono text-[10px] border border-hairline">↵</kbd> Abrir
            </span>
          </div>
          <span className="font-mono text-[10px]">{filteredTools.length} disponibles</span>
        </div>
      </div>
    </div>
  );
};
