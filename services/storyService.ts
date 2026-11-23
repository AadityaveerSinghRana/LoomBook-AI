import { supabase } from '../supabaseClient';
import {
  Story,
  StoryPage,
  ReaderEvent,
  ReaderEventType,
  PageEngagementScore,
  SteerSuggestion,
  AutopilotMetrics,
  LlmProvider,
} from '../types';

export interface StoryDetailPayload {
  story: Story;
  scores: PageEngagementScore[];
  suggestions: SteerSuggestion[];
  events: ReaderEvent[];
}

export interface SupabaseStatus {
  connected: boolean;
  schemaProvisioned: boolean;
  mode: 'supabase_native' | 'local_postgres_mirror_with_sse';
  projectUrl: string;
  detail?: string;
}

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const storyService = {
  getStories: async (): Promise<{ stories: Story[]; metrics: AutopilotMetrics }> => {
    return apiJson('/api/stories');
  },

  getStoryDetail: async (id: string): Promise<StoryDetailPayload> => {
    return apiJson(`/api/stories/${encodeURIComponent(id)}`);
  },

  generateStory: async (params: {
    prompt: string;
    genre: string;
    audience: string;
    tone: string;
    pageCount: number;
    provider: LlmProvider;
  }): Promise<{ story: Story }> => {
    return apiJson('/api/stories/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  deleteStory: async (id: string): Promise<void> => {
    await apiJson(`/api/stories/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  updatePage: async (
    storyId: string,
    pageIndex: number,
    updates: { prose?: string; chapterTitle?: string; sessionId?: string }
  ): Promise<{ page: StoryPage; story: Story }> => {
    return apiJson(`/api/stories/${encodeURIComponent(storyId)}/pages/${pageIndex}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  regeneratePage: async (
    storyId: string,
    pageIndex: number,
    guidance: string,
    sessionId?: string
  ): Promise<{
    page: StoryPage;
    story: Story;
    score: PageEngagementScore;
    suggestion: SteerSuggestion | null;
  }> => {
    return apiJson(`/api/stories/${encodeURIComponent(storyId)}/pages/${pageIndex}/regenerate`, {
      method: 'POST',
      body: JSON.stringify({ guidance, sessionId }),
    });
  },

  logReaderEvent: async (params: {
    storyId: string;
    pageIndex: number;
    sessionId: string;
    eventType: ReaderEventType;
    dwellMs?: number;
    metadata?: Record<string, unknown>;
  }): Promise<{
    event: ReaderEvent;
    score: PageEngagementScore;
    suggestion: SteerSuggestion | null;
  }> => {
    // Also mirror silently to Supabase if the user provisioned 001_storybook_autopilot.sql
    void supabase
      .from('reader_events')
      .insert({
        story_id: params.storyId,
        page_index: params.pageIndex,
        session_id: params.sessionId,
        event_type: params.eventType,
        dwell_ms: params.dwellMs || 0,
        metadata: params.metadata || {},
      })
      .then(() => undefined, () => undefined);

    return apiJson('/api/events', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  getPendingSuggestions: async (): Promise<{ suggestions: SteerSuggestion[] }> => {
    return apiJson('/api/suggestions/pending');
  },

  applySuggestion: async (
    suggestionId: string,
    optionId?: string
  ): Promise<{ suggestion: SteerSuggestion; updatedPage: StoryPage }> => {
    return apiJson(`/api/suggestions/${encodeURIComponent(suggestionId)}/apply`, {
      method: 'POST',
      body: JSON.stringify({ optionId, mode: 'applied' }),
    });
  },

  dismissSuggestion: async (suggestionId: string): Promise<{ suggestion: SteerSuggestion }> => {
    return apiJson(`/api/suggestions/${encodeURIComponent(suggestionId)}/dismiss`, {
      method: 'POST',
    });
  },

  triggerSweep: async (): Promise<{ ok: boolean; autoAppliedCount: number }> => {
    return apiJson('/api/autopilot/sweep', { method: 'POST' });
  },

  getSupabaseStatus: async (): Promise<SupabaseStatus> => {
    return apiJson('/api/supabase/status');
  },

  subscribeToAutopilot: (handlers: {
    onSuggestionCreated?: (suggestion: SteerSuggestion) => void;
    onSuggestionResolved?: (suggestion: SteerSuggestion) => void;
    onEngagementUpdated?: (score: PageEngagementScore) => void;
    onStoryUpdated?: (story: Story) => void;
  }): (() => void) => {
    const source = new EventSource('/api/realtime/stream');

    source.addEventListener('steer_suggestion_created', (ev) => {
      try {
        const parsed = JSON.parse((ev as MessageEvent).data) as SteerSuggestion;
        handlers.onSuggestionCreated?.(parsed);
      } catch {
        // ignore malformed event
      }
    });

    source.addEventListener('steer_suggestion_resolved', (ev) => {
      try {
        const parsed = JSON.parse((ev as MessageEvent).data) as SteerSuggestion;
        handlers.onSuggestionResolved?.(parsed);
      } catch {
        // ignore
      }
    });

    source.addEventListener('engagement_updated', (ev) => {
      try {
        const parsed = JSON.parse((ev as MessageEvent).data) as PageEngagementScore;
        handlers.onEngagementUpdated?.(parsed);
      } catch {
        // ignore
      }
    });

    source.addEventListener('story_updated', (ev) => {
      try {
        const parsed = JSON.parse((ev as MessageEvent).data) as Story;
        handlers.onStoryUpdated?.(parsed);
      } catch {
        // ignore
      }
    });

    // Optional Supabase Realtime channel subscription if remote tables are active
    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (handlers.onSuggestionCreated) {
      const uniqueTopic = `loombook-autopilot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      channel = supabase
        .channel(uniqueTopic)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'steer_suggestions' },
          (payload) => {
            if (payload.new && handlers.onSuggestionCreated) {
              const row = payload.new as Record<string, unknown>;
              handlers.onSuggestionCreated({
                id: String(row.id),
                storyId: String(row.story_id),
                troublePageIndex: Number(row.trouble_page_index),
                targetPageIndex: Number(row.target_page_index),
                triggerReason: String(row.trigger_reason),
                engagementScoreAtTrigger: Number(row.engagement_score_at_trigger),
                options: (row.options as SteerSuggestion['options']) || [],
                selectedOptionId: (row.selected_option_id as string) || null,
                status: (row.status as SteerSuggestion['status']) || 'pending',
                autoApplyAt: String(row.auto_apply_at),
                createdAt: String(row.created_at),
                resolvedAt: (row.resolved_at as string) || null,
              });
            }
          }
        )
        .subscribe();
    }

    return () => {
      source.close();
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  },
};
