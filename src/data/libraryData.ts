// Phase 3 — Complete Media & Creative Asset Library Data Model & Catalog

export type AssetCategory =
  | 'video'
  | 'film'
  | 'music'
  | 'sfx'
  | 'voice'
  | 'image'
  | 'character'
  | 'animation'
  | 'vfx'
  | 'transition'
  | 'color'
  | 'template'
  | '3d_asset'
  | 'project';

export type AssetSource = 'builtin' | 'licensed' | 'upload' | 'ai_generated';

export interface AssetLicense {
  type: 'Royalty-Free Worldwide' | 'Creative Commons CC0' | 'Commercial Studio License' | 'AI Studio Creative License' | 'Studio Master Proprietary';
  commercialUse: boolean;
  attribution: string;
  certificateId: string;
  verified: boolean;
}

export interface UniversalAsset {
  id: string;
  name: string;
  category: AssetCategory;
  subcategory: string;
  source: AssetSource;
  format: string;
  resolution?: string;
  duration?: string;
  size: string;
  thumbnail: string;
  mediaUrl?: string;
  description: string;
  tags: string[];
  license: AssetLicense;
  specs: {
    codec?: string;
    fps?: number;
    colorSpace?: string;
    aspect?: string;
    sampleRate?: string;
    bitDepth?: string;
    channels?: string;
    polyCount?: string;
    lutFilter?: string;
    soundMethod?: string;
    cssStyle?: string;
  };
  isFavorite: boolean;
  collection?: string;
  addedAt: string;
  usageCount: number;
}

export interface AssetCollection {
  id: string;
  name: string;
  description: string;
  assetCount: number;
  coverImage: string;
  category: string;
}

export const ASSET_CATEGORIES: { id: AssetCategory; name: string; icon: string; description: string; count: number }[] = [
  { id: 'video', name: 'Video Library', icon: '🎬', description: 'Stock footage, cinematic clips, nature, cities, action, lifestyle', count: 18 },
  { id: 'film', name: 'Film Library', icon: '🎥', description: 'Film scenes, cinematic references, shot examples, film templates', count: 14 },
  { id: 'music', name: 'Music Library', icon: '🎵', description: 'Background music, cinematic scores, emotional & orchestral music', count: 16 },
  { id: 'sfx', name: 'Sound Effects (SFX)', icon: '🔊', description: 'Explosions, rain, thunder, footsteps, weapons and impacts', count: 24 },
  { id: 'voice', name: 'Voice Library', icon: '🎙️', description: 'AI voices, narration, character voices, voice-over', count: 12 },
  { id: 'image', name: 'Image Library', icon: '🎨', description: 'Backgrounds, textures, posters, photographs & illustrations', count: 20 },
  { id: 'character', name: 'Character Library', icon: '🧍', description: '2D characters, 3D characters, costumes, expressions & poses', count: 10 },
  { id: 'animation', name: 'Animation Library', icon: '🎞️', description: 'Character movements, motion graphics, animated objects & scenes', count: 12 },
  { id: 'vfx', name: 'VFX Library', icon: '✨', description: 'Fire, smoke, particles, lightning, explosions, green-screen effects', count: 15 },
  { id: 'transition', name: 'Transition Library', icon: '🔄', description: 'Fade, dissolve, zoom, whip, cinematic wipe transitions', count: 14 },
  { id: 'color', name: 'Color Library', icon: '🎨', description: 'LUTs, color-grading presets & cinematic looks', count: 16 },
  { id: 'template', name: 'Template Library', icon: '📝', description: 'Intro, outro, titles, credits, subtitles & film templates', count: 14 },
  { id: '3d_asset', name: '3D Asset Library', icon: '🧊', description: 'Models, environments, props, materials & studio lighting', count: 12 },
  { id: 'project', name: 'Project Asset Library', icon: '📦', description: 'All files uploaded or generated for each film', count: 8 },
];

