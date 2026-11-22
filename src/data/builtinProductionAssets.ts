const pack = {
  VFX: {
    Fire: ['Campfire', 'Embers'],
    Smoke: ['Ground Fog', 'Rising Smoke'],
    Explosions: ['Energy Burst', 'Impact Flash'],
    Lightning: ['Lightning Bolt', 'Electric Arc'],
    Magic: ['Portal Ring', 'Magic Sparkles'],
    Particles: ['Rain', 'Snow', 'Dust Motes', 'Bubbles'],
    Transitions: ['Light Sweep', 'Iris Wipe', 'Glitch Sweep'],
    'Lens Effects': ['Lens Flare'],
  },
  Audio: {
    Music: ['Ambient Bed', 'Cartoon Cue', 'Tension Pulse'],
    'Sound Effects': ['Whoosh', 'Hit Impact', 'Door Creak', 'Magic Chime', 'Cartoon Pop', 'UI Beep'],
    Footsteps: ['Wood Footsteps', 'Gravel Footsteps'],
    Nature: ['Rain Ambience', 'Wind Gust', 'Thunder', 'Bird Chirps'],
    'Cinematic Sounds': ['Bass Drop', 'Riser', 'Cinematic Boom'],
  },
  Video: {
    'Stock Footage': ['Neon City Loop', 'Star Field Loop', 'Ocean Loop'],
    'Green Screen': ['Green Screen Test Plate'],
  },
  'Film Production': {
    Storyboards: ['Six Panel Storyboard'],
    Templates: ['Shot List', 'Sound Cue Sheet'],
  },
} as const;

export type ProductionAssetFolder = keyof typeof pack;

export const builtinProductionAssets = (Object.keys(pack) as ProductionAssetFolder[]).flatMap((folder) =>
  Object.entries(pack[folder]).flatMap(([subfolder, names]) => (names as readonly string[]).map((name) => {
    const slug = name.toLowerCase().replaceAll(' ', '-');
    const format = folder === 'Audio' ? 'WAV' : folder === 'Film Production' ? (subfolder === 'Storyboards' ? 'SVG' : 'CSV') : 'WebM';
    const url = `/assets/production-pack/${slug}.${format.toLowerCase()}`;
    const durationSec = format === 'WebM' ? 2 : format === 'WAV' ? (subfolder === 'Music' || name.endsWith('Ambience') ? 4 : 2) : undefined;
    return { assetId: `zkmap-${slug}`, slug, folder, subfolder, name, format, url, durationSec };
  })),
);

export type BuiltinProductionAsset = (typeof builtinProductionAssets)[number];
