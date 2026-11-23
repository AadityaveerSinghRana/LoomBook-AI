import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';
import { SEED_STORIES, SEED_EVENTS, SEED_SCORES, SEED_SUGGESTIONS } from './data/seedStories.ts';
import type {
  Story,
  StoryPage,
  ReaderEvent,
  ReaderEventType,
  PageEngagementScore,
  SteerSuggestion,
  SteerOption,
  LlmProvider,
  AutopilotMetrics,
} from './types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'storybook-db.json');

interface DatabaseState {
  stories: Story[];
  readerEvents: ReaderEvent[];
  engagementScores: PageEngagementScore[];
  steerSuggestions: SteerSuggestion[];
}

const COVER_LIBRARY = [
  '/src/assets/images/storybook_clockwork_owl_1795118105916.jpg',
  '/src/assets/images/storybook_glass_harbor_1795118105288.jpg',
  '/src/assets/images/storybook_cartographer_garden_1795118104949.jpg',
  '/src/assets/images/storybook_paper_lighthouse_1795119354793.jpg',
  '/src/assets/images/storybook_velvet_observatory_1795119355118.jpg',
  '/src/assets/images/storybook_apricot_orchard_1795119354871.jpg',
  '/src/assets/images/storybook_porcelain_violin_1795119353245.jpg',
];

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

let db: DatabaseState = {
  stories: [],
  readerEvents: [],
  engagementScores: [],
  steerSuggestions: [],
};

let dbWriteQueue: Promise<void> = Promise.resolve();

async function loadDatabase(): Promise<void> {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf-8');
    db = JSON.parse(raw) as DatabaseState;
    const existingIds = new Set(db.stories.map((s) => s.id));
    const missingSeeds = SEED_STORIES.filter((s) => !existingIds.has(s.id));
    if (missingSeeds.length > 0) {
      db.stories.push(...structuredClone(missingSeeds));
      await saveDatabase();
    }
  } catch {
    db = {
      stories: structuredClone(SEED_STORIES),
      readerEvents: structuredClone(SEED_EVENTS),
      engagementScores: structuredClone(SEED_SCORES),
      steerSuggestions: structuredClone(SEED_SUGGESTIONS),
    };
    await saveDatabase();
  }
}

async function saveDatabase(): Promise<void> {
  const snapshot = JSON.stringify(db, null, 2);
  dbWriteQueue = dbWriteQueue
    .then(async () => {
      await fs.mkdir(DB_DIR, { recursive: true });
      await fs.writeFile(DB_PATH, snapshot, 'utf-8');
    })
    .catch((err) => {
      console.warn('Database persistence skipped (using in-memory state):', err instanceof Error ? err.message : err);
    });
  await dbWriteQueue;
}

// Server-Sent Events (SSE) clients for Realtime push to Prompter Studio
const sseClients = new Set<Response>();

function broadcastRealtime(event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function generateTextWithPublicLlm(
  provider: LlmProvider,
  prompt: string,
  systemInstruction: string
): Promise<string> {
  if (provider === 'pollinations-openai') {
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        model: 'openai',
        jsonMode: false,
      }),
    });
    if (!res.ok) {
      throw new Error(`Pollinations LLM error (${res.status})`);
    }
    return await res.text();
  }

  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction,
    },
  });
  if (!response.text) {
    throw new Error('Gemini returned an empty response.');
  }
  return response.text;
}

