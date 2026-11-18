import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { registerExistingLibraryAsset } from './mediaLibraryStore.ts';
import { generateStudioImages } from './aiImageStudioStore.ts';

export interface FilmStoryInput {
  prompt: string;
  language: string;
  genre: string;
  target_minutes: number;
}

export interface FilmCharacterRef {
  image_id: string;
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface FilmCharacterRecord {
  character_id: string;
  name: string;
  style: string;
  description: string;
  personality: string;
  appearance: string;
  voice_description: string;
  reference_images: FilmCharacterRef[];
}

export interface FilmSceneRecord {
  scene_id: string;
  scene_number: number;
  title: string;
  location: string;
  description: string;
  action: string;
  dialogue: Array<{ character_name: string; line: string }>;
  character_names: string[];
  character_ids: string[];
}

export interface FilmStoryboardPanel {
  panel_id: string;
  scene_id: string;
  scene_number: number;
  shot_type: string;
  camera_angle: string;
  visual_prompt: string;
  action: string;
  character_ids: string[];
  imageUrl?: string;
}

export interface FilmPipelineProject {
  id: string;
  name: string;
  themeId: string;
  themeName: string;
  interfaceTheme: string;
  projectType: string;
  resolution: string;
  fps: number;
  aspectRatio: string;
  language: string;
  story: FilmStoryInput | null;
  screenplay: any | null;
  scenes: FilmSceneRecord[];
  characters: FilmCharacterRecord[];
  storyboard: FilmStoryboardPanel[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const UPLOADS_DIR = path.join(DATA_DIR, 'library-uploads');
const DB_PATH = path.join(DATA_DIR, 'film-pipeline.json');

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function readDb(): FilmPipelineProject[] {
  ensureStorage();
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, '[]', 'utf8');
    return [];
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDb(items: FilmPipelineProject[]) {
  ensureStorage();
  fs.writeFileSync(DB_PATH, JSON.stringify(items, null, 2), 'utf8');
}

export function listFilmPipelineProjects(): FilmPipelineProject[] {
  return readDb();
}

export function getFilmPipelineProject(id: string): FilmPipelineProject | null {
  return readDb().find((p) => p.id === id) || null;
}

export function saveFilmPipelineProject(project: FilmPipelineProject): FilmPipelineProject {
  const all = readDb();
  const idx = all.findIndex((p) => p.id === project.id);
  const updated = { ...project, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    all[idx] = updated;
  } else {
    all.unshift(updated);
  }
  writeDb(all);
  return updated;
}

export function createFilmPipelineProject(input: {
  name: string;
  theme?: string;
  themeId?: string;
  themeName?: string;
  interfaceTheme?: string;
  projectType?: string;
  resolution?: string;
  fps?: number;
  aspectRatio?: string;
  language?: string;
}): FilmPipelineProject {
  const name = String(input.name || '').trim();
  if (!name) throw new Error('Project name is required.');

  const now = new Date().toISOString();
  const themeId = input.themeId || input.theme || 'anime';
  const project: FilmPipelineProject = {
    id: `fp-${crypto.randomUUID().slice(0, 8)}`,
    name,
    themeId,
    themeName: input.themeName || `${themeId} Studio`,
    interfaceTheme: input.interfaceTheme || 'dark_professional',
    projectType: input.projectType || 'Short',
    resolution: input.resolution || '1080p',
    fps: Number(input.fps) || 24,
    aspectRatio: input.aspectRatio || '16:9',
    language: input.language || 'English',
    story: null,
    screenplay: null,
    scenes: [],
    characters: [],
    storyboard: [],
    status: 'created',
    createdAt: now,
    updatedAt: now,
  };
  return saveFilmPipelineProject(project);
}

export function deleteFilmPipelineProject(id: string): boolean {
  const all = readDb();
  const remaining = all.filter((p) => p.id !== id);
  if (remaining.length === all.length) return false;
  writeDb(remaining);
  return true;
}

export function saveProjectStory(id: string, story: Partial<FilmStoryInput>): FilmPipelineProject {
  const proj = getFilmPipelineProject(id);
  if (!proj) throw new Error('Project not found.');
  proj.story = {
    prompt: String(story.prompt || '').trim(),
    language: story.language || proj.language || 'English',
    genre: story.genre || 'Adventure',
    target_minutes: Number(story.target_minutes) || 10,
  };
  proj.status = 'story_saved';
  return saveFilmPipelineProject(proj);
}

export async function generateProjectScreenplay(
  id: string,
  ai: GoogleGenAI | null
): Promise<{ project: FilmPipelineProject; screenplay: any }> {
  const proj = getFilmPipelineProject(id);
  if (!proj) throw new Error('Project not found.');
  if (!proj.story?.prompt) throw new Error('Save a story prompt first.');

  let screenplay: any = null;

  if (ai) {
    try {
      const resp = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: JSON.stringify({
          projectName: proj.name,
          theme: proj.themeName,
          story: proj.story,
        }),
        config: {
          systemInstruction:
            'You are a professional animation screenwriter. Return valid JSON with keys: title (string), logline (string), characters (array of {name, role, appearance, personality}), and scenes (array of 4 objects each with scene_number, title, location, visual_description, action, dialogue array of {character_name, line}). Write dialogue in the requested language.',
          responseMimeType: 'application/json',
        },
      });
      screenplay = JSON.parse(resp.text || '{}');
    } catch (err) {
      console.warn('Gemini film screenplay fallback:', err);
    }
  }

