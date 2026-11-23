import React, { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, Menu, X } from 'lucide-react';
import { RoutePath, SteerSuggestion, Story } from '../types';
import { storyService } from '../services/storyService';
import { SteerNudgeToast } from '../components/SteerNudgeToast';
import { useAuth } from '../context/AuthContext';

export const StudioLayout: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [pendingSuggestions, setPendingSuggestions] = useState<SteerSuggestion[]>([]);
  const [storiesById, setStoriesById] = useState<Record<string, Story>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [{ suggestions }, { stories }] = await Promise.all([
          storyService.getPendingSuggestions(),
          storyService.getStories(),
        ]);
        setPendingSuggestions(suggestions);
        const map: Record<string, Story> = {};
        for (const s of stories) map[s.id] = s;
        setStoriesById(map);
      } catch (err) {
        console.error('Failed to initialize autopilot listener:', err);
      }
    };
    void loadInitial();

    const unsubscribe = storyService.subscribeToAutopilot({
      onSuggestionCreated: (suggestion) => {
        setPendingSuggestions((prev) => [
          suggestion,
          ...prev.filter((item) => item.id !== suggestion.id),
        ]);
      },
      onSuggestionResolved: (resolved) => {
        setPendingSuggestions((prev) => prev.filter((item) => item.id !== resolved.id));
      },
      onStoryUpdated: (story) => {
        setStoriesById((prev) => ({ ...prev, [story.id]: story }));
      },
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const storiesList = useMemo(() => Object.values(storiesById), [storiesById]);
  const firstStoryId = storiesList[0]?.id || 'clockwork-sentinel';
  const isReaderRoute = location.pathname.startsWith('/read/');
  const activeSuggestion = !isReaderRoute ? pendingSuggestions[0] : undefined;

  const navItems = [
    {
      label: 'Library',
      to: RoutePath.HOME,
      active: location.pathname === RoutePath.HOME,
    },
    {
      label: 'Prompt Generator',
      to: RoutePath.STUDIO,
      active: location.pathname === RoutePath.STUDIO,
    },
    {
      label: 'Prompter Studio',
      to: `/studio/${firstStoryId}`,
      active: location.pathname.startsWith('/studio/'),
    },
    {
      label: 'Reader View',
      to: `/read/${firstStoryId}`,
      active: location.pathname.startsWith('/read/'),
    },
    {
      label: 'SQL & Supabase',
      to: RoutePath.ARCHITECTURE,
      active: location.pathname === RoutePath.ARCHITECTURE,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6 sm:px-8">
          <Link
            to={RoutePath.HOME}
            className="flex items-center gap-2.5 shrink-0 text-white hover:opacity-90 transition-opacity"
          >
            <BookOpen size={18} className="text-white" />
            <span className="text-sm font-semibold uppercase tracking-[0.18em]">
              Loombook
            </span>
          </Link>

          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  item.active
                    ? 'bg-white text-black'
                    : 'text-white/65 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={isAuthenticated ? RoutePath.ACCOUNT : RoutePath.LOGIN}
              className={`hidden sm:inline-flex rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                location.pathname === RoutePath.ACCOUNT
                  ? 'bg-white/15 text-white'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
              }`}
            >
              {isAuthenticated ? 'Account' : 'Sign In'}
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="inline-flex md:hidden items-center justify-center rounded-md border border-white/15 bg-[#0A0A0D] p-2 text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="border-t border-white/10 bg-[#0A0A0D] px-6 py-4 md:hidden space-y-1"
          >
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`block rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  item.active
                    ? 'bg-white text-black'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to={isAuthenticated ? RoutePath.ACCOUNT : RoutePath.LOGIN}
              className="block rounded-md px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              {isAuthenticated ? 'Account' : 'Sign In'}
            </Link>
          </nav>
        )}
      </header>

      <main className="flex-1 bg-black text-white">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 bg-black">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-8 py-6 text-xs text-white/50">
          <p className="uppercase tracking-[0.18em] text-white/40">
            Loombook · AI Storybook Studio
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <Link to={RoutePath.HOME} className="hover:text-white transition-colors whitespace-nowrap">
              Library
            </Link>
            <Link to={RoutePath.STUDIO} className="hover:text-white transition-colors whitespace-nowrap">
              Generate
            </Link>
            <Link to={RoutePath.ARCHITECTURE} className="hover:text-white transition-colors whitespace-nowrap">
              Postgres & Edge Function
            </Link>
            <Link to={RoutePath.LOGIN} className="hover:text-white transition-colors whitespace-nowrap">
              Account
            </Link>
          </div>
        </div>
      </footer>

      {/* Realtime Prompter Nudge */}
      {activeSuggestion && (
        <SteerNudgeToast
          suggestion={activeSuggestion}
          storyTitle={storiesById[activeSuggestion.storyId]?.title}
          onResolved={(resolved) =>
            setPendingSuggestions((prev) => prev.filter((item) => item.id !== resolved.id))
          }
          onDismissed={(id) =>
            setPendingSuggestions((prev) => prev.filter((item) => item.id !== id))
          }
        />
      )}
    </div>
  );
};
