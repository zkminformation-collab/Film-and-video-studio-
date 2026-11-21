import fs from 'fs';
import path from 'path';
import { importUnifiedMediaAsset } from './unifiedMediaStore.ts';

export type ManhwaSeriesStatus = 'Ongoing' | 'Completed';
export type ManhwaVisibility = 'Private' | 'Public';
export type ManhwaChapterStatus = 'Draft' | 'Processing' | 'Completed';

export interface ManhwaSeriesRecord {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  cover_asset_id: string;
  cover_url: string;
  author: string;
  genre: string;
  language: string;
  art_style: string;
  status: ManhwaSeriesStatus;
  visibility: ManhwaVisibility;
  is_favourite: boolean;
  last_opened_at: string | null;
  last_read_chapter_id: string | null;
  last_read_page: number;
  created_at: string;
  updated_at: string;
}

export interface ManhwaChapterAudioTrack {
  id: string;
  label: string;
  speaker: string;
  voice_gender: 'male' | 'female' | 'neutral';
  url: string;
  asset_id: string;
  created_at: string;
}

export interface ManhwaChapterRecord {
  id: string;
  manhwa_id: string;
  chapter_number: number;
  title: string;
  description: string;
  cover_asset_id: string;
  cover_url: string;
  backgrounds: string[];
  audio_tracks: ManhwaChapterAudioTrack[];
  status: ManhwaChapterStatus;
  created_at: string;
  updated_at: string;
}

export interface ManhwaPageRecord {
  id: string;
  chapter_id: string;
  page_number: number;
  title: string;
  image_url: string;
  asset_id: string;
  created_at: string;
}

export interface ManhwaPanelRecord {
  id: string;
  chapter_id: string;
  page_id: string;
  panel_index: number;
  title: string;
  image_url: string;
  asset_id: string;
  bbox: { x: number; y: number; w: number; h: number };
  camera_motion: string;
  duration_sec: number;
  created_at: string;
}

export interface ManhwaCharacterRecord {
  id: string;
  chapter_id: string;
  name: string;
  role: string;
  appearance: string;
  voice_gender: 'male' | 'female' | 'neutral';
  created_at: string;
}

export interface ManhwaDialogueRecord {
  id: string;
  chapter_id: string;
  panel_id: string;
  speaker: string;
  text: string;
  narration: string;
  emotion: string;
  order_index: number;
}

export interface ManhwaScenePromptRecord {
  id: string;
  chapter_id: string;
  panel_id: string;
  prompt_text: string;
  style: string;
  camera_motion: string;
  created_at: string;
}

export interface ManhwaVideoJobRecord {
  id: string;
  chapter_id: string;
  title: string;
  status: 'Queued' | 'Rendering' | 'Completed';
  resolution: string;
  duration_sec: number;
  video_url: string;
  asset_id: string;
  created_at: string;
}

export interface ManhwaLibraryDb {
  manhwa_series: ManhwaSeriesRecord[];
  manhwa_chapters: ManhwaChapterRecord[];
  manhwa_pages: ManhwaPageRecord[];
  manhwa_panels: ManhwaPanelRecord[];
  manhwa_characters: ManhwaCharacterRecord[];
  manhwa_dialogues: ManhwaDialogueRecord[];
  manhwa_scene_prompts: ManhwaScenePromptRecord[];
  manhwa_video_jobs: ManhwaVideoJobRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'manhwa-library-db.json');

function padChapter(num: number): string {
  return String(num).padStart(3, '0');
}

function linkToUnifiedMedia(params: {
  name: string;
  category: 'images' | 'audio' | 'video' | 'animation';
  url: string;
  projectId: string;
  fileType?: string;
}): string {
  try {
    const imported = importUnifiedMediaAsset({
      name: params.name,
      category: params.category,
      file_type: params.fileType || (params.category === 'video' ? 'mp4' : params.category === 'audio' ? 'mp3' : 'jpg'),
      storage_path: params.url,
      source: 'Manhwa Studio',
      source_url: params.url,
      preview_url: params.url,
      license_name: 'Creator Original',
      commercial_use: 'yes',
      attribution: 'Manhwa Studio Library',
      project_id: params.projectId,
    });
    return imported.asset.id;
  } catch {
    return `uml-manhwa-${Date.now()}`;
  }
}

