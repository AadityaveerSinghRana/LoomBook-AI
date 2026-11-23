import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BookOpen,
  Compass,
  RefreshCw,
  Save,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import {
  Story,
  PageEngagementScore,
  SteerSuggestion,
  ReaderEvent,
  LlmProvider,
  RoutePath,
} from '../types';
import { storyService } from '../services/storyService';
import { Button } from '../components/ui/Button';

const PROMPT_STARTERS = [
  {
    label: 'The Whispering Observatory',
    prompt:
      'A young glassblower in a mountain village crafts lenses that let people see yesterday’s clouds, until an old astronomer commissions a lens to find a missing comet.',
    genre: 'Poetic Fantasy',
    tone: 'Luminous & Curious',
  },
  {
    label: 'The Night-Train Cartographer',
    prompt:
      'Every midnight, a miniature brass train circles a sleeping bookshop, mapping lost chapters onto silver tickets for insomniac readers.',
    genre: 'Whimsical Mystery',
    tone: 'Atmospheric & Warm',
  },
  {
    label: 'Salt & Cedar',
    prompt:
      'Two siblings inherit an abandoned tidal lighthouse whose beam changes color whenever an unwritten letter washes into the cove.',
    genre: 'Maritime Speculative',
    tone: 'Quiet Suspense',
  },
];

