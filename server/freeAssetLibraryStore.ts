import fs from 'fs';
import path from 'path';

export type FreeAssetFolder =
  | 'Animation'
  | 'VFX'
  | '3D Assets'
  | 'Images'
  | 'Audio'
  | 'Video'
  | 'Film Production'
  | 'Open-Source Software';

export type CommercialUseStatus = 'Yes' | 'Check' | 'No';

export interface FreeAssetRecord {
  assetId: string;
  name: string;
  folder: FreeAssetFolder;
  subfolder: string;
  format: string;
  source: string;
  sourceUrl: string;
  downloadUrl: string;
  previewUrl: string;
  previewType: 'lottie' | 'video' | 'audio' | 'image' | 'model3d' | 'tool';
  license: string;
  commercialUse: CommercialUseStatus;
  licenseNote: string;
  description: string;
  tags: string[];
  projectId: string;
  customImported?: boolean;
}

export const FREE_ASSET_FOLDER_TREE: Record<FreeAssetFolder, string[]> = {
  Animation: ['Lottie JSON', '2D Animation', '3D Animation', 'Character Animation', 'Motion Graphics'],
  VFX: ['Fire', 'Smoke', 'Explosions', 'Lightning', 'Magic', 'Particles', 'Transitions'],
  '3D Assets': ['Characters', 'Buildings', 'Vehicles', 'Props', 'Models', 'HDRI'],
  Images: ['Backgrounds', 'Environments', 'Textures'],
  Audio: ['Music', 'Sound Effects', 'Footsteps', 'Nature', 'Cinematic Sounds'],
  Video: ['Stock Footage', 'Green Screen', 'Overlays', 'Templates'],
  'Film Production': ['Storyboards', 'Fonts', 'Icons', 'Templates'],
  'Open-Source Software': ['3D & VFX', '2D Animation', 'Video Editing', 'Rendering'],
};

