import fs from 'fs';
import path from 'path';

export interface DesignLibraryItem {
  id: string;
  name: string;
  category:
    | 'Film Styles'
    | 'Animation'
    | 'Manhwa'
    | 'Character Designs'
    | 'Backgrounds'
    | 'Camera Designs'
    | 'Lighting'
    | 'VFX Designs'
    | 'Transitions'
    | 'Typography'
    | 'UI Designs';
  previewUrl: string;
  description: string;
  associatedPrompts: string[];
  editableSettings: Record<string, string>;
  license: string;
  source: string;
  targetModule: string;
  isFavourite: boolean;
  createdAt: string;
}

export const PROMPT_26_CATEGORIES = [
  'AI Film Prompts',
  'Story Prompts',
  'Screenplay Prompts',
  'Scene Prompts',
  'Character Prompts',
  'Background Prompts',
  'Storyboard Prompts',
  'AI Image Prompts',
  'Image Editing Prompts',
  'AI Video Prompts',
  'Image-to-Video Prompts',
  'Animation Prompts',
  'Manhwa Prompts',
  'Camera Prompts',
  'Lighting Prompts',
  'Voice Prompts',
  'Emotion Prompts',
  'Lip-Sync Prompts',
  'Music Prompts',
  'Sound Effects Prompts',
  'VFX Prompts',
  'Transition Prompts',
  'Subtitle Prompts',
  'Editing Prompts',
  'Thumbnail Prompts',
  'Marketing Prompts',
] as const;

export type PromptCategory26 = (typeof PROMPT_26_CATEGORIES)[number];
export type PromptOrigin = 'builtin' | 'user_created' | 'user_imported' | 'ai_generated';

export interface VariablePromptItem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  promptTemplate: string;
  defaultVariables: Record<string, string>;
  provider: string;
  model: string;
  tags: string[];
  targetModule: string;
  scope: 'builtin' | 'my' | 'community';
  origin: PromptOrigin;
  is_public: boolean;
  isFavourite: boolean;
  version: number;
  usageCount: number;
  lastUsedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromptVersionEntry {
  id: string;
  prompt_id: string;
  version: number;
  title: string;
  promptTemplate: string;
  savedAt: string;
}

export interface PromptUsageEntry {
  id: string;
  prompt_id: string;
  provider: string;
  model: string;
  usedAt: string;
}

export interface StudioTemplateItem {
  id: string;
  name: string;
  category: string;
  description: string;
  aspectRatio: string;
  duration: string;
  visualStyle: string;
  includedModules: string[];
  starterPrompt: string;
  targetModule: string;
  previewUrl: string;
}

interface DesignPromptDb {
  design_library: DesignLibraryItem[];
  prompt_library: VariablePromptItem[];
  prompt_versions: PromptVersionEntry[];
  prompt_usage_history: PromptUsageEntry[];
  template_library: StudioTemplateItem[];
}

