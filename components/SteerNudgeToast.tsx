import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, X, ArrowRight, Check, Clock } from 'lucide-react';
import { SteerSuggestion } from '../types';
import { storyService } from '../services/storyService';

interface SteerNudgeToastProps {
  suggestion: SteerSuggestion;
  storyTitle?: string;
  onResolved: (suggestion: SteerSuggestion) => void;
  onDismissed: (suggestionId: string) => void;
}

export const SteerNudgeToast: React.FC<SteerNudgeToastProps> = ({
  suggestion,
  storyTitle,
  onResolved,
  onDismissed,
}) => {
  const navigate = useNavigate();
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    Math.max(0, Math.ceil((new Date(suggestion.autoApplyAt).getTime() - Date.now()) / 1000))
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(suggestion.autoApplyAt).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, [suggestion.autoApplyAt]);

  const handleApply = async (optionId: string) => {
    setApplyingId(optionId);
    setError(null);
    try {
      const res = await storyService.applySuggestion(suggestion.id, optionId);
      onResolved(res.suggestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to apply steer');
    } finally {
      setApplyingId(null);
    }
  };

  const handleDismiss = async () => {
    try {
      await storyService.dismissSuggestion(suggestion.id);
      onDismissed(suggestion.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to dismiss');
    }
  };

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 w-full max-w-md rounded-xl border border-white/15 bg-[#101014] p-5 text-white shadow-2xl"
    >
      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-[#F59E0B]">
            <Compass size={14} />
            <span>Steer the story?</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">Score {suggestion.engagementScoreAtTrigger}/100</span>
          </div>
          <h4 className="font-display text-base font-semibold text-white">
            {storyTitle ? `${storyTitle} — ` : ''}Page {suggestion.targetPageIndex + 1}
          </h4>
          <p className="text-xs leading-relaxed text-white/60">{suggestion.triggerReason}</p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss steering nudge"
          className="rounded-md p-1.5 text-white/45 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-3.5 space-y-2">
        {suggestion.options.map((opt) => {
          const isApplying = applyingId === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={applyingId !== null}
              onClick={() => handleApply(opt.id)}
              className="w-full rounded-lg border border-white/10 bg-[#18181D] p-3 text-left transition-colors hover:border-white hover:bg-[#1F1F26] disabled:opacity-60 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-white">
                  {opt.label}
                  {opt.confidenceRank === 1 ? ' · Top Match' : ''}
                </span>
                <span className="text-xs text-white/60 flex items-center gap-1 whitespace-nowrap shrink-0">
                  {isApplying ? 'Applying...' : 'Apply'}
                  {isApplying ? <Check size={12} /> : <ArrowRight size={12} />}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-white">{opt.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/60 line-clamp-2">
                {opt.previewHook}
              </p>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-2.5 text-xs text-[#FCA5A5]">{error}</p>}

      <div className="mt-3.5 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/50">
        <span className="flex items-center gap-1.5 font-mono-tabular">
          <Clock size={12} />
          {secondsLeft > 0
            ? `Auto-steers top option in ${secondsLeft}s`
            : 'Quietly auto-applying top option...'}
        </span>
        <button
          type="button"
          onClick={() => navigate(`/studio/${suggestion.storyId}`)}
          className="font-medium text-white hover:underline whitespace-nowrap shrink-0 cursor-pointer"
        >
          Open Studio
        </button>
      </div>
    </aside>
  );
};
