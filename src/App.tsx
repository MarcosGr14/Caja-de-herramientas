import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { HomeScreen } from './components/layout/HomeScreen';
import { CommandPalette } from './components/layout/CommandPalette';
import { SettingsModal } from './components/layout/SettingsModal';
import { ToastProvider, useToast } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToolSkeleton } from './components/ui/Skeleton';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTheme } from './hooks/useTheme';
import { TOOLS_REGISTRY } from './data/tools';
import { ToolDefinition } from './types/tools';

function MainApp() {
  // Theme hook to ensure proper HTML attributes
  useTheme();

  // Route state derived from window.location.hash
  const [currentToolId, setCurrentToolId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    return TOOLS_REGISTRY.some((t) => t.id === hash) ? hash : null;
  });

  // Local storage for Favorites and Recents
  const [favorites, setFavorites] = useLocalStorage<string[]>('app-favorites', [
    'contador-palabras',
    'formateador-json',
    'colores-paletas',
    'generador-contrasenas',
  ]);

  const [recentToolIds, setRecentToolIds] = useLocalStorage<string[]>('app-recents', []);

  // UI state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [filterFavoritesInHome, setFilterFavoritesInHome] = useState(false);

  const { success } = useToast();

  // Synchronize hash with current tool
  const navigateToTool = useCallback(
    (toolId: string) => {
      window.location.hash = `#/${toolId}`;
      setCurrentToolId(toolId);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Add to recents
      setRecentToolIds((prev) => {
        const filtered = prev.filter((id) => id !== toolId);
        return [toolId, ...filtered].slice(0, 8);
      });
    },
    [setRecentToolIds]
  );

  const navigateToHome = useCallback(() => {
    window.location.hash = '';
    setCurrentToolId(null);
    setFilterFavoritesInHome(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen to browser hash change (back/forward buttons)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (TOOLS_REGISTRY.some((t) => t.id === hash)) {
        setCurrentToolId(hash);
      } else {
        setCurrentToolId(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toggle favorite
  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFav = favorites.includes(id);
    if (isFav) {
      setFavorites(favorites.filter((favId) => favId !== id));
      success('Herramienta quitada de favoritos');
    } else {
      setFavorites([...favorites, id]);
      success('Herramienta añadida a favoritos');
    }
  };

  // Find active tool
  const activeTool = TOOLS_REGISTRY.find((t) => t.id === currentToolId);

  // Sync document title with active tool
  useEffect(() => {
    if (activeTool) {
      document.title = `${activeTool.name} — Caja de Herramientas`;
    } else {
      document.title = 'Caja de Herramientas — Hub de Utilidades 100% en el Navegador';
    }
  }, [activeTool]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <Header
        currentToolId={currentToolId}
        onNavigateHome={navigateToHome}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Body Layout: Sidebar + Content */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar
          currentToolId={currentToolId}
          onSelectTool={navigateToTool}
          favorites={favorites}
        />

        {/* Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 md:pb-12">
          {activeTool ? (
            <div className="space-y-6">
              <ErrorBoundary fallbackTitle={`Error en ${activeTool.name}`}>
                <Suspense fallback={<ToolSkeleton />}>
                  <activeTool.component />
                </Suspense>
              </ErrorBoundary>
            </div>
          ) : (
            <HomeScreen
              onSelectTool={navigateToTool}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              recentToolIds={recentToolIds}
              filterOnlyFavorites={filterFavoritesInHome}
              onClearFavoritesFilter={() => setFilterFavoritesInHome(false)}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentToolId={currentToolId}
        onNavigateHome={navigateToHome}
        onOpenSearch={() => setIsSearchOpen(true)}
        onSelectTool={navigateToTool}
        favorites={favorites}
        onFilterFavorites={() => {
          navigateToHome();
          setFilterFavoritesInHome(true);
        }}
      />

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTool={navigateToTool}
      />

      {/* Settings & Personalization Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
