import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, Sliders, Trash2 } from 'lucide-react';
import { Story, AutopilotMetrics, RoutePath } from '../types';
import { storyService } from '../services/storyService';
import { Button } from '../components/ui/Button';
import CurvedLensCarousel, { pad2, type LensSlide } from '../components/ui/3d-curved-carousel';

const SEEDED_STORY_IDS = [
  'clockwork-sentinel',
  'sea-glass-harbor',
  'cartographers-conservatory',
  'paper-lighthouse',
  'velvet-observatory',
  'apricot-orchard-clock',
  'porcelain-violinist',
];

export const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [metrics, setMetrics] = useState<AutopilotMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGenre, setActiveGenre] = useState<string>('All');
  const [activeCatalogIndex, setActiveCatalogIndex] = useState<number>(0);

  const fetchLibrary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await storyService.getStories();
      setStories(data.stories);
      setMetrics(data.metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load storybooks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLibrary();
    const unsub = storyService.subscribeToAutopilot({
      onStoryUpdated: (updated) => {
        setStories((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      },
    });
    return () => unsub();
  }, []);

  const genres = useMemo(
    () => ['All', ...Array.from(new Set(stories.map((s) => s.genre)))],
    [stories]
  );

  const filteredStories = useMemo(
    () => (activeGenre === 'All' ? stories : stories.filter((s) => s.genre === activeGenre)),
    [stories, activeGenre]
  );

  const carouselSlides: LensSlide[] = useMemo(
    () =>
      filteredStories.map((story) => {
        const steeredCount = story.pages.filter((p) => p.steeredBy).length;
        return {
          title: story.title,
          kicker: `${story.genre} · ${story.pages.length} pages${
            steeredCount > 0 ? ` · ${steeredCount} steered` : ''
          }`,
          caption: story.subtitle,
          image: story.coverUrl,
          alt: `Cover art for ${story.title}`,
        };
      }),
    [filteredStories]
  );

  const safeCatalogIndex =
    filteredStories.length > 0 ? Math.min(activeCatalogIndex, filteredStories.length - 1) : 0;
  const activeStory = filteredStories[safeCatalogIndex] ?? null;

  const handleGenreChange = (genre: string) => {
    setActiveGenre(genre);
    setActiveCatalogIndex(0);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await storyService.deleteStory(id);
      setStories((prev) => prev.filter((s) => s.id !== id));
      setActiveCatalogIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete story.');
    }
  };

  return (
    <div className="w-full min-w-0 bg-black text-white">
      {/* Gallery Hero */}
      <section className="mx-auto max-w-7xl px-8 pt-10 pb-16 lg:pt-14 lg:pb-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">
              Reader-Signal Autopilot · Generative Editions
            </p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-[4.25rem] font-normal tracking-tight text-white leading-[1.04] [text-wrap:balance]">
              Stories that sense when a reader drifts.
            </h1>
            <p className="max-w-lg text-sm sm:text-base leading-relaxed text-white/65">
              Prompt a complete illustrated storybook with a persistent Story Bible. Passive dwell, skips, and rereads feed a closed telemetry loop that nudges the prompter—or quietly steers the next page.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button size="lg" variant="primary" onClick={() => navigate(RoutePath.STUDIO)}>
                Generate a Storybook
                <ArrowRight size={16} className="ml-2" />
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() =>
                  navigate(`/read/${stories[0]?.id || 'clockwork-sentinel'}`)
                }
              >
                Open Live Reader
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-[#101014]">
              <img
                src="/src/assets/images/studio_hero_desk_1795118106089.jpg"
                alt="Open illustrated storybook manuscript on a writing table"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Full-Width Minimal Metrics Strip */}
      <section className="border-y border-white/10 bg-black">
        <div className="mx-auto max-w-7xl px-8 py-9">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                Published Editions
              </p>
              <p className="mt-2 font-mono-tabular text-3xl font-semibold text-white">
                {metrics ? metrics.totalStories : '—'}
              </p>
              <p className="mt-1 text-xs text-white/55">With structured Story Bibles</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                Passive Reader Events
              </p>
              <p className="mt-2 font-mono-tabular text-3xl font-semibold text-white">
                {metrics ? metrics.totalEvents : '—'}
              </p>
              <p className="mt-1 text-xs text-white/55">Dwell, skips, rereads & edits</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                Trouble Triggers Caught
              </p>
              <p className="mt-2 font-mono-tabular text-3xl font-semibold text-[#F59E0B]">
                {metrics ? metrics.troubleTriggersCaught : '—'}
              </p>
              <p className="mt-1 text-xs text-white/55">Threshold crossings detected</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                Autopilot Steers
              </p>
              <p className="mt-2 font-mono-tabular text-3xl font-semibold text-white">
                {metrics ? metrics.quietAutoSteers + metrics.manualSteersApplied : '—'}
              </p>
              <p className="mt-1 text-xs text-white/55">
                {metrics
                  ? `${metrics.quietAutoSteers} quiet · ${metrics.manualSteersApplied} prompter`
                  : 'Next-page revisions'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Storybook Catalog */}
      <section className="mx-auto max-w-7xl px-8 py-16 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">
              Edition Archive
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-white">
              Storybook Catalog
            </h2>
            <p className="text-sm text-white/60">
              Drag across editions or select the centered volume to open Reader View and emit live telemetry.
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-[#101014] p-1 overflow-x-auto border border-white/10">
            {genres.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => handleGenreChange(genre)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeGenre === genre
                    ? 'bg-white text-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="h-[580px] animate-pulse rounded-2xl border border-white/10 bg-[#0A0A0D]" />
        ) : filteredStories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/20 bg-[#0A0A0D] px-6 py-16 text-center">
            <h3 className="font-display text-xl font-semibold text-white">
              No storybooks in this shelf yet
            </h3>
            <p className="mt-2 text-sm text-white/60">
              Create a new illustrated storybook from a prompt to begin collecting reader signals.
            </p>
            <div className="mt-6">
              <Button onClick={() => navigate(RoutePath.STUDIO)}>Generate First Story</Button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0D]">
            <CurvedLensCarousel
              slides={carouselSlides}
              label="Storybook Catalog"
              bend={0.55}
              background="#0A0A0D"
              ink="#FFFFFF"
              height="clamp(500px, 68vh, 620px)"
              activeIndex={safeCatalogIndex}
              onChange={setActiveCatalogIndex}
              onSlideClick={(idx) => {
                const targetStory = filteredStories[idx];
                if (targetStory) navigate(`/read/${targetStory.id}`);
              }}
            />

            {activeStory && (
              <div className="border-t border-white/10 bg-[#0A0A0D] px-6 py-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-white/45">
                      <span className="font-mono-tabular font-semibold text-white">
                        {pad2(safeCatalogIndex + 1)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{activeStory.genre}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{activeStory.pages.length} pages</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">
                        {activeStory.storyBible?.toneRules || activeStory.audience}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white truncate">
                      {activeStory.title} —{' '}
                      <span className="font-normal text-white/60">
                        {activeStory.storyBible?.setting || activeStory.subtitle}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => navigate(`/read/${activeStory.id}`)}
                    >
                      <BookOpen size={14} className="mr-1.5" />
                      Read Edition
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/studio/${activeStory.id}`)}
                    >
                      <Sliders size={14} className="mr-1.5" />
                      Open Studio
                    </Button>
                    {!SEEDED_STORY_IDS.includes(activeStory.id) && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, activeStory.id)}
                        aria-label={`Delete ${activeStory.title}`}
                        className="rounded-md p-2 text-white/45 hover:bg-red-950/50 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {filteredStories.length > 1 && (
                  <div className="mt-4 flex items-center gap-6 overflow-x-auto border-t border-white/10 pt-3.5">
                    {filteredStories.map((story, idx) => {
                      const isCurrent = idx === safeCatalogIndex;
                      return (
                        <button
                          key={story.id}
                          type="button"
                          onClick={() => setActiveCatalogIndex(idx)}
                          className={`group flex items-center gap-2 border-b-2 pb-1 text-left text-xs whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                            isCurrent
                              ? 'border-white font-semibold text-white'
                              : 'border-transparent text-white/45 hover:text-white'
                          }`}
                        >
                          <span className="font-mono-tabular opacity-70">{pad2(idx + 1)}</span>
                          <span>{story.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