const SEED_DESIGNS: DesignLibraryItem[] = [
  {
    id: 'DES_0001',
    name: 'Anamorphic Hollywood Cinema',
    category: 'Film Styles',
    previewUrl: '/assets/images/hero_studio_suite_1794901010340.jpg',
    description: '2.39:1 widescreen cinematic color science with teal-orange shadows and subtle lens flare.',
    associatedPrompts: ['Cinematic 2.39:1 anamorphic film frame, shallow depth of field, subtle film grain, 4K HDR'],
    editableSettings: { aspectRatio: '2.39:1', colorGrade: 'Teal & Amber', grain: '12%', fps: '24' },
    license: 'Studio Built-In (Commercial OK)',
    source: 'Film & Video Studio Ultimate',
    targetModule: 'ai_video',
    isFavourite: true,
    createdAt: '2026-11-18T00:00:00Z',
  },
  {
    id: 'DES_0002',
    name: 'High-Budget Anime Sakuga Style',
    category: 'Animation',
    previewUrl: '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
    description: 'Crisp cel-shaded anime linework with volumetric sunset rim lighting and dynamic smears.',
    associatedPrompts: ['High-budget Japanese anime movie frame, crisp lineart, cel shading, volumetric sky'],
    editableSettings: { style: 'Anime 2D', fps: '24', lineWeight: 'Fine', celShading: '3-Tone' },
    license: 'Studio Built-In (Commercial OK)',
    source: 'Animation Studio',
    targetModule: 'animation',
    isFavourite: true,
    createdAt: '2026-11-18T00:00:00Z',
  },
  {
    id: 'DES_0003',
    name: 'Korean Webtoon Vertical Scroll',
    category: 'Manhwa',
    previewUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    description: 'Dramatic speed lines, glowing aura overlays, and crisp Korean manhwa panel framing.',
    associatedPrompts: ['Korean manhwa action panel, glowing mana aura, crisp ink lines, dramatic vertical composition'],
    editableSettings: { aspectRatio: '9:16', auraGlow: 'High', panelGutter: '16px', motionParallax: '2.5D' },
    license: 'Studio Built-In (Commercial OK)',
    source: 'Manhwa Studio',
    targetModule: 'manhwa_studio',
    isFavourite: false,
    createdAt: '2026-11-18T00:00:00Z',
  },
  {
    id: 'DES_0004',
    name: 'Heroic Fantasy Protagonist Rig',
    category: 'Character Designs',
    previewUrl: '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
    description: 'Consistent character turnaround sheet setup with locked clothing, hairstyle, and facial proportions.',
    associatedPrompts: ['Character sheet turnaround, front/side/back views, consistent outfit and facial features'],
    editableSettings: { archetype: 'Hero', consistencySeed: '48219', outfitLock: 'Enabled', expressions: '4-Pack' },
    license: 'Studio Built-In (Commercial OK)',
    source: 'Character Studio',
    targetModule: 'character',
    isFavourite: false,
    createdAt: '2026-11-18T00:00:00Z',
  },
  {
    id: 'DES_0005',
    name: 'Ancient Temple & Basalt Valley',
    category: 'Backgrounds',
    previewUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    description: 'Atmospheric wide environment plate with mist layers and golden-hour mountain silhouettes.',
    associatedPrompts: ['Wide establishing background plate, ancient stone temple in misty basalt valley, golden hour'],
    editableSettings: { timeOfDay: 'Golden Hour', fogDensity: '45%', parallaxLayers: '4', resolution: '4K' },
    license: 'Studio Built-In (Commercial OK)',
    source: 'Background Studio',
    targetModule: 'storyboard',
    isFavourite: false,
    createdAt: '2026-11-18T00:00:00Z',
  },
  {
    id: 'DES_0006',
    name: 'Low-Angle Hero Tracking Dolly',
    category: 'Camera Designs',
    previewUrl: '/assets/images/hero_studio_suite_1794901010340.jpg',
    description: '35mm anamorphic low-angle dolly push tracking forward through atmospheric foreground particles.',
    associatedPrompts: ['Low-angle 35mm tracking dolly push toward hero, shallow DOF, dramatic foreground depth'],
    editableSettings: { lens: '35mm Anamorphic', motion: 'Dolly Push', aperture: 'f/1.8', stabilization: 'Gimbal' },
    license: 'Studio Built-In (Commercial OK)',
    source: 'Camera Director',
    targetModule: 'ai_video',
    isFavourite: false,
    createdAt: '2026-11-18T00:00:00Z',
  },
  {
    id: 'DES_0007',
    name: 'Volumetric Storm Rim Lighting',
    category: 'Lighting',
    previewUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    description: 'High-contrast cyan moonlight rim paired with warm ember key light for dramatic action scenes.',
    associatedPrompts: ['Dramatic storm lighting, cold cyan rim light with warm orange fire key light, volumetric rain'],
    editableSettings: { keyTemp: '3200K', rimTemp: '7500K', contrast: 'High', volumetrics: 'On' },
    license: 'Studio Built-In (Commercial OK)',
    source: 'Lighting Presets',
    targetModule: 'ai_image',
    isFavourite: false,
    createdAt: '2026-11-18T00:00:00Z',
  },
  {
    id: 'DES_0008',
    name: 'Pyro Embers & Lightning Surge',
    category: 'VFX Designs',
    previewUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    description: 'Additive blend fire sparks, plasma lightning arcs, and shockwave distortion ring.',
    associatedPrompts: ['Cinematic VFX fire embers and electric lightning surge overlay on dark alpha background'],
    editableSettings: { blendMode: 'Screen / Add', particleCount: 'High', glowIntensity: '85%', motionBlur: 'On' },
    license: 'Studio Built-In (Commercial OK)',
    source: 'VFX Studio',
    targetModule: 'vfx',
    isFavourite: true,
    createdAt: '2026-11-18T00:00:00Z',
  },
  {
    id: 'DES_0009',
    name: 'Whip-Pan Flash & Cross-Dissolve',
    category: 'Transitions',
    previewUrl: '/assets/images/hero_studio_suite_1794901010340.jpg',
    description: 'High-energy directional whip-pan motion blur transition for action cuts and trailers.',
    associatedPrompts: ['Fast cinematic whip-pan camera transition with directional light streak blur'],
    editableSettings: { durationMs: '350ms', easing: 'Expo Out', directionalBlur: '70%', audioCue: 'Whoosh' },
    license: 'Studio Built-In (Commercial OK)',
    source: 'Timeline Editor',
    targetModule: 'editor',
    isFavourite: false,
    createdAt: '2026-11-18T00:00:00Z',
  },
  {
    id: 'DES_0010',
    name: 'Cinematic Serif Title & Multilingual Subtitles',
    category: 'Typography',
    previewUrl: '/assets/images/hero_studio_suite_1794901010340.jpg',
    description: 'Wide-tracked theatrical title cards paired with high-legibility subtitle lower-thirds.',
    associatedPrompts: ['Minimal theatrical gold-and-white title typography centered on dark matte backdrop'],
    editableSettings: { titleFont: 'Cinzel / Noto Sans', tracking: '0.25em', subtitleBg: '65% Black', safeMargin: '10%' },
    license: 'SIL OFL / Google Fonts',
    source: 'Subtitle & Title Studio',
    targetModule: 'subtitles',
    isFavourite: false,
    createdAt: '2026-11-18T00:00:00Z',
  },
  {
    id: 'DES_0011',
    name: 'Dark Pro NLE Workstation Theme',
    category: 'UI Designs',
    previewUrl: '/assets/images/hero_studio_suite_1794901010340.jpg',
    description: 'High-contrast obsidian editing suite palette with amber playhead and purple AI accents.',
    associatedPrompts: ['Modern dark film studio workstation UI with multi-track timeline and inspector panels'],
    editableSettings: { surface: '#07090e', accent: '#f59e0b', aiAccent: '#9333ea', density: 'Compact' },
    license: 'Studio Built-In (MIT)',
    source: 'UI System',
    targetModule: 'animation',
    isFavourite: false,
    createdAt: '2026-11-18T00:00:00Z',
  },
];