function createSeedDb(): ManhwaLibraryDb {
  const now = new Date().toISOString();

  const series: ManhwaSeriesRecord[] = [
    {
      id: 'mhw-shadow-world',
      owner_id: 'studio-user',
      title: 'Shadow World',
      description:
        'An adventure in a mysterious fantasy world where an exiled silver-haired swordsman awakens an ancient obsidian seal to reclaim a fractured kingdom.',
      cover_asset_id: 'uml-seed-shadow-cover',
      cover_url: '/src/assets/images/manhwa_cover_shadow_world_1795002499270.jpg',
      author: 'Studio Creator',
      genre: 'Action, Fantasy',
      language: 'English',
      art_style: 'Dark Fantasy Webtoon',
      status: 'Ongoing',
      visibility: 'Public',
      is_favourite: true,
      last_opened_at: now,
      last_read_chapter_id: 'mhw-ch-shadow-001',
      last_read_page: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'mhw-skyline-revenant',
      owner_id: 'studio-user',
      title: 'Skyline Revenant',
      description:
        'Above rain-drenched neon rooftops, a lone hunter carrying an arcane lantern tracks spectral anomalies before dawn breaks over the metropolis.',
      cover_asset_id: 'uml-seed-skyline-cover',
      cover_url: '/src/assets/images/manhwa_cover_skyline_revenant_1795002498039.jpg',
      author: 'Studio Creator',
      genre: 'Urban Fantasy, Mystery',
      language: 'English',
      art_style: 'Modern Neo-Noir Webtoon',
      status: 'Ongoing',
      visibility: 'Public',
      is_favourite: false,
      last_opened_at: null,
      last_read_chapter_id: null,
      last_read_page: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'mhw-crimson-lotus',
      owner_id: 'studio-user',
      title: 'Crimson Lotus Sect',
      description:
        'A disgraced sword master returns to the misty peaks of Mount Hwa to uncover the truth behind the fall of the Crimson Lotus Sect.',
      cover_asset_id: 'uml-seed-crimson-cover',
      cover_url: '/src/assets/images/manhwa_cover_crimson_lotus_1795002498343.jpg',
      author: 'Community Author',
      genre: 'Martial Arts, Murim',
      language: 'Korean / English',
      art_style: 'Ink-Wash Murim',
      status: 'Completed',
      visibility: 'Public',
      is_favourite: true,
      last_opened_at: null,
      last_read_chapter_id: null,
      last_read_page: 1,
      created_at: now,
      updated_at: now,
    },
  ];

  const chapters: ManhwaChapterRecord[] = [
    {
      id: 'mhw-ch-shadow-001',
      manhwa_id: 'mhw-shadow-world',
      chapter_number: 1,
      title: 'The Beginning',
      description:
        'Kairo stands on the storm-swept ridge overlooking the Obsidian Citadel as the ancient crescent seal begins to fracture.',
      cover_asset_id: 'uml-seed-ch1-cover',
      cover_url: '/src/assets/images/manhwa_panel_warrior_1794812531995.jpg',
      backgrounds: ['Mist-shrouded cliffside ridge', 'Ancient Obsidian Sanctuary Gate', 'Moonlit shattered courtyard'],
      audio_tracks: [
        {
          id: 'aud-ch1-1',
          label: 'Kairo — Opening Oath',
          speaker: 'Kairo',
          voice_gender: 'male',
          url: '',
          asset_id: 'uml-seed-aud-1',
          created_at: now,
        },
      ],
      status: 'Completed',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'mhw-ch-shadow-002',
      manhwa_id: 'mhw-shadow-world',
      chapter_number: 2,
      title: 'The Hidden Power',
      description: 'Inside the Sanctuary Gate, dormant lightning runes awaken along Kairo’s blade.',
      cover_asset_id: 'uml-seed-ch2-cover',
      cover_url: '/src/assets/images/manhwa_panel_temple_1794812532125.jpg',
      backgrounds: ['Sanctuary Inner Hall', 'Runic Altar'],
      audio_tracks: [],
      status: 'Processing',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'mhw-ch-shadow-003',
      manhwa_id: 'mhw-shadow-world',
      chapter_number: 3,
      title: 'The New World',
      description: 'Crossing the veil reveals the fractured floating districts of the Shadow World.',
      cover_asset_id: 'uml-seed-ch3-cover',
      cover_url: '/src/assets/images/manhwa_cover_shadow_world_1795002499270.jpg',
      backgrounds: ['Floating Citadels', 'Eclipse Horizon'],
      audio_tracks: [],
      status: 'Draft',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'mhw-ch-shadow-004',
      manhwa_id: 'mhw-shadow-world',
      chapter_number: 4,
      title: 'The First Battle',
      description: 'Steel meets shadow as the Warden of the Gate challenges Kairo’s awakened power.',
      cover_asset_id: 'uml-seed-ch4-cover',
      cover_url: '/src/assets/images/manhwa_panel_clash_1794812531342.jpg',
      backgrounds: ['Citadel Bridge', 'Storm Arena'],
      audio_tracks: [],
      status: 'Draft',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'mhw-ch-shadow-005',
      manhwa_id: 'mhw-shadow-world',
      chapter_number: 5,
      title: 'The Secret',
      description: 'A hidden inscription beneath the throne reveals why the realm was sealed a century ago.',
      cover_asset_id: 'uml-seed-ch5-cover',
      cover_url: '/src/assets/images/manhwa_panel_temple_1794812532125.jpg',
      backgrounds: ['Sunken Archive Vault'],
      audio_tracks: [],
      status: 'Draft',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'mhw-ch-skyline-001',
      manhwa_id: 'mhw-skyline-revenant',
      chapter_number: 1,
      title: 'Rain Over Sector Nine',
      description: 'The arcane lantern flickers for the first time in three years, signaling a Grade-S rift.',
      cover_asset_id: 'uml-seed-sky1-cover',
      cover_url: '/src/assets/images/manhwa_cover_skyline_revenant_1795002498039.jpg',
      backgrounds: ['Rain-slicked rooftop', 'Neon alley'],
      audio_tracks: [],
      status: 'Draft',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'mhw-ch-crimson-001',
      manhwa_id: 'mhw-crimson-lotus',
      chapter_number: 1,
      title: 'Petals in the Mist',
      description: 'After ten winters in exile, Master Jin ascends the pine cliffs of Mount Hwa.',
      cover_asset_id: 'uml-seed-crim1-cover',
      cover_url: '/src/assets/images/manhwa_cover_crimson_lotus_1795002498343.jpg',
      backgrounds: ['Mount Hwa Pine Cliff'],
      audio_tracks: [],
      status: 'Completed',
      created_at: now,
      updated_at: now,
    },
  ];

  const pages: ManhwaPageRecord[] = [
    {
      id: 'mhw-pg-001',
      chapter_id: 'mhw-ch-shadow-001',
      page_number: 1,
      title: 'Page 1 · Cliffside Awakening',
      image_url: '/src/assets/images/manhwa_panel_warrior_1794812531995.jpg',
      asset_id: 'uml-seed-pg-1',
      created_at: now,
    },
    {
      id: 'mhw-pg-002',
      chapter_id: 'mhw-ch-shadow-001',
      page_number: 2,
      title: 'Page 2 · Ancient Sanctuary Gate',
      image_url: '/src/assets/images/manhwa_panel_temple_1794812532125.jpg',
      asset_id: 'uml-seed-pg-2',
      created_at: now,
    },
    {
      id: 'mhw-pg-003',
      chapter_id: 'mhw-ch-shadow-001',
      page_number: 3,
      title: 'Page 3 · Blade Clash of Destiny',
      image_url: '/src/assets/images/manhwa_panel_clash_1794812531342.jpg',
      asset_id: 'uml-seed-pg-3',
      created_at: now,
    },
    {
      id: 'mhw-pg-sky-1',
      chapter_id: 'mhw-ch-skyline-001',
      page_number: 1,
      title: 'Page 1 · Rooftop Vigil',
      image_url: '/src/assets/images/manhwa_cover_skyline_revenant_1795002498039.jpg',
      asset_id: 'uml-seed-pg-sky1',
      created_at: now,
    },
    {
      id: 'mhw-pg-crim-1',
      chapter_id: 'mhw-ch-crimson-001',
      page_number: 1,
      title: 'Page 1 · Return to Mount Hwa',
      image_url: '/src/assets/images/manhwa_cover_crimson_lotus_1795002498343.jpg',
      asset_id: 'uml-seed-pg-crim1',
      created_at: now,
    },
  ];

  const panels: ManhwaPanelRecord[] = [
    {
      id: 'mhw-pnl-001',
      chapter_id: 'mhw-ch-shadow-001',
      page_id: 'mhw-pg-001',
      panel_index: 1,
      title: 'Panel 01 · Cliffside Awakening',
      image_url: '/src/assets/images/manhwa_panel_warrior_1794812531995.jpg',
      asset_id: 'uml-seed-pg-1',
      bbox: { x: 0, y: 0, w: 100, h: 100 },
      camera_motion: 'Slow Zoom In',
      duration_sec: 5,
      created_at: now,
    },
    {
      id: 'mhw-pnl-002',
      chapter_id: 'mhw-ch-shadow-001',
      page_id: 'mhw-pg-002',
      panel_index: 2,
      title: 'Panel 02 · Ancient Sanctuary Gate',
      image_url: '/src/assets/images/manhwa_panel_temple_1794812532125.jpg',
      asset_id: 'uml-seed-pg-2',
      bbox: { x: 0, y: 0, w: 100, h: 100 },
      camera_motion: 'Vertical Scroll (Webtoon)',
      duration_sec: 5,
      created_at: now,
    },
    {
      id: 'mhw-pnl-003',
      chapter_id: 'mhw-ch-shadow-001',
      page_id: 'mhw-pg-003',
      panel_index: 3,
      title: 'Panel 03 · Blade Clash of Destiny',
      image_url: '/src/assets/images/manhwa_panel_clash_1794812531342.jpg',
      asset_id: 'uml-seed-pg-3',
      bbox: { x: 0, y: 0, w: 100, h: 100 },
      camera_motion: 'Dramatic Shake',
      duration_sec: 5,
      created_at: now,
    },
  ];

  const characters: ManhwaCharacterRecord[] = [
    {
      id: 'mhw-chr-001',
      chapter_id: 'mhw-ch-shadow-001',
      name: 'Kairo',
      role: 'Protagonist',
      appearance: 'Silver-haired swordsman in a dark tattered cloak wielding a lightning-etched blade',
      voice_gender: 'male',
      created_at: now,
    },
    {
      id: 'mhw-chr-002',
      chapter_id: 'mhw-ch-shadow-001',
      name: 'Warden Veyra',
      role: 'Antagonist',
      appearance: 'Armored obsidian sentinel guarding the Sanctuary Gate',
      voice_gender: 'female',
      created_at: now,
    },
  ];

  const dialogues: ManhwaDialogueRecord[] = [
    {
      id: 'mhw-dlg-001',
      chapter_id: 'mhw-ch-shadow-001',
      panel_id: 'mhw-pnl-001',
      speaker: 'Kairo',
      text: 'Tonight the seal breaks, and I will not turn back from the abyss.',
      narration: 'On the mist-covered ridge, the silver-haired swordsman raised his awakened blade.',
      emotion: 'Determined',
      order_index: 1,
    },
    {
      id: 'mhw-dlg-002',
      chapter_id: 'mhw-ch-shadow-001',
      panel_id: 'mhw-pnl-002',
      speaker: 'Warden Veyra',
      text: 'No mortal steps beyond the Obsidian Gate without paying the toll of shadow.',
      narration: 'Ancient stone pillars hummed as blue lightning arced across the threshold.',
      emotion: 'Commanding',
      order_index: 2,
    },
    {
      id: 'mhw-dlg-003',
      chapter_id: 'mhw-ch-shadow-001',
      panel_id: 'mhw-pnl-003',
      speaker: 'Kairo',
      text: 'Then let steel answer steel!',
      narration: 'Sparks tore through the storm as both blades collided in mid-air.',
      emotion: 'Fierce',
      order_index: 3,
    },
  ];

  const scenePrompts: ManhwaScenePromptRecord[] = [
    {
      id: 'mhw-prm-001',
      chapter_id: 'mhw-ch-shadow-001',
      panel_id: 'mhw-pnl-001',
      prompt_text:
        'Animate Korean dark fantasy manhwa panel: silver-haired swordsman Kairo on cliffside, cloak billowing in storm wind, slow cinematic push-in, subtle lightning reflections along steel blade, 24fps.',
      style: 'Dark Fantasy Webtoon',
      camera_motion: 'Slow Zoom In',
      created_at: now,
    },
    {
      id: 'mhw-prm-002',
      chapter_id: 'mhw-ch-shadow-001',
      panel_id: 'mhw-pnl-002',
      prompt_text:
        'Vertical parallax scroll up ancient obsidian sanctuary gate, floating glowing dust motes, drifting cold mist, dramatic moonlight rim light.',
      style: 'Dark Fantasy Webtoon',
      camera_motion: 'Vertical Scroll (Webtoon)',
      created_at: now,
    },
  ];

  const videoJobs: ManhwaVideoJobRecord[] = [
    {
      id: 'mhw-vid-001',
      chapter_id: 'mhw-ch-shadow-001',
      title: 'Shadow World · Ch 001 Preview Cut',
      status: 'Completed',
      resolution: '1920x1080',
      duration_sec: 15,
      video_url: '',
      asset_id: 'uml-seed-vid-001',
      created_at: now,
    },
  ];

  return {
    manhwa_series: series,
    manhwa_chapters: chapters,
    manhwa_pages: pages,
    manhwa_panels: panels,
    manhwa_characters: characters,
    manhwa_dialogues: dialogues,
    manhwa_scene_prompts: scenePrompts,
    manhwa_video_jobs: videoJobs,
  };
}

