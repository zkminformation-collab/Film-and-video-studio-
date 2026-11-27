export const MAX_STORY_UNITS = 25;
export const STORY_SCENES_PER_UNIT = 3;

export const STORY_EFFECTS = {
  none: 'None',
  fade: 'Fade in / out',
  warm: 'Warm color',
  monochrome: 'Black & white',
  zoom: 'Slow zoom',
} as const;

export const STORY_FRAMINGS = ['Establishing', 'Wide Shot', 'Medium Shot', 'Close-up', 'Over-the-shoulder'] as const;

export interface CartoonStoryScene {
  title: string;
  location: string;
  action: string;
  framing: typeof STORY_FRAMINGS[number];
  imagePrompt: string;
  dialogue: string;
  audioDirection: string;
  effectsDirection: string;
  effect: keyof typeof STORY_EFFECTS;
  subtitle: string;
  seconds: number;
}

export interface CartoonStoryUnit {
  number: number;
  title: string;
  story: string;
  scenes: CartoonStoryScene[];
}

export interface CartoonStoryPlan {
  id: string;
  title: string;
  premise: string;
  format: 'episodes' | 'chapters';
  source: 'gemini' | 'studio_draft';
  units: CartoonStoryUnit[];
}

export interface CartoonStoryProduction {
  parentProjectId: string;
  planId: string;
  storyTitle: string;
  format: CartoonStoryPlan['format'];
  unit: CartoonStoryUnit;
}