async function generateFullStoryWithLlm(params: {
  prompt: string;
  genre: string;
  audience: string;
  tone: string;
  pageCount: number;
  provider: LlmProvider;
}): Promise<{
  title: string;
  subtitle: string;
  genre: string;
  storyBible: Story['storyBible'];
  pages: Array<{
    chapterTitle: string;
    prose: string;
    illustrationCue: string;
    pacingIntent: string;
  }>;
}> {
  const { prompt, genre, audience, tone, pageCount, provider } = params;

  if (provider === 'pollinations-openai') {
    const sys = 'You are an acclaimed storybook author and narrative architect. Always respond with valid JSON only—no markdown fences.';
    const userPrompt = `Create an illustrated storybook with a Story Bible and exactly ${pageCount} pages.
Prompt: ${prompt}
Genre: ${genre}
Audience: ${audience}
Tone: ${tone}

Return strict JSON matching:
{
  "title": "string",
  "subtitle": "string",
  "genre": "string",
  "storyBible": {
    "premise": "string",
    "protagonist": "string",
    "setting": "string",
    "toneRules": "string",
    "plotArc": "string",
    "pacingNotes": "string"
  },
  "pages": [
    {
      "chapterTitle": "string",
      "prose": "2 rich literary paragraphs separated by \\n\\n (90-140 words per page)",
      "illustrationCue": "string",
      "pacingIntent": "string"
    }
  ]
}`;
    const raw = await generateTextWithPublicLlm(provider, userPrompt, sys);
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(cleaned);
  }

  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Create a rich, cohesive illustrated storybook with a Story Bible and exactly ${pageCount} pages.
User Prompt: ${prompt}
Preferred Genre: ${genre}
Target Audience: ${audience}
Desired Tone: ${tone}
Each page should have 2 vivid, readable paragraphs (90-140 words total per page) with tactile sensory details and clear narrative progression.`,
    config: {
      systemInstruction:
        'You are a literary storybook author and narrative designer. Write evocative, humane prose with a crisp Story Bible for continuity.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          genre: { type: Type.STRING },
          storyBible: {
            type: Type.OBJECT,
            properties: {
              premise: { type: Type.STRING },
              protagonist: { type: Type.STRING },
              setting: { type: Type.STRING },
              toneRules: { type: Type.STRING },
              plotArc: { type: Type.STRING },
              pacingNotes: { type: Type.STRING },
            },
            required: ['premise', 'protagonist', 'setting', 'toneRules', 'plotArc', 'pacingNotes'],
          },
          pages: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                chapterTitle: { type: Type.STRING },
                prose: { type: Type.STRING },
                illustrationCue: { type: Type.STRING },
                pacingIntent: { type: Type.STRING },
              },
              required: ['chapterTitle', 'prose', 'illustrationCue', 'pacingIntent'],
            },
          },
        },
        required: ['title', 'subtitle', 'genre', 'storyBible', 'pages'],
      },
    },
  });

  const jsonStr = (response.text ?? '{}').trim();
  return JSON.parse(jsonStr);
}

async function generateSteeringOptionsWithLlm(
  story: Story,
  troublePageIndex: number,
  targetPageIndex: number,
  triggerReason: string
): Promise<SteerOption[]> {
  const neighbors = story.pages.filter(
    (p) => Math.abs(p.pageIndex - troublePageIndex) <= 1
  );

  if (story.llmProvider === 'pollinations-openai') {
    const raw = await generateTextWithPublicLlm(
      'pollinations-openai',
      `Story: "${story.title}"
Story Bible: ${JSON.stringify(story.storyBible)}
Neighboring Pages: ${JSON.stringify(
        neighbors.map((n) => ({ page: n.pageIndex + 1, title: n.chapterTitle, prose: n.prose }))
      )}
Trouble on Page ${troublePageIndex + 1}: ${triggerReason}
Generate 3 subtle steering options for Page ${targetPageIndex + 1} (directions: "more_tension", "lighter_tone", "plot_twist").
Return strict JSON array of 3 objects: [{ "id": "string", "direction": "more_tension|lighter_tone|plot_twist", "label": "string", "title": "string", "rationale": "string", "previewHook": "string", "confidenceRank": 1|2|3 }]`,
      'You are Reader-Signal Autopilot, a subtle narrative editor. Respond with valid JSON array only.'
    );
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(cleaned) as SteerOption[];
  }

  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Analyze why readers struggled on Page ${troublePageIndex + 1} ("${
      story.pages[troublePageIndex]?.chapterTitle ?? ''
    }") due to: ${triggerReason}.

Story Title: ${story.title}
Story Bible: ${JSON.stringify(story.storyBible)}
Neighboring Pages Context:
${neighbors
  .map((p) => `--- Page ${p.pageIndex + 1}: ${p.chapterTitle} ---\n${p.prose}`)
  .join('\n\n')}

Propose 3 subtle narrative steering options for Page ${targetPageIndex + 1} ("${
      story.pages[targetPageIndex]?.chapterTitle ?? ''
    }"):
1. "more_tension" (label: "More Tension")
2. "lighter_tone" (label: "Lighter Tone")
3. "plot_twist" (label: "Plot Twist")

Rank them 1, 2, 3 by confidenceRank (1 = strongest editorial fit for the Story Bible). Keep previewHook to 1-2 vivid sentences.`,
    config: {
      systemInstruction:
        'You are the Reader-Signal Autopilot Edge Function. Provide subtle, story-bible-faithful narrative steering options without breaking continuity.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            direction: { type: Type.STRING },
            label: { type: Type.STRING },
            title: { type: Type.STRING },
            rationale: { type: Type.STRING },
            previewHook: { type: Type.STRING },
            confidenceRank: { type: Type.INTEGER },
          },
          required: ['id', 'direction', 'label', 'title', 'rationale', 'previewHook', 'confidenceRank'],
        },
      },
    },
  });

  const parsed = JSON.parse((response.text ?? '[]').trim()) as SteerOption[];
  return parsed.slice(0, 3).map((opt, idx) => ({
    ...opt,
    id: opt.id || `opt-${Date.now()}-${idx}`,
    confidenceRank: opt.confidenceRank || idx + 1,
  }));
}

