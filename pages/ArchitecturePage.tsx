import React, { useEffect, useState } from 'react';
import { Copy, Check, Database, Zap, Radio, RefreshCw } from 'lucide-react';
import { storyService, SupabaseStatus } from '../services/storyService';
import { Button } from '../components/ui/Button';

const SQL_MIGRATION_SNIPPET = `-- 1. Passive Reader Events Table
create table if not exists public.reader_events (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  page_index int not null,
  session_id text not null,
  event_type text not null check (
    event_type in ('page_view', 'dwell', 'fast_skip', 'reread', 'regenerate', 'edit', 'session_abandon')
  ),
  dwell_ms integer not null default 0,
  created_at timestamptz not null default now()
);

-- 2. Trigger invokes Edge Function when trouble threshold crosses
create trigger trg_reader_events_autopilot
  after insert on public.reader_events
  for each row
  execute function public.fn_evaluate_reader_signal();

-- 3. pg_cron 1-minute rollup & quiet auto-apply sweep
select cron.schedule(
  'reader-signal-autopilot-minute-sweep',
  '* * * * *',
  $$ select public.rollup_story_page_engagement(story_id, page_index) ... $$
);

-- 4. Enable Supabase Realtime push to Prompter screen
alter publication supabase_realtime add table public.steer_suggestions;`;

const EDGE_FUNCTION_SNIPPET = `// supabase/functions/reader-signal-autopilot/index.ts
// Pulls story_bible + neighboring pages, asks Gemini for 3 steering options,
// writes to steer_suggestions, and quietly applies top option if unanswered.

const neighboringPages = pages.filter(
  (p) => Math.abs(p.page_index - trouble_page_index) <= 1
);

const options = await askLlmForSteeringOptions(
  geminiApiKey, story, neighboringPages,
  trouble_page_index, targetPageIndex, trigger_reason
);

await supabase.from("steer_suggestions").insert({
  story_id,
  trouble_page_index,
  target_page_index: targetPageIndex,
  trigger_reason,
  engagement_score_at_trigger: engagement_score,
  options,
  status: "pending",
  auto_apply_at: new Date(Date.now() + 45_000).toISOString(),
});`;