  if (!screenplay || !Array.isArray(screenplay.scenes) || screenplay.scenes.length === 0) {
    const isKn = proj.story.language.toLowerCase().includes('kannada');
    screenplay = {
      title: proj.name,
      logline: proj.story.prompt,
      characters: [
        {
          name: 'Arun',
          role: 'Lead Hero',
          appearance: 'Black windswept hair, navy adventure jacket, warm amber eyes',
          personality: 'Brave, resourceful, and empathetic',
        },
        {
          name: 'Kael',
          role: 'Shadow Rival',
          appearance: 'Silver hair, obsidian cloak with glowing purple runes',
          personality: 'Calculating and fiercely ambitious',
        },
      ],
      scenes: [
        {
          scene_number: 1,
          title: 'The Mountain Gate',
          location: 'Misty Mountain Ridge',
          visual_description: `Sweeping ${proj.themeName} vista of towering cliffs and ancient floating arches at dawn.`,
          action: 'Arun arrives at the ridge and holds up an ancient glowing compass.',
          dialogue: [
            {
              character_name: 'Arun',
              line: isKn
                ? 'ಈ ಪ್ರಾಚೀನ ನಗರದ ರಹಸ್ಯವನ್ನು ನಾನು ಇಂದು ಪತ್ತೆ ಮಾಡುತ್ತೇನೆ.'
                : 'The compass points straight to the ancient gate. Our journey begins.',
            },
          ],
        },
        {
          scene_number: 2,
          title: 'Whispers in the Forest',
          location: 'Bioluminescent Forest',
          visual_description: 'Glowing emerald foliage and floating pollen sparks beneath tall ancient trees.',
          action: 'Arun discovers a carved stone seal pulsating with light.',
          dialogue: [
            {
              character_name: 'Arun',
              line: isKn
                ? 'ಈ ಮುದ್ರೆ ಇನ್ನೂ ಜೀವಂತವಾಗಿದೆ!'
                : 'This ancient seal... it is still alive!',
            },
          ],
        },
        {
          scene_number: 3,
          title: 'Arrival of the Rival',
          location: 'Ancient City Courtyard',
          visual_description: 'Storm clouds swirl over grand marble pillars as purple lightning strikes.',
          action: 'Kael steps down from the shadows blocking the temple entrance.',
          dialogue: [
            {
              character_name: 'Kael',
              line: isKn
                ? 'ನೀನು ತುಂಬಾ ತಡವಾಗಿ ಬಂದಿದ್ದೀಯ. ಈ ಶಕ್ತಿ ನನ್ನದು!'
                : 'You are too late, traveler. The relic belongs to the storm.',
            },
          ],
        },
        {
          scene_number: 4,
          title: 'Climax at the Spire',
          location: 'Sky Battlefield',
          visual_description: 'Dramatic aerial arena lit by golden dawn and electric aura.',
          action: 'Arun and Kael clash as the ancient spire awakens.',
          dialogue: [
            {
              character_name: 'Arun',
              line: isKn
                ? 'ಸತ್ಯ ಮತ್ತು ಧೈರ್ಯವೇ ಅಂತಿಮವಾಗಿ ಗೆಲ್ಲುತ್ತದೆ!'
                : 'I will protect this world no matter the cost!',
            },
          ],
        },
      ],
    };
  }

