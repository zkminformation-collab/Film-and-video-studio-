export type StudioAnimationStyleId =
  | 'cinematic_scifi'
  | 'realistic_3d'
  | 'anime'
  | 'hollywood_3d'
  | 'vector_2d';

export interface StudioAnimationStyle {
  id: StudioAnimationStyleId;
  label: string;
  shortLabel: string;
  renderEngine: string;
  palettePrimary: string;
  paletteAccent: string;
  description: string;
}

export const STUDIO_ANIMATION_STYLES: StudioAnimationStyle[] = [
  {
    id: 'cinematic_scifi',
    label: 'Cinematic Sci-Fi & Fantasy',
    shortLabel: 'Cinematic 3D',
    renderEngine: 'Volumetric Rim Shaders + Anamorphic Bloom',
    palettePrimary: '#f59e0b',
    paletteAccent: '#06b6d4',
    description: 'Moody atmospheric lighting, energy auras, holographic telemetry, and dramatic depth of field.',
  },
  {
    id: 'realistic_3d',
    label: 'Realistic 3D Cinematic',
    shortLabel: 'Realistic 3D',
    renderEngine: 'Raytraced PBR + Path-Traced Skin',
    palettePrimary: '#38bdf8',
    paletteAccent: '#8b5cf6',
    description: 'Photorealistic surface materials, subsurface scattering, atmospheric storm dust, and 65mm anamorphic depth.',
  },
  {
    id: 'anime',
    label: 'Anime-Style Series',
    shortLabel: 'Anime Style',
    renderEngine: '2.5D Cel-Shaded + Impact Frame VFX',
    palettePrimary: '#ec4899',
    paletteAccent: '#a855f7',
    description: 'Dynamic speedlines, expressive hand-drawn smears, high-contrast cel shadows, and stylized energy arcs.',
  },
  {
    id: 'hollywood_3d',
    label: 'Hollywood 3D Feature',
    shortLabel: 'Hollywood 3D',
    renderEngine: 'Feature Stylized Rig + SSS',
    palettePrimary: '#8b5cf6',
    paletteAccent: '#f59e0b',
    description: 'Expressive theatrical character acting, painterly brushwork textures, and blockbuster rim lighting.',
  },
  {
    id: 'vector_2d',
    label: '2D Vector / Cel Animation',
    shortLabel: '2D Vector',
    renderEngine: 'Clean Keyframe Vector Rig (24 FPS)',
    palettePrimary: '#10b981',
    paletteAccent: '#38bdf8',
    description: 'Razor-sharp 2D puppeted limbs, onion-skin keyframing, inked outlines, and multi-plane camera pan.',
  },
];

export interface StudioCharacterLock {
  id: string;
  name: string;
  role: string;
  seedCode: string;
  voiceProfileName: string;
  kannadaVoice: string;
  primaryColor: string;
  accentColor: string;
  signatureProp: string;
  defaultExpression: 'heroic' | 'calm' | 'fierce' | 'sorrow';
  sampleKannadaLine: string;
  sampleEnglishLine: string;
}

export const STUDIO_CHARACTER_LOCKS: StudioCharacterLock[] = [
  {
    id: 'valerie-lead',
    name: 'COMMANDER VALERIE CHEN',
    role: 'Lead Explorer · Orbital Pioneer',
    seedCode: 'CHRONOS-SEED-01',
    voiceProfileName: 'Valerie Chen (English Female)',
    kannadaVoice: 'kn-IN-Wavenet-A · Expressive Alto',
    primaryColor: '#38bdf8',
    accentColor: '#f59e0b',
    signatureProp: 'Orbital Telemetry Scanner',
    defaultExpression: 'heroic',
    sampleKannadaLine: 'ಪ್ರೊಮೆಥಿಯಸ್ ಸ್ಟೇಷನ್, ನಕ್ಷತ್ರಗಳ ನಡುವೆ ಹೊಸ ಸಂಕೇತ ದೃಢಪಟ್ಟಿದೆ!',
    sampleEnglishLine: 'Prometheus Station, do you copy? Telemetry shows a stable resonance across the ridge.',
  },
  {
    id: 'huxley-director',
    name: 'DR. HUXLEY VANCE',
    role: 'Mission Director · Ground Command',
    seedCode: 'CHRONOS-SEED-02',
    voiceProfileName: 'Dr. Huxley Vance (English Male)',
    kannadaVoice: 'kn-IN-Wavenet-B · Deep Baritone',
    primaryColor: '#ef4444',
    accentColor: '#a855f7',
    signatureProp: 'Command Holotable Relay',
    defaultExpression: 'fierce',
    sampleKannadaLine: 'ತಕ್ಷಣ ಹಿಂದೆ ಸರಿಯಿರಿ! ಅಲ್ಲಿ ವಿದ್ಯುತ್ಕಾಂತೀಯ ತರಂಗಗಳು ಹೆಚ್ಚಾಗುತ್ತಿವೆ.',
    sampleEnglishLine: 'Pull back immediately! Orbital sensors just registered a massive gravity spike.',
  },
  {
    id: 'arya-synth',
    name: 'SYNTH ARYA-7',
    role: 'Co-Pilot & Navigation AI',
    seedCode: 'CHRONOS-SEED-03',
    voiceProfileName: 'Arya-7 (Synthetic AI)',
    kannadaVoice: 'kn-IN-Standard-A · Analytical Calm',
    primaryColor: '#06b6d4',
    accentColor: '#a855f7',
    signatureProp: 'Optical Quantum Core',
    defaultExpression: 'calm',
    sampleKannadaLine: 'ಕಮಾಂಡರ್, ಈ ದ್ವಾರವು ನಮ್ಮ ನಕ್ಷತ್ರಪುಂಜದ ಕೇಂದ್ರಕ್ಕೆ ಸಂಪರ್ಕಿಸುತ್ತದೆ.',
    sampleEnglishLine: 'Commander, the monolith glyphs match a prime mathematical ignition sequence.',
  },
  {
    id: 'kairo-ranger',
    name: 'CAPTAIN KAIRO',
    role: 'Action Sequence Lead',
    seedCode: 'CHRONOS-SEED-04',
    voiceProfileName: 'Vikram R. (Kannada Male)',
    kannadaVoice: 'kn-IN-Wavenet-B · Commanding Lead',
    primaryColor: '#ec4899',
    accentColor: '#fbbf24',
    signatureProp: 'Plasma Edge Blade',
    defaultExpression: 'heroic',
    sampleKannadaLine: 'ಸತ್ಯದ ಬೆಳಕು ಕತ್ತಲೆಯನ್ನು ಭೇದಿಸುತ್ತದೆ. ನಾವು ಮುಂದೆ ಸಾಗೋಣ!',
    sampleEnglishLine: 'Hold the perimeter and engage stabilizers—we are crossing the event horizon!',
  },
];