function readDb(): ManhwaLibraryDb {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) {
      const seed = createSeedDb();
      fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
      return seed;
    }
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    return {
      manhwa_series: Array.isArray(parsed?.manhwa_series) ? parsed.manhwa_series : [],
      manhwa_chapters: Array.isArray(parsed?.manhwa_chapters) ? parsed.manhwa_chapters : [],
      manhwa_pages: Array.isArray(parsed?.manhwa_pages) ? parsed.manhwa_pages : [],
      manhwa_panels: Array.isArray(parsed?.manhwa_panels) ? parsed.manhwa_panels : [],
      manhwa_characters: Array.isArray(parsed?.manhwa_characters) ? parsed.manhwa_characters : [],
      manhwa_dialogues: Array.isArray(parsed?.manhwa_dialogues) ? parsed.manhwa_dialogues : [],
      manhwa_scene_prompts: Array.isArray(parsed?.manhwa_scene_prompts) ? parsed.manhwa_scene_prompts : [],
      manhwa_video_jobs: Array.isArray(parsed?.manhwa_video_jobs) ? parsed.manhwa_video_jobs : [],
    };
  } catch {
    return createSeedDb();
  }
}

function writeDb(db: ManhwaLibraryDb): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export function listManhwaSeries(filters?: { tab?: string; q?: string }) {
  const db = readDb();
  const tab = String(filters?.tab || 'all').toLowerCase();
  const q = String(filters?.q || '').trim().toLowerCase();

  const chapterCountBySeries = new Map<string, number>();
  for (const ch of db.manhwa_chapters) {
    chapterCountBySeries.set(ch.manhwa_id, (chapterCountBySeries.get(ch.manhwa_id) || 0) + 1);
  }

  let items = db.manhwa_series.map((s) => ({
    ...s,
    chapter_count: chapterCountBySeries.get(s.id) || 0,
  }));

  if (tab === 'my') {
    items = items.filter((s) => s.owner_id === 'studio-user');
  } else if (tab === 'explore') {
    items = items.filter((s) => s.visibility === 'Public');
  } else if (tab === 'recent') {
    items = items
      .filter((s) => Boolean(s.last_opened_at))
      .sort((a, b) => String(b.last_opened_at || '').localeCompare(String(a.last_opened_at || '')));
  } else if (tab === 'favourites') {
    items = items.filter((s) => s.is_favourite);
  }

  if (q) {
    items = items.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.genre.toLowerCase().includes(q) ||
        s.author.toLowerCase().includes(q)
    );
  }

  return items;
}