export const INITIAL_COLLECTIONS: AssetCollection[] = [
  {
    id: 'col-1',
    name: 'Sci-Fi Space Odyssey Package',
    description: 'Anamorphic 4K spaceplates, low-brass braams, and cosmic holograms.',
    assetCount: 12,
    coverImage: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    category: 'Film & VFX'
  },
  {
    id: 'col-2',
    name: 'Neo-Tokyo Cyberpunk Toolkit',
    description: 'Rainy neon alleyways, electronic glitch transitions, and synthwave drones.',
    assetCount: 15,
    coverImage: '/assets/images/cinema_cyberpunk_alley_1794406568416.jpg',
    category: 'Action & Noir'
  },
  {
    id: 'col-3',
    name: 'Hollywood Blockbuster Trailer Essentials',
    description: '3D Gold titles, 808 sub drops, trailer braams, and 2.39:1 scope mattes.',
    assetCount: 18,
    coverImage: '/assets/images/cinema_soundstage_set_1794406569758.jpg',
    category: 'Trailer & Post'
  },
  {
    id: 'col-4',
    name: 'Kannada (ಸ್ಯಾಂಡಲ್‌ವುಡ್) Cinema Showcase',
    description: 'Native Sandalwood high-intensity action shots, bilingual subtitles, and dramatic orchestral brass.',
    assetCount: 14,
    coverImage: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    category: 'Regional & Multilingual'
  }
];