export const StudioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Generator state
  const [prompt, setPrompt] = useState(PROMPT_STARTERS[0].prompt);
  const [genre, setGenre] = useState(PROMPT_STARTERS[0].genre);
  const [audience, setAudience] = useState('All Ages');
  const [tone, setTone] = useState(PROMPT_STARTERS[0].tone);
  const [pageCount, setPageCount] = useState(5);
  const [provider, setProvider] = useState<LlmProvider>('gemini-4-hydrogen');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Studio cockpit state
  const [story, setStory] = useState<Story | null>(null);
  const [scores, setScores] = useState<PageEngagementScore[]>([]);
  const [suggestions, setSuggestions] = useState<SteerSuggestion[]>([]);
  const [events, setEvents] = useState<ReaderEvent[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [bibleOpen, setBibleOpen] = useState(false);

  // Page editor state
  const [draftTitle, setDraftTitle] = useState('');
  const [draftProse, setDraftProse] = useState('');
  const [regenGuidance, setRegenGuidance] = useState('');
  const [savingPage, setSavingPage] = useState(false);
  const [regeneratingPage, setRegeneratingPage] = useState(false);
  const [applyingOptionId, setApplyingOptionId] = useState<string | null>(null);
  const [studioNotice, setStudioNotice] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());

  const loadDetail = async (storyId: string) => {
    setLoadingDetail(true);
    try {
      const data = await storyService.getStoryDetail(storyId);
      setStory(data.story);
      setScores(data.scores);
      setSuggestions(data.suggestions);
      setEvents(data.events);
      const current = data.story.pages[activePageIndex] || data.story.pages[0];
      if (current) {
        setDraftTitle(current.chapterTitle);
        setDraftProse(current.prose);
      }
    } catch (err) {
      setStudioNotice(err instanceof Error ? err.message : 'Unable to load story studio.');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (!id) {
      setStory(null);
      return;
    }
    void loadDetail(id);
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!id) return;
    const unsub = storyService.subscribeToAutopilot({
      onEngagementUpdated: (score) => {
        if (score.storyId !== id) return;
        setScores((prev) => {
          const idx = prev.findIndex((s) => s.pageIndex === score.pageIndex);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = score;
            return copy;
          }
          return [...prev, score].sort((a, b) => a.pageIndex - b.pageIndex);
        });
      },
      onSuggestionCreated: (suggestion) => {
        if (suggestion.storyId !== id) return;
        setSuggestions((prev) => [suggestion, ...prev.filter((s) => s.id !== suggestion.id)]);
      },
      onSuggestionResolved: (resolved) => {
        if (resolved.storyId !== id) return;
        setSuggestions((prev) => prev.map((s) => (s.id === resolved.id ? resolved : s)));
      },
      onStoryUpdated: (updated) => {
        if (updated.id !== id) return;
        setStory(updated);
        const page = updated.pages[activePageIndex];
        if (page) {
          setDraftTitle(page.chapterTitle);
          setDraftProse(page.prose);
        }
      },
    });
    return () => unsub();
  }, [id, activePageIndex]);

  const handleSelectPage = (index: number) => {
    setActivePageIndex(index);
    const page = story?.pages[index];
    if (page) {
      setDraftTitle(page.chapterTitle);
      setDraftProse(page.prose);
    }
  };

  const handleGenerateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await storyService.generateStory({
        prompt,
        genre,
        audience,
        tone,
        pageCount,
        provider,
      });
      navigate(`/studio/${res.story.id}`);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Story generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePage = async () => {
    if (!story) return;
    setSavingPage(true);
    setStudioNotice(null);
    try {
      const res = await storyService.updatePage(story.id, activePageIndex, {
        chapterTitle: draftTitle,
        prose: draftProse,
      });
      setStory(res.story);
      setStudioNotice(`Saved edits to Page ${activePageIndex + 1} and logged edit signal.`);
      await loadDetail(story.id);
    } catch (err) {
      setStudioNotice(err instanceof Error ? err.message : 'Failed to save edits.');
    } finally {
      setSavingPage(false);
    }
  };

  const handleRegeneratePage = async () => {
    if (!story) return;
    setRegeneratingPage(true);
    setStudioNotice(null);
    try {
      const res = await storyService.regeneratePage(
        story.id,
        activePageIndex,
        regenGuidance || 'Sharpen narrative momentum and sensory clarity.'
      );
      setStory(res.story);
      setDraftTitle(res.page.chapterTitle);
      setDraftProse(res.page.prose);
      setRegenGuidance('');
      setStudioNotice(`Regenerated Page ${activePageIndex + 1} with LLM.`);
      await loadDetail(story.id);
    } catch (err) {
      setStudioNotice(err instanceof Error ? err.message : 'Regeneration failed.');
    } finally {
      setRegeneratingPage(false);
    }
  };

  const handleApplyOption = async (suggestionId: string, optionId: string) => {
    if (!story) return;
    setApplyingOptionId(optionId);
    setStudioNotice(null);
    try {
      const res = await storyService.applySuggestion(suggestionId, optionId);
      setStudioNotice(
        `Applied "${res.updatedPage.lastSteerNote}" to Page ${res.updatedPage.pageIndex + 1}.`
      );
      await loadDetail(story.id);
    } catch (err) {
      setStudioNotice(err instanceof Error ? err.message : 'Failed to apply steering option.');
    } finally {
      setApplyingOptionId(null);
    }
  };

  const handleDismissSuggestion = async (suggestionId: string) => {
    if (!story) return;
    await storyService.dismissSuggestion(suggestionId);
    await loadDetail(story.id);
  };

  // Mode 1: Prompt Generator Studio
  if (!id) {
    return (
      <div className="mx-auto max-w-5xl px-8 py-12 space-y-10 bg-black text-white">
        <div className="border-b border-white/10 pb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/45">Public LLM Generator</p>
          <h1 className="mt-2 font-display text-3xl sm:text-5xl font-normal tracking-tight text-white">
            Compose a New Storybook
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
            Provide a narrative prompt. The server drafts a cohesive Story Bible alongside illustrated page spreads and arms the Reader-Signal Autopilot from page one.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <form onSubmit={handleGenerateStory} className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="story-prompt" className="text-xs font-medium text-white/65">
                  Story Prompt
                </label>
                <span className="text-xs text-white/45">Quick starters below</span>
              </div>
              <textarea
                id="story-prompt"
                rows={4}
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your character, setting, and central mystery..."
                className="w-full rounded-xl border border-white/15 bg-[#0A0A0D] p-4 text-sm leading-relaxed text-white placeholder:text-white/35 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/15"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {PROMPT_STARTERS.map((starter) => (
                  <button
                    key={starter.label}
                    type="button"
                    onClick={() => {
                      setPrompt(starter.prompt);
                      setGenre(starter.genre);
                      setTone(starter.tone);
                    }}
                    className="rounded-md border border-white/15 bg-[#0A0A0D] px-2.5 py-1 text-xs font-medium text-white/65 hover:border-white hover:text-white transition-colors cursor-pointer"
                  >
                    {starter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="story-genre" className="text-xs font-medium text-white/65">
                  Genre
                </label>
                <input
                  id="story-genre"
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#0A0A0D] px-3.5 py-2.5 text-sm text-white focus:border-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="story-audience" className="text-xs font-medium text-white/65">
                  Audience
                </label>
                <select
                  id="story-audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#0A0A0D] px-3.5 py-2.5 text-sm text-white focus:border-white focus:outline-none"
                >
                  <option value="Children (6–9)">Children (6–9)</option>
                  <option value="Middle Grade">Middle Grade</option>
                  <option value="All Ages">All Ages</option>
                  <option value="Young Adult">Young Adult</option>
                  <option value="Adult Literary">Adult Literary</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="story-tone" className="text-xs font-medium text-white/65">
                  Narrative Tone
                </label>
                <input
                  id="story-tone"
                  type="text"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#0A0A0D] px-3.5 py-2.5 text-sm text-white focus:border-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="story-pages" className="text-xs font-medium text-white/65">
                  Page Count ({pageCount} pages)
                </label>
                <input
                  id="story-pages"
                  type="range"
                  min={3}
                  max={8}
                  value={pageCount}
                  onChange={(e) => setPageCount(Number(e.target.value))}
                  className="w-full accent-white mt-2"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="story-llm" className="text-xs font-medium text-white/65">
                Public LLM Engine (Free Credits)
              </label>
              <select
                id="story-llm"
                value={provider}
                onChange={(e) => setProvider(e.target.value as LlmProvider)}
                className="w-full rounded-lg border border-white/15 bg-[#0A0A0D] px-3.5 py-2.5 text-sm text-white focus:border-white focus:outline-none"
              >
                <option value="gemini-4-hydrogen">
                  Google Gemini 4 Hydrogen (Server-Side Free Tier)
                </option>
                <option value="pollinations-openai">
                  Pollinations Public Text LLM (Zero-Key Open Endpoint)
                </option>
              </select>
            </div>

            {genError && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-300">
                {genError}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" size="lg" variant="primary" isLoading={generating}>
                {generating ? 'Drafting Story Bible & Pages...' : 'Generate Storybook'}
                {!generating && <ArrowRight size={16} className="ml-2" />}
              </Button>
            </div>
          </form>

          <aside className="lg:col-span-5 space-y-6 rounded-xl border border-white/10 bg-[#0A0A0D] p-6 h-fit">
            <h2 className="font-display text-lg font-semibold text-white">
              What gets built automatically
            </h2>
            <div className="space-y-5 text-sm text-white/60">
              <div className="border-b border-white/10 pb-4">
                <p className="font-medium text-white">01. Persistent Story Bible</p>
                <p className="mt-1 leading-relaxed">
                  Locks in your protagonist, setting, tone constraints, and overarching plot arc so future Autopilot steers never break continuity.
                </p>
              </div>
              <div className="border-b border-white/10 pb-4">
                <p className="font-medium text-white">02. Multi-Page Literary Spreads</p>
                <p className="mt-1 leading-relaxed">
                  Each page includes a chapter title, readable prose, illustration cue, and pacing intent ready for the distraction-free Reader View.
                </p>
              </div>
              <div>
                <p className="font-medium text-white">03. Armed Reader-Signal Autopilot</p>
                <p className="mt-1 leading-relaxed">
                  Fast skips, abandons, and regenerations automatically trigger the Edge Function to propose 3 subtle steering options in real time.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // Mode 2: Story Studio + Autopilot Cockpit
  if (loadingDetail && !story) {
    return (
      <div className="mx-auto max-w-7xl px-8 py-16 text-sm text-white/60">
        Loading Prompter Studio...
      </div>
    );
  }

  if (!story) {
    return (
      <div className="mx-auto max-w-4xl px-8 py-16 text-center space-y-4">
        <h2 className="font-display text-2xl font-semibold text-white">Storybook not found</h2>
        <Button onClick={() => navigate(RoutePath.HOME)}>Return to Library</Button>
      </div>
    );
  }

  const activePage = story.pages[activePageIndex] || story.pages[0];
  const pendingSuggestions = suggestions.filter((s) => s.status === 'pending');
  const resolvedSuggestions = suggestions.filter((s) => s.status !== 'pending');

  return (
    <div className="mx-auto max-w-7xl px-8 py-10 space-y-8 bg-black text-white">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/45">
            <span>Prompter Studio</span>
            <span aria-hidden="true">·</span>
            <span>{story.genre}</span>
            <span aria-hidden="true">·</span>
            <span>{story.llmProvider}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-white">
            {story.title}
          </h1>
          <p className="text-sm text-white/60">{story.subtitle}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/read/${story.id}`)}
          >
            <BookOpen size={14} className="mr-1.5" />
            Open Reader View
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(RoutePath.STUDIO)}
          >
            <Plus size={14} className="mr-1.5" />
            New Story
          </Button>
        </div>
      </div>

      {studioNotice && (
        <div className="rounded-xl border border-white/15 bg-[#101014] px-4 py-3 text-sm text-white">
          {studioNotice}
        </div>
      )}

      {/* Main 12-Column Split */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left 7 Cols: Story Bible + Manuscript Editor */}
        <div className="lg:col-span-7 space-y-6">
          {/* Collapsible Story Bible */}
          <div className="rounded-xl border border-white/10 bg-[#0A0A0D]">
            <button
              type="button"
              onClick={() => setBibleOpen((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-4 text-left cursor-pointer"
            >
              <div>
                <h2 className="text-sm font-semibold text-white">Story Bible</h2>
                <p className="text-xs text-white/50">
                  Continuity anchor read by the Edge Function when steering pages
                </p>
              </div>
              {bibleOpen ? (
                <ChevronUp size={18} className="text-white/60" />
              ) : (
                <ChevronDown size={18} className="text-white/60" />
              )}
            </button>
            {bibleOpen && (
              <div className="border-t border-white/10 px-5 py-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs leading-relaxed">
                <div>
                  <p className="font-semibold text-white">Premise</p>
                  <p className="mt-1 text-white/60">{story.storyBible.premise}</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Protagonist</p>
                  <p className="mt-1 text-white/60">{story.storyBible.protagonist}</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Setting</p>
                  <p className="mt-1 text-white/60">{story.storyBible.setting}</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Tone Rules</p>
                  <p className="mt-1 text-white/60">{story.storyBible.toneRules}</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Plot Arc</p>
                  <p className="mt-1 text-white/60">{story.storyBible.plotArc}</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Pacing Notes</p>
                  <p className="mt-1 text-white/60">{story.storyBible.pacingNotes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Page Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto rounded-lg bg-[#101014] border border-white/10 p-1">
            {story.pages.map((p) => {
              const pageScore = scores.find((s) => s.pageIndex === p.pageIndex);
              const isSelected = p.pageIndex === activePageIndex;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPage(p.pageIndex)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-white text-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span>Page {p.pageIndex + 1}</span>
                  {pageScore?.troubleTriggered && (
                    <AlertTriangle size={12} className="text-[#F59E0B]" />
                  )}
                  {p.steeredBy === 'autopilot' && (
                    <Compass size={12} className={isSelected ? 'text-black' : 'text-white'} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Page Editor */}
          {activePage && (
            <div className="rounded-xl border border-white/10 bg-[#0A0A0D] p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3.5 text-xs text-white/45">
                <span>
                  Page {activePage.pageIndex + 1} of {story.pages.length}
                </span>
                {activePage.lastSteerNote && (
                  <span className="font-medium text-white">
                    {activePage.steeredBy === 'autopilot' ? 'Quietly steered by Autopilot' : 'Steered'} · {activePage.lastSteerNote}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="chapter-title" className="text-xs font-medium text-white/65">
                  Chapter Title
                </label>
                <input
                  id="chapter-title"
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-black px-3.5 py-2 font-display text-xl font-semibold text-white focus:border-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="page-prose" className="text-xs font-medium text-white/65">
                  Page Prose
                </label>
                <textarea
                  id="page-prose"
                  rows={9}
                  value={draftProse}
                  onChange={(e) => setDraftProse(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-black p-4 text-[15px] leading-7 text-white focus:border-white focus:outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/10 pt-4">
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="text"
                    value={regenGuidance}
                    onChange={(e) => setRegenGuidance(e.target.value)}
                    placeholder="Optional rewrite direction (e.g., raise stakes)..."
                    className="w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-xs text-white placeholder:text-white/35 focus:border-white focus:outline-none"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleRegeneratePage}
                    isLoading={regeneratingPage}
                  >
                    <RefreshCw size={13} className="mr-1.5" />
                    Regenerate
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSavePage}
                  isLoading={savingPage}
                >
                  <Save size={13} className="mr-1.5" />
                  Save Edits
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Cols: Reader-Signal Autopilot Console */}
        <div className="lg:col-span-5 space-y-6">
          {/* Engagement Score Table */}
          <div className="rounded-xl border border-white/10 bg-[#0A0A0D] overflow-hidden">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-sm font-semibold text-white">
                Per-Page Engagement Rollup
              </h2>
              <p className="mt-0.5 text-xs text-white/50">
                Computed from reader_events · trouble triggers below 45 or 2 fast skips
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 bg-[#101014] text-white/50">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Page</th>
                    <th className="px-3 py-2.5 font-medium text-right">Score</th>
                    <th className="px-3 py-2.5 font-medium text-right">Avg Dwell</th>
                    <th className="px-3 py-2.5 font-medium text-right">Skips</th>
                    <th className="px-4 py-2.5 font-medium">Signal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {story.pages.map((p) => {
                    const row = scores.find((s) => s.pageIndex === p.pageIndex);
                    const scoreVal = row ? row.engagementScore : 72;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => handleSelectPage(p.pageIndex)}
                        className={`cursor-pointer transition-colors hover:bg-white/5 ${
                          activePageIndex === p.pageIndex ? 'bg-white/10' : ''
                        }`}
                      >
                        <td className="px-4 py-2.5 font-medium text-white">
                          P{p.pageIndex + 1}
                        </td>
                        <td
                          className={`px-3 py-2.5 text-right font-mono-tabular font-semibold ${
                            row?.troubleTriggered
                              ? 'text-[#F59E0B]'
                              : scoreVal >= 75
                              ? 'text-white'
                              : 'text-white/70'
                          }`}
                        >
                          {row ? `${scoreVal}/100` : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono-tabular text-white/60">
                          {row && row.avgDwellMs > 0
                            ? `${(row.avgDwellMs / 1000).toFixed(1)}s`
                            : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono-tabular text-white/60">
                          {row ? row.fastSkipCount : 0}
                        </td>
                        <td className="px-4 py-2.5">
                          {row?.troubleTriggered ? (
                            <span className="font-medium text-[#F59E0B]">Trouble</span>
                          ) : row ? (
                            <span className="font-medium text-white">Steady</span>
                          ) : (
                            <span className="text-white/35">No data</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Steering Suggestions */}
          <div className="rounded-xl border border-white/10 bg-[#0A0A0D] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Autopilot Steering Queue
                </h2>
                <p className="text-xs text-white/50">
                  Pushed via Realtime when trouble thresholds trip
                </p>
              </div>
              <span className="font-mono-tabular text-xs font-medium text-white/60">
                {pendingSuggestions.length} pending
              </span>
            </div>

            {pendingSuggestions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/15 bg-[#101014] p-4 text-xs leading-relaxed text-white/60">
                No pending steering nudges. Open{' '}
                <button
                  type="button"
                  onClick={() => navigate(`/read/${story.id}`)}
                  className="font-semibold text-white underline cursor-pointer"
                >
                  Reader View
                </button>{' '}
                and skip two pages quickly (or simulate friction) to watch the Edge Function generate live options.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingSuggestions.map((sugg) => {
                  const secondsLeft = Math.max(
                    0,
                    Math.ceil((new Date(sugg.autoApplyAt).getTime() - nowTick) / 1000)
                  );
                  return (
                    <div
                      key={sugg.id}
                      className="rounded-lg border border-white/10 bg-[#101014] p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-[#F59E0B]">
                            Steer Page {sugg.targetPageIndex + 1}?
                          </p>
                          <p className="mt-0.5 text-xs text-white/60">
                            {sugg.triggerReason}
                          </p>
                        </div>
                        <span className="flex items-center gap-1 font-mono-tabular text-xs text-white/50 shrink-0">
                          <Clock size={12} />
                          {secondsLeft}s
                        </span>
                      </div>

                      <div className="space-y-2">
                        {sugg.options.map((opt) => (
                          <div
                            key={opt.id}
                            className="rounded-lg border border-white/10 bg-[#141418] p-3 space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-white">
                                {opt.label}
                                {opt.confidenceRank === 1 ? ' · Recommended' : ''}
                              </span>
                              <Button
                                size="sm"
                                variant="primary"
                                isLoading={applyingOptionId === opt.id}
                                disabled={applyingOptionId !== null}
                                onClick={() => handleApplyOption(sugg.id, opt.id)}
                              >
                                Apply
                              </Button>
                            </div>
                            <p className="text-sm font-medium text-white">{opt.title}</p>
                            <p className="text-xs leading-relaxed text-white/60">
                              {opt.rationale}
                            </p>
                            <p className="text-xs italic text-white/50">
                              “{opt.previewHook}”
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-white/45">
                          Top option auto-applies if unanswered
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDismissSuggestion(sugg.id)}
                          className="font-medium text-white/60 hover:text-white cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {resolvedSuggestions.length > 0 && (
              <div className="border-t border-white/10 pt-4 space-y-2">
                <p className="text-xs font-medium text-white/45">Resolved Steers</p>
                {resolvedSuggestions.slice(0, 4).map((item) => {
                  const chosen = item.options.find((o) => o.id === item.selectedOptionId);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 text-xs text-white/60"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <CheckCircle2 size={13} className="text-white shrink-0" />
                        <span className="truncate">
                          P{item.targetPageIndex + 1}: {chosen?.title || item.status}
                        </span>
                      </span>
                      <span className="font-mono-tabular text-[11px] text-white/45 shrink-0">
                        {item.status === 'auto_applied' ? 'Quiet Auto-Steer' : item.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent reader_events Log */}
          <div className="rounded-xl border border-white/10 bg-[#0A0A0D] p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">Recent reader_events</h2>
            {events.length === 0 ? (
              <p className="text-xs text-white/45">No passive events logged yet.</p>
            ) : (
              <div className="max-h-56 overflow-y-auto divide-y divide-white/10">
                {events.slice(0, 12).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between py-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tabular font-medium text-white">
                        P{ev.pageIndex + 1}
                      </span>
                      <span
                        className={
                          ev.eventType === 'fast_skip' || ev.eventType === 'session_abandon'
                            ? 'font-medium text-[#F59E0B]'
                            : 'text-white/60'
                        }
                      >
                        {ev.eventType}
                      </span>
                    </div>
                    <span className="font-mono-tabular text-white/45">
                      {ev.dwellMs > 0 ? `${(ev.dwellMs / 1000).toFixed(1)}s` : 'instant'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
