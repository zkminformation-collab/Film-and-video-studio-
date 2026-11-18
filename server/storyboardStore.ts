import fs from 'fs';
import path from 'path';
import {
  generateStudioImages,
  listSavedCharacterIdentities,
} from './aiImageStudioStore.ts';
import { registerExistingLibraryAsset } from './mediaLibraryStore.ts';

export type ShotCameraType =
  | 'Extreme wide shot'
  | 'Wide shot'
  | 'Medium shot'
  | 'Close-up'
  | 'Extreme close-up'
  | 'Over-the-shoulder shot'
  | 'Low-angle shot'
  | 'High-angle shot'
  | 'Tracking shot'
  | 'Aerial shot';

export interface StoryboardShotItem {
  id: string;
  sceneId: string;
  shotNumber: number;
  cameraAngle: ShotCameraType;
  characterName: string;
  characterId?: string;
  action: string;
  dialogue: string;
  narration?: string;
  durationSec: number;
  prompt: string;
  notes: string;
  imageUrl: string;
  imageAssetId?: string;
  voiceAssetId?: string;
  sfxPreset?: string;
  status: 'draft' | 'image_ready' | 'approved' | 'video_queued';
}

export interface StoryboardSceneItem {
  id: string;
  sceneNumber: number;
  title: string;
  location: string;
  description: string;
  characters: string[];
  durationSec: number;
  musicMood?: string;
  shots: StoryboardShotItem[];
}

export interface StoryboardCharacterProfile {
  id: string;
  name: string;
  description: string;
  clothing: string;
  hairstyle: string;
  expressions: string;
  poses: string;
  voiceReference: string;
  referenceImageUrl: string;
  identitySeed?: number;
}

