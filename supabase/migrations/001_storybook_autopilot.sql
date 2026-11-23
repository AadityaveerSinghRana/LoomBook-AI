-- Loombook Reader-Signal Autopilot Migration
-- Run in Supabase SQL Editor to enable Postgres-native telemetry, pg_cron rollups,
-- Edge Function trouble triggers, and Supabase Realtime push notifications.

create extension if not exists pgcrypto;
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 1. Core Storybooks & Story Bible
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  subtitle text not null default '',
  genre text not null default 'Literary Fiction',
  audience text not null default 'All Ages',
  prompt text not null,
  llm_provider text not null default 'gemini-4-hydrogen',
  cover_url text,
  story_bible jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Individual Storybook Pages
create table if not exists public.story_pages (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  page_index int not null,
  chapter_title text not null,
  prose text not null,
  illustration_cue text not null default '',
  pacing_intent text not null default '',
  steered_by text check (steered_by in ('manual', 'autopilot')),
  last_steer_note text,
  updated_at timestamptz not null default now(),
  unique (story_id, page_index)
);

-- 3. Passive Reader Telemetry Stream
create table if not exists public.reader_events (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  page_index int not null,
  session_id text not null,
  event_type text not null check (
    event_type in ('page_view', 'dwell', 'fast_skip', 'reread', 'regenerate', 'edit', 'session_abandon')
  ),
  dwell_ms integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_reader_events_story_page
  on public.reader_events (story_id, page_index, created_at desc);

-- 4. Rolled-Up Per-Page Engagement Scores
create table if not exists public.page_engagement_scores (
  story_id uuid not null references public.stories(id) on delete cascade,
  page_index int not null,
  engagement_score numeric(5,2) not null default 72.0,
  avg_dwell_ms integer not null default 0,
  view_count integer not null default 0,
  fast_skip_count integer not null default 0,
  consecutive_fast_skips integer not null default 0,
  reread_count integer not null default 0,
  regenerate_count integer not null default 0,
  edit_count integer not null default 0,
  abandon_count integer not null default 0,
  trouble_triggered boolean not null default false,
  trouble_reason text,
  updated_at timestamptz not null default now(),
  primary key (story_id, page_index)
);

-- 5. LLM Steering Suggestions (Realtime-enabled)
create table if not exists public.steer_suggestions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  trouble_page_index int not null,
  target_page_index int not null,
  trigger_reason text not null,
  engagement_score_at_trigger numeric(5,2) not null,
  options jsonb not null default '[]'::jsonb,
  selected_option_id text,
  status text not null default 'pending' check (status in ('pending', 'applied', 'auto_applied', 'dismissed')),
  auto_apply_at timestamptz not null default (now() + interval '45 seconds'),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- 6. Rollup & Trouble-Threshold Function
create or replace function public.rollup_story_page_engagement(
  p_story_id uuid,
  p_page_index int
) returns void
language plpgsql
security definer
as $$
declare
  v_views int;
  v_fast_skips int;
  v_rereads int;
  v_regens int;
  v_edits int;
  v_abandons int;
  v_avg_dwell int;
  v_consec_skips int := 0;
  v_score numeric(5,2) := 72.0;
  v_trouble boolean := false;
  v_reason text := null;
  v_already_pending boolean := false;
  rec record;
begin
  select
    count(*) filter (where event_type = 'page_view'),
    count(*) filter (where event_type = 'fast_skip'),
    count(*) filter (where event_type = 'reread'),
    count(*) filter (where event_type = 'regenerate'),
    count(*) filter (where event_type = 'edit'),
    count(*) filter (where event_type = 'session_abandon'),
    coalesce(avg(dwell_ms) filter (where dwell_ms > 0), 0)::int
  into v_views, v_fast_skips, v_rereads, v_regens, v_edits, v_abandons, v_avg_dwell
  from public.reader_events
  where story_id = p_story_id
    and page_index = p_page_index;

  -- Check consecutive fast skips on latest events
  for rec in
    select event_type
    from public.reader_events
    where story_id = p_story_id and page_index = p_page_index
    order by created_at desc
    limit 4
  loop
    if rec.event_type = 'fast_skip' then
      v_consec_skips := v_consec_skips + 1;
    else
      exit;
    end if;
  end loop;

  -- Engagement scoring formula
  v_score := 72.0
    + least(v_rereads * 6, 18)
    + (case when v_avg_dwell between 12000 and 55000 then 8 else 0 end)
    - (v_fast_skips * 18)
    - (v_regens * 12)
    - (v_edits * 6)
    - (v_abandons * 30);

  v_score := greatest(0, least(100, v_score));

  if v_consec_skips >= 2 then
    v_trouble := true;
    v_reason := format('%s consecutive fast skips (<4s dwell)', v_consec_skips);
  elsif v_abandons >= 1 then
    v_trouble := true;
    v_reason := 'Session abandoned on this page';
  elsif v_score < 45 then
    v_trouble := true;
    v_reason := format('Engagement score fell to %s/100', round(v_score));
  end if;

  insert into public.page_engagement_scores (
    story_id, page_index, engagement_score, avg_dwell_ms,
    view_count, fast_skip_count, consecutive_fast_skips,
    reread_count, regenerate_count, edit_count, abandon_count,
    trouble_triggered, trouble_reason, updated_at
  )
  values (
    p_story_id, p_page_index, v_score, v_avg_dwell,
    v_views, v_fast_skips, v_consec_skips,
    v_rereads, v_regens, v_edits, v_abandons,
    v_trouble, v_reason, now()
  )
  on conflict (story_id, page_index) do update set
    engagement_score = excluded.engagement_score,
    avg_dwell_ms = excluded.avg_dwell_ms,
    view_count = excluded.view_count,
    fast_skip_count = excluded.fast_skip_count,
    consecutive_fast_skips = excluded.consecutive_fast_skips,
    reread_count = excluded.reread_count,
    regenerate_count = excluded.regenerate_count,
    edit_count = excluded.edit_count,
    abandon_count = excluded.abandon_count,
    trouble_triggered = excluded.trouble_triggered,
    trouble_reason = excluded.trouble_reason,
    updated_at = now();

  if v_trouble then
    select exists(
      select 1 from public.steer_suggestions
      where story_id = p_story_id
        and trouble_page_index = p_page_index
        and status = 'pending'
    ) into v_already_pending;

    if not v_already_pending then
      -- Invoke Supabase Edge Function via pg_net
      perform net.http_post(
        url := current_setting('app.settings.edge_function_url', true) || '/reader-signal-autopilot',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'action', 'generate_steer',
          'story_id', p_story_id,
          'trouble_page_index', p_page_index,
          'trigger_reason', v_reason,
          'engagement_score', v_score
        )
      );
    end if;
  end if;