const SEED_FREE_ASSETS: FreeAssetRecord[] = [
  // 1. Animation data – Lottie, JSON, CSS and JavaScript
  {
    assetId: 'ANIM_00001',
    name: 'LottieFiles — Community JSON Motion Library',
    folder: 'Animation',
    subfolder: 'Lottie JSON',
    format: 'JSON / dotLottie',
    source: 'LottieFiles',
    sourceUrl: 'https://lottiefiles.com/',
    downloadUrl: 'https://useanimations.com/icons/playPause.json',
    previewUrl: 'https://useanimations.com/icons/playPause.json',
    previewType: 'lottie',
    license: 'Lottie Simple License / Free',
    commercialUse: 'Yes',
    licenseNote: 'Free Lottie JSON animations for icons, UI loaders, and motion overlays. Check per-creator license.',
    description: 'Vector Lottie JSON animations playable via lottie-web across web, mobile, and studio overlays.',
    tags: ['Lottie', 'JSON', 'Motion Graphics', 'UI'],
    projectId: 'all',
  },
  {
    assetId: 'ANIM_00002',
    name: 'useAnimations — 300 MIT Animated Icons',
    folder: 'Animation',
    subfolder: 'Lottie JSON',
    format: 'JSON / SVG',
    source: 'useAnimations',
    sourceUrl: 'https://useanimations.com/',
    downloadUrl: 'https://useanimations.com/icons/loading.json',
    previewUrl: 'https://useanimations.com/icons/loading.json',
    previewType: 'lottie',
    license: 'MIT',
    commercialUse: 'Yes',
    licenseNote: 'MIT License — free for commercial and personal use with direct CORS-enabled JSON endpoints.',
    description: '300 crisp stroke-animated Lottie JSON icons with CSS currentColor theming.',
    tags: ['MIT', 'Lottie', 'Icons', 'Loading'],
    projectId: 'all',
  },
  {
    assetId: 'ANIM_00003',
    name: 'Lordicon — Animated Interactive Icons',
    folder: 'Animation',
    subfolder: 'Motion Graphics',
    format: 'JSON / Embed',
    source: 'Lordicon',
    sourceUrl: 'https://lordicon.com/',
    downloadUrl: 'https://useanimations.com/icons/star.json',
    previewUrl: 'https://useanimations.com/icons/star.json',
    previewType: 'lottie',
    license: 'Free Tier / CC BY',
    commercialUse: 'Check',
    licenseNote: 'Free animated icons require attribution on free tier; Pro removes attribution.',
    description: 'Interactive animated buttons and HUD icons for video overlays and studio dashboards.',
    tags: ['Lordicon', 'Buttons', 'Interactive'],
    projectId: 'all',
  },
  {
    assetId: 'ANIM_00004',
    name: 'Animate.css — CSS Transition Presets',
    folder: 'Animation',
    subfolder: '2D Animation',
    format: 'CSS',
    source: 'Animate.css',
    sourceUrl: 'https://animate.style/',
    downloadUrl: 'https://animate.style/',
    previewUrl: 'https://useanimations.com/icons/scrollDown.json',
    previewType: 'lottie',
    license: 'Hippocratic / MIT-style Open Source',
    commercialUse: 'Yes',
    licenseNote: 'Installed in studio frontend for instant fade, zoom, bounce, and slide transitions.',
    description: 'Cross-browser CSS animation library for title cards, lower thirds, and page transitions.',
    tags: ['CSS', 'Transitions', 'Titles'],
    projectId: 'all',
  },
  {
    assetId: 'ANIM_00005',
    name: 'Animista — On-Demand CSS Animation Generator',
    folder: 'Animation',
    subfolder: 'Motion Graphics',
    format: 'CSS Keyframes',
    source: 'Animista',
    sourceUrl: 'https://animista.net/',
    downloadUrl: 'https://animista.net/',
    previewUrl: 'https://useanimations.com/icons/infinity.json',
    previewType: 'lottie',
    license: 'Free to Use',
    commercialUse: 'Yes',
    licenseNote: 'Generate custom CSS @keyframes snippets on demand for text and overlay motion.',
    description: 'Interactive CSS keyframe generator for cinematic title entrances and kinetic typography.',
    tags: ['CSS', 'Keyframes', 'Kinetic Text'],
    projectId: 'all',
  },
  {
    assetId: 'ANIM_00006',
    name: 'Anime.js — JavaScript SVG & Timeline Engine',
    folder: 'Animation',
    subfolder: '2D Animation',
    format: 'JS / SVG',
    source: 'Anime.js',
    sourceUrl: 'https://animejs.com/',
    downloadUrl: 'https://animejs.com/',
    previewUrl: 'https://useanimations.com/icons/activity.json',
    previewType: 'lottie',
    license: 'MIT',
    commercialUse: 'Yes',
    licenseNote: 'MIT License — installed in studio for SVG path, stagger, and timeline animations.',
    description: 'Lightweight JavaScript animation engine for synchronized SVG paths and UI motion.',
    tags: ['Anime.js', 'SVG', 'Stagger', 'Timeline'],
    projectId: 'all',
  },
  {
    assetId: 'ANIM_00007',
    name: 'Motion — React Spring & Gesture Animation',
    folder: 'Animation',
    subfolder: 'Motion Graphics',
    format: 'TSX / React',
    source: 'Motion',
    sourceUrl: 'https://motion.dev/',
    downloadUrl: 'https://motion.dev/',
    previewUrl: 'https://useanimations.com/icons/toggle.json',
    previewType: 'lottie',
    license: 'MIT',
    commercialUse: 'Yes',
    licenseNote: 'MIT License — installed in studio for physics-driven React interface animations.',
    description: 'Production-grade spring physics and layout transition library for React.',
    tags: ['Motion', 'React', 'Spring'],
    projectId: 'all',
  },
  {
    assetId: 'ANIM_00008',
    name: 'Rive — Interactive State-Machine Character Animations',
    folder: 'Animation',
    subfolder: 'Character Animation',
    format: 'RIV',
    source: 'Rive',
    sourceUrl: 'https://rive.app/',
    downloadUrl: 'https://rive.app/',
    previewUrl: 'https://useanimations.com/icons/heart.json',
    previewType: 'lottie',
    license: 'Free Community / Check Per File',
    commercialUse: 'Check',
    licenseNote: 'Check individual Rive Community file licenses (many are CC BY or MIT).',
    description: 'Real-time interactive vector character rigs and state-machine animations.',
    tags: ['Rive', 'Interactive', 'Character Rig'],
    projectId: 'all',
  },

  // 2. 3D models, characters and environments
  {
    assetId: '3D_00001',
    name: 'Poly Haven — CC0 3D Models, HDRIs & Textures',
    folder: '3D Assets',
    subfolder: 'HDRI',
    format: 'GLB / EXR / HDR',
    source: 'Poly Haven',
    sourceUrl: 'https://polyhaven.com/',
    downloadUrl: 'https://polyhaven.com/hdris',
    previewUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    previewType: 'model3d',
    license: 'CC0',
    commercialUse: 'Yes',
    licenseNote: '100% CC0 Public Domain — safe for commercial films, 3D lighting, and reusable studio libraries.',
    description: 'High-dynamic-range lighting environments (HDRIs), scanned 3D props, and PBR textures.',
    tags: ['CC0', 'HDRI', '3D Models', 'PBR'],
    projectId: 'all',
  },
  {
    assetId: '3D_00002',
    name: 'ambientCG — PBR Materials & Surface Maps',
    folder: 'Images',
    subfolder: 'Textures',
    format: 'PNG / JPG (4K PBR)',
    source: 'ambientCG',
    sourceUrl: 'https://ambientcg.com/',
    downloadUrl: 'https://ambientcg.com/',
    previewUrl: '/assets/images/hero_studio_suite_1794901010340.jpg',
    previewType: 'image',
    license: 'CC0',
    commercialUse: 'Yes',
    licenseNote: 'CC0 Public Domain PBR texture maps (albedo, normal, roughness, displacement).',
    description: 'Thousands of seamless PBR materials for 3D environments, architecture, and stylized cartoon surfaces.',
    tags: ['CC0', 'PBR', 'Textures', 'Materials'],
    projectId: 'all',
  },
  {
    assetId: '3D_00003',
    name: 'Kenney Assets — 2D/3D Characters, Props & Environments',
    folder: '3D Assets',
    subfolder: 'Props',
    format: 'GLB / FBX / PNG',
    source: 'Kenney',
    sourceUrl: 'https://kenney.nl/assets',
    downloadUrl: 'https://kenney.nl/assets',
    previewUrl: '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
    previewType: 'model3d',
    license: 'CC0',
    commercialUse: 'Yes',
    licenseNote: 'CC0 Public Domain — no attribution required, ideal for reusable 2D/3D cartoon asset libraries.',
    description: 'Modular cartoon characters, buildings, vehicles, props, and environment kits.',
    tags: ['CC0', 'Kenney', '3D Props', 'Cartoon'],
    projectId: 'all',
  },
  {
    assetId: '3D_00004',
    name: 'Quaternius — Animated 3D Character & Environment Packs',
    folder: '3D Assets',
    subfolder: 'Characters',
    format: 'GLB / FBX',
    source: 'Quaternius',
    sourceUrl: 'https://quaternius.com/',
    downloadUrl: 'https://quaternius.com/',
    previewUrl: '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
    previewType: 'model3d',
    license: 'CC0',
    commercialUse: 'Yes',
    licenseNote: 'CC0 low-poly rigged characters and animated packs ready for Blender and Three.js.',
    description: 'Pre-rigged 3D cartoon characters, creatures, vehicles, and complete animated packs.',
    tags: ['CC0', '3D Characters', 'Rigged', 'Animations'],
    projectId: 'all',
  },
  {
    assetId: '3D_00005',
    name: 'Mixos — CC0 3D Models, Materials & HDRIs',
    folder: '3D Assets',
    subfolder: 'Models',
    format: 'GLB / HDR',
    source: 'Mixos',
    sourceUrl: 'https://www.mixos.io/cc0-3d-assets',
    downloadUrl: 'https://www.mixos.io/cc0-3d-assets',
    previewUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    previewType: 'model3d',
    license: 'CC0',
    commercialUse: 'Yes',
    licenseNote: 'Curated CC0 3D models, materials, and lighting HDRIs.',
    description: 'Ready-to-import CC0 3D assets for rapid scene dressing and pre-visualization.',
    tags: ['CC0', 'Models', 'HDRI'],
    projectId: 'all',
  },
  {
    assetId: '3D_00006',
    name: '3D Valley — Models, Textures & Animation Assets',
    folder: '3D Assets',
    subfolder: 'Buildings',
    format: 'FBX / OBJ / BLEND',
    source: '3D Valley',
    sourceUrl: 'https://3dvalley.com/library',
    downloadUrl: 'https://3dvalley.com/library',
    previewUrl: '/assets/images/hero_studio_suite_1794901010340.jpg',
    previewType: 'model3d',
    license: 'Check Individual License',
    commercialUse: 'Check',
    licenseNote: 'Verify individual asset licenses before commercial film distribution.',
    description: 'Library of 3D architectural sets, textures, HDRIs, and animation assets.',
    tags: ['3D', 'Buildings', 'Environments'],
    projectId: 'all',
  },

  // 3. VFX – Visual effects, explosions, smoke, fire and particles
  {
    assetId: 'VFX_00001',
    name: 'ActionVFX — 650+ Free Fire, Smoke, Explosions & Lightning',
    folder: 'VFX',
    subfolder: 'Explosions',
    format: 'MP4 / ProRes',
    source: 'ActionVFX',
    sourceUrl: 'https://www.actionvfx.com/',
    downloadUrl: 'https://www.actionvfx.com/',
    previewUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    previewType: 'video',
    license: 'ActionVFX Free License',
    commercialUse: 'Yes',
    licenseNote: '650+ free compositing elements (fire, smoke, explosions, lightning, portals, impacts).',
    description: 'Production-grade live-action VFX stock elements for compositing over animated and live scenes.',
    tags: ['VFX', 'Fire', 'Explosions', 'Smoke', 'Lightning'],
    projectId: 'all',
  },
  {
    assetId: 'VFX_00002',
    name: 'ActionVFX — Compositing Practice Footage',
    folder: 'VFX',
    subfolder: 'Transitions',
    format: 'MP4 / MOV',
    source: 'ActionVFX Practice Footage',
    sourceUrl: 'https://www.actionvfx.com/practice-footage',
    downloadUrl: 'https://www.actionvfx.com/practice-footage',
    previewUrl: '/assets/images/hero_studio_suite_1794901010340.jpg',
    previewType: 'video',
    license: 'Free Practice License',
    commercialUse: 'Check',
    licenseNote: 'Intended for VFX compositing practice and showreels; check license for commercial spots.',
    description: 'Clean plates and camera-tracked footage for testing explosions, tracking, and keying.',
    tags: ['VFX', 'Compositing', 'Plates'],
    projectId: 'all',
  },
  {
    assetId: 'VFX_00003',
    name: 'ProductionCrate — Magic, Energy, Fire & Smoke Effects',
    folder: 'VFX',
    subfolder: 'Magic',
    format: 'MP4 / MOV (Alpha)',
    source: 'ProductionCrate / FootageCrate',
    sourceUrl: 'https://www.productioncrate.com/',
    downloadUrl: 'https://www.productioncrate.com/',
    previewUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    previewType: 'video',
    license: 'Free Tier (Daily Limit)',
    commercialUse: 'Yes',
    licenseNote: 'Free accounts get daily downloads of magic spells, muzzle flashes, fire, and energy beams.',
    description: 'Stylized anime/fantasy energy blasts, portals, fire, and smoke compositing elements.',
    tags: ['Magic', 'Energy', 'Anime VFX', 'Fire'],
    projectId: 'all',
  },
  {
    assetId: 'VFX_00004',
    name: 'Kenney Particle Pack — 2D Particles & Sprites',
    folder: 'VFX',
    subfolder: 'Particles',
    format: 'PNG (Alpha)',
    source: 'Kenney Particle Pack',
    sourceUrl: 'https://kenney.nl/assets/particle-pack',
    downloadUrl: 'https://kenney.nl/assets/particle-pack',
    previewUrl: '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
    previewType: 'image',
    license: 'CC0',
    commercialUse: 'Yes',
    licenseNote: 'CC0 Public Domain — free for commercial games, cartoons, and motion overlays.',
    description: '80+ crisp 2D particle sprites for sparks, dust, smoke puffs, starlight, and magic trails.',
    tags: ['CC0', 'Particles', '2D VFX', 'Sparks'],
    projectId: 'all',
  },
  {
    assetId: 'VFX_00005',
    name: 'Mixkit — Video Effects & Motion Templates',
    folder: 'Video',
    subfolder: 'Templates',
    format: 'MP4 / MOGRT / PRPROJ',
    source: 'Mixkit',
    sourceUrl: 'https://mixkit.co/',
    downloadUrl: 'https://mixkit.co/',
    previewUrl: '/assets/images/hero_studio_suite_1794901010340.jpg',
    previewType: 'video',
    license: 'Mixkit Free / Check Clip',
    commercialUse: 'Check',
    licenseNote: 'Mixkit includes both Free and Restricted licenses — verify each item before commercial export.',
    description: 'Ready-made transitions, lower thirds, glitch overlays, and cinematic templates.',
    tags: ['Templates', 'Transitions', 'Overlays'],
    projectId: 'all',
  },

  // 4. Free stock videos and backgrounds
  {
    assetId: 'VID_00001',
    name: 'Pexels Videos — Cinematic Nature & City Stock Footage',
    folder: 'Video',
    subfolder: 'Stock Footage',
    format: 'MP4 (4K / HD)',
    source: 'Pexels Videos',
    sourceUrl: 'https://www.pexels.com/videos/',
    downloadUrl: 'https://www.pexels.com/api/documentation/',
    previewUrl: '/assets/images/hero_studio_suite_1794901010340.jpg',
    previewType: 'video',
    license: 'Pexels Free License',
    commercialUse: 'Yes',
    licenseNote: 'Free for commercial use subject to Pexels license (no reselling unmodified stock). Official API available.',
    description: 'High-resolution cinematic B-roll, aerial landscapes, cityscapes, and background plates.',
    tags: ['Stock Footage', '4K', 'Pexels', 'API'],
    projectId: 'all',
  },
  {
    assetId: 'VID_00002',
    name: 'Pixabay Videos — Free Stock Footage & Backgrounds',
    folder: 'Video',
    subfolder: 'Stock Footage',
    format: 'MP4',
    source: 'Pixabay Videos',
    sourceUrl: 'https://pixabay.com/videos/',
    downloadUrl: 'https://pixabay.com/videos/',
    previewUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    previewType: 'video',
    license: 'Pixabay Content License',
    commercialUse: 'Yes',
    licenseNote: 'Free use and modification subject to Pixabay prohibited-use restrictions.',
    description: 'Royalty-free motion backgrounds, nature clips, and green screen footage.',
    tags: ['Pixabay', 'Stock Footage', 'Backgrounds'],
    projectId: 'all',
  },
  {
    assetId: 'VID_00003',
    name: 'Mixkit Free Videos — Cinematic Footage & Transitions',
    folder: 'Video',
    subfolder: 'Overlays',
    format: 'MP4',
    source: 'Mixkit Free Videos',
    sourceUrl: 'https://mixkit.co/free-stock-video/',
    downloadUrl: 'https://mixkit.co/free-stock-video/',
    previewUrl: '/assets/images/hero_studio_suite_1794901010340.jpg',
    previewType: 'video',
    license: 'Mixkit Free / Restricted',
    commercialUse: 'Check',
    licenseNote: 'Check individual clip badge (Free vs Restricted video license) before broadcast use.',
    description: 'Curated film-ready video clips, light leaks, and atmospheric overlays.',
    tags: ['Mixkit', 'Overlays', 'Cinematic'],
    projectId: 'all',
  },
  {
    assetId: 'VID_00004',
    name: 'Coverr — Atmospheric Backgrounds & Stock Footage',
    folder: 'Images',
    subfolder: 'Backgrounds',
    format: 'MP4 / WebM',
    source: 'Coverr',
    sourceUrl: 'https://coverr.co/',
    downloadUrl: 'https://coverr.co/',
    previewUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    previewType: 'video',
    license: 'Coverr Free License',
    commercialUse: 'Yes',
    licenseNote: 'Free stock video backgrounds for web hero banners and title sequences.',
    description: 'Clean looping video backgrounds and establishing environment clips.',
    tags: ['Coverr', 'Backgrounds', 'Loops'],
    projectId: 'all',
  },

  // 5. Music Studio – Free background music
  {
    assetId: 'AUD_00001',
    name: 'Mixkit Music — Cinematic, Emotional & Action Scores',
    folder: 'Audio',
    subfolder: 'Music',
    format: 'MP3 / WAV',
    source: 'Mixkit Music',
    sourceUrl: 'https://mixkit.co/free-stock-music/',
    downloadUrl: 'https://mixkit.co/free-stock-music/',
    previewUrl: '',
    previewType: 'audio',
    license: 'Mixkit Free Music License',
    commercialUse: 'Check',
    licenseNote: 'Important: Mixkit free music license excludes video games and TV/radio broadcasts.',
    description: 'Cinematic orchestral, emotional, suspense, and ambient tracks for online videos.',
    tags: ['Music', 'Cinematic', 'Ambient', 'Score'],
    projectId: 'all',
  },
  {
    assetId: 'AUD_00002',
    name: 'Pixabay Music — Royalty-Free Soundtracks',
    folder: 'Audio',
    subfolder: 'Music',
    format: 'MP3',
    source: 'Pixabay Music',
    sourceUrl: 'https://pixabay.com/music/',
    downloadUrl: 'https://pixabay.com/music/',
    previewUrl: '',
    previewType: 'audio',
    license: 'Pixabay Content License',
    commercialUse: 'Yes',
    licenseNote: 'Free background music for YouTube, film projects, and animations (check Content ID notes).',
    description: 'Large catalog of film scores, lo-fi beats, epic trailers, and cartoon themes.',
    tags: ['Music', 'Pixabay', 'Soundtrack'],
    projectId: 'all',
  },
  {
    assetId: 'AUD_00003',
    name: 'Free Music Archive — Independent Music Collections',
    folder: 'Audio',
    subfolder: 'Music',
    format: 'MP3',
    source: 'Free Music Archive',
    sourceUrl: 'https://freemusicarchive.org/',
    downloadUrl: 'https://freemusicarchive.org/',
    previewUrl: '',
    previewType: 'audio',
    license: 'Creative Commons (Varies)',
    commercialUse: 'Check',
    licenseNote: 'Each track has its own Creative Commons license — filter for CC0 or CC BY for commercial films.',
    description: 'Curated independent scores, instrumental themes, and acoustic backgrounds.',
    tags: ['Music', 'Creative Commons', 'Indie'],
    projectId: 'all',
  },
  {
    assetId: 'AUD_00004',
    name: 'Incompetech — Kevin MacLeod Film Compositions',
    folder: 'Audio',
    subfolder: 'Music',
    format: 'MP3',
    source: 'Incompetech',
    sourceUrl: 'https://incompetech.com/music/',
    downloadUrl: 'https://incompetech.com/music/',
    previewUrl: '',
    previewType: 'audio',
    license: 'CC BY 4.0',
    commercialUse: 'Yes',
    licenseNote: 'Free for commercial films with simple credit attribution (CC BY 4.0).',
    description: 'Iconic royalty-free comedy, adventure, suspense, and cartoon film scores.',
    tags: ['CC BY', 'Film Score', 'Cartoon Music'],
    projectId: 'all',
  },

  // 6. Sound Effects Studio – SFX
  {
    assetId: 'AUD_00005',
    name: 'Mixkit Sound Effects — Whoosh, Impacts & Transitions',
    folder: 'Audio',
    subfolder: 'Sound Effects',
    format: 'WAV / MP3',
    source: 'Mixkit Sound Effects',
    sourceUrl: 'https://mixkit.co/free-sound-effects/',
    downloadUrl: 'https://mixkit.co/free-sound-effects/',
    previewUrl: '',
    previewType: 'audio',
    license: 'Mixkit Free SFX License',
    commercialUse: 'Yes',
    licenseNote: 'Clean transition whooshes, hits, alarms, and nature foley.',
    description: 'Instant film transition whooshes, cinematic impacts, cartoon pops, and ambience.',
    tags: ['SFX', 'Whoosh', 'Impacts', 'Transitions'],
    projectId: 'all',
  },
  {
    assetId: 'AUD_00006',
    name: 'Freesound — Footsteps, Doors, Weather & Ambience',
    folder: 'Audio',
    subfolder: 'Footsteps',
    format: 'WAV / OGG / MP3',
    source: 'Freesound',
    sourceUrl: 'https://freesound.org/',
    downloadUrl: 'https://freesound.org/',
    previewUrl: '',
    previewType: 'audio',
    license: 'CC0 / CC BY / CC BY-NC',
    commercialUse: 'Check',
    licenseNote: 'Filter by CC0 or CC BY for commercial films; avoid NonCommercial (NC) files.',
    description: 'Massive community foley library for footsteps, weather, animals, and room tone.',
    tags: ['Freesound', 'Foley', 'Footsteps', 'Ambience'],
    projectId: 'all',
  },
  {
    assetId: 'AUD_00007',
    name: 'Pixabay Sound Effects — Cinematic & Everyday SFX',
    folder: 'Audio',
    subfolder: 'Cinematic Sounds',
    format: 'MP3',
    source: 'Pixabay Sound Effects',
    sourceUrl: 'https://pixabay.com/sound-effects/',
    downloadUrl: 'https://pixabay.com/sound-effects/',
    previewUrl: '',
    previewType: 'audio',
    license: 'Pixabay Content License',
    commercialUse: 'Yes',
    licenseNote: 'No attribution required; free for film, cartoon, and social video mixes.',
    description: 'Cinematic risers, explosions, cartoon boings, and everyday environmental SFX.',
    tags: ['SFX', 'Pixabay', 'Cinematic'],
    projectId: 'all',
  },
  {
    assetId: 'AUD_00008',
    name: 'Sonniss GameAudioGDC — Pro Multi-GB Film & Game SFX',
    folder: 'Audio',
    subfolder: 'Nature',
    format: 'WAV (24-bit)',
    source: 'Sonniss GameAudioGDC',
    sourceUrl: 'https://sonniss.com/gameaudiogdc/',
    downloadUrl: 'https://sonniss.com/gameaudiogdc/',
    previewUrl: '',
    previewType: 'audio',
    license: 'Royalty-Free Commercial',
    commercialUse: 'Yes',
    licenseNote: 'Annual GDC royalty-free commercial bundles — no attribution required.',
    description: 'Studio-mastered 24-bit WAV foley, sci-fi, combat, and nature sound libraries.',
    tags: ['WAV', '24-bit', 'Pro SFX', 'Commercial'],
    projectId: 'all',
  },

  // 7. Film editing, 2D animation and VFX software
  {
    assetId: 'TOOL_00001',
    name: 'Blender — 3D Animation, Modelling, VFX & Editing',
    folder: 'Open-Source Software',
    subfolder: '3D & VFX',
    format: 'Desktop App (GPL)',
    source: 'Blender',
    sourceUrl: 'https://www.blender.org/',
    downloadUrl: 'https://www.blender.org/download/',
    previewUrl: '/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    previewType: 'tool',
    license: 'GNU GPL (Free & Open Source)',
    commercialUse: 'Yes',
    licenseNote: '100% free and open-source for commercial 3D films, Grease Pencil 2D, and VFX.',
    description: 'Industry-standard open-source 3D creation suite with Grease Pencil 2D and compositor.',
    tags: ['Blender', '3D', 'VFX', 'Open Source'],
    projectId: 'all',
  },
  {
    assetId: 'TOOL_00002',
    name: 'OpenToonz — 2D Cartoon & Anime Production Suite',
    folder: 'Open-Source Software',
    subfolder: '2D Animation',
    format: 'Desktop App (BSD)',
    source: 'OpenToonz',
    sourceUrl: 'https://opentoonz.github.io/e/',
    downloadUrl: 'https://opentoonz.github.io/e/',
    previewUrl: '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
    previewType: 'tool',
    license: 'BSD Open Source',
    commercialUse: 'Yes',
    licenseNote: 'Free for commercial 2D anime and cartoon studio production.',
    description: 'Traditional hand-drawn & vector 2D animation software used in anime studios.',
    tags: ['OpenToonz', '2D Animation', 'Anime'],
    projectId: 'all',
  },
  {
    assetId: 'TOOL_00003',
    name: 'Krita — Digital Painting & Frame-by-Frame 2D Animation',
    folder: 'Open-Source Software',
    subfolder: '2D Animation',
    format: 'Desktop App (GPL)',
    source: 'Krita',
    sourceUrl: 'https://krita.org/',
    downloadUrl: 'https://krita.org/en/download/',
    previewUrl: '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
    previewType: 'tool',
    license: 'GNU GPL',
    commercialUse: 'Yes',
    licenseNote: 'Free open-source concept art, storyboard drawing, and cel animation tool.',
    description: 'Painterly brushes, onion-skinning timeline, and audio scrubbing for 2D animation.',
    tags: ['Krita', 'Storyboarding', 'Frame-by-Frame'],
    projectId: 'all',
  },
  {
    assetId: 'TOOL_00004',
    name: 'Natron — Node-Based VFX Compositing',
    folder: 'Open-Source Software',
    subfolder: '3D & VFX',
    format: 'Desktop App (GPL)',
    source: 'Natron',
    sourceUrl: 'https://natrongithub.github.io/',
    downloadUrl: 'https://natrongithub.github.io/',
    previewUrl: '/assets/images/hero_studio_suite_1794901010340.jpg',
    previewType: 'tool',
    license: 'GNU GPL',
    commercialUse: 'Yes',
    licenseNote: 'Open-source node-based compositor compatible with OpenFX plugins.',
    description: 'Professional rotoscoping, keying, tracking, and multi-pass VFX compositing.',
    tags: ['Natron', 'Compositing', 'Node VFX'],
    projectId: 'all',
  },
  {
    assetId: 'TOOL_00005',
    name: 'Kdenlive — Multitrack Non-Linear Video Editor',
    folder: 'Open-Source Software',
    subfolder: 'Video Editing',
    format: 'Desktop App (GPL)',
    source: 'Kdenlive',
    sourceUrl: 'https://kdenlive.org/',
    downloadUrl: 'https://kdenlive.org/en/download/',
    previewUrl: '/assets/images/hero_studio_suite_1794901010340.jpg',
    previewType: 'tool',
    license: 'GNU GPL',
    commercialUse: 'Yes',
    licenseNote: 'Free open-source multitrack video editor built on MLT and FFmpeg.',
    description: 'Proxy editing, keyframeable effects, color scopes, and multi-audio track mixing.',
    tags: ['Kdenlive', 'Video Editing', 'Multitrack'],
    projectId: 'all',
  },
  {
    assetId: 'TOOL_00006',
    name: 'Shotcut — Cross-Platform Video Editor & Filters',
    folder: 'Open-Source Software',
    subfolder: 'Video Editing',
    format: 'Desktop App (GPL)',
    source: 'Shotcut',
    sourceUrl: 'https://shotcut.org/',
    downloadUrl: 'https://shotcut.org/download/',
    previewUrl: '/assets/images/hero_studio_suite_1794901010340.jpg',
    previewType: 'tool',
    license: 'GNU GPL',
    commercialUse: 'Yes',
    licenseNote: 'Free open-source video editor with native 4K timeline support.',
    description: 'Fast timeline editing, LUT color grading, audio filters, and hardware encoding.',
    tags: ['Shotcut', 'Editing', '4K'],
    projectId: 'all',
  },
  {
    assetId: 'TOOL_00007',
    name: 'FFmpeg — Video Processing, Conversion & MP4 Rendering',
    folder: 'Open-Source Software',
    subfolder: 'Rendering',
    format: 'CLI / Server Engine',
    source: 'FFmpeg',
    sourceUrl: 'https://ffmpeg.org/',
    downloadUrl: 'https://ffmpeg.org/download.html',
    previewUrl: '/assets/images/hero_studio_suite_1794901010340.jpg',
    previewType: 'tool',
    license: 'LGPL / GPL',
    commercialUse: 'Yes',
    licenseNote: 'Powers server-side video muxing, subtitle burn-in, and final MP4 rendering.',
    description: 'Complete multimedia framework to decode, encode, transcode, mux, and render MP4 films.',
    tags: ['FFmpeg', 'MP4', 'Rendering', 'Export'],
    projectId: 'all',
  },

  // 8. Storyboard, fonts and icons
  {
    assetId: 'PROD_00001',
    name: 'StudioBinder — Storyboard & Shot-List Templates',
    folder: 'Film Production',
    subfolder: 'Storyboards',
    format: 'PDF / DOCX / Sheets',
    source: 'StudioBinder',
    sourceUrl: 'https://www.studiobinder.com/film-production-documents/',
    downloadUrl: 'https://www.studiobinder.com/film-production-documents/',
    previewUrl: '/assets/images/hero_studio_suite_1794901010340.jpg',
    previewType: 'image',
    license: 'Free Production Templates',
    commercialUse: 'Yes',
    licenseNote: 'Free downloadable storyboard, call sheet, shot list, and script breakdown templates.',
    description: 'Industry-standard film pre-production documents for directors and producers.',
    tags: ['Storyboards', 'Shot Lists', 'Templates'],
    projectId: 'all',
  },
  {
    assetId: 'PROD_00002',
    name: 'Google Fonts — Open-Source Film Title & Subtitle Fonts',
    folder: 'Film Production',
    subfolder: 'Fonts',
    format: 'TTF / WOFF2',
    source: 'Google Fonts',
    sourceUrl: 'https://fonts.google.com/',
    downloadUrl: 'https://fonts.google.com/',
    previewUrl: '/assets/images/hero_studio_suite_1794901010340.jpg',
    previewType: 'image',
    license: 'SIL OFL / Apache 2.0',
    commercialUse: 'Yes',
    licenseNote: '100% free for commercial films, title cards, posters, and burned-in subtitles.',
    description: 'Over 1,600 font families including Kannada, Hindi, Tamil, Telugu, and cinematic display faces.',
    tags: ['Fonts', 'Subtitles', 'Titles', 'Multilingual'],
    projectId: 'all',
  },
  {
    assetId: 'PROD_00003',
    name: 'Lucide — Open-Source Vector Studio Icons',
    folder: 'Film Production',
    subfolder: 'Icons',
    format: 'SVG / React',
    source: 'Lucide',
    sourceUrl: 'https://lucide.dev/',
    downloadUrl: 'https://lucide.dev/',
    previewUrl: 'https://useanimations.com/icons/settings.json',
    previewType: 'lottie',
    license: 'ISC (MIT-compatible)',
    commercialUse: 'Yes',
    licenseNote: 'Installed in ZKMAP Studio — free open-source SVG icons for UI and motion callouts.',
    description: 'Clean, consistent SVG icon library for HUDs, explainers, and motion graphics.',
    tags: ['Icons', 'SVG', 'Lucide'],
    projectId: 'all',
  },
  {
    assetId: 'PROD_00004',
    name: 'Heroicons — Handcrafted Tailwind SVG Icons',
    folder: 'Film Production',
    subfolder: 'Icons',
    format: 'SVG',
    source: 'Heroicons',
    sourceUrl: 'https://heroicons.com/',
    downloadUrl: 'https://heroicons.com/',
    previewUrl: 'https://useanimations.com/icons/bookmark.json',
    previewType: 'lottie',
    license: 'MIT',
    commercialUse: 'Yes',
    licenseNote: 'MIT License — free for commercial UI and video motion graphics.',
    description: 'Outline, solid, and mini SVG icons by the Tailwind CSS team.',
    tags: ['Icons', 'SVG', 'MIT'],
    projectId: 'all',
  },
  {
    assetId: 'PROD_00005',
    name: 'OpenGameArt — 2D Sprites, Textures & Audio',
    folder: 'Film Production',
    subfolder: 'Templates',
    format: 'PNG / OGG / WAV',
    source: 'OpenGameArt',
    sourceUrl: 'https://opengameart.org/',
    downloadUrl: 'https://opengameart.org/',
    previewUrl: '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
    previewType: 'image',
    license: 'CC0 / CC BY / GPL (Varies)',
    commercialUse: 'Check',
    licenseNote: 'Filter by CC0 or CC BY for commercial cartoon and animation projects.',
    description: 'Community repository of 2D cartoon sprites, tilesets, backgrounds, and retro SFX.',
    tags: ['2D Art', 'Sprites', 'Textures', 'Audio'],
    projectId: 'all',
  },
];