export const ArchitecturePage: React.FC = () => {
  const [status, setStatus] = useState<SupabaseStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [copiedBlock, setCopiedBlock] = useState<'sql' | 'edge' | null>(null);
  const [sweepResult, setSweepResult] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await storyService.getSupabaseStatus();
      setStatus(res);
    } catch {
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    void checkStatus();
  }, []);

  const copyText = async (which: 'sql' | 'edge', text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedBlock(which);
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  const runManualSweep = async () => {
    const res = await storyService.triggerSweep();
    setSweepResult(
      `Sweep completed: ${res.autoAppliedCount} expired suggestion(s) quietly applied.`
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-8 py-12 space-y-12 bg-black text-white">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/45">
            Supabase Architecture · Zero-Gap Feedback Loop
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-5xl font-normal tracking-tight text-white">
            Reader-Signal Autopilot Pipeline
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
            Every passive reader interaction flows through a closed Postgres, Edge Function, and Realtime loop. Below is the live runtime mode alongside the exact SQL migration and Deno Edge Function included in the repository.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="secondary" size="sm" onClick={checkStatus} isLoading={loadingStatus}>
            <RefreshCw size={14} className="mr-1.5" />
            Verify Supabase
          </Button>
          <Button variant="primary" size="sm" onClick={runManualSweep}>
            Run 60s Sweep Now
          </Button>
        </div>
      </div>

      {sweepResult && (
        <div className="rounded-xl border border-white/15 bg-[#101014] px-4 py-3 text-sm text-white">
          {sweepResult}
        </div>
      )}

      {/* Live Connection Status */}
      <section className="rounded-xl border border-white/10 bg-[#0A0A0D] p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <p className="text-xs text-white/45">Supabase Endpoint</p>
            <p className="mt-1 font-mono-tabular text-sm font-medium text-white truncate">
              {status?.projectUrl || 'https://wkkvehuckymlrsweyjjf.supabase.co'}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/45">Schema Provisioning</p>
            <p className="mt-1 text-sm font-medium text-white">
              {loadingStatus
                ? 'Checking remote tables...'
                : status?.schemaProvisioned
                ? 'Native Supabase tables active'
                : 'Mirroring locally until SQL migration is applied'}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/45">Realtime Push Channel</p>
            <p className="mt-1 text-sm font-medium text-white">
              {status?.schemaProvisioned
                ? 'Supabase Realtime + SSE Mirror'
                : 'Live SSE Stream + Supabase Channel Ready'}
            </p>
          </div>
        </div>
      </section>

      {/* 4-Step Pipeline Breakdown */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#0A0A0D] p-6 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Database size={15} />
            <span>01. Passive Telemetry & Postgres Rollup</span>
          </div>
          <h3 className="font-display text-lg font-semibold text-white">
            reader_events → page_engagement_scores
          </h3>
          <p className="text-sm leading-relaxed text-white/60">
            Reader View logs dwell duration, fast skips (&lt;4s), rereads, page regenerations, inline edits, and session abandons. A trigger (plus 1-minute <code className="font-mono text-xs text-white/80">pg_cron</code> job) computes each page’s 0–100 engagement score.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0A0A0D] p-6 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#F59E0B]">
            <Zap size={15} />
            <span>02. Trouble Threshold & Edge Function</span>
          </div>
          <h3 className="font-display text-lg font-semibold text-white">
            Story Bible + Neighboring Pages → Gemini LLM
          </h3>
          <p className="text-sm leading-relaxed text-white/60">
            Crossing a trouble threshold (2 consecutive fast skips, session abandon, or score &lt; 45) invokes the Edge Function. It pulls the Story Bible and neighboring pages to draft 3 subtle steering options: More Tension, Lighter Tone, and Plot Twist.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0A0A0D] p-6 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Radio size={15} />
            <span>03. Realtime Prompter Nudge</span>
          </div>
          <h3 className="font-display text-lg font-semibold text-white">
            steer_suggestions → Prompter Screen
          </h3>
          <p className="text-sm leading-relaxed text-white/60">
            New suggestions push immediately to the Prompter’s screen as a compact “Steer the story?” nudge with one-click previews of how the next page will open.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0A0A0D] p-6 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <RefreshCw size={15} />
            <span>04. Quiet Autopilot Fallback</span>
          </div>
          <h3 className="font-display text-lg font-semibold text-white">
            Unanswered Timer → Automatic Next-Page Steer
          </h3>
          <p className="text-sm leading-relaxed text-white/60">
            If no prompter responds before the countdown window closes, the Autopilot quietly applies the top-ranked steering option to the upcoming page while keeping Story Bible continuity intact.
          </p>
        </div>
      </section>

      {/* Code Artifacts */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#0A0A0D] overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
            <div>
              <h3 className="text-sm font-semibold text-white">
                supabase/migrations/001_storybook_autopilot.sql
              </h3>
              <p className="text-xs text-white/45">Schema, PL/pgSQL trigger, pg_cron & Realtime</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => copyText('sql', SQL_MIGRATION_SNIPPET)}
            >
              {copiedBlock === 'sql' ? (
                <>
                  <Check size={13} className="mr-1.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={13} className="mr-1.5" />
                  Copy SQL
                </>
              )}
            </Button>
          </div>
          <pre className="overflow-x-auto bg-[#050507] border-t border-white/10 p-5 font-mono text-xs leading-relaxed text-white/85">
            {SQL_MIGRATION_SNIPPET}
          </pre>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0A0A0D] overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
            <div>
              <h3 className="text-sm font-semibold text-white">
                supabase/functions/reader-signal-autopilot/index.ts
              </h3>
              <p className="text-xs text-white/45">Deno Edge Function for LLM steering & auto-apply</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => copyText('edge', EDGE_FUNCTION_SNIPPET)}
            >
              {copiedBlock === 'edge' ? (
                <>
                  <Check size={13} className="mr-1.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={13} className="mr-1.5" />
                  Copy Edge Fn
                </>
              )}
            </Button>
          </div>
          <pre className="overflow-x-auto bg-[#050507] border-t border-white/10 p-5 font-mono text-xs leading-relaxed text-white/85">
            {EDGE_FUNCTION_SNIPPET}
          </pre>
        </div>
      </section>
    </div>
  );
};