end;
$$;

-- 7. Trigger on reader_events insert
create or replace function public.fn_evaluate_reader_signal()
returns trigger
language plpgsql
security definer
as $$
begin
  perform public.rollup_story_page_engagement(new.story_id, new.page_index);
  return new;
end;
$$;

drop trigger if exists trg_reader_events_autopilot on public.reader_events;
create trigger trg_reader_events_autopilot
  after insert on public.reader_events
  for each row
  execute function public.fn_evaluate_reader_signal();

-- 8. pg_cron job running every minute for batch rollup + quiet auto-apply
select cron.schedule(
  'reader-signal-autopilot-minute-sweep',
  '* * * * *',
  $$
    -- Roll up any active story pages from the past 2 minutes
    select public.rollup_story_page_engagement(story_id, page_index)
    from (
      select distinct story_id, page_index
      from public.reader_events
      where created_at > now() - interval '2 minutes'
    ) recent;

    -- Quietly auto-apply unanswered pending steer suggestions past auto_apply_at
    select net.http_post(
      url := current_setting('app.settings.edge_function_url', true) || '/reader-signal-autopilot',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('action', 'auto_apply_expired')
    );
  $$
);

-- 9. Enable Supabase Realtime on steer_suggestions and story_pages
alter publication supabase_realtime add table public.steer_suggestions;
alter publication supabase_realtime add table public.story_pages;
alter publication supabase_realtime add table public.page_engagement_scores;