  proj.screenplay = screenplay;
  proj.status = 'screenplay_generated';
  const saved = saveFilmPipelineProject(proj);
  return { project: saved, screenplay };
}

export function createProjectScenesFromScreenplay(id: string): {
  project: FilmPipelineProject;
  scenes: FilmSceneRecord[];
} {
  const proj = getFilmPipelineProject(id);
  if (!proj) throw new Error('Project not found.');
  if (!proj.screenplay) throw new Error('Generate the screenplay first.');

  const rawScenes = Array.isArray(proj.screenplay.scenes) ? proj.screenplay.scenes : [];
  const scenes: FilmSceneRecord[] = rawScenes.map((sc: any, idx: number) => {
    const dlg = Array.isArray(sc.dialogue) ? sc.dialogue : [];
    const charNames = Array.from(
      new Set<string>(
        [
          ...(Array.isArray(sc.character_names) ? sc.character_names : []),
          ...dlg.map((d: any) => String(d?.character_name || '').trim()).filter(Boolean),
        ]
      )
    );
    const linkedIds = proj.characters
      .filter((c) => charNames.some((n) => n.toLowerCase() === c.name.toLowerCase()))
      .map((c) => c.character_id);

    return {
      scene_id: `sc-${crypto.randomUUID().slice(0, 8)}`,
      scene_number: Number(sc.scene_number) || idx + 1,
      title: String(sc.title || `Scene ${idx + 1}`),
      location: String(sc.location || 'Studio Location'),
      description: String(sc.visual_description || sc.description || ''),
      action: String(sc.action || ''),
      dialogue: dlg,
      character_names: charNames,
      character_ids: linkedIds,
    };
  });

  proj.scenes = scenes;
  proj.status = 'scenes_created';
  const saved = saveFilmPipelineProject(proj);
  return { project: saved, scenes };
}

export function addProjectCharacter(
  id: string,
  input: {
    name: string;
    style?: string;
    description?: string;
    personality?: string;
    appearance?: string;
    voice_description?: string;
  }
): { project: FilmPipelineProject; character: FilmCharacterRecord } {
  const proj = getFilmPipelineProject(id);
  if (!proj) throw new Error('Project not found.');
  const name = String(input.name || '').trim();
  if (!name) throw new Error('Character name is required.');

  const character: FilmCharacterRecord = {
    character_id: `char-${crypto.randomUUID().slice(0, 8)}`,
    name,
    style: input.style || proj.themeName,
    description: String(input.description || '').trim(),
    personality: String(input.personality || '').trim(),
    appearance: String(input.appearance || '').trim(),
    voice_description: String(input.voice_description || '').trim(),
    reference_images: [],
  };

  proj.characters.push(character);

  // Auto-link character_id to matching scenes
  for (const sc of proj.scenes) {
    const names = sc.character_names.map((n) => n.toLowerCase());
    if (names.includes(name.toLowerCase()) && !sc.character_ids.includes(character.character_id)) {
      sc.character_ids.push(character.character_id);
    }
  }

  const saved = saveFilmPipelineProject(proj);
  return { project: saved, character };
}

export function attachCharacterReferenceImage(
  projectId: string,
  characterId: string,
  input: { filename?: string; mimeType: string; dataUrl: string }
): { project: FilmPipelineProject; reference: FilmCharacterRef } {
  ensureStorage();
  const proj = getFilmPipelineProject(projectId);
  if (!proj) throw new Error('Project not found.');

  const character = proj.characters.find((c) => c.character_id === characterId);
  if (!character) throw new Error('Character not found.');

  const allowed: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
  };
  const mime = String(input.mimeType || '').toLowerCase();
  const ext = allowed[mime];
  if (!ext) throw new Error('Only PNG, JPG and WebP reference images are accepted.');

  const raw = String(input.dataUrl || '');
  const commaIdx = raw.indexOf(',');
  if (commaIdx < 0) throw new Error('Invalid image payload.');
  const buf = Buffer.from(raw.slice(commaIdx + 1), 'base64');
  if (buf.length === 0 || buf.length > 10 * 1024 * 1024) {
    throw new Error('Reference image must be 10 MB or smaller.');
  }