function makeBuiltinPrompt(
  idx: number,
  title: string,
  description: string,
  category: PromptCategory26,
  promptTemplate: string,
  defaultVariables: Record<string, string>,
  targetModule: string,
  provider: string,
  model: string,
  tags: string[],
  isFavourite = false
): VariablePromptItem {
  const now = '2026-11-18T00:00:00Z';
  return {
    id: `PRM_${String(idx).padStart(4, '0')}`,
    user_id: 'system',
    title,
    description,
    category,
    promptTemplate,
    defaultVariables,
    provider,
    model,
    tags,
    targetModule,
    scope: 'builtin',
    origin: 'builtin',
    is_public: true,
    isFavourite,
    version: 1,
    usageCount: 0,
    lastUsedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

const SEED_PROMPTS: VariablePromptItem[] = [
  makeBuiltinPrompt(
    1,
    'Complete Animated Film Blueprint',
    'Generate a complete end-to-end animated movie production plan from one story idea.',
    'AI Film Prompts',
    `Create a complete [FILM_STYLE] animated film.\nTitle: [MOVIE_TITLE]\nPremise: [STORY_PREMISE]\nLead Character: [LEAD_CHARACTER]\nRuntime: [DURATION]\nAspect Ratio: [ASPECT_RATIO]`,
    {
      FILM_STYLE: 'Pixar-style 3D Cartoon',
      MOVIE_TITLE: 'The Sky Lantern Keeper',
      STORY_PREMISE: 'A young lantern maker restores the stars above a floating mountain village.',
      LEAD_CHARACTER: 'Aarav, a resourceful 12-year-old inventor',
      DURATION: '5 minutes',
      ASPECT_RATIO: '16:9',
    },
    'cartoon_creator',
    'Gemini',
    'gemini-2.5-pro',
    ['film', 'complete-movie', 'blueprint'],
    true
  ),
  makeBuiltinPrompt(
    2,
    'Three-Act Story Arc Generator',
    'Craft an original three-act story outline with character arcs and emotional beats.',
    'Story Prompts',
    `Write a 3-act [GENRE] story set in [WORLD_SETTING].\nHero: [HERO_NAME]\nAntagonist: [ANTAGONIST]\nCore Theme: [THEME]\nTarget Audience: [AUDIENCE]`,
    {
      GENRE: 'Fantasy Adventure',
      WORLD_SETTING: 'An ancient sunken kingdom powered by crystal waterfalls',
      HERO_NAME: 'Maya, a mapmaker apprentice',
      ANTAGONIST: 'The Shadow Tide',
      THEME: 'Courage and friendship',
      AUDIENCE: 'Family & All Ages',
    },
    'script',
    'Gemini',
    'gemini-2.5-pro',
    ['story', '3-act', 'outline'],
    true
  ),
  makeBuiltinPrompt(
    3,
    'Production Screenplay & Dialogue Formatter',
    'Convert a story outline into formatted scenes with INT/EXT sluglines and dialogue.',
    'Screenplay Prompts',
    `Convert this story beat into a production screenplay in [LANGUAGE] with sluglines, action lines, and expressive character dialogue.\nStory Beat: [STORY_BEAT]\nTone: [TONE]\nScenes: [SCENE_COUNT]`,
    {
      LANGUAGE: 'English & Kannada',
      STORY_BEAT: 'The hero opens the sealed vault and awakens the guardian spirit.',
      TONE: 'Cinematic & Emotional',
      SCENE_COUNT: '4 scenes',
    },
    'script',
    'Gemini',
    'gemini-2.5-pro',
    ['screenplay', 'dialogue', 'script']
  ),
  makeBuiltinPrompt(
    4,
    'Individual Cinematic Scene Breakdown',
    'Expand a single story beat into a detailed visual scene description.',
    'Scene Prompts',
    `Write a vivid visual scene breakdown for Scene [SCENE_NUMBER].\nLocation: [LOCATION]\nTime of Day: [TIME_OF_DAY]\nCharacters Present: [CHARACTERS]\nKey Dramatic Beat: [DRAMATIC_BEAT]`,
    {
      SCENE_NUMBER: '01',
      LOCATION: 'Basalt Cliff Temple',
      TIME_OF_DAY: 'Golden Hour Sunset',
      CHARACTERS: 'Hero, Mentor',
      DRAMATIC_BEAT: 'Hero receives the glowing relic as storm clouds gather.',
    },
    'storyboard',
    'Gemini',
    'gemini-2.5-flash',
    ['scene', 'breakdown', 'staging']
  ),
  makeBuiltinPrompt(
    5,
    'Consistent Character Turnaround Sheet',
    'Create a reusable character reference sheet for visual consistency across every shot.',
    'Character Prompts',
    `Create a consistent [ART_STYLE] character turnaround sheet (front, side, back) for [CHARACTER_NAME].\nFace & Hair: [FACE_HAIR]\nClothing: [CLOTHING]\nAccessories: [ACCESSORIES]\nMaintain identical proportions and colors.`,
    {
      ART_STYLE: 'Realistic Anime',
      CHARACTER_NAME: 'Kiran the Sky Ranger',
      FACE_HAIR: 'Expressive dark eyes, windswept black hair, scar on left cheek',
      CLOTHING: 'Indigo cloak with gold trim, leather boots',
      ACCESSORIES: 'Brass compass and luminous blade',
    },
    'character',
    'Imagen / FLUX',
    'imagen-3.0',
    ['character', 'consistency', 'turnaround'],
    true
  ),
  makeBuiltinPrompt(
    6,
    'Widescreen Scene Background Environment Plate',
    'Generate clean character-free environment plates for scene compositing.',
    'Background Prompts',
    `Generate a clean character-free [STYLE] background plate of [LOCATION].\nAtmosphere: [ATMOSPHERE]\nTime of Day: [TIME_OF_DAY]\nAspect Ratio: [ASPECT_RATIO]\nUltra-detailed cinematic depth.`,
    {
      STYLE: 'Cinematic Anime',
      LOCATION: 'Misty pine valley with wooden suspension bridge and waterfalls',
      ATMOSPHERE: 'Floating golden pollen and soft morning mist',
      TIME_OF_DAY: 'Sunrise',
      ASPECT_RATIO: '16:9',
    },
    'ai_image',
    'Imagen / FLUX',
    'imagen-3.0',
    ['background', 'environment', 'plate']
  ),
  makeBuiltinPrompt(
    7,
    'Storyboard Panel Shot Breakdown',
    'Turn a scene into numbered camera shots with framing and action notes.',
    'Storyboard Prompts',
    `Break Scene [SCENE_TITLE] into [SHOT_COUNT] storyboard panels.\nVisual Style: [STYLE]\nKey Action: [KEY_ACTION]\nInclude camera angle, character pose, and dialogue cue per panel.`,
    {
      SCENE_TITLE: 'The Awakening',
      SHOT_COUNT: '6',
      STYLE: 'Anime Cinema',
      KEY_ACTION: 'Hero approaches the glowing monolith and raises the staff.',
    },
    'storyboard',
    'Gemini',
    'gemini-2.5-flash',
    ['storyboard', 'panels', 'shots']
  ),
  makeBuiltinPrompt(
    8,
    '4K Cinematic AI Keyframe Image',
    'Generate high-resolution film frames, posters, and scene concept art.',
    'AI Image Prompts',
    `Generate a [IMAGE_STYLE] keyframe of [SUBJECT] in [LOCATION].\nLighting: [LIGHTING]\nComposition: [COMPOSITION]\nAspect Ratio: [ASPECT_RATIO]\n4K ultra-detailed cinema quality.`,
    {
      IMAGE_STYLE: 'Realistic Anime',
      SUBJECT: 'A young hero standing on a mountain ridge looking at a glowing city',
      LOCATION: 'High alpine cliffs under dramatic clouds',
      LIGHTING: 'Volumetric sunset god rays',
      COMPOSITION: 'Rule of thirds wide establishing shot',
      ASPECT_RATIO: '16:9',
    },
    'ai_image',
    'Imagen / FLUX',
    'imagen-3.0',
    ['image', 'keyframe', '4k']
  ),
  makeBuiltinPrompt(
    9,
    'Precision AI Image Inpaint & Restyle',
    'Modify lighting, outfits, weather, or props on an existing studio image.',
    'Image Editing Prompts',
    `Edit the selected image: [EDIT_INSTRUCTION].\nPreserve: [PRESERVE_ELEMENTS]\nNew Lighting/Mood: [NEW_MOOD]\nKeep face and character identity locked.`,
    {
      EDIT_INSTRUCTION: 'Change daytime clear sky to dramatic stormy twilight with glowing rain reflections',
      PRESERVE_ELEMENTS: 'Character face, pose, and foreground sword',
      NEW_MOOD: 'High-contrast teal and amber storm',
    },
    'ai_image',
    'Imagen / OpenAI',
    'gpt-image-1',
    ['image-editing', 'inpaint', 'restyle']
  ),
  makeBuiltinPrompt(
    10,
    'Cinematic AI Video Generator',
    'Master reusable prompt for generating consistent cinematic video scenes.',
    'AI Video Prompts',
    `Create a cinematic video scene.\n\nVideo style: [STYLE]\nScene description: [SCENE]\nCharacter: [CHARACTER]\nCharacter action: [ACTION]\nLocation: [LOCATION]\nCamera angle: [CAMERA_ANGLE]\nCamera movement: [CAMERA_MOVEMENT]\nLighting: [LIGHTING]\nVisual effects: [VFX]\nDuration: [DURATION]\nAspect ratio: [ASPECT_RATIO]\n\nMaintain character appearance and visual consistency.\nGenerate the scene using the selected video provider.`,
    {
      STYLE: 'Cinematic 3D Anime',
      SCENE: 'Hero confronts an ancient stone guardian awakening in a misty canyon',
      CHARACTER: 'Young ranger in obsidian cloak with glowing runes',
      ACTION: 'Steps forward and raises an illuminated blade as embers rise',
      LOCATION: 'Volcanic basalt valley temple at dusk',
      CAMERA_ANGLE: 'Low-angle hero shot',
      CAMERA_MOVEMENT: 'Smooth dolly push-in with subtle orbital arc',
      LIGHTING: 'Volumetric sunset rim light with warm ember glow',
      VFX: 'Floating fire sparks, drifting mist, subtle lens flare',
      DURATION: '8 seconds',
      ASPECT_RATIO: '16:9',
    },
    'ai_video',
    'Veo / Video Provider',
    'veo-3.1',
    ['video', 'cinematic', 'master-prompt'],
    true
  ),
  makeBuiltinPrompt(
    11,
    'Image-to-Video Still Frame Animator',
    'Animate a storyboard panel or AI image with natural motion and camera drift.',
    'Image-to-Video Prompts',
    `Animate the reference still image smoothly over [DURATION].\nSubject Motion: [SUBJECT_MOTION]\nCamera Motion: [CAMERA_MOTION]\nBackground Motion: [BG_MOTION]\nPreserve original artwork style and character face.`,
    {
      DURATION: '5 seconds',
      SUBJECT_MOTION: 'Hair and cloak flowing in breeze, subtle blink and breathing',
      CAMERA_MOTION: 'Gentle 5% slow zoom-in',
      BG_MOTION: 'Drifting clouds and shimmering water reflections',
    },
    'ai_video',
    'Veo / Video Provider',
    'veo-3.1',
    ['image-to-video', 'i2v', 'animate-still']
  ),
  makeBuiltinPrompt(
    12,
    '2D / 3D / Anime Action Animation Sequence',
    'Direct character movement, smears, and fluid animation timing.',
    'Animation Prompts',
    `Create a [ANIMATION_STYLE] animated sequence at [FPS] FPS.\nCharacter Movement: [MOVEMENT]\nTiming & Pacing: [TIMING]\nSecondary Motion: [SECONDARY_MOTION]`,
    {
      ANIMATION_STYLE: '2D Sakuga Anime',
      FPS: '24',
      MOVEMENT: 'Acrobatic leap across collapsing stone pillars',
      TIMING: 'Snappy anticipation, fast impact frame, slow-motion apex',
      SECONDARY_MOTION: 'Trailing scarf, dust clouds, flying pebbles',
    },
    'animation',
    'Animation Engine',
    'studio-2d-3d',
    ['animation', '2d', '3d', 'anime']
  ),
  makeBuiltinPrompt(
    13,
    'Manhwa Panel-to-Video Parallax & Aura',
    'Convert Korean comic/manhwa panels into dynamic 2.5D video scenes.',
    'Manhwa Prompts',
    `Animate this manhwa panel in [ASPECT_RATIO].\nLayer Separation: [PARALLAX]\nAura & Speed Lines: [AURA_EFFECT]\nCamera Move: [CAMERA_MOVE]\nKeep crisp comic ink outlines.`,
    {
      ASPECT_RATIO: '9:16',
      PARALLAX: '3-layer foreground character, mid-ground slash, deep background',
      AURA_EFFECT: 'Electric violet mana flames and radial speed lines',
      CAMERA_MOVE: 'Dramatic punch-in zoom on character eyes',
    },
    'manhwa_studio',
    'Manhwa Engine',
    'manhwa-2.5d',
    ['manhwa', 'webtoon', 'comic']
  ),
  makeBuiltinPrompt(
    14,
    'Cinematography Camera Angle & Lens Director',
    'Specify exact focal length, shot size, and camera movement choreography.',
    'Camera Prompts',
    `Direct camera on [LENS] lens with [SHOT_SIZE] framing.\nMovement: [CAMERA_MOVE]\nDepth of Field: [DOF]\nComposition Rule: [COMPOSITION]`,
    {
      LENS: '35mm Anamorphic',
      SHOT_SIZE: 'Over-the-shoulder medium close-up',
      CAMERA_MOVE: 'Slow Steadicam tracking arc left-to-right',
      DOF: 'Shallow f/1.8 with rack focus to hero eyes',
      COMPOSITION: 'Leading lines with dramatic foreground silhouette',
    },
    'camera',
    'Camera Director',
    'cinema-rig',
    ['camera', 'lens', 'cinematography']
  ),
  makeBuiltinPrompt(
    15,
    'Cinematic Three-Point & Volumetric Lighting',
    'Design filmic lighting mood, color temperature, and atmospheric haze.',
    'Lighting Prompts',
    `Apply [LIGHTING_STYLE] lighting setup.\nKey Light: [KEY_LIGHT]\nRim/Back Light: [RIM_LIGHT]\nAtmosphere: [ATMOSPHERE]\nColor Contrast: [COLOR_CONTRAST]`,
    {
      LIGHTING_STYLE: 'Chiaroscuro Dramatic Rim',
      KEY_LIGHT: 'Warm 3200K torchlight from camera left',
      RIM_LIGHT: 'Cold 7000K cyan moonlight outlining silhouette',
      ATMOSPHERE: 'Light volumetric fog catching sunbeams',
      COLOR_CONTRAST: 'Teal shadows with golden amber highlights',
    },
    'ai_image',
    'Imagen / FLUX',
    'imagen-3.0',
    ['lighting', 'volumetric', 'cinematography']
  ),
  makeBuiltinPrompt(
    16,
    'Multilingual Character Voiceover & Narration',
    'Synthesize expressive dialogue in Kannada, English, Hindi, Tamil, or Telugu.',
    'Voice Prompts',
    `Perform this dialogue in [LANGUAGE] with [VOICE_STYLE] voice and [EMOTION] emotion at [SPEED] speed:\n"[DIALOGUE_TEXT]"`,
    {
      LANGUAGE: 'Kannada / English',
      VOICE_STYLE: 'Warm heroic narrator',
      EMOTION: 'Calm yet inspiring',
      SPEED: 'Normal cinematic pace',
      DIALOGUE_TEXT: 'Every great journey begins with a single spark of courage.',
    },
    'ai_voice',
    'ElevenLabs',
    'eleven_multilingual_v2',
    ['voice', 'tts', 'dialogue', 'kannada']
  ),
  makeBuiltinPrompt(
    17,
    'Character Facial Expression & Emotion Pack',
    'Direct subtle micro-expressions and emotional arcs for animated characters.',
    'Emotion Prompts',
    `Express [PRIMARY_EMOTION] transitioning into [SECONDARY_EMOTION] for [CHARACTER_NAME].\nEye Direction: [EYE_LINE]\nBody Language: [POSTURE]\nIntensity: [INTENSITY]`,
    {
      PRIMARY_EMOTION: 'Quiet determination',
      SECONDARY_EMOTION: 'Hopeful relief',
      CHARACTER_NAME: 'Maya',
      EYE_LINE: 'Looks slightly off-camera toward horizon',
      POSTURE: 'Shoulders relax, subtle confident smile',
      INTENSITY: 'Natural & cinematic (not exaggerated)',
    },
    'character',
    'Animation Engine',
    'expression-rig',
    ['emotion', 'expressions', 'acting']
  ),
  makeBuiltinPrompt(
    18,
    'Dialogue Lip-Sync & Viseme Timing',
    'Synchronize spoken dialogue audio with accurate character mouth shapes.',
    'Lip-Sync Prompts',
    `Synchronize character [CHARACTER_NAME] mouth visemes to [LANGUAGE] audio line:\n"[SPOKEN_LINE]"\nFrame Rate: [FPS] FPS\nJaw Emphasis: [EMPHASIS]`,
    {
      CHARACTER_NAME: 'Aarav',
      LANGUAGE: 'Kannada (kn-IN)',
      SPOKEN_LINE: 'Naavu ee kadalannu daati hosa lokavannu kaanona!',
      FPS: '24',
      EMPHASIS: 'Natural conversational articulation with eyebrow accents',
    },
    'animation',
    'Lip-Sync Engine',
    'viseme-sync-24fps',
    ['lip-sync', 'visemes', 'dialogue']
  ),
  makeBuiltinPrompt(
    19,
    'Cinematic Background Score Composer',
    'Generate looping background music, theme scores, intros, and outros.',
    'Music Prompts',
    `Compose a [GENRE] music track with [MOOD] mood.\nLead Instruments: [INSTRUMENTS]\nTempo: [TEMPO]\nDuration: [DURATION]\nLoopable: [LOOP]`,
    {
      GENRE: 'Orchestral Cinematic',
      MOOD: 'Epic & Uplifting',
      INSTRUMENTS: 'Soaring strings, piano, flute, cinematic percussion',
      TEMPO: 'Medium (105 BPM)',
      DURATION: '60 seconds',
      LOOP: 'Yes, seamless loop',
    },
    'audio',
    'Stability Audio',
    'stable-audio-open',
    ['music', 'score', 'soundtrack']
  ),
  makeBuiltinPrompt(
    20,
    'Cinematic & Environmental Sound Effects (SFX)',
    'Create crisp foley, impacts, weather, and transition sound effects.',
    'Sound Effects Prompts',
    `Generate a clean studio [SFX_CATEGORY] sound effect: [SFX_DESCRIPTION].\nDuration: [DURATION]\nEnvironment Acoustic: [ACOUSTICS]\nNo background music.`,
    {
      SFX_CATEGORY: 'Action & Weather',
      SFX_DESCRIPTION: 'Deep cinematic thunder rumble followed by rain hitting stone courtyard',
      DURATION: '6 seconds',
      ACOUSTICS: 'Wide open outdoor canyon reverb',
    },
    'audio',
    'Stability Audio',
    'stable-audio-sfx',
    ['sfx', 'foley', 'sound-effects']
  ),
  makeBuiltinPrompt(
    21,
    'VFX Fire, Smoke, Lightning & Particles',
    'Create compositing-ready elemental visual effects overlays.',
    'VFX Prompts',
    `Generate a [VFX_TYPE] visual effect element.\nColor Palette: [COLORS]\nIntensity: [INTENSITY]\nBackground: Pure black for additive/screen compositing\nFrame Rate: [FPS] FPS`,
    {
      VFX_TYPE: 'Swirling fire embers and plasma lightning burst',
      COLORS: 'Molten gold orange and electric cyan',
      INTENSITY: 'High impact burst fading to drifting sparks',
      FPS: '24',
    },
    'vfx',
    'VFX Engine',
    'vfx-compositor',
    ['vfx', 'fire', 'lightning', 'particles']
  ),
  makeBuiltinPrompt(
    22,
    'Seamless Cinematic Scene Transition',
    'Design whip-pans, match cuts, light leaks, and portal transitions between shots.',
    'Transition Prompts',
    `Create a [TRANSITION_STYLE] transition from [FROM_SCENE] into [TO_SCENE].\nDuration: [DURATION]\nAudio Cue: [AUDIO_CUE]`,
    {
      TRANSITION_STYLE: 'Directional whip-pan motion blur with golden light streak',
      FROM_SCENE: 'Close-up of glowing lantern',
      TO_SCENE: 'Wide aerial reveal of sunrise over the floating city',
      DURATION: '0.6 seconds',
      AUDIO_CUE: 'Crisp low-end whoosh riser',
    },
    'editor',
    'Timeline Engine',
    'transition-fx',
    ['transitions', 'editing', 'cuts']
  ),
  makeBuiltinPrompt(
    23,
    'Multilingual SRT Subtitle Generator & Translator',
    'Generate accurate time-coded subtitles and translate across Indian & global languages.',
    'Subtitle Prompts',
    `Generate time-coded SRT subtitles translating dialogue from [SOURCE_LANG] to [TARGET_LANGS].\nMax Line Length: [MAX_CHARS] characters\nStyle: [SUBTITLE_STYLE]`,
    {
      SOURCE_LANG: 'English',
      TARGET_LANGS: 'Kannada, Hindi, Tamil, Telugu',
      MAX_CHARS: '42',
      SUBTITLE_STYLE: 'Theatrical clean phrasing with speaker tags when off-screen',
    },
    'subtitles',
    'Gemini',
    'gemini-2.5-flash',
    ['subtitles', 'srt', 'translation']
  ),
  makeBuiltinPrompt(
    24,
    'Timeline Pacing & Rough-Cut Polish Assistant',
    'Tighten edit rhythm, J/L cuts, and audio ducking across the multitrack timeline.',
    'Editing Prompts',
    `Review and tighten the timeline edit for [VIDEO_FORMAT].\nTarget Cut Rhythm: [CUT_PACE]\nDialogue Mixing: [AUDIO_DUCKING]\nVisual Polish: [COLOR_NOTE]`,
    {
      VIDEO_FORMAT: 'Animated Short Film Trailer',
      CUT_PACE: '2.0 seconds average, accelerating to 0.8s at climax',
      AUDIO_DUCKING: 'Duck music track -12 dB under dialogue',
      COLOR_NOTE: 'Consistent warm golden LUT across Act 1',
    },
    'editor',
    'Gemini',
    'gemini-2.5-flash',
    ['editing', 'timeline', 'pacing']
  ),
  makeBuiltinPrompt(
    25,
    'High-CTR YouTube & Film Poster Thumbnail',
    'Design bold, high-contrast 16:9 thumbnails with readable focal hierarchy.',
    'Thumbnail Prompts',
    `Create a high-contrast 16:9 [STYLE] film thumbnail.\nFocal Character: [CHARACTER_POSE]\nBackground Drama: [BG_ELEMENT]\nHeadline Text Space: [TEXT_ZONE]\nColors: [COLOR_POP]`,
    {
      STYLE: '3D Animated Cinema',
      CHARACTER_POSE: 'Hero close-up with glowing eyes and raised crystal staff on right third',
      BG_ELEMENT: 'Exploding storm clouds and floating castle silhouette',
      TEXT_ZONE: 'Clean dark contrast area on upper-left for 3-word bold title',
      COLOR_POP: 'Electric cyan vs fiery amber',
    },
    'ai_image',
    'Imagen / FLUX',
    'imagen-3.0',
    ['thumbnail', 'poster', 'youtube']
  ),
  makeBuiltinPrompt(
    26,
    'Film Launch Titles, Descriptions & Social Copy',
    'Write SEO-optimized YouTube titles, descriptions, hashtags, and launch posts.',
    'Marketing Prompts',
    `Write a complete launch marketing kit for "[FILM_TITLE]" ([GENRE]).\nPlatforms: [PLATFORMS]\nHook Angle: [HOOK]\nInclude 5 clickable titles, SEO description, 12 hashtags, and a 30-second trailer script.`,
    {
      FILM_TITLE: 'The Sky Lantern Keeper',
      GENRE: '3D Animated Fantasy Short',
      PLATFORMS: 'YouTube, Instagram Reels, X, Blog',
      HOOK: 'Made from a single story prompt to full 4K animated film',
    },
    'social_media',
    'Gemini',
    'gemini-2.5-flash',
    ['marketing', 'seo', 'social-media']
  ),
];

const SEED_TEMPLATES: StudioTemplateItem[] = [
  {
    id: 'TPL_0001',
    name: 'Complete 3D Cartoon Short Film',
    category: 'Full Film',
    description: 'End-to-end 3-act animated movie template: Story → Screenplay → Characters → Storyboard → Voices → Music → Timeline MP4.',
    aspectRatio: '16:9 (4K)',
    duration: '03:00',
    visualStyle: 'Pixar-style 3D Cartoon',
    includedModules: ['Story', 'Characters', 'Storyboard', 'AI Video', 'Voice', 'Music', 'Timeline', 'MP4 Export'],
    starterPrompt: 'A curious young inventor and her clockwork fox race across floating islands to relight the sky beacon before sunset.',
    targetModule: 'cartoon_creator',
    previewUrl: '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
  },
  {
    id: 'TPL_0002',
    name: 'Manhwa Chapter to Animated Episode',
    category: 'Manhwa',
    description: 'Convert vertical comic chapters into 2.5D animated episodes with character voiceovers, action VFX, and dramatic soundtracks.',
    aspectRatio: '9:16 & 16:9',
    duration: '02:30',
    visualStyle: 'Korean Manhwa Action',
    includedModules: ['Manhwa Studio', 'AI Image', 'Voice Studio', 'VFX', 'Timeline'],
    starterPrompt: 'Animate a high-stakes dungeon awakening chapter with glowing aura overlays, impact hits, and narrator voiceover.',
    targetModule: 'manhwa_studio',
    previewUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
  },
  {
    id: 'TPL_0003',
    name: 'Cinematic Sci-Fi Trailer (60s)',
    category: 'Trailer',
    description: 'Fast-paced 12-shot sci-fi teaser with deep brass risers, dramatic title cards, and anamorphic color grading.',
    aspectRatio: '2.39:1',
    duration: '01:00',
    visualStyle: 'Cinematic Sci-Fi',
    includedModules: ['Storyboard', 'AI Video', 'Music', 'SFX', 'VFX', 'Subtitles'],
    starterPrompt: 'An expedition uncovers a glowing monolith in a volcanic valley that awakens an orbital starship.',
    targetModule: 'storyboard',
    previewUrl: '/assets/images/hero_studio_suite_1794901010340.jpg',
  },
  {
    id: 'TPL_0004',
    name: 'Multilingual Explainer & Motion GFX',
    category: 'Motion Graphics',
    description: 'Clean Lottie + Motion Graphics educational video template with Kannada/English/Hindi narration and subtitles.',
    aspectRatio: '16:9',
    duration: '01:30',
    visualStyle: 'Motion Graphics & Lottie',
    includedModules: ['Animation Studio', 'Voice Studio', 'Subtitles', 'Timeline'],
    starterPrompt: 'Explain how solar satellites beam clean energy to remote villages using crisp animated icons and warm narration.',
    targetModule: 'animation',
    previewUrl: '/assets/images/hero_studio_suite_1794901010340.jpg',
  },
];

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'design-prompt-db.json');

function readDb(): DesignPromptDb {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) {
      const initial: DesignPromptDb = {
        design_library: SEED_DESIGNS,
        prompt_library: SEED_PROMPTS,
        prompt_versions: [],
        prompt_usage_history: [],
        template_library: SEED_TEMPLATES,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    const existingPrompts: VariablePromptItem[] = Array.isArray(parsed?.prompt_library) ? parsed.prompt_library : [];
    // Ensure all 26 built-in category prompts are present while preserving user-created/imported prompts
    const userPrompts = existingPrompts.filter((p) => p.origin && p.origin !== 'builtin');
    const existingBuiltinById = new Map(existingPrompts.filter((p) => !p.origin || p.origin === 'builtin').map((p) => [p.id, p]));
    const mergedBuiltins = SEED_PROMPTS.map((seed) => {
      const prev = existingBuiltinById.get(seed.id);
      if (prev && prev.category === seed.category) {
        return { ...seed, isFavourite: prev.isFavourite, usageCount: prev.usageCount || 0, lastUsedAt: prev.lastUsedAt || null };
      }
      return seed;
    });

    return {
      design_library: Array.isArray(parsed?.design_library) && parsed.design_library.length > 0 ? parsed.design_library : SEED_DESIGNS,
      prompt_library: [...userPrompts, ...mergedBuiltins],
      prompt_versions: Array.isArray(parsed?.prompt_versions) ? parsed.prompt_versions : [],
      prompt_usage_history: Array.isArray(parsed?.prompt_usage_history) ? parsed.prompt_usage_history : [],
      template_library: Array.isArray(parsed?.template_library) && parsed.template_library.length > 0 ? parsed.template_library : SEED_TEMPLATES,
    };
  } catch {
    return {
      design_library: SEED_DESIGNS,
      prompt_library: SEED_PROMPTS,
      prompt_versions: [],
      prompt_usage_history: [],
      template_library: SEED_TEMPLATES,
    };
  }
}

function writeDb(db: DesignPromptDb): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function extractVariables(template: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const m of template.matchAll(/\[([A-Z0-9_]+)\]/g)) {
    vars[m[1]] = '';
  }
  return vars;
}