export function createManhwaSeries(input: {
  title: string;
  description?: string;
  cover_url?: string;
  author?: string;
  genre?: string;
  language?: string;
  art_style?: string;
  status?: ManhwaSeriesStatus;
  visibility?: ManhwaVisibility;
}) {
  const db = readDb();
  const now = new Date().toISOString();
  const id = `mhw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const coverUrl =
    String(input.cover_url || '').trim() || '/src/assets/images/manhwa_cover_shadow_world_1795002499270.jpg';
  const coverAssetId = linkToUnifiedMedia({
    name: `${input.title.trim()} — Cover`,
    category: 'images',
    url: coverUrl,
    projectId: id,
  });

  const record: ManhwaSeriesRecord = {
    id,
    owner_id: 'studio-user',
    title: input.title.trim(),
    description: String(input.description || '').trim() || 'Original manhwa series created in Manhwa Studio.',
    cover_asset_id: coverAssetId,
    cover_url: coverUrl,
    author: String(input.author || 'Studio Creator').trim(),
    genre: String(input.genre || 'Action, Fantasy').trim(),
    language: String(input.language || 'English').trim(),
    art_style: String(input.art_style || 'Korean Webtoon').trim(),
    status: input.status === 'Completed' ? 'Completed' : 'Ongoing',
    visibility: input.visibility === 'Private' ? 'Private' : 'Public',
    is_favourite: false,
    last_opened_at: now,
    last_read_chapter_id: null,
    last_read_page: 1,
    created_at: now,
    updated_at: now,
  };

  db.manhwa_series.unshift(record);
  writeDb(db);
  return { ...record, chapter_count: 0 };
}

export function getManhwaSeriesDetail(seriesId: string) {
  const db = readDb();
  const series = db.manhwa_series.find((s) => s.id === seriesId);
  if (!series) return null;

  series.last_opened_at = new Date().toISOString();
  writeDb(db);

  const chapters = db.manhwa_chapters
    .filter((c) => c.manhwa_id === seriesId)
    .sort((a, b) => a.chapter_number - b.chapter_number)
    .map((c) => ({
      ...c,
      page_count: db.manhwa_pages.filter((p) => p.chapter_id === c.id).length,
      panel_count: db.manhwa_panels.filter((p) => p.chapter_id === c.id).length,
      dialogue_count: db.manhwa_dialogues.filter((d) => d.chapter_id === c.id).length,
      video_count: db.manhwa_video_jobs.filter((v) => v.chapter_id === c.id).length,
    }));

  return { series, chapters };
}

export function updateManhwaSeries(
  seriesId: string,
  updates: Partial<{
    title: string;
    description: string;
    cover_url: string;
    author: string;
    genre: string;
    language: string;
    art_style: string;
    status: ManhwaSeriesStatus;
    visibility: ManhwaVisibility;
    is_favourite: boolean;
    last_read_chapter_id: string | null;
    last_read_page: number;
  }>
) {
  const db = readDb();
  const series = db.manhwa_series.find((s) => s.id === seriesId);
  if (!series) return null;

  if (typeof updates.title === 'string' && updates.title.trim()) series.title = updates.title.trim();
  if (typeof updates.description === 'string') series.description = updates.description.trim();
  if (typeof updates.cover_url === 'string' && updates.cover_url.trim()) {
    series.cover_url = updates.cover_url.trim();
    series.cover_asset_id = linkToUnifiedMedia({
      name: `${series.title} — Cover`,
      category: 'images',
      url: series.cover_url,
      projectId: series.id,
    });
  }
  if (typeof updates.author === 'string') series.author = updates.author.trim();
  if (typeof updates.genre === 'string') series.genre = updates.genre.trim();
  if (typeof updates.language === 'string') series.language = updates.language.trim();
  if (typeof updates.art_style === 'string') series.art_style = updates.art_style.trim();
  if (updates.status === 'Ongoing' || updates.status === 'Completed') series.status = updates.status;
  if (updates.visibility === 'Private' || updates.visibility === 'Public') series.visibility = updates.visibility;
  if (typeof updates.is_favourite === 'boolean') series.is_favourite = updates.is_favourite;
  if (updates.last_read_chapter_id !== undefined) series.last_read_chapter_id = updates.last_read_chapter_id;
  if (typeof updates.last_read_page === 'number' && updates.last_read_page >= 1) {
    series.last_read_page = updates.last_read_page;
  }
  series.updated_at = new Date().toISOString();

  writeDb(db);
  return series;
}

export function deleteManhwaSeries(seriesId: string): boolean {
  const db = readDb();
  const exists = db.manhwa_series.some((s) => s.id === seriesId);
  if (!exists) return false;

  const chapterIds = new Set(db.manhwa_chapters.filter((c) => c.manhwa_id === seriesId).map((c) => c.id));
  db.manhwa_series = db.manhwa_series.filter((s) => s.id !== seriesId);
  db.manhwa_chapters = db.manhwa_chapters.filter((c) => c.manhwa_id !== seriesId);
  db.manhwa_pages = db.manhwa_pages.filter((p) => !chapterIds.has(p.chapter_id));
  db.manhwa_panels = db.manhwa_panels.filter((p) => !chapterIds.has(p.chapter_id));
  db.manhwa_characters = db.manhwa_characters.filter((c) => !chapterIds.has(c.chapter_id));
  db.manhwa_dialogues = db.manhwa_dialogues.filter((d) => !chapterIds.has(d.chapter_id));
  db.manhwa_scene_prompts = db.manhwa_scene_prompts.filter((s) => !chapterIds.has(s.chapter_id));
  db.manhwa_video_jobs = db.manhwa_video_jobs.filter((v) => !chapterIds.has(v.chapter_id));
  writeDb(db);
  return true;
}

export function createManhwaChapter(
  seriesId: string,
  input: { title: string; description?: string; cover_url?: string; status?: ManhwaChapterStatus }
) {
  const db = readDb();
  const series = db.manhwa_series.find((s) => s.id === seriesId);
  if (!series) return null;

  const existing = db.manhwa_chapters.filter((c) => c.manhwa_id === seriesId);
  const nextNum = existing.reduce((max, c) => Math.max(max, c.chapter_number), 0) + 1;
  const now = new Date().toISOString();
  const id = `mhw-ch-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
  const coverUrl = String(input.cover_url || '').trim() || series.cover_url;
  const coverAssetId = linkToUnifiedMedia({
    name: `${series.title} Ch ${padChapter(nextNum)} Cover`,
    category: 'images',
    url: coverUrl,
    projectId: seriesId,
  });

  const chapter: ManhwaChapterRecord = {
    id,
    manhwa_id: seriesId,
    chapter_number: nextNum,
    title: String(input.title || '').trim() || `Chapter ${padChapter(nextNum)}`,
    description: String(input.description || '').trim() || 'New chapter ready for pages, panels, and AI animation.',
    cover_asset_id: coverAssetId,
    cover_url: coverUrl,
    backgrounds: [],
    audio_tracks: [],
    status: input.status || 'Draft',
    created_at: now,
    updated_at: now,
  };

  db.manhwa_chapters.push(chapter);
  series.updated_at = now;
  writeDb(db);
  return { ...chapter, page_count: 0, panel_count: 0, dialogue_count: 0, video_count: 0 };
}