export const COMPLETE_MEDIA_CATALOG: UniversalAsset[] = [
  // 1. VIDEO LIBRARY
  {
    id: 'vid-101',
    name: 'Orbital_Station_Earthrise_4K.mov',
    category: 'video',
    subcategory: 'Sci-Fi & Space',
    source: 'builtin',
    format: 'ProRes 4444 XQ',
    resolution: '3840x2160 (4K DCI)',
    duration: '00:14:20',
    size: '1.82 GB',
    thumbnail: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    mediaUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    description: 'Slow panoramic space station flyby with Earth atmospheric glow and distant star field.',
    tags: ['Space', 'Earth', 'Orbit', '4K', 'Anamorphic'],
    license: {
      type: 'Royalty-Free Worldwide',
      commercialUse: true,
      attribution: 'Film & Video Studio Universal Master',
      certificateId: 'FVS-RF-2026-9041',
      verified: true
    },
    specs: { codec: 'ProRes 4444 XQ', fps: 24, aspect: '2.39:1', colorSpace: 'ACEScc' },
    isFavorite: true,
    collection: 'col-1',
    addedAt: '2026-11-10',
    usageCount: 42
  },
  {
    id: 'vid-102',
    name: 'Cyberpunk_Alley_Neon_Rain_Take04.mov',
    category: 'video',
    subcategory: 'Cities & Urban',
    source: 'builtin',
    format: 'ProRes 422 HQ',
    resolution: '3840x2160 (4K UHD)',
    duration: '00:08:45',
    size: '1.10 GB',
    thumbnail: '/assets/images/cinema_cyberpunk_alley_1794406568416.jpg',
    mediaUrl: '/assets/images/cinema_cyberpunk_alley_1794406568416.jpg',
    description: 'Cyberpunk back-alley wet pavement tracking camera with neon reflections and steam vents.',
    tags: ['Cyberpunk', 'Rain', 'Night', 'Neon', 'Urban'],
    license: {
      type: 'Royalty-Free Worldwide',
      commercialUse: true,
      attribution: 'Film & Video Studio Master',
      certificateId: 'FVS-RF-2026-9042',
      verified: true
    },
    specs: { codec: 'ProRes 422 HQ', fps: 24, aspect: '2.39:1', colorSpace: 'Rec.709' },
    isFavorite: true,
    collection: 'col-2',
    addedAt: '2026-11-10',
    usageCount: 68
  },
  {
    id: 'vid-103',
    name: 'Studio_Soundstage_Master_Crane.mov',
    category: 'video',
    subcategory: 'Behind The Scenes',
    source: 'builtin',
    format: 'REDCODE RAW',
    resolution: '4096x2160 (True 4K)',
    duration: '00:18:12',
    size: '2.40 GB',
    thumbnail: '/assets/images/cinema_soundstage_set_1794406569758.jpg',
    mediaUrl: '/assets/images/cinema_soundstage_set_1794406569758.jpg',
    description: 'Wide crane movement over Hollywood soundstage production set with practical studio rigs.',
    tags: ['Soundstage', 'BTS', '4K', 'Hollywood', 'Camera Crane'],
    license: {
      type: 'Commercial Studio License',
      commercialUse: true,
      attribution: 'Production Studio Archive',
      certificateId: 'FVS-CS-2026-1182',
      verified: true
    },
    specs: { codec: 'R3D RAW', fps: 24, aspect: '1.85:1', colorSpace: 'REDWideGamut' },
    isFavorite: false,
    collection: 'col-3',
    addedAt: '2026-11-08',
    usageCount: 19
  },

  // 2. FILM LIBRARY
  {
    id: 'flm-201',
    name: 'Sci-Fi_Dune_Basalt_Monolith_Sequence.mov',
    category: 'film',
    subcategory: 'Cinematic Scenes',
    source: 'builtin',
    format: 'ARRIRAW 4.5K',
    resolution: '4448x3096 (Open Gate)',
    duration: '00:22:40',
    size: '3.15 GB',
    thumbnail: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    mediaUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    description: 'Complete 3-shot film sequence reference demonstrating scale, dust particle lighting and anamorphic distortion.',
    tags: ['Film Scene', 'Dune Style', 'Monolith', 'Anamorphic', 'Scene Example'],
    license: {
      type: 'Commercial Studio License',
      commercialUse: true,
      attribution: 'Studio Master Collection',
      certificateId: 'FVS-FL-2026-4401',
      verified: true
    },
    specs: { codec: 'ARRIRAW', fps: 24, aspect: '2.39:1', colorSpace: 'Arri LogC4' },
    isFavorite: true,
    collection: 'col-1',
    addedAt: '2026-11-09',
    usageCount: 55
  },

  // 3. MUSIC LIBRARY
  {
    id: 'mus-301',
    name: 'Chronicles_Of_The_Void_Orchestral_Score.wav',
    category: 'music',
    subcategory: 'Cinematic Orchestral',
    source: 'builtin',
    format: 'Broadcast WAV 96kHz',
    duration: '03:45',
    size: '62 MB',
    thumbnail: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    description: 'Lush symphonic score in D minor with warm cellos, French horns, subtle analog synth bass and celestial choir.',
    tags: ['Score', 'Orchestral', 'Hans Zimmer Style', 'Strings', 'D Minor'],
    license: {
      type: 'Royalty-Free Worldwide',
      commercialUse: true,
      attribution: 'Studio Scoring Stage',
      certificateId: 'FVS-MU-2026-7719',
      verified: true
    },
    specs: { sampleRate: '96 kHz', bitDepth: '24-bit', channels: 'Stereo', soundMethod: 'startScorePlayback' },
    isFavorite: true,
    collection: 'col-1',
    addedAt: '2026-11-10',
    usageCount: 88
  },

  // 4. SOUND EFFECTS (SFX)
  {
    id: 'sfx-401',
    name: 'Hans_Zimmer_Trailer_Braam_Horn.wav',
    category: 'sfx',
    subcategory: 'Impacts & Booms',
    source: 'builtin',
    format: 'WAV 96kHz / 24-bit',
    duration: '02.2s',
    size: '3.8 MB',
    thumbnail: '/assets/images/cinema_soundstage_set_1794406569758.jpg',
    description: 'Massive resonant low-brass trailer braam hit for dramatic blockbuster title cards and scene impacts.',
    tags: ['Braam', 'Trailer Hit', 'Sub Bass', 'Inception', 'Impact'],
    license: {
      type: 'Creative Commons CC0',
      commercialUse: true,
      attribution: 'Public Studio FX',
      certificateId: 'FVS-SFX-2026-001',
      verified: true
    },
    specs: { sampleRate: '96 kHz', bitDepth: '24-bit', channels: 'Stereo', soundMethod: 'playTrailerBraam' },
    isFavorite: true,
    collection: 'col-3',
    addedAt: '2026-11-11',
    usageCount: 142
  },
  {
    id: 'sfx-402',
    name: 'Sub_Bass_Drop_808_Earthquake.wav',
    category: 'sfx',
    subcategory: 'Impacts & Booms',
    source: 'builtin',
    format: 'WAV 96kHz / 24-bit',
    duration: '02.1s',
    size: '3.6 MB',
    thumbnail: '/assets/images/cinema_cyberpunk_alley_1794406568416.jpg',
    description: '85Hz to 24Hz sinusoidal sub-bass explosion drop designed to shake subwoofer acoustic cones.',
    tags: ['Sub Drop', '808', 'Earthquake', 'Subwoofer', 'Trailer'],
    license: {
      type: 'Creative Commons CC0',
      commercialUse: true,
      attribution: 'Public Studio FX',
      certificateId: 'FVS-SFX-2026-002',
      verified: true
    },
    specs: { sampleRate: '96 kHz', bitDepth: '24-bit', channels: 'Stereo', soundMethod: 'playSubBassDrop' },
    isFavorite: true,
    collection: 'col-3',
    addedAt: '2026-11-11',
    usageCount: 97
  },
  {
    id: 'sfx-403',
    name: 'Industrial_Blast_Door_Metallic_Slam.wav',
    category: 'sfx',
    subcategory: 'Foley & Mechanical',
    source: 'builtin',
    format: 'WAV 96kHz / 24-bit',
    duration: '01.0s',
    size: '1.9 MB',
    thumbnail: '/assets/images/cinema_soundstage_set_1794406569758.jpg',
    description: 'Heavy hydraulic blast door slamming shut with mechanical locking clicks and metallic decay.',
    tags: ['Metal', 'Industrial', 'Hydraulic', 'Door Slam', 'Foley'],
    license: {
      type: 'Creative Commons CC0',
      commercialUse: true,
      attribution: 'Public Studio FX',
      certificateId: 'FVS-SFX-2026-003',
      verified: true
    },
    specs: { sampleRate: '96 kHz', bitDepth: '24-bit', channels: 'Stereo', soundMethod: 'playMetallicSlam' },
    isFavorite: false,
    collection: 'col-1',
    addedAt: '2026-11-11',
    usageCount: 38
  },
  {
    id: 'sfx-404',
    name: 'Dark_Suspense_Tension_Riser.wav',
    category: 'sfx',
    subcategory: 'Transitions & Risers',
    source: 'builtin',
    format: 'WAV 96kHz / 24-bit',
    duration: '02.6s',
    size: '4.2 MB',
    thumbnail: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    description: 'Sawtooth pitch sweep climbing from 60Hz to 880Hz with resonant bandpass filter for jump scares.',
    tags: ['Riser', 'Tension', 'Suspense', 'Horror', 'Jump Scare'],
    license: {
      type: 'Creative Commons CC0',
      commercialUse: true,
      attribution: 'Public Studio FX',
      certificateId: 'FVS-SFX-2026-004',
      verified: true
    },
    specs: { sampleRate: '96 kHz', bitDepth: '24-bit', channels: 'Stereo', soundMethod: 'playDarkRiser' },
    isFavorite: true,
    collection: 'col-2',
    addedAt: '2026-11-11',
    usageCount: 76
  },
  {
    id: 'sfx-405',
    name: 'Hollywood_35mm_Slate_Clapper_1kHz.wav',
    category: 'sfx',
    subcategory: 'Foley & Mechanical',
    source: 'builtin',
    format: 'WAV 96kHz / 24-bit',
    duration: '00.1s',
    size: '320 KB',
    thumbnail: '/assets/images/cinema_soundstage_set_1794406569758.jpg',
    description: 'SMPTE 1000Hz calibration tone beep synced with physical clapper slate snap.',
    tags: ['Slate', '1kHz', 'Clapper', 'Sync Tone', 'Hollywood'],
    license: {
      type: 'Creative Commons CC0',
      commercialUse: true,
      attribution: 'Studio Standard',
      certificateId: 'FVS-SFX-2026-005',
      verified: true
    },
    specs: { sampleRate: '96 kHz', bitDepth: '24-bit', channels: 'Mono', soundMethod: 'playSlateBeep' },
    isFavorite: false,
    addedAt: '2026-11-11',
    usageCount: 54
  },
  {
    id: 'sfx-406',
    name: 'Cybernetic_Glitch_Telemetry_Stutter.wav',
    category: 'sfx',
    subcategory: 'Sci-Fi & UI',
    source: 'builtin',
    format: 'WAV 96kHz / 24-bit',
    duration: '00.4s',
    size: '800 KB',
    thumbnail: '/assets/images/cinema_cyberpunk_alley_1794406568416.jpg',
    description: '8-step micro stutter burst simulating broken digital telemetry or holographic flicker.',
    tags: ['Glitch', 'Cyberpunk', 'Digital Error', 'Telemetry', 'Stutter'],
    license: {
      type: 'Creative Commons CC0',
      commercialUse: true,
      attribution: 'Studio FX',
      certificateId: 'FVS-SFX-2026-006',
      verified: true
    },
    specs: { sampleRate: '96 kHz', bitDepth: '24-bit', channels: 'Stereo', soundMethod: 'playGlitchTransition' },
    isFavorite: true,
    collection: 'col-2',
    addedAt: '2026-11-11',
    usageCount: 63
  },

  // 5. VOICE LIBRARY
  {
    id: 'voc-501',
    name: 'Commander_Valerie_English_ADR.wav',
    category: 'voice',
    subcategory: 'AI Voices & Narration',
    source: 'ai_generated',
    format: 'Broadcast WAV 96kHz',
    duration: '00:18',
    size: '5.2 MB',
    thumbnail: '/assets/images/avatar_director_1794406569000.jpg',
    description: 'Grounded, authoritative female commander ADR voice delivering mission-critical telemetry dialogue.',
    tags: ['AI Voice', 'Dialogue', 'Commander', 'Sci-Fi', 'English'],
    license: {
      type: 'AI Studio Creative License',
      commercialUse: true,
      attribution: 'AI Studio Voice Synthesis',
      certificateId: 'FVS-VO-2026-3391',
      verified: true
    },
    specs: { sampleRate: '96 kHz', bitDepth: '24-bit', channels: 'Mono' },
    isFavorite: true,
    addedAt: '2026-11-11',
    usageCount: 31
  },
  {
    id: 'voc-502',
    name: 'Kannada_Narrator_Cinema_ಕನ್ನಡ.wav',
    category: 'voice',
    subcategory: 'AI Voices & Narration',
    source: 'ai_generated',
    format: 'Broadcast WAV 96kHz',
    duration: '00:24',
    size: '6.8 MB',
    thumbnail: '/assets/images/avatar_director_1794406569000.jpg',
    description: 'Resonant Sandalwood dramatic voiceover reading: "ಇತಿಹಾಸವನ್ನು ಬದಲಾಯಿಸುವ ಕ್ಷಣ ಇದೀಗ ಆರಂಭವಾಗಿದೆ."',
    tags: ['Kannada', 'ಕನ್ನಡ', 'Sandalwood', 'Regional Voice', 'Voiceover'],
    license: {
      type: 'AI Studio Creative License',
      commercialUse: true,
      attribution: 'AI Studio Voice Engine',
      certificateId: 'FVS-VO-2026-3392',
      verified: true
    },
    specs: { sampleRate: '96 kHz', bitDepth: '24-bit', channels: 'Mono' },
    isFavorite: true,
    collection: 'col-4',
    addedAt: '2026-11-11',
    usageCount: 47
  },

  // 6. IMAGE LIBRARY
  {
    id: 'img-601',
    name: 'Ancient_Alien_Monolith_Texture_8K.png',
    category: 'image',
    subcategory: 'Textures & Backgrounds',
    source: 'builtin',
    format: 'PNG 16-bit Lossless',
    resolution: '7680x4320 (8K UHD)',
    size: '28.5 MB',
    thumbnail: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    mediaUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    description: 'Detailed basalt rock texture displacement map with glowing cybernetic rune inlays.',
    tags: ['Texture', '8K', 'Displacement', 'Sci-Fi', 'Basalt'],
    license: {
      type: 'Royalty-Free Worldwide',
      commercialUse: true,
      attribution: 'Studio Art Dept',
      certificateId: 'FVS-IMG-2026-8801',
      verified: true
    },
    specs: { colorSpace: 'sRGB IEC61966-2.1', aspect: '16:9' },
    isFavorite: false,
    collection: 'col-1',
    addedAt: '2026-11-09',
    usageCount: 22
  },

  // 7. CHARACTER LIBRARY
  {
    id: 'chr-701',
    name: 'Arya_7_Synthetic_Android_Rig.gltf',
    category: 'character',
    subcategory: '3D Characters & Rigs',
    source: 'builtin',
    format: 'glTF 2.0 / PBR Materials',
    resolution: '64,000 Polygons',
    size: '18.4 MB',
    thumbnail: '/assets/images/cinema_cyberpunk_alley_1794406568416.jpg',
    description: 'Full-body rigged humanoid synthetic android with metallic chassis sub-layers and facial blend shapes.',
    tags: ['Character Rig', 'Android', 'glTF', '3D Model', 'Sci-Fi'],
    license: {
      type: 'Commercial Studio License',
      commercialUse: true,
      attribution: '3D Character Studio',
      certificateId: 'FVS-CHR-2026-5510',
      verified: true
    },
    specs: { polyCount: '64k Quads', aspect: '1:1' },
    isFavorite: true,
    collection: 'col-2',
    addedAt: '2026-11-10',
    usageCount: 39
  },

  // 8. ANIMATION LIBRARY
  {
    id: 'anm-801',
    name: 'Holoscreen_Tactical_Radar_Sweep.json',
    category: 'animation',
    subcategory: 'Motion Graphics & UI',
    source: 'builtin',
    format: 'Lottie / Vector Canvas',
    duration: '00:06 Loop',
    size: '420 KB',
    thumbnail: '/assets/images/cinema_soundstage_set_1794406569758.jpg',
    description: 'Looping 360-degree holographic radar sweep with target acquisition reticles and telemetry telemetry.',
    tags: ['Motion Graphics', 'HUD', 'Radar', 'Loop', 'Sci-Fi UI'],
    license: {
      type: 'Creative Commons CC0',
      commercialUse: true,
      attribution: 'Studio Motion Lab',
      certificateId: 'FVS-ANM-2026-9099',
      verified: true
    },
    specs: { fps: 60, aspect: '1:1' },
    isFavorite: false,
    collection: 'col-1',
    addedAt: '2026-11-10',
    usageCount: 28
  },

  // 9. VFX LIBRARY
  {
    id: 'vfx-901',
    name: 'Anamorphic_Horizontal_Blue_Flare.png',
    category: 'vfx',
    subcategory: 'Optical Lens Flares',
    source: 'builtin',
    format: 'PNG Alpha / Additive Blend',
    resolution: '3840x2160 (4K)',
    size: '8.4 MB',
    thumbnail: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    mediaUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    description: 'Authentic Panavision cylindrical lens element blue streak flare overlay with specular starburst.',
    tags: ['Lens Flare', 'Anamorphic', 'Blue Streak', 'VFX Overlay', '4K'],
    license: {
      type: 'Royalty-Free Worldwide',
      commercialUse: true,
      attribution: 'Studio VFX Lab',
      certificateId: 'FVS-VFX-2026-1044',
      verified: true
    },
    specs: { aspect: '2.39:1' },
    isFavorite: true,
    collection: 'col-1',
    addedAt: '2026-11-11',
    usageCount: 73
  },
  {
    id: 'vfx-902',
    name: 'Kodak_500T_35mm_Film_Grain_Overlay.mp4',
    category: 'vfx',
    subcategory: 'Film Grain & Halation',
    source: 'builtin',
    format: 'ProRes 4444 Grain Loop',
    resolution: '3840x2160 (4K)',
    duration: '00:30 Loop',
    size: '840 MB',
    thumbnail: '/assets/images/cinema_soundstage_set_1794406569758.jpg',
    mediaUrl: '/assets/images/cinema_soundstage_set_1794406569758.jpg',
    description: 'Scanned 35mm optical grain from unexposed Kodak Vision3 500T celluloid for analog warmth.',
    tags: ['Film Grain', 'Kodak 500T', '35mm', 'Texture Loop', 'Analog'],
    license: {
      type: 'Royalty-Free Worldwide',
      commercialUse: true,
      attribution: 'Archival Stock Lab',
      certificateId: 'FVS-VFX-2026-1045',
      verified: true
    },
    specs: { fps: 24, aspect: '2.39:1' },
    isFavorite: true,
    collection: 'col-3',
    addedAt: '2026-11-10',
    usageCount: 110
  },

  // 10. TRANSITION LIBRARY
  {
    id: 'trn-1001',
    name: 'Cinematic_Film_Burn_Flash_Wipe.mov',
    category: 'transition',
    subcategory: 'Optical Film Burns',
    source: 'builtin',
    format: 'ProRes 4444 Alpha',
    duration: '00:01:12',
    size: '145 MB',
    thumbnail: '/assets/images/cinema_cyberpunk_alley_1794406568416.jpg',
    description: 'Vintage 35mm film burn flare transition with light leaks, sprocket hole flash, and amber glow.',
    tags: ['Film Burn', 'Light Leak', 'Wipe', 'Transition', 'Vintage'],
    license: {
      type: 'Royalty-Free Worldwide',
      commercialUse: true,
      attribution: 'Studio FX Vault',
      certificateId: 'FVS-TRN-2026-6621',
      verified: true
    },
    specs: { fps: 24, aspect: '2.39:1' },
    isFavorite: false,
    addedAt: '2026-11-09',
    usageCount: 45
  },

  // 11. COLOR LIBRARY (LUTS)
  {
    id: 'col-1101',
    name: 'Kodak_Vision3_5219_33x33.cube',
    category: 'color',
    subcategory: 'Print Film Stocks',
    source: 'builtin',
    format: '.CUBE 3D LUT',
    size: '1.2 MB',
    thumbnail: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    mediaUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    description: 'Gold standard Hollywood print film stock with warm highlight roll-off and deep emerald shadows.',
    tags: ['LUT', 'Kodak 5219', '3D LUT', 'DaVinci Resolve', 'Hollywood'],
    license: {
      type: 'Royalty-Free Worldwide',
      commercialUse: true,
      attribution: 'ACES LUT Collection',
      certificateId: 'FVS-LUT-2026-2383',
      verified: true
    },
    specs: { colorSpace: 'Rec.709 / ACES', lutFilter: 'sepia-25 contrast-125 saturate-110' },
    isFavorite: true,
    collection: 'col-3',
    addedAt: '2026-11-08',
    usageCount: 165
  },
  {
    id: 'col-1102',
    name: 'Cyberpunk_Neo_Tokyo_2077.cube',
    category: 'color',
    subcategory: 'Stylized Grades',
    source: 'builtin',
    format: '.CUBE 3D LUT',
    size: '1.2 MB',
    thumbnail: '/assets/images/cinema_cyberpunk_alley_1794406568416.jpg',
    mediaUrl: '/assets/images/cinema_cyberpunk_alley_1794406568416.jpg',
    description: 'Deep navy and electric cyan shadows paired with searing neon magenta and orange highlights.',
    tags: ['Cyberpunk', 'Neon', 'Teal Magenta', 'LUT', 'Stylized'],
    license: {
      type: 'Royalty-Free Worldwide',
      commercialUse: true,
      attribution: 'Studio Color Lab',
      certificateId: 'FVS-LUT-2026-2077',
      verified: true
    },
    specs: { colorSpace: 'Rec.709', lutFilter: 'hue-rotate-30 saturate-140 contrast-135' },
    isFavorite: true,
    collection: 'col-2',
    addedAt: '2026-11-10',
    usageCount: 122
  },

  // 12. TEMPLATE LIBRARY
  {
    id: 'tpl-1201',
    name: 'Hollywood_Epic_3D_Gold_Title_Sequence',
    category: 'template',
    subcategory: 'Main Title Sequences',
    source: 'builtin',
    format: 'Interactive React / CSS Component',
    resolution: '4K Vector Text',
    duration: '00:08',
    size: '24 KB',
    thumbnail: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    description: 'Cinzel Serif 3D gold specular gradient title with slow push tracking and horizontal lens flare sweep.',
    tags: ['Title Template', 'Gold 3D', 'Blockbuster', 'Opening Credits'],
    license: {
      type: 'Commercial Studio License',
      commercialUse: true,
      attribution: 'Studio Typography Lab',
      certificateId: 'FVS-TPL-2026-8811',
      verified: true
    },
    specs: { aspect: '2.39:1' },
    isFavorite: true,
    collection: 'col-3',
    addedAt: '2026-11-10',
    usageCount: 89
  },
  {
    id: 'tpl-1202',
    name: 'Bilingual_Kannada_English_Cinema_Subtitles',
    category: 'template',
    subcategory: 'Subtitle Templates',
    source: 'builtin',
    format: 'WebVTT / SRT Universal',
    size: '48 KB',
    thumbnail: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    description: 'Dual-line subtitle format rendering native Kannada script on top and English translation below with drop shadow.',
    tags: ['Subtitles', 'Kannada', 'ಕನ್ನಡ', 'Bilingual', 'SRT'],
    license: {
      type: 'Creative Commons CC0',
      commercialUse: true,
      attribution: 'Sandallwood Translation Collective',
      certificateId: 'FVS-TPL-2026-8812',
      verified: true
    },
    specs: {
      cssStyle: 'color: #38bdf8; font-family: "Noto Sans Kannada", sans-serif; text-shadow: 2px 2px 2px #000;'
    },
    isFavorite: true,
    collection: 'col-4',
    addedAt: '2026-11-11',
    usageCount: 61
  },

  // 13. 3D ASSET LIBRARY
  {
    id: 'mod-1301',
    name: 'Ancient_Alien_Monolith_Sculpt.obj',
    category: '3d_asset',
    subcategory: 'Environments & Props',
    source: 'builtin',
    format: 'Wavefront OBJ + 4K PBR Maps',
    resolution: '48,000 Polygons',
    size: '34 MB',
    thumbnail: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    description: 'Towering basalt monolith hero prop with emissive glyph channel and micro-fracture displacement.',
    tags: ['3D Model', 'OBJ', 'PBR', 'Sci-Fi Prop', 'Monolith'],
    license: {
      type: 'Royalty-Free Worldwide',
      commercialUse: true,
      attribution: '3D VFX Department',
      certificateId: 'FVS-3D-2026-4011',
      verified: true
    },
    specs: { polyCount: '48k Triangles', aspect: '1:1' },
    isFavorite: false,
    collection: 'col-1',
    addedAt: '2026-11-09',
    usageCount: 18
  },

  // 14. PROJECT ASSET LIBRARY
  {
    id: 'prj-1401',
    name: 'Active_Production_Master_Timeline_Stem.mov',
    category: 'project',
    subcategory: 'Film Project Stems',
    source: 'upload',
    format: 'Apple ProRes 422 HQ',
    resolution: '3840x2160 (4K UHD)',
    duration: '00:04:12',
    size: '890 MB',
    thumbnail: '/assets/images/cinema_soundstage_set_1794406569758.jpg',
    mediaUrl: '/assets/images/cinema_soundstage_set_1794406569758.jpg',
    description: 'Current project rough cut assembly render with synchronized dialogue, temporary foley, and grading draft.',
    tags: ['Project Asset', 'Rough Cut', 'Work In Progress', 'Timeline Stem'],
    license: {
      type: 'Studio Master Proprietary',
      commercialUse: true,
      attribution: 'User Production Workspace',
      certificateId: 'FVS-PRJ-2026-0001',
      verified: true
    },
    specs: { codec: 'ProRes 422 HQ', fps: 24, aspect: '2.39:1' },
    isFavorite: true,
    addedAt: '2026-11-12',
    usageCount: 104
  }
];
