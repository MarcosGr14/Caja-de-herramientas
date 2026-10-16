import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Star,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  Filter,
  Check,
  X,
} from 'lucide-react';
import { TOOLS_REGISTRY, CATEGORIES_LIST } from '../../data/tools';
import { ToolDefinition, ToolCategory } from '../../types/tools';
import { HeroSection } from './HeroSection';
import { useToast } from '../ui/Toast';

export interface HomeScreenProps {
  onSelectTool: (id: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  recentToolIds: string[];
  filterOnlyFavorites?: boolean;
  onClearFavoritesFilter?: () => void;
  selectedCategory?: string;
  onSelectCategory?: (catId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectTool,
  favorites,
  onToggleFavorite,
  recentToolIds,
  filterOnlyFavorites = false,
  onClearFavoritesFilter,
  selectedCategory = 'all',
  onSelectCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);
  const { success } = useToast();

  const scrollToGrid = () => {
    gridRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Filter tools based on search and selectedCategory
  const filteredTools = useMemo(() => {
    return TOOLS_REGISTRY.filter((t) => {
      if (filterOnlyFavorites && !favorites.includes(t.id)) {
        return false;
      }
      if (selectedCategory !== 'all' && t.category !== selectedCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        t.name.toLowerCase().includes(q) ||
        t.shortName.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory, filterOnlyFavorites, favorites]);

  // Recent tools objects
  const recentTools = useMemo(() => {
    return recentToolIds
      .map((id) => TOOLS_REGISTRY.find((t) => t.id === id))
      .filter((t): t is ToolDefinition => !!t);
  }, [recentToolIds]);

  // Favorite tools objects
  const favoriteTools = useMemo(() => {
    return TOOLS_REGISTRY.filter((t) => favorites.includes(t.id));
  }, [favorites]);

  return (
    <div className="w-full flex flex-col">
      {/* Editorial Hero Section */}
      {!filterOnlyFavorites && selectedCategory === 'all' && !searchQuery && (
        <HeroSection
          onSelectTool={onSelectTool}
          favorites={favorites}
          recentToolIds={recentToolIds}
          onScrollToGrid={scrollToGrid}
        />
      )}

      {/* Main Grid Content Container */}
      <div ref={gridRef} className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
        
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-8 mb-8 border-b border-hairline">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--text-faint)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar por nombre, categoría o palabra clave..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#F1F1F3] dark:bg-[#1A1A20] border border-hairline rounded-[6px] text-xs text-[var(--text-main)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-color)] min-h-[44px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-faint)] hover:text-[var(--text-main)] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status & active filter chips */}
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] flex-wrap">
            {filterOnlyFavorites && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--accent-subtle)] text-[var(--accent-text)] rounded-full text-xs font-semibold">
                <Star className="w-3 h-3 fill-current" />
                <span>Solo favoritas</span>
                <button
                  onClick={onClearFavoritesFilter}
                  className="ml-1 hover:opacity-75 cursor-pointer"
                  title="Ver todas"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F1F1F3] dark:bg-[#1A1A20] rounded-full text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]">
                <span>Categoría: {selectedCategory}</span>
                {onSelectCategory && (
                  <button
                    onClick={() => onSelectCategory('all')}
                    className="ml-1 hover:opacity-75 cursor-pointer"
                    title="Quitar filtro"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            )}

            <span className="font-mono text-[11px] text-[var(--text-faint)]">
              {filteredTools.length} {filteredTools.length === 1 ? 'herramienta' : 'herramientas'}
            </span>
          </div>
        </div>

        {/* Empty State */}
        {filteredTools.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center justify-center border border-dashed border-hairline rounded-[14px] bg-[#F7F7F8] dark:bg-[#1A1A1E]">
            <div className="w-12 h-12 rounded-full border border-hairline flex items-center justify-center text-[var(--text-faint)] mb-4">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
              Sin resultados encontrados
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mb-6">
              No encontramos herramientas que coincidan con "{searchQuery}". Intenta con otros términos como "bits", "hash", "qr" o "fecha".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                if (onSelectCategory) onSelectCategory('all');
                if (onClearFavoritesFilter) onClearFavoritesFilter();
              }}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-[#111113] dark:bg-[#F4F4F5] text-white dark:text-[#111113] rounded-[6px] cursor-pointer min-h-[40px]"
            >
              Restablecer filtros
            </button>
          </div>
        )}

        {/* Favorites section (if in favorites filter or if favorites exists and no query) */}
        {filterOnlyFavorites && favoriteTools.length > 0 && (
          <div className="mb-14">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-3xl font-light font-mono text-[var(--deco-number)]">
                ★
              </span>
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-main)]">
                Tus Herramientas Favoritas
              </h2>
              <div className="flex-1 h-[1px] bg-hairline" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {favoriteTools.map((tool, idx) => (
                <ToolGridCard
                  key={tool.id}
                  tool={tool}
                  index={idx}
                  isFavorite={true}
                  onToggleFavorite={onToggleFavorite}
                  onSelectTool={onSelectTool}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recents section (when browsing home without search filter) */}
        {!searchQuery && selectedCategory === 'all' && !filterOnlyFavorites && recentTools.length > 0 && (
          <div className="mb-16">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-3xl font-light font-mono text-[var(--deco-number)]">
                REC
              </span>
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-main)]">
                Usadas Recientemente
              </h2>
              <div className="flex-1 h-[1px] bg-hairline" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {recentTools.slice(0, 4).map((tool, idx) => (
                <ToolGridCard
                  key={tool.id}
                  tool={tool}
                  index={idx}
                  isFavorite={favorites.includes(tool.id)}
                  onToggleFavorite={onToggleFavorite}
                  onSelectTool={onSelectTool}
                />
              ))}
            </div>
          </div>
        )}

        {/* Categories Sections */}
        {!filterOnlyFavorites &&
          CATEGORIES_LIST.map((category, catIdx) => {
            const categoryTools = filteredTools.filter((t) => t.category === category.id);
            if (categoryTools.length === 0) return null;

            const categoryNumber = catIdx < 9 ? `0${catIdx + 1}` : `${catIdx + 1}`;

            return (
              <section key={category.id} className="mb-16 scroll-mt-24">
                {/* Section Header: Number thin & large + Category title + Hairline */}
                <div className="flex items-baseline gap-4 mb-6">
                  <span
                    aria-hidden="true"
                    className="text-3xl sm:text-4xl font-extralight font-mono text-[var(--deco-number)] select-none"
                  >
                    {categoryNumber}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-base sm:text-lg font-semibold uppercase tracking-[0.16em] text-[var(--text-main)]">
                      {category.name}
                    </h2>
                    <span className="text-xs text-[var(--text-faint)] font-mono">
                      ({categoryTools.length})
                    </span>
                  </div>
                  <div className="flex-1 h-[1px] bg-hairline" />
                </div>

                {/* Grid: 4 cols (>=1280px), 3 (>=1024px), 2 (>=640px), 1 (<480px) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {categoryTools.map((tool, idx) => (
                    <ToolGridCard
                      key={tool.id}
                      tool={tool}
                      index={idx}
                      isFavorite={favorites.includes(tool.id)}
                      onToggleFavorite={onToggleFavorite}
                      onSelectTool={onSelectTool}
                    />
                  ))}
                </div>
              </section>
            );
          })}
      </div>
    </div>
  );
};

// Subcomponent: Tool Grid Card in Editorial Aesthetic
interface ToolGridCardProps {
  tool: ToolDefinition;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onSelectTool: (id: string) => void;
}

const ToolGridCard: React.FC<ToolGridCardProps> = ({
  tool,
  index,
  isFavorite,
  onToggleFavorite,
  onSelectTool,
}) => {
  const IconComp = tool.icon;
  const cardNumber = index < 9 ? `0${index + 1}` : `${index + 1}`;

  return (
    <div
      onClick={() => onSelectTool(tool.id)}
      className="group relative bg-[var(--bg-panel)] rounded-[14px] border border-hairline p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-black/50 cursor-pointer flex flex-col justify-between min-h-[170px]"
    >
      {/* Top row: Monospace index, Lucide circle icon, Favorite toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Fine outline circle containing the Lucide icon */}
          <div className="w-10 h-10 rounded-full border border-hairline bg-[#F7F7F8] dark:bg-[#1A1A1E] flex items-center justify-center text-[var(--text-main)] group-hover:border-[var(--accent-color)] group-hover:text-[var(--accent-color)] transition-colors">
            <IconComp className="w-4 h-4 stroke-[1.5]" />
          </div>
          <span className="font-mono text-[11px] text-[var(--text-faint)]">
            {cardNumber}
          </span>
        </div>

        {/* Favorite Star Button */}
        <button
          onClick={(e) => onToggleFavorite(tool.id, e)}
          className={`p-1.5 rounded-full border border-transparent hover:border-hairline transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
            isFavorite
              ? 'text-amber-500 hover:text-amber-600'
              : 'text-[var(--text-faint)] hover:text-[var(--text-main)]'
          }`}
          title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : 'stroke-[1.5]'}`} />
        </button>
      </div>

      {/* Middle: Tool Name with hover accent underline & Description */}
      <div>
        <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[var(--text-main)] group-hover:text-[var(--accent-text)] transition-colors inline-block relative">
          <span>{tool.name}</span>
          <span className="block max-w-0 group-hover:max-w-full transition-all duration-200 h-[1.5px] bg-[var(--accent-color)] mt-0.5" />
        </h3>
        <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1 leading-relaxed">
          {tool.description}
        </p>
      </div>

      {/* Bottom info tag */}
      <div className="pt-3 mt-3 border-t border-hairline/60 flex items-center justify-between text-[10px] font-mono uppercase text-[var(--text-faint)]">
        <span>{tool.category}</span>
        <span className="opacity-0 group-hover:opacity-100 text-[var(--accent-color)] font-bold transition-opacity">
          ABRIR →
        </span>
      </div>
    </div>
  );
};