export function reorderManhwaChapters(seriesId: string, orderedChapterIds: string[]) {
  const db = readDb();
  const chapterMap = new Map(
    db.manhwa_chapters.filter((c) => c.manhwa_id === seriesId).map((c) => [c.id, c])
  );
  let num = 1;
  const seen = new Set<string>();
  for (const id of orderedChapterIds) {
    const ch = chapterMap.get(id);
    if (ch) {
      ch.chapter_number = num++;
      ch.updated_at = new Date().toISOString();
      seen.add(id);
    }
  }
  for (const ch of chapterMap.values()) {
    if (!seen.has(ch.id)) {
      ch.chapter_number = num++;
    }
  }
  writeDb(db);
  return getManhwaSeriesDetail(seriesId)?.chapters || [];
}

export function getManhwaChapterDetail(chapterId: string) {
  const db = readDb();
  const chapter = db.manhwa_chapters.find((c) => c.id === chapterId);
  if (!chapter) return null;

  const series = db.manhwa_series.find((s) => s.id === chapter.manhwa_id) || null;
  const siblingChapters = db.manhwa_chapters
    .filter((c) => c.manhwa_id === chapter.manhwa_id)
    .sort((a, b) => a.chapter_number - b.chapter_number);

  return {
    series,
    chapter,
    siblingChapters,
    pages: db.manhwa_pages
      .filter((p) => p.chapter_id === chapterId)
      .sort((a, b) => a.page_number - b.page_number),
    panels: db.manhwa_panels
      .filter((p) => p.chapter_id === chapterId)
      .sort((a, b) => a.panel_index - b.panel_index),
    characters: db.manhwa_characters.filter((c) => c.chapter_id === chapterId),
    dialogues: db.manhwa_dialogues
      .filter((d) => d.chapter_id === chapterId)
      .sort((a, b) => a.order_index - b.order_index),
    scenePrompts: db.manhwa_scene_prompts.filter((s) => s.chapter_id === chapterId),
    videoJobs: db.manhwa_video_jobs.filter((v) => v.chapter_id === chapterId),
  };
}

