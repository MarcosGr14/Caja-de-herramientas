import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { HomeScreen } from './components/layout/HomeScreen';
import { ToolPageContainer } from './components/layout/ToolPageContainer';
import { Footer } from './components/layout/Footer';
import { MobileNav } from './components/layout/MobileNav';
import { CommandPalette } from './components/layout/CommandPalette';
import { SettingsModal } from './components/layout/SettingsModal';
import { ToastProvider, useToast } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToolSkeleton } from './components/ui/Skeleton';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTheme } from './hooks/useTheme';
import { TOOLS_REGISTRY } from './data/tools';
import { ToolDefinition } from './types/tools';

const DEFAULT_FAVORITES: string[] = [
  'bases-bits',
  'subredes-ipv4',
  'chmod-calc',
  'cron-parser',
  'regex-tester',
  'epoch-converter',
];

const DEFAULT_RECENTS: string[] = [];

function MainApp() {
  // Theme hook to ensure proper HTML attributes
  useTheme();

  // Route state derived from window.location.hash
  const [currentToolId, setCurrentToolId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    return TOOLS_REGISTRY.some((t) => t.id === hash) ? hash : null;
  });

  // Selected Category filter ('all' or category.id)
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Local storage for Favorites and Recents
  const [favorites, setFavorites] = useLocalStorage<string[]>('app-favorites', DEFAULT_FAVORITES);
  const [recentToolIds, setRecentToolIds] = useLocalStorage<string[]>('app-recents', DEFAULT_RECENTS);

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

  const handleCategorySelect = useCallback((catId: string) => {
    setSelectedCategory(catId);
    if (currentToolId) {
      window.location.hash = '';
      setCurrentToolId(null);
    }
    setFilterFavoritesInHome(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentToolId]);

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
      success('Herramienta quitada de favoritas');
    } else {
      setFavorites([...favorites, id]);
      success('Herramienta guardada en favoritas');
    }
  };

  // Find active tool
  const activeTool = TOOLS_REGISTRY.find((t) => t.id === currentToolId);

  // Sync document title with active tool
  useEffect(() => {
    if (activeTool) {
      document.title = `${activeTool.name.toUpperCase()} — CAJA.tools`;
    } else {
      document.title = 'CAJA.tools — Hub de Utilidades 100% en el Navegador';
    }
  }, [activeTool]);

  return (
    // Outer Frame on Desktop: Centered Window with Soft Shadow & Margins
    <div className="min-h-screen bg-[var(--bg-exterior)] flex flex-col items-center justify-start lg:p-6 xl:p-8 transition-colors">
      
      {/* Window Panel Container (Window Frame on >=1024px, Fullscreen on mobile/tablet) */}
      <div className="w-full max-w-[1520px] bg-[var(--bg-panel)] lg:rounded-[20px] border-0 lg:border border-hairline window-frame flex flex-col min-h-screen lg:min-h-[calc(100vh-3rem)] overflow-hidden transition-all duration-300 relative text-[var(--text-main)]">
        
        {/* Top Editorial Header */}
        <Header
          currentToolId={currentToolId}
          activeCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
          onNavigateHome={navigateToHome}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Content Canvas */}
        <main className="flex-1 w-full pb-20 lg:pb-8">
          {activeTool ? (
            <ToolPageContainer
              tool={activeTool}
              onSelectTool={navigateToTool}
              onNavigateHome={navigateToHome}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            >
              <ErrorBoundary fallbackTitle={`Error en ${activeTool.name}`}>
                <Suspense fallback={<ToolSkeleton />}>
                  <activeTool.component />
                </Suspense>
              </ErrorBoundary>
            </ToolPageContainer>
          ) : (
            <HomeScreen
              onSelectTool={navigateToTool}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              recentToolIds={recentToolIds}
              filterOnlyFavorites={filterFavoritesInHome}
              onClearFavoritesFilter={() => setFilterFavoritesInHome(false)}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
            />
          )}
        </main>

        {/* Minimal Editorial Footer */}
        <Footer />
      </div>

      {/* Mobile Bottom Navigation Bar */}
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