export function listDesigns() {
  return readDb().design_library;
}

export function createDesign(input: Partial<DesignLibraryItem> & { name: string; category: DesignLibraryItem['category'] }): DesignLibraryItem {
  const db = readDb();
  const item: DesignLibraryItem = {
    id: `DES_${String(db.design_library.length + 1).padStart(4, '0')}`,
    name: input.name.trim(),
    category: input.category,
    previewUrl: input.previewUrl || '/assets/images/hero_studio_suite_1794901010340.jpg',
    description: input.description || 'Custom studio design preset.',
    associatedPrompts: Array.isArray(input.associatedPrompts) && input.associatedPrompts.length > 0 ? input.associatedPrompts : [input.name],
    editableSettings: input.editableSettings || { aspectRatio: '16:9', quality: '4K' },
    license: input.license || 'Studio Proprietary',
    source: input.source || 'User Created',
    targetModule: input.targetModule || 'ai_image',
    isFavourite: Boolean(input.isFavourite),
    createdAt: new Date().toISOString(),
  };
  db.design_library.unshift(item);
  writeDb(db);
  return item;
}

export function toggleDesignFavourite(id: string): DesignLibraryItem | null {
  const db = readDb();
  const found = db.design_library.find((d) => d.id === id);
  if (!found) return null;
  found.isFavourite = !found.isFavourite;
  writeDb(db);
  return found;
}