export function updateManhwaChapter(
  chapterId: string,
  updates: Partial<{
    title: string;
    description: string;
    cover_url: string;
    status: ManhwaChapterStatus;
    backgrounds: string[];
  }>
) {
  const db = readDb();
  const chapter = db.manhwa_chapters.find((c) => c.id === chapterId);
  if (!chapter) return null;

  if (typeof updates.title === 'string' && updates.title.trim()) chapter.title = updates.title.trim();
  if (typeof updates.description === 'string') chapter.description = updates.description.trim();
  if (typeof updates.cover_url === 'string' && updates.cover_url.trim()) {
    chapter.cover_url = updates.cover_url.trim();
    chapter.cover_asset_id = linkToUnifiedMedia({
      name: `${chapter.title} Cover`,
      category: 'images',
      url: chapter.cover_url,
      projectId: chapter.manhwa_id,
    });
  }
  if (updates.status === 'Draft' || updates.status === 'Processing' || updates.status === 'Completed') {
    chapter.status = updates.status;
  }
  if (Array.isArray(updates.backgrounds)) {
    chapter.backgrounds = updates.backgrounds.map((b) => String(b).trim()).filter(Boolean);
  }
  chapter.updated_at = new Date().toISOString();
  writeDb(db);
  return chapter;
}

export function deleteManhwaChapter(chapterId: string): boolean {
  const db = readDb();
  const target = db.manhwa_chapters.find((c) => c.id === chapterId);
  if (!target) return false;

  const seriesId = target.manhwa_id;
  db.manhwa_chapters = db.manhwa_chapters.filter((c) => c.id !== chapterId);
  db.manhwa_pages = db.manhwa_pages.filter((p) => p.chapter_id !== chapterId);
  db.manhwa_panels = db.manhwa_panels.filter((p) => p.chapter_id !== chapterId);
  db.manhwa_characters = db.manhwa_characters.filter((c) => c.chapter_id !== chapterId);
  db.manhwa_dialogues = db.manhwa_dialogues.filter((d) => d.chapter_id !== chapterId);
  db.manhwa_scene_prompts = db.manhwa_scene_prompts.filter((s) => s.chapter_id !== chapterId);
  db.manhwa_video_jobs = db.manhwa_video_jobs.filter((v) => v.chapter_id !== chapterId);

  // Re-sequence remaining chapter numbers
  const remaining = db.manhwa_chapters
    .filter((c) => c.manhwa_id === seriesId)
    .sort((a, b) => a.chapter_number - b.chapter_number);
  remaining.forEach((c, idx) => {
    c.chapter_number = idx + 1;
  });

  writeDb(db);
  return true;
}