async function rewritePageWithLlm(
  story: Story,
  targetPage: StoryPage,
  steeringDirective: string
): Promise<string> {
  const prevPage = story.pages.find((p) => p.pageIndex === targetPage.pageIndex - 1);
  const nextPage = story.pages.find((p) => p.pageIndex === targetPage.pageIndex + 1);

  const prompt = `Rewrite Page ${targetPage.pageIndex + 1} ("${targetPage.chapterTitle}") of "${story.title}".

Story Bible:
${JSON.stringify(story.storyBible, null, 2)}

Previous Page Context:
${prevPage ? prevPage.prose : 'This is the opening page.'}

Current Page Draft:
${targetPage.prose}

Next Page Context:
${nextPage ? nextPage.prose : 'This is the closing page.'}

Editorial Steering Directive:
${steeringDirective}

Return ONLY the revised prose for this page (2 cohesive paragraphs separated by a blank line, 95-150 words). Do not include chapter titles or commentary.`;

  const sys =
    'You are an accomplished storybook editor gently reshaping prose to recover reader engagement while preserving the Story Bible voice and continuity.';

  const revised = await generateTextWithPublicLlm(story.llmProvider, prompt, sys);
  return revised.trim();
}

function computePageEngagement(storyId: string, pageIndex: number): PageEngagementScore {
  const events = db.readerEvents.filter(
    (e) => e.storyId === storyId && e.pageIndex === pageIndex
  );

  let viewCount = 0;
  let fastSkipCount = 0;
  let rereadCount = 0;
  let regenerateCount = 0;
  let editCount = 0;
  let abandonCount = 0;
  let dwellSum = 0;
  let dwellCount = 0;

  for (const ev of events) {
    if (ev.eventType === 'page_view') viewCount++;
    if (ev.eventType === 'fast_skip') fastSkipCount++;
    if (ev.eventType === 'reread') rereadCount++;
    if (ev.eventType === 'regenerate') regenerateCount++;
    if (ev.eventType === 'edit') editCount++;
    if (ev.eventType === 'session_abandon') abandonCount++;
    if (ev.dwellMs > 0) {
      dwellSum += ev.dwellMs;
      dwellCount++;
    }
  }

  const avgDwellMs = dwellCount > 0 ? Math.round(dwellSum / dwellCount) : 0;

  // Count trailing consecutive fast_skip events
  const chronological = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  let consecutiveFastSkips = 0;
  for (const ev of chronological) {
    if (ev.eventType === 'fast_skip') {
      consecutiveFastSkips++;
    } else if (ev.eventType === 'dwell' || ev.eventType === 'reread') {
      break;
    }
  }

  let score =
    72 +
    Math.min(rereadCount * 6, 18) +
    (avgDwellMs >= 12000 && avgDwellMs <= 55000 ? 8 : 0) -
    fastSkipCount * 18 -
    regenerateCount * 12 -
    editCount * 6 -
    abandonCount * 30;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let troubleTriggered = false;
  let troubleReason: string | null = null;

  if (consecutiveFastSkips >= 2) {
    troubleTriggered = true;
    troubleReason = `${consecutiveFastSkips} consecutive fast skips (<4s dwell)`;
  } else if (abandonCount >= 1) {
    troubleTriggered = true;
    troubleReason = 'Reader session abandoned on this page';
  } else if (score < 45 && fastSkipCount + regenerateCount + abandonCount >= 2) {
    troubleTriggered = true;
    troubleReason = `Engagement score dropped to ${score}/100`;
  }

  const entry: PageEngagementScore = {
    storyId,
    pageIndex,
    engagementScore: score,
    avgDwellMs,
    viewCount,
    fastSkipCount,
    consecutiveFastSkips,
    rereadCount,
    regenerateCount,
    editCount,
    abandonCount,
    troubleTriggered,
    troubleReason,
    updatedAt: new Date().toISOString(),
  };

  const existingIdx = db.engagementScores.findIndex(
    (s) => s.storyId === storyId && s.pageIndex === pageIndex
  );
  if (existingIdx >= 0) {
    db.engagementScores[existingIdx] = entry;
  } else {
    db.engagementScores.push(entry);
  }

  return entry;
}