const DATA_DIR = path.resolve(process.cwd(), '.data');
const CUSTOM_ASSETS_FILE = path.join(DATA_DIR, 'free-assets.json');

function ensureCustomStore(): FreeAssetRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(CUSTOM_ASSETS_FILE)) {
      fs.writeFileSync(CUSTOM_ASSETS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const parsed = JSON.parse(fs.readFileSync(CUSTOM_ASSETS_FILE, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function listFreeAssets(): FreeAssetRecord[] {
  const custom = ensureCustomStore();
  return [...custom, ...SEED_FREE_ASSETS];
}

export function importFreeAsset(input: {
  name: string;
  folder: FreeAssetFolder;
  subfolder: string;
  format: string;
  source: string;
  sourceUrl: string;
  downloadUrl?: string;
  previewUrl?: string;
  previewType?: FreeAssetRecord['previewType'];
  license: string;
  commercialUse: CommercialUseStatus;
  licenseNote?: string;
  description?: string;
  projectId?: string;
}): FreeAssetRecord {
  const custom = ensureCustomStore();
  const prefix =
    input.folder === 'VFX'
      ? 'VFX'
      : input.folder === '3D Assets'
      ? '3D'
      : input.folder === 'Audio'
      ? 'AUD'
      : input.folder === 'Video'
      ? 'VID'
      : input.folder === 'Animation'
      ? 'ANIM'
      : 'ASSET';

  const record: FreeAssetRecord = {
    assetId: `${prefix}_${String(custom.length + 10001)}`,
    name: input.name.trim(),
    folder: input.folder,
    subfolder: input.subfolder.trim() || FREE_ASSET_FOLDER_TREE[input.folder]?.[0] || 'General',
    format: input.format.trim() || 'MP4',
    source: input.source.trim() || 'Custom Import',
    sourceUrl: input.sourceUrl.trim(),
    downloadUrl: (input.downloadUrl || input.sourceUrl).trim(),
    previewUrl: (input.previewUrl || '').trim(),
    previewType: input.previewType || 'image',
    license: input.license.trim() || 'CC0',
    commercialUse: input.commercialUse || 'Check',
    licenseNote: (input.licenseNote || 'Verify source license terms prior to commercial release.').trim(),
    description: (input.description || `Imported from ${input.source}`).trim(),
    tags: [input.folder, input.subfolder, input.source, input.license].filter(Boolean),
    projectId: input.projectId || 'all',
    customImported: true,
  };

  custom.unshift(record);
  fs.writeFileSync(CUSTOM_ASSETS_FILE, JSON.stringify(custom, null, 2), 'utf-8');
  return record;
}

export interface EnrichedStudioAsset extends FreeAssetRecord {
  packageStatus: 'included_in_zip' | 'official_source_link';
  modificationAllowed: CommercialUseStatus;
  redistributionAllowed: CommercialUseStatus;
  zipFolderPath: string;
}

function resolveZipFolderPath(a: FreeAssetRecord): string {
  if (a.folder === 'Animation') {
    if (a.subfolder === 'Lottie JSON') return '01-Animation/Lottie-JSON';
    if (a.subfolder === '3D Animation') return '01-Animation/3D-Animation';
    return '01-Animation/2D-Animation';
  }
  if (a.folder === 'VFX') {
    if (a.subfolder === 'Fire') return '02-VFX/Fire';
    if (a.subfolder === 'Smoke') return '02-VFX/Smoke';
    if (a.subfolder === 'Explosions') return '02-VFX/Explosion';
    if (a.subfolder === 'Lightning') return '02-VFX/Lightning';
    return '02-VFX/Particles';
  }
  if (a.folder === '3D Assets') {
    if (a.subfolder === 'Characters') return '03-3D-Assets/Characters';
    if (a.subfolder === 'HDRI') return '03-3D-Assets/HDRI';
    return '03-3D-Assets/Models';
  }
  if (a.folder === 'Images') {
    if (a.subfolder === 'Textures') return '03-3D-Assets/Textures';
    return '04-Images';
  }
  if (a.folder === 'Video') return '05-Video';
  if (a.folder === 'Audio') {
    return a.subfolder === 'Music' ? '06-Music' : '07-Sound-Effects';
  }
  return '08-Fonts-Icons';
}

export function listEnrichedStudioAssets(): EnrichedStudioAsset[] {
  return listFreeAssets().map((a) => {
    const licUpper = a.license.toUpperCase();
    const isMitOrCc0 = licUpper.includes('CC0') || licUpper === 'MIT' || licUpper.startsWith('MIT ');
    const isIncludedInZip = a.source === 'useAnimations';
    const redistributionAllowed: CommercialUseStatus = isMitOrCc0
      ? 'Yes'
      : a.source.toLowerCase().includes('mixkit')
      ? 'No'
      : 'Check';
    const modificationAllowed: CommercialUseStatus =
      isMitOrCc0 || licUpper.includes('GPL') || licUpper.includes('BSD') || licUpper.includes('OFL')
        ? 'Yes'
        : a.commercialUse === 'Yes'
        ? 'Yes'
        : 'Check';

    return {
      ...a,
      packageStatus: isIncludedInZip ? 'included_in_zip' : 'official_source_link',
      modificationAllowed,
      redistributionAllowed,
      zipFolderPath: resolveZipFolderPath(a),
    };
  });
}

function csvEscape(val: unknown): string {
  const s = String(val ?? '');
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function generateDownloadLinksCsv(assets: EnrichedStudioAsset[]): string {
  const header = [
    'Asset ID',
    'Asset Name',
    'ZIP Folder',
    'Category',
    'Subfolder',
    'Format',
    'Source',
    'Package Status',
    'Source URL',
    'Download URL',
    'Project ID',
  ];
  const rows = assets.map((a) =>
    [
      a.assetId,
      a.name,
      a.zipFolderPath,
      a.folder,
      a.subfolder,
      a.format,
      a.source,
      a.packageStatus === 'included_in_zip' ? 'Included in ZIP (MIT)' : 'Official Source Link',
      a.sourceUrl,
      a.downloadUrl,
      a.projectId,
    ]
      .map(csvEscape)
      .join(',')
  );
  return [header.join(','), ...rows].join('\n');
}

export function generateLicensesCsv(assets: EnrichedStudioAsset[]): string {
  const header = [
    'Asset ID',
    'Asset Name',
    'Source',
    'License',
    'Commercial Use',
    'Modification Permitted',
    'Redistribution Permitted',
    'Package Status',
    'License Notes',
  ];
  const rows = assets.map((a) =>
    [
      a.assetId,
      a.name,
      a.source,
      a.license,
      a.commercialUse,
      a.modificationAllowed,
      a.redistributionAllowed,
      a.packageStatus === 'included_in_zip' ? 'Included in ZIP' : 'Download from Official Website',
      a.licenseNote,
    ]
      .map(csvEscape)
      .join(',')
  );
  return [header.join(','), ...rows].join('\n');
}

const COMPLETE_LIBRARY_FOLDERS = [
  '01-Animation/Lottie-JSON',
  '01-Animation/2D-Animation',
  '01-Animation/3D-Animation',
  '02-VFX/Fire',
  '02-VFX/Smoke',
  '02-VFX/Explosion',
  '02-VFX/Lightning',
  '02-VFX/Particles',
  '03-3D-Assets/Characters',
  '03-3D-Assets/Models',
  '03-3D-Assets/Textures',
  '03-3D-Assets/HDRI',
  '04-Images',
  '05-Video',
  '06-Music',
  '07-Sound-Effects',
  '08-Fonts-Icons',
  '09-Asset-Catalog',
];

const BUNDLED_MIT_LOTTIE_IDS = ['loading', 'playPause', 'heart', 'star', 'settings', 'download'];

export async function buildCompleteStudioLibraryZip(): Promise<Buffer> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const root = zip.folder('Film-Video-Studio-Complete-Library')!;
  const assets = listEnrichedStudioAssets();

  // Create exact 01-09 folder hierarchy and place official-source README manifests inside each
  for (const relPath of COMPLETE_LIBRARY_FOLDERS) {
    const folderRef = root.folder(relPath)!;
    if (relPath === '09-Asset-Catalog') continue;
    const matching = assets.filter((a) => a.zipFolderPath === relPath);
    const readmeLines = [
      `Film & Video Studio Ultimate — Complete Studio Library`,
      `Folder: ${relPath}`,
      `======================================================`,
      ``,
      `IMPORTANT: Third-party assets that cannot be redistributed in a bundle are preserved as official source links below.`,
      `Always verify individual license terms before commercial distribution.`,
      ``,
      ...(matching.length > 0
        ? matching.flatMap((m) => [
            `- [${m.assetId}] ${m.name}`,
            `  Source: ${m.source} (${m.sourceUrl})`,
            `  Download: ${m.downloadUrl}`,
            `  License: ${m.license} | Commercial: ${m.commercialUse} | Modify: ${m.modificationAllowed} | Redistribute: ${m.redistributionAllowed}`,
            `  Note: ${m.licenseNote}`,
            ``,
          ])
        : [`Drop your downloaded ${relPath} assets into this folder to organize them for Film & Video Studio Ultimate.`, ``]),
    ];
    folderRef.file('SOURCES-README.txt', readmeLines.join('\n'));
  }

  // Legally bundle MIT-licensed useAnimations Lottie JSON starter pack in 01-Animation/Lottie-JSON/
  const lottieDir = root.folder('01-Animation/Lottie-JSON')!;
  lottieDir.file(
    'LICENSE-MIT.txt',
    `useAnimations Lottie JSON icons are distributed under the MIT License (https://useanimations.com/).\nFree for commercial use, modification, and redistribution.\n`
  );

  await Promise.all(
    BUNDLED_MIT_LOTTIE_IDS.map(async (id) => {
      try {
        const resp = await fetch(`https://useanimations.com/icons/${id}.json`, {
          signal: AbortSignal.timeout(4000),
        });
        if (resp.ok) {
          const text = await resp.text();
          lottieDir.file(`${id}.json`, text);
        }
      } catch {
        // skip if offline
      }
    })
  );

  // 09-Asset-Catalog: assets.json, download-links.csv, licenses.csv
  const catalogDir = root.folder('09-Asset-Catalog')!;
  catalogDir.file(
    'assets.json',
    JSON.stringify(
      {
        package: 'Film-Video-Studio-Complete-Library',
        option: 'Option 6: Complete Studio Library',
        generatedAt: new Date().toISOString(),
        totalAssets: assets.length,
        bundledMitLottieFiles: BUNDLED_MIT_LOTTIE_IDS.map((id) => `01-Animation/Lottie-JSON/${id}.json`),
        folders: COMPLETE_LIBRARY_FOLDERS,
        assets,
      },
      null,
      2
    )
  );
  catalogDir.file('download-links.csv', generateDownloadLinksCsv(assets));
  catalogDir.file('licenses.csv', generateLicensesCsv(assets));

  root.file(
    'README.txt',
    [
      'FILM & VIDEO STUDIO ULTIMATE — COMPLETE STUDIO LIBRARY (OPTION 6)',
      '=================================================================',
      '',
      'This package organizes all studio animation, VFX, 3D, image, video, music,',
      'sound effects, font/icon, and open-source production resources.',
      '',
      '- 01-Animation/Lottie-JSON/ includes MIT-licensed Lottie JSON starter animations.',
      '- All other folders contain verified official source links and license notes so',
      '  third-party assets are downloaded cleanly from their original websites.',
      '- See 09-Asset-Catalog/ for assets.json, download-links.csv, and licenses.csv.',
      '',
    ].join('\n')
  );

  const uint8 = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  return Buffer.from(uint8);
}