  const imageId = `ref-${crypto.randomUUID().slice(0, 8)}`;
  const filename = `${imageId}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buf);
  const url = `/api/library-uploads/${filename}`;

  const reference: FilmCharacterRef = {
    image_id: imageId,
    filename: input.filename || filename,
    url,
    mimeType: mime,
    sizeBytes: buf.length,
    uploadedAt: new Date().toISOString(),
  };

  character.reference_images.push(reference);

  registerExistingLibraryAsset({
    name: `${character.name} — Character Reference (${proj.name})`,
    category: 'character',
    subcategory: 'Character Reference Sheet',
    source: 'upload',
    format: ext.toUpperCase(),
    mimeType: mime,
    sizeBytes: buf.length,
    url,
    thumbnail: url,
    description: `${character.appearance || character.description} (character_id: ${character.character_id})`,
    tags: ['Character Consistency', character.name, proj.themeName],
    projectId: proj.id,
    projectName: proj.name,
    timelineTrack: 'Character / Image',
  });

  const saved = saveFilmPipelineProject(proj);
  return { project: saved, reference };
}

export function generateProjectStoryboardPanels(id: string): {
  project: FilmPipelineProject;
  panels: FilmStoryboardPanel[];
} {
  const proj = getFilmPipelineProject(id);
  if (!proj) throw new Error('Project not found.');
  if (!proj.scenes || proj.scenes.length === 0) {
    throw new Error('Create scenes before generating the storyboard.');
  }

  const panels: FilmStoryboardPanel[] = [];
  for (const sc of proj.scenes) {
    const linkedChars = proj.characters.filter((c) => sc.character_ids.includes(c.character_id));
    const charDesc = linkedChars
      .map((c) => `${c.name} (${c.appearance || c.description})`)
      .join('; ');
    const refImg =
      linkedChars[0]?.reference_images[0]?.url ||
      '/assets/images/cartoon_adventure_thumb_1794924309261.jpg';

    panels.push(
      {
        panel_id: `pnl-${crypto.randomUUID().slice(0, 8)}`,
        scene_id: sc.scene_id,
        scene_number: sc.scene_number,
        shot_type: 'Wide Establishing Shot',
        camera_angle: 'Wide shot',
        visual_prompt: `${proj.themeName} style wide shot of ${sc.location}. ${sc.description}${charDesc ? ` Characters: ${charDesc}.` : ''}`,
        action: sc.description,
        character_ids: sc.character_ids,
        imageUrl: refImg,
      },
      {
        panel_id: `pnl-${crypto.randomUUID().slice(0, 8)}`,
        scene_id: sc.scene_id,
        scene_number: sc.scene_number,
        shot_type: 'Character Action Close-Up',
        camera_angle: 'Medium close-up',
        visual_prompt: `${proj.themeName} style dramatic medium close-up: ${sc.action}${charDesc ? ` Preserve character identity: ${charDesc}.` : ''}`,
        action: sc.action,
        character_ids: sc.character_ids,
        imageUrl: refImg,
      }
    );
  }

  proj.storyboard = panels;
  proj.status = 'storyboard_created';
  const saved = saveFilmPipelineProject(proj);
  return { project: saved, panels };
}

export async function renderStoryboardPanelImage(
  projectId: string,
  panelId: string
): Promise<{ project: FilmPipelineProject; panel: FilmStoryboardPanel }> {
  const proj = getFilmPipelineProject(projectId);
  if (!proj) throw new Error('Project not found.');
  const panel = proj.storyboard.find((p) => p.panel_id === panelId);
  if (!panel) throw new Error('Storyboard panel not found.');

  const [img] = await generateStudioImages({
    prompt: panel.visual_prompt,
    style: proj.themeName,
    aspectRatio: proj.aspectRatio || '16:9',
    resolution: '1024px',
    count: 1,
    folder: 'Film Scenes',
    mode: 'film_scene',
    projectId: proj.id,
    projectName: proj.name,
    titlePrefix: `${proj.name} Sc${panel.scene_number} ${panel.shot_type}`,
  });

  panel.imageUrl = img.url;
  const saved = saveFilmPipelineProject(proj);
  return { project: saved, panel };
}