export interface StudioScenePresetSpec {
  sceneNumber: number;
  title: string;
  kannadaTitle: string;
  runtimeMinutes: number;
  summary: string;
  keyAction: string;
  environmentPreset: 'ash_embers' | 'lightning_storm' | 'sacred_sunset' | 'celestial_sanctum';
  recommendedStyle: StudioAnimationStyleId;
  previewImage: string;
}

const CORE_SCENE_PRESETS: StudioScenePresetSpec[] = [
  {
    sceneNumber: 1,
    title: 'Basalt Valley Discovery',
    kannadaTitle: 'ದೃಶ್ಯ 1 – ಬಸಾಲ್ಟ್ ಕಣಿವೆಯ ಅನ್ವೇಷಣೆ',
    runtimeMinutes: 12,
    summary: 'As electromagnetic storms roll across the ridge, the explorer uncovers an active obsidian monolith.',
    keyAction: 'Slow dolly push-in across fog while blue pulse rings illuminate the horizon.',
    environmentPreset: 'ash_embers',
    recommendedStyle: 'cinematic_scifi',
    previewImage: '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
  },
  {
    sceneNumber: 2,
    title: 'Neon Crossing Protocol',
    kannadaTitle: 'ದೃಶ್ಯ 2 – ನಿಯಾನ್ ನಗರದ ಹಾದಿ',
    runtimeMinutes: 12,
    summary: 'Heavy rain pours over the high-tech sector as the courier races against a system lockdown.',
    keyAction: 'Low-angle tracking shot through neon reflections and atmospheric haze.',
    environmentPreset: 'lightning_storm',
    recommendedStyle: 'anime',
    previewImage: '/src/assets/images/cinema_cyberpunk_alley_1794406568416.jpg',
  },
  {
    sceneNumber: 3,
    title: 'Soundstage Master Setup',
    kannadaTitle: 'ದೃಶ್ಯ 3 – ಸ್ಟುಡಿಯೋ ಮಾಸ್ಟರ್ ದೃಶ್ಯ',
    runtimeMinutes: 12,
    summary: 'Tungsten arc lights sweep across the grand soundstage as the final confrontation begins.',
    keyAction: 'Wide crane pedestal rising over the illuminated stage floor.',
    environmentPreset: 'sacred_sunset',
    recommendedStyle: 'realistic_3d',
    previewImage: '/src/assets/images/cinema_soundstage_set_1794406569758.jpg',
  },
  {
    sceneNumber: 4,
    title: 'Celestial Core Resonance',
    kannadaTitle: 'ದೃಶ್ಯ 4 – ಆಕಾಶಕಾಯದ ಅನುರಣನ',
    runtimeMinutes: 12,
    summary: 'The crew synchronizes the star-lens array as cosmic energy arcs above the sanctuary.',
    keyAction: 'Orbiting 360 camera circling characters bathed in teal and gold volumetric light.',
    environmentPreset: 'celestial_sanctum',
    recommendedStyle: 'hollywood_3d',
    previewImage: '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
  },
];

export function getScenePreset(sceneNum: number): StudioScenePresetSpec {
  const clamped = Math.max(1, Math.min(24, Math.round(sceneNum)));
  const found = CORE_SCENE_PRESETS.find((c) => c.sceneNumber === clamped);
  if (found) return found;

  const envRotation: StudioScenePresetSpec['environmentPreset'][] = [
    'ash_embers',
    'sacred_sunset',
    'lightning_storm',
    'celestial_sanctum',
  ];
  const styleRotation: StudioAnimationStyleId[] = [
    'cinematic_scifi',
    'realistic_3d',
    'anime',
    'hollywood_3d',
    'vector_2d',
  ];

  return {
    sceneNumber: clamped,
    title: `Production Sequence ${clamped}`,
    kannadaTitle: `ದೃಶ್ಯ ${clamped} – ಸ್ಟುಡಿಯೋ ಸರಣಿ`,
    runtimeMinutes: 12,
    summary: `Sequence ${clamped} cinematic shot block with synchronized Kannada/English ADR and dynamic camera trajectory.`,
    keyAction: 'Dynamic camera tracking with atmospheric particle depth and rim illumination.',
    environmentPreset: envRotation[(clamped - 1) % envRotation.length],
    recommendedStyle: styleRotation[(clamped - 1) % styleRotation.length],
    previewImage:
      clamped % 2 === 1
        ? '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg'
        : '/src/assets/images/cinema_cyberpunk_alley_1794406568416.jpg',
  };
}