export function addManhwaPages(
  chapterId: string,
  pagesInput: Array<{ title?: string; image_url: string }>
) {
  const db = readDb();
  const chapter = db.manhwa_chapters.find((c) => c.id === chapterId);
  if (!chapter) return null;

  const existing = db.manhwa_pages.filter((p) => p.chapter_id === chapterId);
  let nextPageNum = existing.reduce((max, p) => Math.max(max, p.page_number), 0) + 1;
  const now = new Date().toISOString();
  const created: ManhwaPageRecord[] = [];

  for (const item of pagesInput) {
    const imgUrl = String(item.image_url || '').trim();
    if (!imgUrl) continue;
    const pageNum = nextPageNum++;
    const assetId = linkToUnifiedMedia({
      name: `${chapter.title} · Page ${pageNum}`,
      category: 'images',
      url: imgUrl,
      projectId: chapter.manhwa_id,
    });
    const rec: ManhwaPageRecord = {
      id: `mhw-pg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      chapter_id: chapterId,
      page_number: pageNum,
      title: String(item.title || '').trim() || `Page ${pageNum}`,
      image_url: imgUrl,
      asset_id: assetId,
      created_at: now,
    };
    db.manhwa_pages.push(rec);
    created.push(rec);
  }

  chapter.updated_at = now;
  writeDb(db);
  return created;
}

export function deleteManhwaPage(chapterId: string, pageId: string): boolean {
  const db = readDb();
  const before = db.manhwa_pages.length;
  db.manhwa_pages = db.manhwa_pages.filter((p) => !(p.chapter_id === chapterId && p.id === pageId));
  if (db.manhwa_pages.length === before) return false;
  db.manhwa_panels = db.manhwa_panels.filter((p) => p.page_id !== pageId);

  const remaining = db.manhwa_pages
    .filter((p) => p.chapter_id === chapterId)
    .sort((a, b) => a.page_number - b.page_number);
  remaining.forEach((p, idx) => {
    p.page_number = idx + 1;
  });

  writeDb(db);
  return true;
}

export function detectChapterPanels(chapterId: string) {
  const db = readDb();
  const chapter = db.manhwa_chapters.find((c) => c.id === chapterId);
  if (!chapter) return null;

  const pages = db.manhwa_pages
    .filter((p) => p.chapter_id === chapterId)
    .sort((a, b) => a.page_number - b.page_number);

  const now = new Date().toISOString();
  const motions = ['Slow Zoom In', 'Vertical Scroll (Webtoon)', 'Pan Left-to-Right', 'Dramatic Shake'];

  // Replace existing auto-detected panels cleanly with page-linked panels
  db.manhwa_panels = db.manhwa_panels.filter((p) => p.chapter_id !== chapterId);

  const detected: ManhwaPanelRecord[] = [];
  let idx = 1;
  for (const page of pages) {
    const panel: ManhwaPanelRecord = {
      id: `mhw-pnl-${Date.now()}-${idx}`,
      chapter_id: chapterId,
      page_id: page.id,
      panel_index: idx,
      title: `Panel ${String(idx).padStart(2, '0')} · ${page.title}`,
      image_url: page.image_url,
      asset_id: page.asset_id,
      bbox: { x: 4, y: 4, w: 92, h: 92 },
      camera_motion: motions[(idx - 1) % motions.length],
      duration_sec: 5,
      created_at: now,
    };
    db.manhwa_panels.push(panel);
    detected.push(panel);
    idx++;
  }

  chapter.status = 'Processing';
  chapter.updated_at = now;
  writeDb(db);
  return detected;
}

export function addOrExtractChapterCharacters(
  chapterId: string,
  manual?: { name: string; role?: string; appearance?: string; voice_gender?: 'male' | 'female' | 'neutral' }
) {
  const db = readDb();
  const chapter = db.manhwa_chapters.find((c) => c.id === chapterId);
  if (!chapter) return null;

  const now = new Date().toISOString();
  if (manual && manual.name.trim()) {
    const created: ManhwaCharacterRecord = {
      id: `mhw-chr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      chapter_id: chapterId,
      name: manual.name.trim(),
      role: String(manual.role || 'Supporting').trim(),
      appearance: String(manual.appearance || 'Consistent manhwa character design').trim(),
      voice_gender: manual.voice_gender || 'male',
      created_at: now,
    };
    db.manhwa_characters.push(created);
    writeDb(db);
    return db.manhwa_characters.filter((c) => c.chapter_id === chapterId);
  }

  const existing = db.manhwa_characters.filter((c) => c.chapter_id === chapterId);
  if (existing.length === 0) {
    const series = db.manhwa_series.find((s) => s.id === chapter.manhwa_id);
    db.manhwa_characters.push(
      {
        id: `mhw-chr-${Date.now()}-1`,
        chapter_id: chapterId,
        name: 'Lead Protagonist',
        role: 'Protagonist',
        appearance: `Primary character from ${series?.title || 'Manhwa Series'} (${series?.art_style || 'Webtoon'})`,
        voice_gender: 'male',
        created_at: now,
      },
      {
        id: `mhw-chr-${Date.now()}-2`,
        chapter_id: chapterId,
        name: 'Narrator',
        role: 'Voiceover',
        appearance: 'Off-screen dramatic story narrator',
        voice_gender: 'neutral',
        created_at: now,
      }
    );
    writeDb(db);
  }
  return db.manhwa_characters.filter((c) => c.chapter_id === chapterId);
}