const pendingGenerations = new Set<string>();

async function evaluateAndMaybeTriggerAutopilot(
  storyId: string,
  pageIndex: number
): Promise<{ score: PageEngagementScore; suggestion: SteerSuggestion | null }> {
  const score = computePageEngagement(storyId, pageIndex);
  await saveDatabase();
  broadcastRealtime('engagement_updated', score);

  if (!score.troubleTriggered) {
    return { score, suggestion: null };
  }

  const alreadyExists = db.steerSuggestions.some(
    (s) =>
      s.storyId === storyId &&
      s.troublePageIndex === pageIndex &&
      s.status === 'pending'
  );
  const lockKey = `${storyId}:${pageIndex}`;

  if (alreadyExists || pendingGenerations.has(lockKey)) {
    return { score, suggestion: null };
  }

  const story = db.stories.find((s) => s.id === storyId);
  if (!story) {
    return { score, suggestion: null };
  }

  pendingGenerations.add(lockKey);
  try {
    const targetPageIndex = Math.min(pageIndex + 1, story.pages.length - 1);
    const reason = score.troubleReason || 'Reader friction detected';
    const options = await generateSteeringOptionsWithLlm(
      story,
      pageIndex,
      targetPageIndex,
      reason
    );

    const suggestion: SteerSuggestion = {
      id: `steer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      storyId,
      troublePageIndex: pageIndex,
      targetPageIndex,
      triggerReason: `${reason} on Page ${pageIndex + 1} ("${
        story.pages[pageIndex]?.chapterTitle ?? ''
      }")`,
      engagementScoreAtTrigger: score.engagementScore,
      options,
      selectedOptionId: null,
      status: 'pending',
      autoApplyAt: new Date(Date.now() + 35_000).toISOString(),
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };

    db.steerSuggestions.unshift(suggestion);
    await saveDatabase();
    broadcastRealtime('steer_suggestion_created', suggestion);
    return { score, suggestion };
  } finally {
    pendingGenerations.delete(lockKey);
  }
}

