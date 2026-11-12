export type StudioModule =
  | 'dashboard'
  | 'films'
  | 'editor'
  | 'ai_manager'
  | 'prompt_library'
  | 'credit_wallet'
  | 'ai_video'
  | 'ai_image'
  | 'animation'
  | 'vfx'
  | 'audio'
  | 'script'
  | 'storyboard'
  | 'character'
  | 'ai_voice'
  | 'camera'
  | 'subtitles'
  | 'color_grading'
  | 'export'
  | 'media'
  | 'cloud_storage'
  | 'team'
  | 'settings'
  | 'ai_wizard';

export type ViewPlatform =
  | 'workstation'
  | 'android'
  | 'website'
  | 'admin'
  | 'wordpress'
  | 'code_viewer'
  | 'deliverables';

export type StudioTheme = 'creative' | 'cinematic' | 'premiere';

export interface FilmProject {
  id: string;
  title: string;
  tagline: string;
  genre: string;
  status: 'Development' | 'Pre-Production' | 'Production' | 'Post-Production' | 'Completed';
  budget: number;
  spent: number;
  scenesCount: number;
  completedScenes: number;
  shootingDaysTotal: number;
  shootingDaysDone: number;
  aspectRatio: '2.39:1' | '1.85:1' | '16:9' | '9:16' | '4:3';
  resolution: '4K DCI' | '4K UHD' | '1080p Full HD';
  fps: 24 | 30 | 60;
  coverImage: string;
  director: string;
  dp: string;
  updatedAt: string;
  scenes?: any[];
  characters?: any[];
  acts?: any[];
  soundtrack?: any;
  subtitles?: any[];
  pipelineStages?: any[];
  screenplay?: string;
  targetDuration?: string;
  animationStyle?: string;
  language?: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  role: string;
  archetype: string;
  actor: string;
  age: string;
  avatarUrl: string;
  voiceModel: string;
  physicalDescription: string;
  psychologicalProfile: string;
  dialogueSample: string;
}

export interface AiVoicePreset {
  id: string;
  name: string;
  gender: 'Female' | 'Male' | 'Synthetic AI';
  accent: string;
  tone: string;
  sampleText: string;
}

export interface TimelineClip {
  id: string;
  trackId: 'v1' | 'v2' | 'a1' | 'a2' | 'titles';
  name: string;
  start: number; // in seconds
  duration: number; // in seconds
  color: string;
  type: 'video' | 'audio' | 'overlay' | 'title';
  assetUrl?: string;
  speed?: number;
  volume?: number;
  filter?: string;
}

export interface ScreenplayElement {
  id: string;
  type: 'scene_heading' | 'action' | 'character' | 'parenthetical' | 'dialogue' | 'transition';
  text: string;
}

export interface StoryboardShot {
  id: string;
  shotNumber: number;
  sceneNumber: string;
  framing: string;
  cameraAngle: string;
  movement: string;
  lens: string;
  lighting: string;
  action: string;
  dialogue: string;
  imageUrl?: string;
  durationSec: number;
}

export interface MediaAsset {
  id: string;
  name: string;
  category: 'footage' | 'audio' | 'sfx' | 'stills' | 'vfx';
  resolution?: string;
  duration?: string;
  size: string;
  url: string;
  thumbnail: string;
  tags: string[];
}

export interface SubtitleCue {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: 'Directing' | 'Camera' | 'Sound' | 'Editorial' | 'Production' | 'VFX';
  email: string;
  callTime?: string;
  status: 'Confirmed' | 'On Set' | 'Wrapped';
  avatarUrl: string;
}

export interface CallSheet {
  id: string;
  projectName: string;
  dayNumber: number;
  totalDays: number;
  date: string;
  callTime: string;
  location: string;
  weather: string;
  nearestHospital: string;
  scenesToShoot: string[];
}

// ==========================================
// AI Central Management & Provider Interfaces
// ==========================================
export type AiProviderId = 'google_gemini' | 'openai_sora' | 'runway_gen3' | 'elevenlabs' | 'stability_ai' | 'anthropic_claude';

export interface AiProviderConfig {
  id: AiProviderId;
  name: string;
  description: string;
  connected: boolean;
  models: string[];
  activeModel: string;
  latencyMs: number;
  rateLimit: string;
  spendingLimitUsd: number;
  currentSpendUsd: number;
  iconColor: string;
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: 'film' | 'camera' | 'character' | 'vfx' | 'voice' | 'music';
  targetModule: StudioModule;
  prompt: string;
  tags: string[];
  estimatedCredits: number;
}

export interface CreditWallet {
  balance: number;
  plan: 'Free' | 'Creator' | 'Professional' | 'Unlimited' | 'Enterprise';
  unlimitedFairUseCap: number; // monthly safety threshold
  creditsUsedThisMonth: number;
  providerSpendThisMonthUsd: number;
}

export interface CreditTransaction {
  id: string;
  type: 'Deduction' | 'Recharge' | 'Refund' | 'Unlimited Pass';
  tool: string;
  amount: number;
  costUsd: number;
  timestamp: string;
  status: 'Completed' | 'Pending';
}

export interface CostEstimate {
  operationName: string;
  scenesCount?: number;
  durationSec?: number;
  resolution?: string;
  estimatedCredits: number;
  estimatedFinancialCostUsd: number;
  currentBalance: number;
  isUnlimitedEligible: boolean;
}

export interface AiQueueItem {
  id: string;
  tool: string;
  prompt: string;
  provider: string;
  status: 'Queued' | 'Synthesizing' | 'Completed' | 'Failed';
  progress: number;
  timeElapsed: string;
  resultUrl?: string;
}
