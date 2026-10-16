import React, { useState, useMemo } from 'react';
import {
  Search,
  Star,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Filter,
  Check,
} from 'lucide-react';
import { TOOLS_REGISTRY, CATEGORIES_LIST } from '../../data/tools';
import { ToolDefinition, ToolCategory } from '../../types/tools';
import { Card } from '../ui/Card';
import { useToast } from '../ui/Toast';

export interface HomeScreenProps {
  onSelectTool: (id: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  recentToolIds: string[];
  filterOnlyFavorites?: boolean;
  onClearFavoritesFilter?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectTool,
  favorites,
  onToggleFavorite,
  recentToolIds,
  filterOnlyFavorites = false,
  onClearFavoritesFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { success } = useToast();

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return '¡Buenos días!';
    if (hour >= 12 && hour < 20) return '¡Buenas tardes!';
    return '¡Buenas noches!';
  }, []);

  // Filter tools based on search and category
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

  // Favorite tools objects
  const favoriteTools = useMemo(() => {
    return TOOLS_REGISTRY.filter((t) => favorites.includes(t.id));
  }, [favorites]);

  // Recent tools objects
  const recentTools = useMemo(() => {
    return recentToolIds
      .map((id) => TOOLS_REGISTRY.find((t) => t.id === id))
      .filter(Boolean) as ToolDefinition[];
  }, [recentToolIds]);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-white via-white to-[var(--accent-subtle)]/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[var(--accent-subtle)] text-[var(--accent-text)] border border-[var(--accent-border)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{TOOLS_REGISTRY.length} herramientas locales sin límites</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            {greeting} Bienvenido a tu <br className="hidden sm:inline" />
            <span className="text-[var(--accent-text)]">Caja de Herramientas</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Un conjunto moderno de utilidades rápidas y seguras. Todo se procesa 100% en tu navegador: sin backend, sin registro, sin cookies de rastreo y listo para funcionar offline.
          </p>

          {/* Big Search Bar */}
          <div className="pt-2">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busca cualquier utilidad (ej. 'contar palabras', 'hash', 'qr', 'colores', 'pdf')..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter by Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setSelectedCategory('all');
            if (onClearFavoritesFilter) onClearFavoritesFilter();
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            selectedCategory === 'all' && !filterOnlyFavorites
              ? 'bg-[var(--accent-color)] text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          Todas ({TOOLS_REGISTRY.length})
        </button>

        {CATEGORIES_LIST.map((cat) => {
          const isSelected = selectedCategory === cat.id && !filterOnlyFavorites;
          const count = TOOLS_REGISTRY.filter((t) => t.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                if (onClearFavoritesFilter) onClearFavoritesFilter();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isSelected
                  ? 'bg-[var(--accent-color)] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* SECTION: FAVORITOS (If present and no specific category filter) */}
      {!searchQuery && selectedCategory === 'all' && favoriteTools.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              Favoritos ({favoriteTools.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                isFavorite={true}
                onSelect={() => onSelectTool(tool.id)}
                onToggleFavorite={(e) => onToggleFavorite(tool.id, e)}
              />
            ))}
          </div>
        </div>
      )}

      {/* SECTION: USADAS RECIENTEMENTE (If present and no search) */}
      {!searchQuery && selectedCategory === 'all' && !filterOnlyFavorites && recentTools.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--accent-text)]" />
              Usadas Recientemente
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTools.slice(0, 3).map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                isFavorite={favorites.includes(tool.id)}
                onSelect={() => onSelectTool(tool.id)}
                onToggleFavorite={(e) => onToggleFavorite(tool.id, e)}
              />
            ))}
          </div>
        </div>
      )}

      {/* SECTION: TODAS LAS HERRAMIENTAS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-200/80 dark:border-slate-800">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            {filterOnlyFavorites
              ? 'Tus Herramientas Favoritas'
              : selectedCategory !== 'all'
              ? CATEGORIES_LIST.find((c) => c.id === selectedCategory)?.name || 'Herramientas'
              : 'Todas las Herramientas'}
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {filteredTools.length} disponibles
          </span>
        </div>

        {filteredTools.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No se encontraron herramientas
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Prueba buscando con otro término o desactiva los filtros actuales.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                isFavorite={favorites.includes(tool.id)}
                onSelect={() => onSelectTool(tool.id)}
                onToggleFavorite={(e) => onToggleFavorite(tool.id, e)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Privacy Notice Banner at bottom */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Todo se procesa en tu dispositivo, nada se sube a ningún servidor.</span>
        </div>
        <span className="font-semibold text-[var(--accent-text)] hidden sm:inline">
          100% Offline y Privado
        </span>
      </div>
    </div>
  );
};

// Tool Card Component
const ToolCard: React.FC<{
  tool: ToolDefinition;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}> = ({ tool, isFavorite, onSelect, onToggleFavorite }) => {
  const IconComp = tool.icon;

  return (
    <Card
      hover
      onClick={onSelect}
      className="cursor-pointer group flex flex-col justify-between p-5 space-y-3 relative overflow-hidden transition-all active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="p-3 rounded-2xl bg-[var(--accent-subtle)] text-[var(--accent-text)] group-hover:scale-110 transition-transform shadow-2xs">
          <IconComp className="w-6 h-6" />
        </div>

        <button
          onClick={onToggleFavorite}
          className={`p-2 rounded-xl transition cursor-pointer ${
            isFavorite
              ? 'text-amber-400 hover:text-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
              : 'text-slate-300 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
        </button>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[var(--accent-text)] transition-colors">
          {tool.name}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {tool.description}
        </p>
      </div>

      <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-[var(--accent-text)]">
        <span className="uppercase text-[10px] text-slate-400 font-semibold tracking-wider">
          {tool.category}
        </span>
        <span className="flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
          Abrir <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Card>
  );
};