async function applySuggestionInternal(
  suggestionId: string,
  optionId: string | null,
  mode: 'applied' | 'auto_applied'
): Promise<{ suggestion: SteerSuggestion; updatedPage: StoryPage } | null> {
  const suggestion = db.steerSuggestions.find((s) => s.id === suggestionId);
  if (!suggestion || suggestion.status !== 'pending') return null;

  const story = db.stories.find((s) => s.id === suggestion.storyId);
  if (!story) return null;

  const sortedOptions = [...suggestion.options].sort(
    (a, b) => a.confidenceRank - b.confidenceRank
  );
  const chosen =
    (optionId ? suggestion.options.find((o) => o.id === optionId) : undefined) ||
    sortedOptions[0];

  if (!chosen) return null;

  const targetPage = story.pages.find((p) => p.pageIndex === suggestion.targetPageIndex);
  if (!targetPage) return null;

  const revisedProse = await rewritePageWithLlm(
    story,
    targetPage,
    `${chosen.label} — ${chosen.title}: ${chosen.rationale} (Suggested opening hook: ${chosen.previewHook})`
  );

  targetPage.prose = revisedProse;
  targetPage.steeredBy = mode === 'auto_applied' ? 'autopilot' : 'manual';
  targetPage.lastSteerNote = `${chosen.label}: ${chosen.title}`;
  targetPage.updatedAt = new Date().toISOString();
  story.updatedAt = new Date().toISOString();

  suggestion.status = mode;
  suggestion.selectedOptionId = chosen.id;
  suggestion.resolvedAt = new Date().toISOString();

  await saveDatabase();

  broadcastRealtime('steer_suggestion_resolved', suggestion);
  broadcastRealtime('story_updated', story);

  return { suggestion, updatedPage: targetPage };
}

let isSweeping = false;
async function runMinuteAutopilotSweep(): Promise<number> {
  if (isSweeping) return 0;
  isSweeping = true;
  let autoAppliedCount = 0;

  try {
    const now = Date.now();
    const expired = db.steerSuggestions.filter(
      (s) => s.status === 'pending' && new Date(s.autoApplyAt).getTime() <= now
    );

    for (const item of expired) {
      try {
        const result = await applySuggestionInternal(item.id, null, 'auto_applied');
        if (result) autoAppliedCount++;
      } catch (err) {
        console.error('Autopilot auto-apply error:', err);
      }
    }
  } finally {
    isSweeping = false;
  }

  return autoAppliedCount;
}

function getMetrics(): AutopilotMetrics {
  return {
    totalStories: db.stories.length,
    totalEvents: db.readerEvents.length,
    troubleTriggersCaught: db.engagementScores.filter((s) => s.troubleTriggered).length,
    quietAutoSteers: db.steerSuggestions.filter((s) => s.status === 'auto_applied').length,
    manualSteersApplied: db.steerSuggestions.filter((s) => s.status === 'applied').length,
  };
}