export interface StoryboardProject {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  style: string;
  storyPrompt: string;
  screenplay: string;
  screenplayApproved: boolean;
  characters: StoryboardCharacterProfile[];
  scenes: StoryboardSceneItem[];
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_PATH = path.join(DATA_DIR, 'storyboards.json');

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readDb(): StoryboardProject[] {
  ensureStorage();
  if (!fs.existsSync(DB_PATH)) {
    const starter = buildStarterStoryboard();
    fs.writeFileSync(DB_PATH, JSON.stringify([starter], null, 2), 'utf8');
    return [starter];
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [buildStarterStoryboard()];
  } catch {
    return [buildStarterStoryboard()];
  }
}

function writeDb(items: StoryboardProject[]) {
  ensureStorage();
  fs.writeFileSync(DB_PATH, JSON.stringify(items, null, 2), 'utf8');
}

function buildStarterStoryboard(): StoryboardProject {
  const now = new Date().toISOString();
  return {
    id: 'sb-proj-001',
    projectId: 'film-kannada-01',
    title: 'Ancient City of the Sky Spire',
    summary: 'A young hero ascends an ancient mountain citadel, uncovers a hidden relic, and confronts a shadow warlord.',
    style: 'Anime',
    storyPrompt: 'Create a cinematic fantasy adventure. A hero enters an ancient city, discovers a mysterious secret, and faces a powerful enemy. Use realistic anime visuals.',
    screenplay: `TITLE: ANCIENT CITY OF THE SKY SPIRE

SCENE 1 - EXT. MISTY MOUNTAIN RIDGE - DAWN
ARJUN stands on the jagged peak gazing at the floating ruins.
NARRATOR (V.O.): Beyond the cloud line sleeps a kingdom erased from history.
ARJUN: The compass is pulling straight toward the gate.

SCENE 2 - EXT. EMERALD FOREST - DAY
ARJUN discovers a glowing rune monolith hidden beneath ancient roots.
ARJUN: This seal... it's still alive!

SCENE 3 - EXT. ANCIENT CITY PLAZA - DUSK
Dark lightning tears the sky as LORD KAEL descends onto the marble steps.
LORD KAEL: You are too late, traveler. The spire belongs to the storm.

SCENE 4 - EXT. SKY BATTLEFIELD - NIGHT
Blades clash amid swirling sparks as the ancient spire ignites.`,
    screenplayApproved: true,
    characters: [
      {
        id: 'sb-char-1',
        name: 'Arjun',
        description: 'Courageous young anime adventurer with sharp eyes and wind-swept hair',
        clothing: 'Navy travel cloak with gold embroidery and leather gauntlets',
        hairstyle: 'Spiky dark black hair',
        expressions: 'Determined, curious, battle-ready',
        poses: 'Standing on cliff, examining relic, sword stance',
        voiceReference: 'ElevenLabs Hero Male (Kannada / English)',
        referenceImageUrl: '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
        identitySeed: 482910,
      },
      {
        id: 'sb-char-2',
        name: 'Lord Kael',
        description: 'Imposing armored antagonist cloaked in obsidian storm energy',
        clothing: 'Obsidian spiked armor with glowing crimson cape',
        hairstyle: 'Long silver hair',
        expressions: 'Cold smirk, furious',
        poses: 'Descending from sky, raising dark blade',
        voiceReference: 'ElevenLabs Deep Villain Baritone',
        referenceImageUrl: '/assets/images/manhwa_panel_warrior_1794812531995.jpg',
        identitySeed: 917342,
      },
    ],
    scenes: [
      {
        id: 'sc-1',
        sceneNumber: 1,
        title: 'Hero Introduction',
        location: 'Mountain',
        description: 'Hero reaches the misty mountain ridge overlooking the ancient city.',
        characters: ['Arjun'],
        durationSec: 30,
        musicMood: 'Epic Orchestral Wonder',
        shots: [
          {
            id: 'sh-1-1',
            sceneId: 'sc-1',
            shotNumber: 1,
            cameraAngle: 'Wide shot',
            characterName: 'Arjun',
            characterId: 'sb-char-1',
            action: 'Show the towering mountain peaks and floating ruins in dramatic dawn light.',
            dialogue: 'NARRATOR: Beyond the cloud line sleeps a kingdom erased from history.',
            durationSec: 10,
            prompt: 'Wide anime shot of towering misty mountain ridge and ancient floating city at dawn, cinematic lighting, 4K',
            notes: 'Slow aerial push-in with wind ambient SFX',
            imageUrl: '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
            sfxPreset: 'Mountain Wind',
            status: 'approved',
          },
          {
            id: 'sh-1-2',
            sceneId: 'sc-1',
            shotNumber: 2,
            cameraAngle: 'Medium shot',
            characterName: 'Arjun',
            characterId: 'sb-char-1',
            action: 'Hero walks forward along the narrow stone path holding a glowing compass.',
            dialogue: 'ARJUN: The compass is pulling straight toward the gate.',
            durationSec: 10,
            prompt: 'Medium anime shot of young hero walking forward on mountain path with glowing compass, wind-swept cloak',
            notes: 'Add footsteps on stone gravel',
            imageUrl: '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
            sfxPreset: 'Footsteps',
            status: 'image_ready',
          },
          {
            id: 'sh-1-3',
            sceneId: 'sc-1',
            shotNumber: 3,
            cameraAngle: 'Close-up',
            characterName: 'Arjun',
            characterId: 'sb-char-1',
            action: 'Tight close-up on hero face as golden sunrise reflects in his eyes.',
            dialogue: '',
            durationSec: 10,
            prompt: 'Close-up anime portrait of determined young hero face, golden sunrise reflections in amber eyes, detailed shading',
            notes: 'Subtle eye blink + hair sway animation',
            imageUrl: '/src/assets/images/avatar_director_1794406569000.jpg',
            status: 'image_ready',
          },
        ],
      },
      {
        id: 'sc-2',
        sceneNumber: 2,
        title: 'Hero Discovers a Secret',
        location: 'Forest',
        description: 'Inside the bioluminescent forest, the hero uncovers an ancient glowing monolith.',
        characters: ['Arjun'],
        durationSec: 45,
        musicMood: 'Mysterious Flute & Strings',
        shots: [
          {
            id: 'sh-2-1',
            sceneId: 'sc-2',
            shotNumber: 1,
            cameraAngle: 'Tracking shot',
            characterName: 'Arjun',
            characterId: 'sb-char-1',
            action: 'Camera tracks hero parting mossy vines to reveal glowing blue runes.',
            dialogue: 'ARJUN: This seal... it is still alive!',
            durationSec: 15,
            prompt: 'Anime tracking shot in enchanted forest, glowing cyan runes on ancient stone monolith, mystical particles',
            notes: 'Magic shimmer VFX layer',
            imageUrl: '/src/assets/images/cinema_cyberpunk_alley_1794406568416.jpg',
            sfxPreset: 'Magic Shimmer',
            status: 'image_ready',
          },
        ],
      },
      {
        id: 'sc-3',
        sceneNumber: 3,
        title: 'Enemy Appears',
        location: 'Ancient city',
        description: 'Storm clouds gather over the ancient plaza as Lord Kael makes his entrance.',
        characters: ['Arjun', 'Lord Kael'],
        durationSec: 60,
        musicMood: 'Suspenseful Brass & Percussion',
        shots: [
          {
            id: 'sh-3-1',
            sceneId: 'sc-3',
            shotNumber: 1,
            cameraAngle: 'Low-angle shot',
            characterName: 'Lord Kael',
            characterId: 'sb-char-2',
            action: 'Low angle looking up at Lord Kael descending in crackling crimson lightning.',
            dialogue: 'LORD KAEL: You are too late, traveler. The spire belongs to the storm.',
            durationSec: 20,
            prompt: 'Low-angle anime action shot of armored villain descending with crimson lightning in ancient city plaza, dramatic shadows',
            notes: 'Thunderclap + camera shake VFX',
            imageUrl: '/assets/images/manhwa_panel_warrior_1794812531995.jpg',
            sfxPreset: 'Thunderclap',
            status: 'image_ready',
          },
        ],
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export function listStoryboards(projectId?: string): StoryboardProject[] {
  const all = readDb();
  if (!projectId || projectId === 'all') return all;
  const filtered = all.filter((sb) => sb.projectId === projectId);
  return filtered.length > 0 ? filtered : all;
}

export function getStoryboardById(id: string): StoryboardProject | null {
  const all = readDb();
  return all.find((sb) => sb.id === id) || null;
}

export function createStoryboard(input: {
  title?: string;
  projectId?: string;
  style?: string;
  storyPrompt?: string;
  screenplay?: string;
}): StoryboardProject {
  const all = readDb();
  const now = new Date().toISOString();
  const title = String(input.title || 'Untitled Film Storyboard').trim();
  const style = input.style || 'Anime';
  const storyPrompt = String(input.storyPrompt || '').trim();
  const sb: StoryboardProject = {
    id: `sb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    projectId: input.projectId || 'film-kannada-01',
    title,
    summary: storyPrompt || `Visual storyboard for "${title}".`,
    style,
    storyPrompt,
    screenplay: input.screenplay || '',
    screenplayApproved: false,
    characters: [],
    scenes: [],
    createdAt: now,
    updatedAt: now,
  };
  all.unshift(sb);
  writeDb(all);
  return sb;
}

export function generateStoryboardFromStory(input: {
  storyboardId?: string;
  projectId?: string;
  title?: string;
  storyPrompt: string;
  screenplay?: string;
  style?: string;
}): StoryboardProject {
  const all = readDb();
  const now = new Date().toISOString();
  const style = input.style || 'Anime';
  const promptText = String(input.storyPrompt || input.screenplay || 'A hero enters an ancient city, discovers a secret, and faces an enemy.').trim();
  const title =
    String(input.title || '').trim() ||
    promptText.split(/[.\n]/)[0].slice(0, 48).trim() ||
    'AI Generated Storyboard';

  // Pull reusable saved characters from AI Image Studio if available
  const savedImageChars = listSavedCharacterIdentities(input.projectId);
  const characters: StoryboardCharacterProfile[] =
    savedImageChars.length > 0
      ? savedImageChars.slice(0, 4).map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          clothing: c.clothes,
          hairstyle: c.hair,
          expressions: c.expression,
          poses: c.pose,
          voiceReference: 'ElevenLabs Character Voice',
          referenceImageUrl: c.latestImageUrl,
          identitySeed: c.identitySeed,
        }))
      : [
          {
            id: `sb-char-${Date.now().toString(36)}-1`,
            name: 'Hero',
            description: `Lead protagonist for ${title}`,
            clothing: 'Detailed cinematic adventure attire',
            hairstyle: 'Wind-swept dark hair',
            expressions: 'Determined, alert, heroic',
            poses: 'Standing, running, combat ready',
            voiceReference: 'ElevenLabs Lead Hero',
            referenceImageUrl: '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
          },
          {
            id: `sb-char-${Date.now().toString(36)}-2`,
            name: 'Antagonist',
            description: `Powerful rival opposing the hero in ${title}`,
            clothing: 'Dark ornate battle cloak',
            hairstyle: 'Silver swept hair',
            expressions: 'Commanding, intense',
            poses: 'Dramatic entrance, attack stance',
            voiceReference: 'ElevenLabs Deep Antagonist',
            referenceImageUrl: '/assets/images/manhwa_panel_warrior_1794812531995.jpg',
          },
        ];

  const heroName = characters[0]?.name || 'Hero';
  const villainName = characters[1]?.name || 'Enemy';

  const generatedScreenplay =
    input.screenplay && input.screenplay.trim().length > 20
      ? input.screenplay
      : `TITLE: ${title.toUpperCase()}

SCENE 1 - EXT. MOUNTAIN OVERLOOK - DAWN
${heroName} arrives at the ridge looking out over the distant realm.
NARRATOR (V.O.): ${promptText.slice(0, 120)}
${heroName.toUpperCase()}: Every path has led to this moment.

SCENE 2 - EXT. ANCIENT FOREST - DAY
${heroName} uncovers a hidden artifact pulsing with light.
${heroName.toUpperCase()}: So the legends were true after all.

SCENE 3 - EXT. ANCIENT CITY GATE - DUSK
${villainName} steps from the shadows blocking the courtyard.
${villainName.toUpperCase()}: Turn back now, or face the storm.

SCENE 4 - EXT. BATTLEFIELD - NIGHT
Energy erupts across the sky as ${heroName} and ${villainName} collide.`;

  const sceneTemplates: Array<{
    title: string;
    location: string;
    desc: string;
    durationSec: number;
    shots: Array<{ cam: ShotCameraType; char: string; action: string; dialogue: string; img: string }>;
  }> = [
    {
      title: 'Hero Introduction',
      location: 'Mountain',
      desc: `${heroName} enters the story overlooking the horizon.`,
      durationSec: 30,
      shots: [
        {
          cam: 'Wide shot',
          char: heroName,
          action: `Establishing wide view of the mountain landscape (${style} style).`,
          dialogue: `NARRATOR: ${promptText.slice(0, 90)}`,
          img: '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
        },
        {
          cam: 'Medium shot',
          char: heroName,
          action: `${heroName} walks forward with determination.`,
          dialogue: `${heroName.toUpperCase()}: Every path has led to this moment.`,
          img: '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
        },
        {
          cam: 'Close-up',
          char: heroName,
          action: `Close-up on ${heroName}'s determined expression.`,
          dialogue: '',
          img: '/src/assets/images/avatar_director_1794406569000.jpg',
        },
      ],
    },
    {
      title: 'Discovery of the Secret',
      location: 'Forest',
      desc: `${heroName} discovers a mysterious secret hidden in the forest.`,
      durationSec: 45,
      shots: [
        {
          cam: 'Tracking shot',
          char: heroName,
          action: `Camera tracks ${heroName} moving through glowing foliage.`,
          dialogue: `${heroName.toUpperCase()}: So the legends were true after all.`,
          img: '/src/assets/images/cinema_cyberpunk_alley_1794406568416.jpg',
        },
        {
          cam: 'Extreme close-up',
          char: heroName,
          action: 'Ancient glowing emblem activates in dramatic light.',
          dialogue: '',
          img: '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
        },
      ],
    },
    {
      title: 'Enemy Appears',
      location: 'Ancient city',
      desc: `${villainName} confronts ${heroName} inside the ancient city.`,
      durationSec: 60,
      shots: [
        {
          cam: 'Low-angle shot',
          char: villainName,
          action: `${villainName} emerges from storm shadows.`,
          dialogue: `${villainName.toUpperCase()}: Turn back now, or face the storm.`,
          img: '/assets/images/manhwa_panel_warrior_1794812531995.jpg',
        },
        {
          cam: 'Over-the-shoulder shot',
          char: heroName,
          action: `${heroName} braces for combat facing ${villainName}.`,
          dialogue: `${heroName.toUpperCase()}: I will not back down!`,
          img: '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
        },
      ],
    },
    {
      title: 'Final Confrontation',
      location: 'Battlefield',
      desc: `Climactic showdown between ${heroName} and ${villainName}.`,
      durationSec: 90,
      shots: [
        {
          cam: 'Aerial shot',
          char: heroName,
          action: 'Sweeping aerial view of the glowing battlefield at climax.',
          dialogue: 'NARRATOR: The fate of the ancient realm hangs in the balance.',
          img: '/src/assets/images/cinema_soundstage_set_1794406569758.jpg',
        },
      ],
    },
  ];

  const scenes: StoryboardSceneItem[] = sceneTemplates.map((st, sIdx) => {
    const sceneId = `sc-${Date.now().toString(36)}-${sIdx + 1}`;
    return {
      id: sceneId,
      sceneNumber: sIdx + 1,
      title: st.title,
      location: st.location,
      description: st.desc,
      characters: [heroName, ...(sIdx >= 2 ? [villainName] : [])],
      durationSec: st.durationSec,
      musicMood: sIdx >= 2 ? 'Epic Action Orchestral' : 'Cinematic Adventure',
      shots: st.shots.map((sh, shIdx) => ({
        id: `sh-${Date.now().toString(36)}-${sIdx + 1}-${shIdx + 1}`,
        sceneId,
        shotNumber: shIdx + 1,
        cameraAngle: sh.cam,
        characterName: sh.char,
        action: sh.action,
        dialogue: sh.dialogue,
        durationSec: Math.max(5, Math.round(st.durationSec / st.shots.length)),
        prompt: `${sh.cam}, ${style} visual style: ${sh.action} Location: ${st.location}.`,
        notes: `Scene ${sIdx + 1} · Shot ${shIdx + 1}`,
        imageUrl: sh.img,
        status: 'draft',
      })),
    };
  });

  const existingIdx = input.storyboardId ? all.findIndex((s) => s.id === input.storyboardId) : -1;
  const sb: StoryboardProject = {
    id: existingIdx >= 0 ? all[existingIdx].id : `sb-${Date.now().toString(36)}`,
    projectId: input.projectId || 'film-kannada-01',
    title,
    summary: promptText.slice(0, 200),
    style,
    storyPrompt: promptText,
    screenplay: generatedScreenplay,
    screenplayApproved: false,
    characters,
    scenes,
    createdAt: existingIdx >= 0 ? all[existingIdx].createdAt : now,
    updatedAt: now,
  };

  if (existingIdx >= 0) {
    all[existingIdx] = sb;
  } else {
    all.unshift(sb);
  }
  writeDb(all);
  return sb;
}

export function updateStoryboard(id: string, updates: Partial<StoryboardProject>): StoryboardProject | null {
  const all = readDb();
  const idx = all.findIndex((sb) => sb.id === id);
  if (idx < 0) return null;
  const updated: StoryboardProject = {
    ...all[idx],
    ...updates,
    id: all[idx].id,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = updated;
  writeDb(all);
  return updated;
}

export function deleteStoryboard(id: string): boolean {
  const all = readDb();
  const remaining = all.filter((sb) => sb.id !== id);
  if (remaining.length === all.length) return false;
  writeDb(remaining);
  return true;
}

export async function generateImageForStoryboardShot(input: {
  storyboardId: string;
  sceneId: string;
  shotId: string;
  prompt?: string;
  style?: string;
  provider?: 'auto' | 'openai' | 'stability' | 'flux' | 'studio_builtin';
}): Promise<{ storyboard: StoryboardProject; shot: StoryboardShotItem; imageUrl: string }> {
  const sb = getStoryboardById(input.storyboardId);
  if (!sb) throw new Error('Storyboard project not found.');

  const scene = sb.scenes.find((s) => s.id === input.sceneId);
  if (!scene) throw new Error('Scene not found.');

  const shot = scene.shots.find((sh) => sh.id === input.shotId);
  if (!shot) throw new Error('Shot not found.');

  const finalPrompt =
    input.prompt ||
    shot.prompt ||
    `${shot.cameraAngle} of ${shot.characterName} in ${scene.location}: ${shot.action}`;
  const finalStyle = input.style || sb.style || 'Anime';

  const [generated] = await generateStudioImages({
    prompt: finalPrompt,
    style: finalStyle,
    aspectRatio: '16:9',
    resolution: '1024px',
    count: 1,
    quality: 'High Detail',
    folder: 'Film Scenes',
    mode: 'film_scene',
    provider: input.provider || 'auto',
    projectId: sb.projectId,
    projectName: sb.title,
    titlePrefix: `SB Sc${scene.sceneNumber}-Sh${shot.shotNumber} (${shot.cameraAngle})`,
  });

  shot.imageUrl = generated.url;
  shot.imageAssetId = generated.id;
  shot.prompt = finalPrompt;
  shot.status = 'image_ready';

  const updated = updateStoryboard(sb.id, { scenes: sb.scenes })!;
  return { storyboard: updated, shot, imageUrl: generated.url };
}

export function exportStoryboardPackage(id: string, format: 'json' | 'shotlist_csv' | 'screenplay_txt' | 'pdf_html') {
  const sb = getStoryboardById(id);
  if (!sb) throw new Error('Storyboard not found.');

  let content = '';
  let mimeType = 'application/json';
  let fileName = `${sb.title.replace(/[^\w-]+/g, '_')}_storyboard.json`;

  if (format === 'screenplay_txt') {
    content = sb.screenplay || sb.summary;
    mimeType = 'text/plain;charset=utf-8';
    fileName = `${sb.title.replace(/[^\w-]+/g, '_')}_screenplay.txt`;
  } else if (format === 'shotlist_csv') {
    const rows = ['Scene,Location,Shot,Camera Angle,Character,Duration(s),Action,Dialogue,Prompt'];
    for (const sc of sb.scenes) {
      for (const sh of sc.shots) {
        const esc = (v: string) => `"${String(v || '').replace(/"/g, '""')}"`;
        rows.push(
          [
            sc.sceneNumber,
            esc(sc.location),
            sh.shotNumber,
            esc(sh.cameraAngle),
            esc(sh.characterName),
            sh.durationSec,
            esc(sh.action),
            esc(sh.dialogue),
            esc(sh.prompt),
          ].join(',')
        );
      }
    }
    content = rows.join('\n');
    mimeType = 'text/csv;charset=utf-8';
    fileName = `${sb.title.replace(/[^\w-]+/g, '_')}_shotlist.csv`;
  } else if (format === 'pdf_html') {
    const panelsHtml = sb.scenes
      .map(
        (sc) => `
      <h2>Scene ${sc.sceneNumber}: ${sc.title} (${sc.location} · ${sc.durationSec}s)</h2>
      <p>${sc.description}</p>
      <div class="grid">
        ${sc.shots
          .map(
            (sh) => `
          <div class="panel">
            <img src="${sh.imageUrl}" alt="Shot ${sh.shotNumber}" />
            <div class="meta"><strong>Shot ${sh.shotNumber}</strong> · ${sh.cameraAngle} · ${sh.durationSec}s</div>
            <div class="desc">${sh.action}</div>
            ${sh.dialogue ? `<div class="dlg">${sh.dialogue}</div>` : ''}
          </div>`
          )
          .join('')}
      </div>`
      )
      .join('');
    content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${sb.title} — Storyboard</title>
<style>body{font-family:system-ui,sans-serif;padding:32px;color:#111}h1{margin-bottom:4px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:24px}.panel{border:1px solid #ddd;border-radius:8px;padding:10px;page-break-inside:avoid}.panel img{width:100%;height:180px;object-fit:cover;border-radius:4px}.meta{font-size:12px;margin-top:6px;color:#444}.desc{font-size:13px;margin-top:4px}.dlg{font-size:12px;font-style:italic;color:#2563eb;margin-top:4px}</style>
</head><body><h1>${sb.title}</h1><p>${sb.summary}</p>${panelsHtml}</body></html>`;
    mimeType = 'text/html;charset=utf-8';
    fileName = `${sb.title.replace(/[^\w-]+/g, '_')}_storyboard_printable.html`;
  } else {
    content = JSON.stringify(sb, null, 2);
  }

  registerExistingLibraryAsset({
    name: fileName,
    category: 'image',
    subcategory: 'Storyboard Export',
    source: 'ai_generated',
    format: format.toUpperCase(),
    mimeType,
    sizeBytes: Buffer.byteLength(content, 'utf8'),
    url: `/api/storyboards/${sb.id}`,
    thumbnail: sb.scenes[0]?.shots[0]?.imageUrl || '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
    description: `Exported storyboard package (${format}) for ${sb.title}.`,
    tags: ['Storyboard', format, sb.style],
    projectId: sb.projectId,
    projectName: sb.title,
    timelineTrack: 'Overlay',
  });

  return { fileName, mimeType, content };
}