export function addOrExtractChapterDialogue(
  chapterId: string,
  manual?: { speaker: string; text: string; narration?: string; emotion?: string; panel_id?: string }
) {
  const db = readDb();
  const chapter = db.manhwa_chapters.find((c) => c.id === chapterId);
  if (!chapter) return null;

  const existing = db.manhwa_dialogues.filter((d) => d.chapter_id === chapterId);
  const panels = db.manhwa_panels
    .filter((p) => p.chapter_id === chapterId)
    .sort((a, b) => a.panel_index - b.panel_index);

  if (manual && manual.text.trim()) {
    const rec: ManhwaDialogueRecord = {
      id: `mhw-dlg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      chapter_id: chapterId,
      panel_id: manual.panel_id || panels[0]?.id || '',
      speaker: String(manual.speaker || 'Narrator').trim(),
      text: manual.text.trim(),
      narration: String(manual.narration || '').trim(),
      emotion: String(manual.emotion || 'Dramatic').trim(),
      order_index: existing.length + 1,
    };
    db.manhwa_dialogues.push(rec);
    writeDb(db);
    return db.manhwa_dialogues
      .filter((d) => d.chapter_id === chapterId)
      .sort((a, b) => a.order_index - b.order_index);
  }

  if (existing.length === 0 && panels.length > 0) {
    const chars = db.manhwa_characters.filter((c) => c.chapter_id === chapterId);
    const leadName = chars[0]?.name || 'Protagonist';
    panels.forEach((pnl, idx) => {
      db.manhwa_dialogues.push({
        id: `mhw-dlg-${Date.now()}-${idx + 1}`,
        chapter_id: chapterId,
        panel_id: pnl.id,
        speaker: leadName,
        text: `Scene ${idx + 1} dialogue for ${chapter.title}.`,
        narration: `Camera glides across ${pnl.title}.`,
        emotion: idx % 2 === 0 ? 'Determined' : 'Tense',
        order_index: idx + 1,
      });
    });
    writeDb(db);
  }

  return db.manhwa_dialogues
    .filter((d) => d.chapter_id === chapterId)
    .sort((a, b) => a.order_index - b.order_index);
}

export function generateChapterScenePrompts(chapterId: string) {
  const db = readDb();
  const chapter = db.manhwa_chapters.find((c) => c.id === chapterId);
  if (!chapter) return null;

  const series = db.manhwa_series.find((s) => s.id === chapter.manhwa_id);
  const panels = db.manhwa_panels
    .filter((p) => p.chapter_id === chapterId)
    .sort((a, b) => a.panel_index - b.panel_index);
  const dialogues = db.manhwa_dialogues.filter((d) => d.chapter_id === chapterId);
  const now = new Date().toISOString();

  db.manhwa_scene_prompts = db.manhwa_scene_prompts.filter((s) => s.chapter_id !== chapterId);

  const created: ManhwaScenePromptRecord[] = panels.map((pnl, idx) => {
    const dlg = dialogues.find((d) => d.panel_id === pnl.id) || dialogues[idx];
    return {
      id: `mhw-prm-${Date.now()}-${idx + 1}`,
      chapter_id: chapterId,
      panel_id: pnl.id,
      prompt_text: `Animate ${series?.art_style || 'Korean webtoon'} panel "${pnl.title}" (${chapter.title}). Camera: ${pnl.camera_motion}. Lighting: dramatic cinematic contrast. ${
        dlg ? `Character emotion: ${dlg.emotion}. Action beat: "${dlg.text}"` : 'Atmospheric parallax motion.'
      } 24fps, crisp ink linework.`,
      style: series?.art_style || 'Korean Webtoon',
      camera_motion: pnl.camera_motion,
      created_at: now,
    };
  });

  db.manhwa_scene_prompts.push(...created);
  chapter.status = 'Processing';
  chapter.updated_at = now;
  writeDb(db);
  return created;
}

export function recordChapterVideoJob(
  chapterId: string,
  input: { title?: string; resolution?: string; duration_sec?: number; video_url?: string }
) {
  const db = readDb();
  const chapter = db.manhwa_chapters.find((c) => c.id === chapterId);
  if (!chapter) return null;

  const now = new Date().toISOString();
  const title = String(input.title || `${chapter.title} · Rendered Episode`).trim();
  const videoUrl = String(input.video_url || '').trim();
  const assetId = linkToUnifiedMedia({
    name: title,
    category: 'video',
    url: videoUrl || chapter.cover_url,
    projectId: chapter.manhwa_id,
    fileType: 'mp4',
  });

  const job: ManhwaVideoJobRecord = {
    id: `mhw-vid-${Date.now()}`,
    chapter_id: chapterId,
    title,
    status: 'Completed',
    resolution: input.resolution || '1920x1080',
    duration_sec: Number(input.duration_sec || 15),
    video_url: videoUrl,
    asset_id: assetId,
    created_at: now,
  };

  db.manhwa_video_jobs.unshift(job);
  chapter.status = 'Completed';
  chapter.updated_at = now;
  writeDb(db);
  return job;
}
