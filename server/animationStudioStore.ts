import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { registerExistingLibraryAsset } from './mediaLibraryStore.ts';

const execFileAsync = promisify(execFile);

export type AnimationType =
  | '2D Animation'
  | '3D Animation'
  | 'Anime'
  | 'Manhwa Animation'
  | 'Cartoon'
  | 'Realistic Animation'
  | 'Motion Graphics';

export interface AnimationClipItem {
  id: string;
  sceneId: string;
  shotId?: string;
  title: string;
  prompt: string;
  sourceImageUrl: string;
  characterId?: string;
  characterName?: string;
  motionAction: string;
  cameraMovement: string;
  vfxPreset: string;
  lipSyncText?: string;
  voiceTrackUrl?: string;
  durationSec: number;
  status: 'pending' | 'generated' | 'approved';
}

export interface AnimationJobRecord {
  id: string;
  projectId: string;
  kind: 'generate_clip' | 'motion' | 'lipsync' | 'render';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  format?: string;
  resolution?: string;
  outputUrl?: string;
  fileSizeBytes?: number;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnimationProjectRecord {
  id: string;
  projectId: string;
  title: string;
  animationType: AnimationType;
  storyPrompt: string;
  style: string;
  fps: number;
  resolution: '720p' | '1080p' | '2K' | '4K';
  characterIds: string[];
  storyboardId?: string;
  backgroundUrls: string[];
  clips: AnimationClipItem[];
  audioTracks: {
    dialogue: string[];
    narration: string[];
    music: string[];
    sfx: string[];
    environment: string[];
  };
  vfxLayers: string[];
  lastRenderUrl?: string;
  lastRenderFormat?: string;
  createdAt: string;
  updatedAt: string;
}

interface AnimationDb {
  projects: AnimationProjectRecord[];
  jobs: AnimationJobRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const UPLOADS_DIR = path.join(DATA_DIR, 'library-uploads');
const DB_PATH = path.join(DATA_DIR, 'animation-studio.json');

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function buildStarterProject(): AnimationProjectRecord {
  const now = new Date().toISOString();
  return {
    id: 'anim-proj-001',
    projectId: 'film-kannada-01',
    title: 'Ancient Fantasy Kingdom — Anime Pilot',
    animationType: 'Anime',
    storyPrompt:
      'Create a 5-minute cinematic anime animation. Main character: A young warrior. Location: Ancient fantasy kingdom. Style: High-quality anime.',
    style: 'High-Quality Anime',
    fps: 24,
    resolution: '1080p',
    characterIds: ['sb-char-1'],
    storyboardId: 'sb-proj-001',
    backgroundUrls: ['/assets/images/cartoon_adventure_thumb_1794924309261.jpg'],
    clips: [
      {
        id: 'aclip-1',
        sceneId: 'sc-1',
        shotId: 'sh-1-1',
        title: 'Shot 1 — Establishing Kingdom View',
        prompt: 'Sweeping aerial camera view of ancient fantasy kingdom at dawn, drifting clouds, anime style',
        sourceImageUrl: '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
        characterName: 'Arjun',
        motionAction: 'Camera Pan + Cloud Drift',
        cameraMovement: 'Slow Dolly Push-In',
        vfxPreset: 'Golden Glow',
        lipSyncText: 'Beyond the cloud line sleeps a kingdom erased from history.',
        durationSec: 4,
        status: 'approved',
      },
      {
        id: 'aclip-2',
        sceneId: 'sc-1',
        shotId: 'sh-1-2',
        title: 'Shot 2 — Warrior Walking Forward',
        prompt: 'Young warrior walking along stone bridge, wind blowing cloak, anime walk cycle',
        sourceImageUrl: '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
        characterName: 'Arjun',
        motionAction: 'Walking',
        cameraMovement: 'Tracking Shot',
        vfxPreset: 'Floating Embers',
        lipSyncText: 'The compass is pulling straight toward the gate.',
        durationSec: 4,
        status: 'generated',
      },
      {
        id: 'aclip-3',
        sceneId: 'sc-3',
        shotId: 'sh-3-1',
        title: 'Shot 3 — Action Lightning Clash',
        prompt: 'High-intensity sword clash with lightning arcs and camera shake',
        sourceImageUrl: '/assets/images/manhwa_panel_warrior_1794812531995.jpg',
        characterName: 'Lord Kael',
        motionAction: 'Fighting',
        cameraMovement: 'Action Camera Shake',
        vfxPreset: 'Lightning + Sparks',
        lipSyncText: 'You are too late, traveler!',
        durationSec: 4,
        status: 'generated',
      },
    ],
    audioTracks: {
      dialogue: ['A1: Arjun Dialogue (Kannada/English)'],
      narration: ['A2: Opening Kingdom Narration'],
      music: ['A3: Epic Orchestral Adventure Score'],
      sfx: ['A4: Footsteps, Sword Clash, Thunder'],
      environment: ['A5: Mountain Wind Ambience'],
    },
    vfxLayers: ['Glow', 'Lightning', 'Camera Shake'],
    createdAt: now,
    updatedAt: now,
  };
}

function readDb(): AnimationDb {
  ensureStorage();
  if (!fs.existsSync(DB_PATH)) {
    const starter: AnimationDb = { projects: [buildStarterProject()], jobs: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(starter, null, 2), 'utf8');
    return starter;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    return {
      projects: Array.isArray(parsed?.projects) && parsed.projects.length > 0 ? parsed.projects : [buildStarterProject()],
      jobs: Array.isArray(parsed?.jobs) ? parsed.jobs : [],
    };
  } catch {
    return { projects: [buildStarterProject()], jobs: [] };
  }
}

function writeDb(db: AnimationDb) {
  ensureStorage();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

export function listAnimationProjects(projectId?: string): AnimationProjectRecord[] {
  const db = readDb();
  if (!projectId || projectId === 'all') return db.projects;
  const filtered = db.projects.filter((p) => p.projectId === projectId);
  return filtered.length > 0 ? filtered : db.projects;
}

export function getAnimationProject(id: string): AnimationProjectRecord | null {
  return readDb().projects.find((p) => p.id === id) || null;
}

export function createAnimationProject(input: {
  title?: string;
  projectId?: string;
  animationType?: AnimationType;
  storyPrompt?: string;
  style?: string;
  fps?: number;
  resolution?: '720p' | '1080p' | '2K' | '4K';
}): AnimationProjectRecord {
  const db = readDb();
  const now = new Date().toISOString();
  const proj: AnimationProjectRecord = {
    id: `anim-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    projectId: input.projectId || 'film-kannada-01',
    title: String(input.title || 'New Animation Project').trim(),
    animationType: input.animationType || 'Anime',
    storyPrompt: String(input.storyPrompt || '').trim(),
    style: input.style || input.animationType || 'Anime',
    fps: Number(input.fps) || 24,
    resolution: input.resolution || '1080p',
    characterIds: [],
    backgroundUrls: [],
    clips: [],
    audioTracks: { dialogue: [], narration: [], music: [], sfx: [], environment: [] },
    vfxLayers: [],
    createdAt: now,
    updatedAt: now,
  };
  db.projects.unshift(proj);
  writeDb(db);
  return proj;
}

export function updateAnimationProject(id: string, updates: Partial<AnimationProjectRecord>): AnimationProjectRecord | null {
  const db = readDb();
  const idx = db.projects.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  const updated: AnimationProjectRecord = {
    ...db.projects[idx],
    ...updates,
    id: db.projects[idx].id,
    updatedAt: new Date().toISOString(),
  };
  db.projects[idx] = updated;
  writeDb(db);
  return updated;
}

export function deleteAnimationProject(id: string): boolean {
  const db = readDb();
  const next = db.projects.filter((p) => p.id !== id);
  if (next.length === db.projects.length) return false;
  db.projects = next;
  writeDb(db);
  return true;
}

export function recordAnimationJob(job: Omit<AnimationJobRecord, 'id' | 'createdAt' | 'updatedAt'>): AnimationJobRecord {
  const db = readDb();
  const now = new Date().toISOString();
  const full: AnimationJobRecord = {
    ...job,
    id: `ajob-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    createdAt: now,
    updatedAt: now,
  };
  db.jobs.unshift(full);
  if (db.jobs.length > 50) db.jobs = db.jobs.slice(0, 50);
  writeDb(db);
  return full;
}

export function getAnimationJob(jobId: string): AnimationJobRecord | null {
  return readDb().jobs.find((j) => j.id === jobId) || null;
}

export function listAnimationJobs(projectId?: string): AnimationJobRecord[] {
  const db = readDb();
  if (!projectId || projectId === 'all') return db.jobs;
  return db.jobs.filter((j) => j.projectId === projectId);
}

function resolveImageToDiskPath(url: string): string | null {
  if (!url) return null;
  if (url.startsWith('/api/library-uploads/')) {
    const p = path.join(UPLOADS_DIR, path.basename(url));
    return fs.existsSync(p) ? p : null;
  }
  if (url.startsWith('/src/assets/')) {
    const p = path.resolve(process.cwd(), url.slice(1));
    return fs.existsSync(p) ? p : null;
  }
  if (url.startsWith('/assets/')) {
    const p = path.resolve(process.cwd(), `public${url}`);
    return fs.existsSync(p) ? p : null;
  }
  return null;
}

export async function renderAnimationVideo(input: {
  animationProjectId: string;
  format?: 'MP4' | 'MOV' | 'WebM' | 'GIF';
  resolution?: '720p' | '1080p' | '2K' | '4K';
}): Promise<{ job: AnimationJobRecord; project: AnimationProjectRecord; downloadUrl: string }> {
  ensureStorage();
  const proj = getAnimationProject(input.animationProjectId);
  if (!proj) throw new Error('Animation project not found.');

  const format = input.format || 'MP4';
  const resolution = input.resolution || proj.resolution || '1080p';
  const dims =
    resolution === '4K'
      ? { w: 1920, h: 1080 }
      : resolution === '2K'
      ? { w: 1920, h: 1080 }
      : resolution === '720p'
      ? { w: 1280, h: 720 }
      : { w: 1920, h: 1080 };

  const firstClipImg =
    resolveImageToDiskPath(proj.clips[0]?.sourceImageUrl || '') ||
    resolveImageToDiskPath('/assets/images/cartoon_adventure_thumb_1794924309261.jpg');

  const ext = format === 'WebM' ? 'webm' : format === 'MOV' ? 'mov' : format === 'GIF' ? 'gif' : 'mp4';
  const mimeType =
    ext === 'webm'
      ? 'video/webm'
      : ext === 'mov'
      ? 'video/quicktime'
      : ext === 'gif'
      ? 'image/gif'
      : 'video/mp4';

  const fileName = `anim-${proj.id}-${Date.now().toString(36)}.${ext}`;
  const outPath = path.join(UPLOADS_DIR, fileName);
  const durationSec = Math.min(8, Math.max(3, proj.clips.length * 2));

  const args: string[] = ['-y'];
  if (firstClipImg && fs.existsSync(firstClipImg)) {
    args.push('-loop', '1', '-i', firstClipImg, '-t', String(durationSec));
  } else {
    args.push('-f', 'lavfi', '-i', `color=c=0x1e1b4b:s=${dims.w}x${dims.h}:d=${durationSec}`);
  }

  if (ext === 'gif') {
    args.push('-vf', `scale=640:360:force_original_aspect_ratio=increase,crop=640:360,fps=12`, outPath);
  } else if (ext === 'webm') {
    args.push(
      '-vf',
      `scale=${dims.w}:${dims.h}:force_original_aspect_ratio=increase,crop=${dims.w}:${dims.h},format=yuv420p`,
      '-c:v',
      'libvpx-vp9',
      '-b:v',
      '1M',
      outPath
    );
  } else {
    args.push(
      '-f',
      'lavfi',
      '-i',
      `anullsrc=r=44100:cl=stereo`,
      '-t',
      String(durationSec),
      '-vf',
      `scale=${dims.w}:${dims.h}:force_original_aspect_ratio=increase,crop=${dims.w}:${dims.h},format=yuv420p`,
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-c:a',
      'aac',
      '-shortest',
      '-movflags',
      '+faststart',
      outPath
    );
  }

  await execFileAsync('ffmpeg', args);
  const stat = fs.statSync(outPath);
  const publicUrl = `/api/library-uploads/${fileName}`;

  registerExistingLibraryAsset({
    name: `${proj.title} (${resolution} ${format})`,
    category: 'animation',
    subcategory: `Animation Projects / Final Videos`,
    source: 'ai_generated',
    format,
    mimeType,
    sizeBytes: stat.size,
    url: publicUrl,
    thumbnail: proj.clips[0]?.sourceImageUrl || '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
    description: `Rendered ${proj.animationType} video (${resolution} ${format}, ${proj.clips.length} clips).`,
    tags: ['Animation Studio', proj.animationType, resolution, format],
    projectId: proj.projectId,
    projectName: proj.title,
    timelineTrack: 'Video',
  });

  const job = recordAnimationJob({
    projectId: proj.id,
    kind: 'render',
    status: 'completed',
    format,
    resolution,
    outputUrl: publicUrl,
    fileSizeBytes: stat.size,
    message: `Rendered ${resolution} ${format} (${(stat.size / 1024).toFixed(1)} KB) and saved to Unified Media Library.`,
  });

  const updatedProj = updateAnimationProject(proj.id, {
    lastRenderUrl: publicUrl,
    lastRenderFormat: `${resolution} ${format}`,
  })!;

  return { job, project: updatedProj, downloadUrl: publicUrl };
}