export function listPrompts() {
  return readDb().prompt_library;
}

export function listPromptVersions(promptId: string) {
  return readDb().prompt_versions.filter((v) => v.prompt_id === promptId);
}

export function createPrompt(input: {
  title: string;
  description?: string;
  category: string;
  promptTemplate: string;
  targetModule?: string;
  provider?: string;
  model?: string;
  tags?: string[];
  is_public?: boolean;
  origin?: PromptOrigin;
}): VariablePromptItem {
  const db = readDb();
  const now = new Date().toISOString();
  const item: VariablePromptItem = {
    id: `PRM_${String(Date.now()).slice(-6)}`,
    user_id: 'studio-owner',
    title: input.title.trim(),
    description: (input.description || 'Custom studio prompt').trim(),
    category: input.category,
    promptTemplate: input.promptTemplate.trim(),
    defaultVariables: extractVariables(input.promptTemplate),
    provider: input.provider || 'Gemini',
    model: input.model || 'gemini-2.5-flash',
    tags: Array.isArray(input.tags) ? input.tags : [input.category.toLowerCase()],
    targetModule: input.targetModule || 'ai_video',
    scope: input.is_public ? 'community' : 'my',
    origin: input.origin || 'user_created',
    is_public: Boolean(input.is_public),
    isFavourite: false,
    version: 1,
    usageCount: 0,
    lastUsedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  db.prompt_library.unshift(item);
  writeDb(db);
  return item;
}

export function updatePrompt(
  id: string,
  patch: Partial<Pick<VariablePromptItem, 'title' | 'description' | 'category' | 'promptTemplate' | 'provider' | 'model' | 'tags' | 'is_public'>>
): VariablePromptItem | null {
  const db = readDb();
  const found = db.prompt_library.find((p) => p.id === id);
  if (!found) return null;

  // Record version history before overwriting
  db.prompt_versions.unshift({
    id: `VER_${Date.now().toString(36)}`,
    prompt_id: found.id,
    version: found.version,
    title: found.title,
    promptTemplate: found.promptTemplate,
    savedAt: new Date().toISOString(),
  });

  if (patch.title) found.title = patch.title.trim();
  if (patch.description !== undefined) found.description = patch.description.trim();
  if (patch.category) found.category = patch.category;
  if (patch.promptTemplate) {
    found.promptTemplate = patch.promptTemplate.trim();
    found.defaultVariables = { ...extractVariables(found.promptTemplate), ...found.defaultVariables };
  }
  if (patch.provider) found.provider = patch.provider;
  if (patch.model) found.model = patch.model;
  if (Array.isArray(patch.tags)) found.tags = patch.tags;
  if (typeof patch.is_public === 'boolean') {
    found.is_public = patch.is_public;
    if (found.origin !== 'builtin') found.scope = patch.is_public ? 'community' : 'my';
  }
  found.version = (found.version || 1) + 1;
  found.updatedAt = new Date().toISOString();

  writeDb(db);
  return found;
}

export function duplicatePrompt(id: string): VariablePromptItem | null {
  const db = readDb();
  const source = db.prompt_library.find((p) => p.id === id);
  if (!source) return null;
  const now = new Date().toISOString();
  const copy: VariablePromptItem = {
    ...source,
    id: `PRM_${String(Date.now()).slice(-6)}`,
    user_id: 'studio-owner',
    title: `${source.title} (Copy)`,
    scope: 'my',
    origin: 'user_created',
    is_public: false,
    version: 1,
    usageCount: 0,
    lastUsedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  db.prompt_library.unshift(copy);
  writeDb(db);
  return copy;
}

export function importPromptsBatch(format: 'json' | 'csv' | 'txt', content: string, defaultCategory = 'AI Video Prompts'): VariablePromptItem[] {
  const created: VariablePromptItem[] = [];
  const trimmed = content.trim();
  if (!trimmed) return created;

  if (format === 'json') {
    const parsed = JSON.parse(trimmed);
    const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.prompts) ? parsed.prompts : [parsed];
    for (const item of list) {
      if (!item) continue;
      const text = String(item.prompt_text || item.promptTemplate || item.prompt || '').trim();
      if (!text) continue;
      created.push(
        createPrompt({
          title: String(item.title || 'Imported JSON Prompt'),
          description: String(item.description || 'Imported from user JSON file'),
          category: String(item.category || defaultCategory),
          promptTemplate: text,
          provider: item.provider ? String(item.provider) : 'Gemini',
          model: item.model ? String(item.model) : 'gemini-2.5-flash',
          tags: Array.isArray(item.tags) ? item.tags.map(String) : ['imported'],
          origin: 'user_imported',
        })
      );
    }
    return created;
  }

  if (format === 'csv') {
    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const startIdx = lines[0]?.toLowerCase().includes('title') ? 1 : 0;
    for (let i = startIdx; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 2) continue;
      const [title, categoryOrText, maybeText] = cols;
      const category = maybeText ? categoryOrText : defaultCategory;
      const text = maybeText || categoryOrText;
      if (!text) continue;
      created.push(
        createPrompt({
          title: title || `Imported Prompt ${i}`,
          description: 'Imported from user CSV file',
          category,
          promptTemplate: text,
          tags: ['imported', 'csv'],
          origin: 'user_imported',
        })
      );
    }
    return created;
  }

  // TXT format: separated by blank lines
  const blocks = trimmed.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  blocks.forEach((block, idx) => {
    const firstLine = block.split('\n')[0].slice(0, 60);
    created.push(
      createPrompt({
        title: `Imported Prompt ${idx + 1}: ${firstLine}`,
        description: 'Imported from user TXT file',
        category: defaultCategory,
        promptTemplate: block,
        tags: ['imported', 'txt'],
        origin: 'user_imported',
      })
    );
  });
  return created;
}

export function togglePromptFavourite(id: string): VariablePromptItem | null {
  const db = readDb();
  const found = db.prompt_library.find((p) => p.id === id);
  if (!found) return null;
  found.isFavourite = !found.isFavourite;
  writeDb(db);
  return found;
}

export function recordPromptUsage(id: string, provider?: string, model?: string): VariablePromptItem | null {
  const db = readDb();
  const found = db.prompt_library.find((p) => p.id === id);
  if (!found) return null;
  const now = new Date().toISOString();
  found.usageCount = (found.usageCount || 0) + 1;
  found.lastUsedAt = now;
  db.prompt_usage_history.unshift({
    id: `USE_${Date.now().toString(36)}`,
    prompt_id: found.id,
    provider: provider || found.provider,
    model: model || found.model,
    usedAt: now,
  });
  writeDb(db);
  return found;
}

export function listTemplates() {
  return readDb().template_library;
}