async function startServer() {
  await loadDatabase();

  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // SSE Realtime Stream (mirrors Supabase Realtime channel)
  app.get('/api/realtime/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, time: new Date().toISOString() })}\n\n`);
    sseClients.add(res);

    const heartbeat = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // Health & Metrics
  app.get('/api/metrics', (_req: Request, res: Response) => {
    res.json(getMetrics());
  });

  // Check if remote Supabase project has the storybook schema applied
  app.get('/api/supabase/status', async (_req: Request, res: Response) => {
    const supabaseUrl = 'https://wkkvehuckymlrsweyjjf.supabase.co';
    const supabaseKey = 'sb_publishable_LlU1uakjbI17_gcweZPXrg_tINTOf2J';
    try {
      const probe = await fetch(`${supabaseUrl}/rest/v1/reader_events?select=id&limit=1`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });
      if (probe.ok) {
        res.json({
          connected: true,
          schemaProvisioned: true,
          mode: 'supabase_native',
          projectUrl: supabaseUrl,
        });
      } else {
        const body = await probe.text();
        res.json({
          connected: true,
          schemaProvisioned: false,
          mode: 'local_postgres_mirror_with_sse',
          projectUrl: supabaseUrl,
          detail: body,
        });
      }
    } catch (err) {
      res.json({
        connected: false,
        schemaProvisioned: false,
        mode: 'local_postgres_mirror_with_sse',
        projectUrl: supabaseUrl,
        detail: err instanceof Error ? err.message : 'Network unavailable',
      });
    }
  });

  // List all stories
  app.get('/api/stories', (_req: Request, res: Response) => {
    const ordered = [...db.stories].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    res.json({ stories: ordered, metrics: getMetrics() });
  });

  // Get single story with engagement scores, events, and suggestions
  app.get('/api/stories/:id', (req: Request, res: Response) => {
    const story = db.stories.find((s) => s.id === req.params.id);
    if (!story) {
      res.status(404).json({ error: 'Storybook not found.' });
      return;
    }

    const scores = db.engagementScores
      .filter((s) => s.storyId === story.id)
      .sort((a, b) => a.pageIndex - b.pageIndex);

    const suggestions = db.steerSuggestions
      .filter((s) => s.storyId === story.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const events = db.readerEvents
      .filter((e) => e.storyId === story.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 60);

    res.json({ story, scores, suggestions, events });
  });

  // Generate a new storybook via Public LLM
  app.post('/api/stories/generate', async (req: Request, res: Response) => {
    try {
      const {
        prompt,
        genre = 'Literary Illustrated',
        audience = 'All Ages',
        tone = 'Atmospheric & Warm',
        pageCount = 5,
        provider = 'gemini-4-hydrogen',
      } = req.body as {
        prompt?: string;
        genre?: string;
        audience?: string;
        tone?: string;
        pageCount?: number;
        provider?: LlmProvider;
      };

      if (!prompt || !prompt.trim()) {
        res.status(400).json({ error: 'Please provide a story prompt.' });
        return;
      }

      const clampedPages = Math.max(3, Math.min(8, Number(pageCount) || 5));
      const generated = await generateFullStoryWithLlm({
        prompt: prompt.trim(),
        genre,
        audience,
        tone,
        pageCount: clampedPages,
        provider,
      });

      const storyId = `story-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date().toISOString();
      const coverUrl = COVER_LIBRARY[db.stories.length % COVER_LIBRARY.length];

      const pages: StoryPage[] = (generated.pages || []).map((p, idx) => ({
        id: `${storyId}-p${idx}`,
        storyId,
        pageIndex: idx,
        chapterTitle: p.chapterTitle || `Chapter ${idx + 1}`,
        prose: p.prose,
        illustrationCue: p.illustrationCue || '',
        pacingIntent: p.pacingIntent || '',
        steeredBy: null,
        lastSteerNote: null,
        updatedAt: now,
      }));

      const newStory: Story = {
        id: storyId,
        title: generated.title || 'Untitled Storybook',
        subtitle: generated.subtitle || 'An original generated edition',
        genre: generated.genre || genre,
        audience,
        prompt: prompt.trim(),
        llmProvider: provider,
        coverUrl,
        storyBible: generated.storyBible,
        pages,
        createdAt: now,
        updatedAt: now,
      };

      db.stories.unshift(newStory);
      await saveDatabase();
      broadcastRealtime('story_created', newStory);

      res.status(201).json({ story: newStory });
    } catch (err) {
      console.error('Story generation failed:', err);
      const message = err instanceof Error ? err.message : 'Story generation failed.';
      res.status(500).json({ error: message });
    }
  });

  // Delete a story
  app.delete('/api/stories/:id', async (req: Request, res: Response) => {
    const idx = db.stories.findIndex((s) => s.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Storybook not found.' });
      return;
    }
    db.stories.splice(idx, 1);
    db.readerEvents = db.readerEvents.filter((e) => e.storyId !== req.params.id);
    db.engagementScores = db.engagementScores.filter((s) => s.storyId !== req.params.id);
    db.steerSuggestions = db.steerSuggestions.filter((s) => s.storyId !== req.params.id);
    await saveDatabase();
    res.json({ ok: true });
  });

  // Update a page manually
  app.patch('/api/stories/:id/pages/:pageIndex', async (req: Request, res: Response) => {
    const story = db.stories.find((s) => s.id === req.params.id);
    const pageIndex = Number(req.params.pageIndex);
    if (!story) {
      res.status(404).json({ error: 'Storybook not found.' });
      return;
    }

    const page = story.pages.find((p) => p.pageIndex === pageIndex);
    if (!page) {
      res.status(404).json({ error: 'Page not found.' });
      return;
    }

    const { prose, chapterTitle, sessionId = 'studio-editor' } = req.body as {
      prose?: string;
      chapterTitle?: string;
      sessionId?: string;
    };

    if (typeof prose === 'string') page.prose = prose;
    if (typeof chapterTitle === 'string') page.chapterTitle = chapterTitle;
    page.steeredBy = 'manual';
    page.lastSteerNote = 'Manual author edit';
    page.updatedAt = new Date().toISOString();
    story.updatedAt = new Date().toISOString();

    const editEvent: ReaderEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      storyId: story.id,
      pageIndex,
      sessionId,
      eventType: 'edit',
      dwellMs: 0,
      createdAt: new Date().toISOString(),
    };
    db.readerEvents.push(editEvent);

    await evaluateAndMaybeTriggerAutopilot(story.id, pageIndex);
    broadcastRealtime('story_updated', story);

    res.json({ page, story });
  });

  // Regenerate a specific page with LLM
  app.post('/api/stories/:id/pages/:pageIndex/regenerate', async (req: Request, res: Response) => {
    try {
      const story = db.stories.find((s) => s.id === req.params.id);
      const pageIndex = Number(req.params.pageIndex);
      if (!story) {
        res.status(404).json({ error: 'Storybook not found.' });
        return;
      }

      const page = story.pages.find((p) => p.pageIndex === pageIndex);
      if (!page) {
        res.status(404).json({ error: 'Page not found.' });
        return;
      }

      const { guidance = 'Freshen imagery, sharpen pacing, and improve emotional resonance.', sessionId = 'reader-session' } =
        req.body as { guidance?: string; sessionId?: string };

      const revised = await rewritePageWithLlm(story, page, guidance);
      page.prose = revised;
      page.steeredBy = 'manual';
      page.lastSteerNote = 'Regenerated via reader request';
      page.updatedAt = new Date().toISOString();
      story.updatedAt = new Date().toISOString();

      db.readerEvents.push({
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        storyId: story.id,
        pageIndex,
        sessionId,
        eventType: 'regenerate',
        dwellMs: 0,
        metadata: { guidance },
        createdAt: new Date().toISOString(),
      });

      const { score, suggestion } = await evaluateAndMaybeTriggerAutopilot(story.id, pageIndex);
      broadcastRealtime('story_updated', story);

      res.json({ page, story, score, suggestion });
    } catch (err) {
      console.error('Page regeneration error:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Regeneration failed.' });
    }
  });

  // Ingest passive reader telemetry into reader_events & trigger engagement evaluation
  app.post('/api/events', async (req: Request, res: Response) => {
    try {
      const { storyId, pageIndex, sessionId, eventType, dwellMs = 0, metadata } = req.body as {
        storyId?: string;
        pageIndex?: number;
        sessionId?: string;
        eventType?: ReaderEventType;
        dwellMs?: number;
        metadata?: Record<string, unknown>;
      };

      if (!storyId || pageIndex === undefined || !eventType) {
        res.status(400).json({ error: 'Missing storyId, pageIndex, or eventType.' });
        return;
      }

      const story = db.stories.find((s) => s.id === storyId);
      if (!story) {
        res.status(404).json({ error: 'Storybook not found.' });
        return;
      }

      const event: ReaderEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        storyId,
        pageIndex: Number(pageIndex),
        sessionId: sessionId || 'anon-reader',
        eventType,
        dwellMs: Math.max(0, Math.round(Number(dwellMs) || 0)),
        metadata,
        createdAt: new Date().toISOString(),
      };

      db.readerEvents.push(event);
      const evaluation = await evaluateAndMaybeTriggerAutopilot(storyId, Number(pageIndex));

      res.status(201).json({
        event,
        score: evaluation.score,
        suggestion: evaluation.suggestion,
      });
    } catch (err) {
      console.error('Reader event ingestion error:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to record reader event.' });
    }
  });

  // Get pending suggestions across all stories (for global Prompter nudge)
  app.get('/api/suggestions/pending', (_req: Request, res: Response) => {
    const pending = db.steerSuggestions
      .filter((s) => s.status === 'pending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ suggestions: pending });
  });

  // Prompter applies a selected steering option
  app.post('/api/suggestions/:id/apply', async (req: Request, res: Response) => {
    try {
      const { optionId, mode = 'applied' } = req.body as {
        optionId?: string;
        mode?: 'applied' | 'auto_applied';
      };

      const result = await applySuggestionInternal(
        String(req.params.id),
        optionId || null,
        mode
      );

      if (!result) {
        res.status(404).json({ error: 'Pending suggestion not found.' });
        return;
      }

      res.json(result);
    } catch (err) {
      console.error('Apply steering error:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to apply steering option.' });
    }
  });

  // Prompter dismisses a steering suggestion
  app.post('/api/suggestions/:id/dismiss', async (req: Request, res: Response) => {
    const suggestion = db.steerSuggestions.find((s) => s.id === req.params.id);
    if (!suggestion) {
      res.status(404).json({ error: 'Suggestion not found.' });
      return;
    }
    suggestion.status = 'dismissed';
    suggestion.resolvedAt = new Date().toISOString();
    await saveDatabase();
    broadcastRealtime('steer_suggestion_resolved', suggestion);
    res.json({ suggestion });
  });

  // Trigger immediate sweep (mirrors pg_cron 1-minute sweep)
  app.post('/api/autopilot/sweep', async (_req: Request, res: Response) => {
    const autoAppliedCount = await runMinuteAutopilotSweep();
    res.json({ ok: true, autoAppliedCount });
  });

  // Background sweep every 10 seconds to quietly auto-apply expired suggestions
  setInterval(() => {
    void runMinuteAutopilotSweep();
  }, 10_000);

  // Lightweight OAuth callback handler for popup authentication inside iframe hosts
  app.get(['/auth/callback', '/auth/callback/'], (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Completing Sign-In · Loombook</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #000000;
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        padding: 24px;
        text-align: center;
      }
      .card {
        max-width: 360px;
        border: 1px solid rgba(255,255,255,0.12);
        background: #0a0a0d;
        border-radius: 12px;
        padding: 24px;
      }
      p { margin: 8px 0 0; font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.5; }
      h1 { margin: 0; font-size: 16px; font-weight: 600; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Completing Google Sign-In…</h1>
      <p id="status">Returning session to Loombook. This window will close automatically.</p>
    </div>
    <script>
      (function () {
        var payload = {
          type: 'SUPABASE_OAUTH_CALLBACK',
          hash: window.location.hash || '',
          search: window.location.search || ''
        };
        var sent = false;
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(payload, '*');
            sent = true;
          }
        } catch (e) {}
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            var bc = new BroadcastChannel('loombook-oauth');
            bc.postMessage(payload);
            bc.close();
            sent = true;
          }
        } catch (e) {}
        try {
          localStorage.setItem('loombook_oauth_result', JSON.stringify({
            type: payload.type,
            hash: payload.hash,
            search: payload.search,
            ts: Date.now()
          }));
          sent = true;
        } catch (e) {}

        if (window.opener) {
          setTimeout(function () { window.close(); }, 180);
        } else {
          window.location.replace('/' + (payload.search || '') + (payload.hash || '#/'));
        }
      })();
    </script>
  </body>
</html>`);
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    const srcAssetsDir = path.join(__dirname, 'src', 'assets');
    app.use('/src/assets', express.static(srcAssetsDir));
    app.use(express.static(distDir));
    app.use((req: Request, res: Response, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Loombook server listening on http://0.0.0.0:${port}`);
  });
}

void startServer();
