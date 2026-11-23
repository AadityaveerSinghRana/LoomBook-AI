import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Edit3,
  Sliders,
  FastForward,
  LogOut,
  Check,
  Compass,
} from 'lucide-react';
import { Story, SteerSuggestion, ReaderEventType } from '../types';
import { storyService } from '../services/storyService';
import { Button } from '../components/ui/Button';

export const ReaderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [dwellSeconds, setDwellSeconds] = useState(0);
  const [lastSignalNote, setLastSignalNote] = useState<string>('Passive reader telemetry armed');
  const [regenerating, setRegenerating] = useState(false);
  const [isEditingLine, setIsEditingLine] = useState(false);
  const [editDraft, setEditDraft] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [liveSteerBanner, setLiveSteerBanner] = useState<SteerSuggestion | null>(null);

  const sessionIdRef = useRef(`reader-${Math.random().toString(36).slice(2, 9)}`);
  const pageEnteredAtRef = useRef<number>(Date.now());

  const loadStory = async (storyId: string) => {
    setLoading(true);
    try {
      const res = await storyService.getStoryDetail(storyId);
      setStory(res.story);
      setPageIndex(0);
      pageEnteredAtRef.current = Date.now();
      setDwellSeconds(0);
      await storyService.logReaderEvent({
        storyId,
        pageIndex: 0,
        sessionId: sessionIdRef.current,
        eventType: 'page_view',
        dwellMs: 0,
      });
    } catch (err) {
      setLastSignalNote(err instanceof Error ? err.message : 'Unable to load storybook.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    void loadStory(id);

    const unsub = storyService.subscribeToAutopilot({
      onStoryUpdated: (updated) => {
        if (updated.id === id) {
          setStory(updated);
        }
      },
      onSuggestionCreated: (sugg) => {
        if (sugg.storyId === id) {
          setLiveSteerBanner(sugg);
        }
      },
      onSuggestionResolved: (resolved) => {
        if (resolved.storyId === id) {
          setLiveSteerBanner(null);
        }
      },
    });
    return () => unsub();
  }, [id]);

  // Live passive dwell clock
  useEffect(() => {
    const timer = setInterval(() => {
      setDwellSeconds(Math.floor((Date.now() - pageEnteredAtRef.current) / 1000));
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const recordDepartureAndMove = async (nextIndex: number, direction: 'forward' | 'back') => {
    if (!story) return;
    const elapsedMs = Date.now() - pageEnteredAtRef.current;
    let eventType: ReaderEventType = 'dwell';
    if (direction === 'back') {
      eventType = 'reread';
    } else if (elapsedMs < 4000) {
      eventType = 'fast_skip';
    }

    setPageIndex(nextIndex);
    pageEnteredAtRef.current = Date.now();
    setDwellSeconds(0);
    setIsEditingLine(false);

    try {
      const res = await storyService.logReaderEvent({
        storyId: story.id,
        pageIndex,
        sessionId: sessionIdRef.current,
        eventType,
        dwellMs: elapsedMs,
      });
      setLastSignalNote(
        `Logged ${eventType} on Page ${pageIndex + 1} (${(elapsedMs / 1000).toFixed(1)}s) · Score ${
          res.score.engagementScore
        }/100`
      );
      if (res.suggestion) {
        setLiveSteerBanner(res.suggestion);
      }
      await storyService.logReaderEvent({
        storyId: story.id,
        pageIndex: nextIndex,
        sessionId: sessionIdRef.current,
        eventType: 'page_view',
        dwellMs: 0,
      });
    } catch {
      // keep reading fluid
    }
  };

  const handleRegenerateCurrentPage = async () => {
    if (!story) return;
    setRegenerating(true);
    try {
      const res = await storyService.regeneratePage(
        story.id,
        pageIndex,
        'Reader requested a fresher, more vivid variation of this page.',
        sessionIdRef.current
      );
      setStory(res.story);
      setLastSignalNote(
        `Logged regenerate on Page ${pageIndex + 1} · Score ${res.score.engagementScore}/100`
      );
      if (res.suggestion) {
        setLiveSteerBanner(res.suggestion);
      }
    } catch (err) {
      setLastSignalNote(err instanceof Error ? err.message : 'Regeneration failed');
    } finally {
      setRegenerating(false);
    }
  };

  const handleSaveReaderEdit = async () => {
    if (!story) return;
    try {
      const res = await storyService.updatePage(story.id, pageIndex, {
        prose: editDraft,
        sessionId: sessionIdRef.current,
      });
      setStory(res.story);
      setIsEditingLine(false);
      setLastSignalNote(`Saved inline edit on Page ${pageIndex + 1} and logged edit signal.`);
    } catch (err) {
      setLastSignalNote(err instanceof Error ? err.message : 'Failed to save edit.');
    }
  };

  const handleSimulateTwoFastSkips = async () => {
    if (!story) return;
    setSimulating(true);
    setLastSignalNote('Recording two consecutive fast skips (<4s) to test Autopilot...');
    try {
      await storyService.logReaderEvent({
        storyId: story.id,
        pageIndex,
        sessionId: 'sim-reader-1',
        eventType: 'fast_skip',
        dwellMs: 1750,
      });
      const res = await storyService.logReaderEvent({
        storyId: story.id,
        pageIndex,
        sessionId: 'sim-reader-2',
        eventType: 'fast_skip',
        dwellMs: 1420,
      });
      if (res.suggestion) {
        setLiveSteerBanner(res.suggestion);
        setLastSignalNote(
          `Trouble threshold crossed on Page ${pageIndex + 1}! Edge Function generated 3 steering options for Page ${
            res.suggestion.targetPageIndex + 1
          }.`
        );
      } else {
        setLastSignalNote(
          `2 fast skips recorded on Page ${pageIndex + 1} · Score ${res.score.engagementScore}/100`
        );
      }
    } catch (err) {
      setLastSignalNote(err instanceof Error ? err.message : 'Simulation failed.');
    } finally {
      setSimulating(false);
    }
  };

  const handleAbandonSession = async () => {
    if (!story) return;
    setSimulating(true);
    try {
      const elapsedMs = Date.now() - pageEnteredAtRef.current;
      const res = await storyService.logReaderEvent({
        storyId: story.id,
        pageIndex,
        sessionId: sessionIdRef.current,
        eventType: 'session_abandon',
        dwellMs: elapsedMs,
      });
      if (res.suggestion) {
        setLiveSteerBanner(res.suggestion);
      }
      setLastSignalNote(
        `Session abandon logged on Page ${pageIndex + 1} · Autopilot trouble trigger fired.`
      );
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-20 text-sm text-white/60">
        Opening storybook edition...
      </div>
    );
  }

  if (!story) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-20 text-center space-y-4">
        <h2 className="font-display text-2xl font-semibold text-white">Storybook not found</h2>
        <Button onClick={() => navigate('/')}>Back to Library</Button>
      </div>
    );
  }

  const currentPage = story.pages[pageIndex] || story.pages[0];
  const paragraphs = currentPage.prose.split(/\n+/).filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl px-8 py-10 space-y-8 bg-black text-white">
      {/* Quiet Top Context */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3 text-xs text-white/50">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 font-medium text-white/65 hover:text-white cursor-pointer"
          >
            <ArrowLeft size={14} />
            Library
          </button>
          <span aria-hidden="true">·</span>
          <span className="text-white font-medium">{story.title}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular">
            Page {pageIndex + 1} of {story.pages.length}
          </span>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate(`/studio/${story.id}`)}
        >
          <Sliders size={13} className="mr-1.5" />
          Open Prompter Studio
        </Button>
      </div>

      {/* Live Autopilot Alert if Triggered */}
      {liveSteerBanner && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#101014] px-5 py-3.5 text-sm">
          <div className="flex items-start gap-2.5 text-white">
            <Compass size={17} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">
                Reader-Signal Autopilot nudged the Prompter for Page{' '}
                {liveSteerBanner.targetPageIndex + 1}
              </p>
              <p className="text-xs text-white/60">
                {liveSteerBanner.triggerReason} — 3 subtle options queued (auto-applies if unanswered).
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate(`/studio/${story.id}`)}
          >
            View Nudge in Studio
          </Button>
        </div>
      )}

      {/* Literary Book Spread */}
      <article className="rounded-2xl border border-white/10 bg-[#0A0A0D] px-7 py-10 sm:px-14 sm:py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 items-start">
          {/* Cover / Scene Plate */}
          <div className="md:col-span-4 space-y-3">
            <div className="aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-[#141418]">
              <img
                src={story.coverUrl}
                alt={story.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-xs leading-relaxed text-white/45">
              Illustration cue: {currentPage.illustrationCue || story.subtitle}
            </p>
          </div>

          {/* Prose Column */}
          <div className="md:col-span-8 space-y-6">
            <div className="space-y-1.5 border-b border-white/10 pb-5">
              <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-white/45">
                <span>Chapter {pageIndex + 1}</span>
                {currentPage.steeredBy && (
                  <span className="font-medium text-white normal-case tracking-normal">
                    {currentPage.steeredBy === 'autopilot'
                      ? 'Steered quietly by Autopilot'
                      : 'Edited'}
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-white">
                {currentPage.chapterTitle}
              </h1>
            </div>

            {isEditingLine ? (
              <div className="space-y-3">
                <textarea
                  rows={8}
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-black p-4 font-display text-base leading-relaxed text-white focus:border-white focus:outline-none"
                />
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingLine(false)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" variant="primary" onClick={handleSaveReaderEdit}>
                    <Check size={13} className="mr-1.5" />
                    Save Passage
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 font-display text-lg leading-[1.8] text-white/90">
                {paragraphs.map((para, idx) => (
                  <p key={idx} className={idx === 0 ? 'drop-cap' : ''}>
                    {para}
                  </p>
                ))}
              </div>
            )}

            {/* Page Turn Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pageIndex === 0}
                  onClick={() => recordDepartureAndMove(pageIndex - 1, 'back')}
                >
                  <ArrowLeft size={14} className="mr-1.5" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={pageIndex >= story.pages.length - 1}
                  onClick={() => recordDepartureAndMove(pageIndex + 1, 'forward')}
                >
                  Next Page
                  <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditDraft(currentPage.prose);
                    setIsEditingLine((v) => !v);
                  }}
                >
                  <Edit3 size={13} className="mr-1.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  isLoading={regenerating}
                  onClick={handleRegenerateCurrentPage}
                >
                  <RefreshCw size={13} className="mr-1.5" />
                  Regenerate
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Passive Signal Monitor & Author Test Strip */}
      <section className="rounded-xl border border-white/10 bg-[#0A0A0D] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <span className="font-medium text-white">Passive Signal Recorder</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">Page dwell: {dwellSeconds}s</span>
              <span aria-hidden="true">·</span>
              <span>Fast-skip threshold &lt; 4s</span>
            </div>
            <p className="text-xs text-white/60">{lastSignalNote}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="secondary"
              isLoading={simulating}
              onClick={handleSimulateTwoFastSkips}
            >
              <FastForward size={13} className="mr-1.5 text-[#F59E0B]" />
              Simulate 2 Fast Skips
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={simulating}
              onClick={handleAbandonSession}
            >
              <LogOut size={13} className="mr-1.5 text-red-400" />
              Simulate Abandon
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
