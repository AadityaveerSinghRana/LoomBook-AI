export type LlmProvider = 'gemini-4-hydrogen' | 'pollinations-openai';

export type ReaderEventType =
  | 'page_view'
  | 'dwell'
  | 'fast_skip'
  | 'reread'
  | 'regenerate'
  | 'edit'
  | 'session_abandon';

export type SteerDirection = 'more_tension' | 'lighter_tone' | 'plot_twist';

export type SteerStatus = 'pending' | 'applied' | 'auto_applied' | 'dismissed';

export interface StoryBible {
  premise: string;
  protagonist: string;
  setting: string;
  toneRules: string;
  plotArc: string;
  pacingNotes: string;
}

export interface StoryPage {
  id: string;
  storyId: string;
  pageIndex: number;
  chapterTitle: string;
  prose: string;
  illustrationCue: string;
  pacingIntent: string;
  steeredBy?: 'manual' | 'autopilot' | null;
  lastSteerNote?: string | null;
  updatedAt: string;
}

export interface Story {
  id: string;
  title: string;
  subtitle: string;
  genre: string;
  audience: string;
  prompt: string;
  llmProvider: LlmProvider;
  coverUrl: string;
  storyBible: StoryBible;
  pages: StoryPage[];
  createdAt: string;
  updatedAt: string;
}

export interface ReaderEvent {
  id: string;
  storyId: string;
  pageIndex: number;
  sessionId: string;
  eventType: ReaderEventType;
  dwellMs: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface PageEngagementScore {
  storyId: string;
  pageIndex: number;
  engagementScore: number; // 0 to 100
  avgDwellMs: number;
  viewCount: number;
  fastSkipCount: number;
  consecutiveFastSkips: number;
  rereadCount: number;
  regenerateCount: number;
  editCount: number;
  abandonCount: number;
  troubleTriggered: boolean;
  troubleReason: string | null;
  updatedAt: string;
}

export interface SteerOption {
  id: string;
  direction: SteerDirection;
  label: string;
  title: string;
  rationale: string;
  previewHook: string;
  confidenceRank: number;
}

export interface SteerSuggestion {
  id: string;
  storyId: string;
  troublePageIndex: number;
  targetPageIndex: number;
  triggerReason: string;
  engagementScoreAtTrigger: number;
  options: SteerOption[];
  selectedOptionId: string | null;
  status: SteerStatus;
  autoApplyAt: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AutopilotMetrics {
  totalStories: number;
  totalEvents: number;
  troubleTriggersCaught: number;
  quietAutoSteers: number;
  manualSteersApplied: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface NoteAttachment {
  name: string;
  path: string;
  size: number;
  type: string;
  id: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  tags?: string[];
  attachments?: NoteAttachment[];
}

export enum RoutePath {
  HOME = '/',
  STUDIO = '/studio',
  STUDIO_DETAIL = '/studio/:id',
  READER = '/read/:id',
  ARCHITECTURE = '/architecture',
  ACCOUNT = '/account',
  LOGIN = '/login',
  SIGNUP = '/signup',
}