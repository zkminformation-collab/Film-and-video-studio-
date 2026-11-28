import fs from 'fs';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { decodeLibraryUpload } from './libraryUploadFormat.ts';

export interface LibraryCatalogCategory {
  id: string;
  name: string;
  summary: string;
  assetTypes: string[];
}

export interface LibraryUploadedAsset {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  source: 'upload' | 'ai_generated' | 'rendered';
  format: string;
  mimeType: string;
  durationSeconds?: number;
  sizeBytes: number;
  size: string;
  url: string;
  thumbnail: string;
  description: string;
  tags: string[];
  projectId?: string;
  projectName?: string;
  ownerUserId?: string;
  projectMedia?: boolean;
  timelineTrack: string;
  addedAt: string;
}

export const TIMELINE_TRACK_BY_CATEGORY: Record<string, string> = {
  character: 'Character / Image',
  image: 'Image',
  video: 'Video',
  voice: 'Voice',
  music: 'Music',
  sfx: 'SFX',
  vfx: 'VFX',
  animation: 'Video',
  background: 'Image',
  subtitle: 'Overlay',
  prop: 'Image',
  camera: 'Overlay',
  transition: 'Overlay',
  color: 'Overlay',
  template: 'Overlay',
};

export function resolveTimelineTrack(category: string): string {
  return TIMELINE_TRACK_BY_CATEGORY[String(category || '').toLowerCase()] || 'Video';
}

export const CARTOON_LIBRARY_CATALOG: LibraryCatalogCategory[] = [
  { id: 'character', name: 'Characters', summary: 'Male, female, children, villains, heroes, character models', assetTypes: ['2D Rig', '3D Model', 'Turnaround Sheet', 'Expressions'] },
  { id: 'animation', name: 'Animation', summary: 'Walking, running, fighting, jumping, facial expressions', assetTypes: ['Walk Cycle', 'Run Cycle', 'Combat Action', 'Lip Sync'] },
  { id: 'vfx', name: 'VFX', summary: 'Fire, smoke, explosions, lightning, magic, particles, glow', assetTypes: ['Fire & Explosion', 'Magic Circle', 'Lightning Arc', 'Smoke Puff'] },
  { id: 'sfx', name: 'SFX', summary: 'Punches, footsteps, weapons, wind, rain, thunder', assetTypes: ['Impact & Fight', 'Foley', 'Weather', 'Whoosh'] },
  { id: 'music', name: 'Music', summary: 'Background music, cinematic, emotional, action, comedy', assetTypes: ['Orchestral Score', 'Adventure Groove', 'Emotional Piano', 'Comedy Underscore'] },
  { id: 'voice', name: 'Voices', summary: 'Kannada, English, Hindi, Tamil, Telugu, narration', assetTypes: ['Kannada Voice', 'English Voice', 'Hindi/Tamil/Telugu', 'Narrator'] },
  { id: 'background', name: 'Backgrounds', summary: 'Forests, cities, castles, villages, mountains', assetTypes: ['Enchanted Forest', 'Cartoon City', 'Fantasy Castle', 'Night Woods'] },
  { id: 'prop', name: 'Props', summary: 'Weapons, vehicles, furniture, tools, objects', assetTypes: ['Lantern & Tools', 'Weapons', 'Vehicles', 'Furniture'] },
  { id: 'camera', name: 'Camera', summary: 'Zoom, pan, tilt, tracking, shake', assetTypes: ['Slow Zoom', 'Pan/Tilt', 'Handheld Shake', 'Crane Tracking'] },
  { id: 'transition', name: 'Transitions', summary: 'Fade, dissolve, wipe, cinematic transitions', assetTypes: ['Crossfade', 'Flash White', 'Wipe', 'Whip Pan'] },
  { id: 'subtitle', name: 'Subtitles', summary: 'SRT, VTT, titles, captions', assetTypes: ['SRT Captions', 'WebVTT', 'Kinetic Titles', 'Bilingual Subtitles'] },
  { id: 'color', name: 'Color Grading', summary: 'Anime, cinematic, fantasy, dark, bright', assetTypes: ['Anime Vibrant', 'Cinematic Film', 'Fantasy Warm', 'Noir Dark'] },
  { id: 'template', name: 'Templates', summary: 'Cartoon intro, trailer, movie scenes, credits', assetTypes: ['Cartoon Intro', 'Trailer Kit', 'Scene Card', 'End Credits'] },
  { id: 'video', name: 'Video', summary: 'Generated clips, uploaded clips, rendered scenes', assetTypes: ['Generated Clip', 'Uploaded Footage', 'Rendered Scene'] },
  { id: 'image', name: 'Images', summary: 'AI images, textures, character sheets, storyboards', assetTypes: ['AI Keyframe', 'Storyboard Panel', 'Texture Pack', 'Character Sheet'] },
];

export const PRODUCTION_TECH_STACK = [
  { name: 'Blender Python API', purpose: '2D/3D animation, modeling, rendering and compositing' },
  { name: 'FFmpeg', purpose: 'Video editing, audio mixing, encoding and exporting (Active in Studio)' },
  { name: 'OpenTimelineIO', purpose: 'Professional timeline and editing data interchange' },
  { name: 'OpenFX', purpose: 'VFX plugin integration and compositing nodes' },
  { name: 'Hugging Face Diffusers', purpose: 'AI image, video and audio model pipelines' },
  { name: 'PyAV', purpose: 'Python video and audio stream processing' },
  { name: 'OpenCV', purpose: 'Image and video frame processing' },
  { name: 'librosa', purpose: 'Audio analysis and waveform synchronization' },
  { name: 'FastAPI / Express API', purpose: 'Backend APIs and persistent media asset uploads (Active in Studio)' },
  { name: 'PostgreSQL / Firestore', purpose: 'Project and unified asset metadata database' },
];

const DATA_DIR = path.resolve(process.cwd(), '.data');
const UPLOADS_DIR = path.join(DATA_DIR, 'library-uploads');
const DB_PATH = path.join(DATA_DIR, 'media-library.json');

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function readDb(): LibraryUploadedAsset[] {
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

function writeDb(items: LibraryUploadedAsset[]) {
  ensureStorage();
  const tempPath = DB_PATH + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify(items, null, 2), 'utf8');
  fs.renameSync(tempPath, DB_PATH);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function listLibraryUploadedAssets(filters?: {
  category?: string;
  q?: string;
  projectId?: string;
}): LibraryUploadedAsset[] {
  const all = readDb();
  const cat = String(filters?.category || '').trim().toLowerCase();
  const q = String(filters?.q || '').trim().toLowerCase();
  const projectId = String(filters?.projectId || '').trim();

  return all.filter((item) => {
    if (cat && cat !== 'all' && item.category.toLowerCase() !== cat) return false;
    if (projectId && projectId !== 'all' && item.projectId !== projectId) return false;
    if (q) {
      const hay = `${item.name} ${item.description} ${item.subcategory} ${item.projectId || ''} ${item.projectName || ''} ${item.tags.join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function saveUploadedLibraryAsset(input: {
  name: string;
  category: string;
  subcategory?: string;
  mimeType: string;
  dataUrl: string;
  description?: string;
  tags?: string[];
  projectId?: string;
  projectName?: string;
  ownerUserId?: string;
  projectMedia?: boolean;
}): LibraryUploadedAsset {
  ensureStorage();

  const { extension: ext, mime, bytes: buf, category } = decodeLibraryUpload(
    String(input.name || ''), String(input.mimeType || ''), String(input.dataUrl || ''),
  );
  const id = `lib-${randomUUID()}`;
  const safeFileName = `${id}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, safeFileName);
  const publicUrl = `/api/library-uploads/${safeFileName}`;

  const isImage = mime.startsWith('image/');
  const isAudio = mime.startsWith('audio/');
  const defaultThumb = isImage
    ? publicUrl
    : isAudio
    ? '/assets/images/feature_voice_dubbing_1794901010817.jpg'
    : '/assets/images/cartoon_adventure_thumb_1794924309261.jpg';

  const resolvedCategory = String(
    input.category || category
  ).toLowerCase();

  const record: LibraryUploadedAsset = {
    id,
    name: String(input.name || '').trim().slice(0, 120) || `asset.${ext}`,
    category: resolvedCategory,
    subcategory: String(input.subcategory || 'Uploaded Studio Asset').trim(),
    source: 'upload',
    format: ext.toUpperCase(),
    mimeType: mime,
    sizeBytes: buf.length,
    size: formatBytes(buf.length),
    url: publicUrl,
    thumbnail: defaultThumb,
    description: String(input.description || 'Uploaded into Unified Cartoon Production Library.').trim(),
    tags: Array.isArray(input.tags) && input.tags.length > 0
      ? input.tags.slice(0, 25).map(tag => String(tag).slice(0, 100))
      : ['Uploaded', ext.toUpperCase()],
    projectId: input.projectId ? String(input.projectId).trim() : undefined,
    projectName: input.projectName ? String(input.projectName).trim() : undefined,
    ownerUserId: input.ownerUserId,
    projectMedia: input.projectMedia,
    timelineTrack: resolveTimelineTrack(resolvedCategory),
    addedAt: new Date().toISOString().split('T')[0],
  };

  const all = readDb();
  all.unshift(record);
  fs.writeFileSync(filePath, buf, { flag: 'wx' });
  try {
    writeDb(all);
  } catch (error) {
    fs.rmSync(filePath, { force: true });
    throw error;
  }
  return record;
}

export function getStoredLibraryAsset(id: string) {
  const asset = readDb().find(item => item.id === id);
  const match = asset?.url.match(/^\/api\/(library-uploads|cartoon-assets)\/([a-z0-9_.-]+)$/i);
  if (!asset || !match || match[2] === '.' || match[2] === '..') return undefined;
  const filePath = path.join(DATA_DIR, match[1], match[2]);
  if (!fs.statSync(filePath, { throwIfNoEntry: false })?.isFile()) return undefined;
  return { asset, filePath };
}

export function registerExistingLibraryAsset(input: {
  name: string;
  category: string;
  subcategory?: string;
  source?: LibraryUploadedAsset['source'];
  format: string;
  mimeType: string;
  sizeBytes?: number;
  durationSeconds?: number;
  url: string;
  thumbnail?: string;
  description?: string;
  tags?: string[];
  projectId?: string;
  projectName?: string;
  ownerUserId?: string;
  projectMedia?: boolean;
  timelineTrack?: string;
}): LibraryUploadedAsset {
  ensureStorage();
  const all = readDb();
  const resolvedCategory = String(input.category || 'video').toLowerCase();
  const existingIdx = all.findIndex(
    (item) =>
      item.url === input.url &&
      item.category === resolvedCategory &&
      (item.projectId || '') === (input.projectId || '')
  );
  const sizeBytes = Number(input.sizeBytes || 0);

  const record: LibraryUploadedAsset = {
    id:
      existingIdx >= 0
        ? all[existingIdx].id
        : `lib-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: String(input.name || 'Studio Asset').trim().slice(0, 120),
    category: resolvedCategory,
    subcategory: String(input.subcategory || 'Cartoon Studio Output').trim(),
    source: input.source || 'ai_generated',
    format: String(input.format || 'MP4').toUpperCase(),
    mimeType: String(input.mimeType || 'video/mp4'),
    durationSeconds: input.durationSeconds,
    sizeBytes,
    size: sizeBytes > 0 ? formatBytes(sizeBytes) : '1.0 MB',
    url: input.url,
    thumbnail: input.thumbnail || '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
    description: String(input.description || 'Auto-registered from Cartoon Creator Studio.').trim(),
    tags: Array.isArray(input.tags) && input.tags.length > 0 ? input.tags : ['Cartoon Studio', resolvedCategory],
    projectId: input.projectId ? String(input.projectId).trim() : undefined,
    projectName: input.projectName ? String(input.projectName).trim() : undefined,
    ownerUserId: input.ownerUserId,
    projectMedia: input.projectMedia,
    timelineTrack: input.timelineTrack || resolveTimelineTrack(resolvedCategory),
    addedAt: new Date().toISOString().split('T')[0],
  };

  if (existingIdx >= 0) {
    all[existingIdx] = record;
  } else {
    all.unshift(record);
  }
  writeDb(all);
  return record;
}

export function syncCartoonProjectAssetsToLibrary(project: {
  id: string;
  name: string;
  projectType?: string;
  animationStyle?: string;
  aspectRatio?: string;
  language?: string;
  thumbnailUrl?: string;
  storyProduction?: unknown;
  ownerUserId?: string;
  referenceImages?: Array<{ id: string; name: string; url: string; mimeType: string; sizeBytes: number }>;
  characters?: Array<{ id: string; name: string; role: string; appearancePrompt: string; avatarUrl: string; voiceStyle?: string }>;
  scenes?: Array<{
    id: string;
    sceneNumber: number;
    title: string;
    description: string;
    storyImageUrl: string;
    imageStatus: string;
    videoClipStatus: string;
    videoClipUrl?: string;
    dialogueText: string;
    dialogueAudioUrl?: string;
    soundtrackUrl?: string;
    dialogueAudioStatus: string;
    musicSfxPreset: string;
    musicSfxStatus: string;
    vfxPreset: string;
    vfxStatus: string;
    subtitleText: string;
    subtitleStatus: string;
    durationSec?: number;
  }>;
  renderJob?: {
    verified?: boolean;
    fileName?: string;
    fileSizeBytes?: number;
  };
}): number {
  let count = 0;
  const projectId = project.id;
  const projectName = project.name;
  const styleTag = project.animationStyle || 'Cartoon';

  // 1. Reference images -> Images (Timeline: Image)
  for (const refImg of project.referenceImages || []) {
    if (!refImg.url) continue;
    registerExistingLibraryAsset({
      name: `${projectName} — ${refImg.name}`,
      category: 'image',
      subcategory: 'Cartoon Reference & Storyboard',
      source: 'upload',
      format: (refImg.mimeType.split('/')[1] || 'PNG').toUpperCase(),
      mimeType: refImg.mimeType || 'image/png',
      sizeBytes: refImg.sizeBytes || 102400,
      url: refImg.url,
      thumbnail: refImg.url,
      description: `Reference artwork for "${projectName}".`,
      tags: ['Cartoon Creator', 'Reference', styleTag],
      projectId, ownerUserId: project.ownerUserId, projectMedia: true,
      projectName,
      timelineTrack: 'Image',
    });
    count++;
  }

  // 2. Characters -> Characters (Timeline: Character / Image)
  for (const ch of project.characters || []) {
    registerExistingLibraryAsset({
      name: `${ch.name} (${ch.role})`,
      category: 'character',
      subcategory: 'AI Generated Character Sheet',
      source: 'ai_generated',
      format: 'PNG',
      mimeType: 'image/png',
      sizeBytes: 320000,
      url: `${ch.avatarUrl}#char-${projectId}-${ch.id}`,
      thumbnail: ch.avatarUrl,
      description: ch.appearancePrompt || `Character rig for ${projectName}.`,
      tags: ['Character', ch.role, styleTag, projectId],
      projectId, ownerUserId: project.ownerUserId, projectMedia: true,
      projectName,
      timelineTrack: 'Character / Image',
    });
    count++;
  }

  // 3. Scenes -> Images, Backgrounds, Video Clips, Voices, Music, SFX, VFX, Animation, Subtitles
  for (const scene of project.scenes || []) {
    const thumb = scene.storyImageUrl || project.thumbnailUrl || '/assets/images/cartoon_adventure_thumb_1794924309261.jpg';

    if (project.storyProduction) {
      const files = [
        { url: scene.imageStatus === 'ready' ? scene.storyImageUrl : undefined, category: 'image', format: 'PNG', mimeType: 'image/png', label: 'Cartoon frame' },
        { url: scene.videoClipStatus === 'ready' ? scene.videoClipUrl : undefined, category: 'video', format: 'MP4', mimeType: 'video/mp4', label: 'Cartoon clip' },
        { url: scene.dialogueAudioStatus === 'ready' ? scene.dialogueAudioUrl : undefined, category: 'voice', format: 'WAV', mimeType: 'audio/wav', label: 'Dialogue' },
        { url: scene.soundtrackUrl, category: 'sfx', format: 'WAV', mimeType: 'audio/wav', label: 'Scene soundtrack' },
      ];
      for (const file of files) {
        if (!file.url) continue;
        const sizeBytes = fs.statSync(path.join(DATA_DIR, 'cartoon-assets', path.basename(file.url)), { throwIfNoEntry: false })?.size;
        if (!sizeBytes) continue;
        registerExistingLibraryAsset({
          name: 'Scene ' + scene.sceneNumber + ' · ' + scene.title + ' · ' + file.label,
          category: file.category, subcategory: file.label, source: 'rendered', format: file.format,
          mimeType: file.mimeType, sizeBytes, url: file.url, thumbnail: thumb,
          durationSeconds: file.category === 'video' ? scene.durationSec : undefined,
          description: scene.description, tags: ['Cartoon Creator', file.label, styleTag], projectId, projectName, ownerUserId: project.ownerUserId, projectMedia: true,
        });
        count++;
      }
      continue;
    }

    if (scene.imageStatus === 'ready' && scene.storyImageUrl) {
      registerExistingLibraryAsset({
        name: `Scene ${scene.sceneNumber}: ${scene.title} (Story Image)`,
        category: 'image',
        subcategory: 'Generated Story Image',
        source: 'ai_generated',
        format: 'JPG',
        mimeType: 'image/jpeg',
        sizeBytes: 420000,
        url: `${scene.storyImageUrl}#img-${projectId}-s${scene.sceneNumber}`,
        thumbnail: thumb,
        description: scene.description,
        tags: ['Story Image', `Scene ${scene.sceneNumber}`, styleTag],
        projectId, ownerUserId: project.ownerUserId, projectMedia: true,
        projectName,
        timelineTrack: 'Image',
      });
      registerExistingLibraryAsset({
        name: `Scene ${scene.sceneNumber}: ${scene.title} (Background)`,
        category: 'background',
        subcategory: 'Cartoon Scene Background',
        source: 'ai_generated',
        format: 'JPG',
        mimeType: 'image/jpeg',
        sizeBytes: 380000,
        url: `${scene.storyImageUrl}#bg-${projectId}-s${scene.sceneNumber}`,
        thumbnail: thumb,
        description: `Background plate extracted for Scene ${scene.sceneNumber} of "${projectName}".`,
        tags: ['Background', `Scene ${scene.sceneNumber}`, styleTag],
        projectId, ownerUserId: project.ownerUserId, projectMedia: true,
        projectName,
        timelineTrack: 'Image',
      });
      count += 2;
    }

    if (scene.videoClipStatus === 'ready') {
      registerExistingLibraryAsset({
        name: `Scene ${scene.sceneNumber}: ${scene.title} (Cartoon Clip)`,
        category: 'video',
        subcategory: 'Animated Cartoon Clip',
        source: 'ai_generated',
        format: 'MP4',
        mimeType: 'video/mp4',
        sizeBytes: 1850000,
        url: `${thumb}#clip-${projectId}-s${scene.sceneNumber}`,
        thumbnail: thumb,
        description: `Animated cartoon clip for Scene ${scene.sceneNumber} (${project.aspectRatio || '16:9'}).`,
        tags: ['Cartoon Clip', `Scene ${scene.sceneNumber}`, styleTag],
        projectId, ownerUserId: project.ownerUserId, projectMedia: true,
        projectName,
        timelineTrack: 'Video',
      });
      count++;
    }

    if (scene.dialogueAudioStatus === 'ready' && scene.dialogueText) {
      registerExistingLibraryAsset({
        name: `Scene ${scene.sceneNumber}: AI Dialogue (${project.language || 'English'})`,
        category: 'voice',
        subcategory: 'AI Character Dialogue',
        source: 'ai_generated',
        format: 'WAV',
        mimeType: 'audio/wav',
        sizeBytes: 240000,
        url: `/api/cartoon-projects/${projectId}#voice-s${scene.sceneNumber}`,
        thumbnail: '/assets/images/feature_voice_dubbing_1794901010817.jpg',
        description: scene.dialogueText,
        tags: ['AI Dialogue', project.language || 'English', `Scene ${scene.sceneNumber}`],
        projectId, ownerUserId: project.ownerUserId, projectMedia: true,
        projectName,
        timelineTrack: 'Voice',
      });
      count++;
    }

    if (scene.musicSfxStatus === 'ready' && scene.musicSfxPreset) {
      registerExistingLibraryAsset({
        name: `Scene ${scene.sceneNumber}: ${scene.musicSfxPreset} (Music)`,
        category: 'music',
        subcategory: 'Background Score',
        source: 'ai_generated',
        format: 'WAV',
        mimeType: 'audio/wav',
        sizeBytes: 640000,
        url: `/api/cartoon-projects/${projectId}#music-s${scene.sceneNumber}`,
        thumbnail: '/assets/images/cinema_soundstage_set_1794406569758.jpg',
        description: `Background music bed for Scene ${scene.sceneNumber}: ${scene.musicSfxPreset}.`,
        tags: ['Music', scene.musicSfxPreset, `Scene ${scene.sceneNumber}`],
        projectId, ownerUserId: project.ownerUserId, projectMedia: true,
        projectName,
        timelineTrack: 'Music',
      });
      registerExistingLibraryAsset({
        name: `Scene ${scene.sceneNumber}: ${scene.musicSfxPreset} (SFX)`,
        category: 'sfx',
        subcategory: 'Cartoon Sound Effects',
        source: 'ai_generated',
        format: 'WAV',
        mimeType: 'audio/wav',
        sizeBytes: 180000,
        url: `/api/cartoon-projects/${projectId}#sfx-s${scene.sceneNumber}`,
        thumbnail: '/assets/images/cinema_soundstage_set_1794406569758.jpg',
        description: `Foley & sound effects layer for Scene ${scene.sceneNumber}.`,
        tags: ['SFX', scene.musicSfxPreset, `Scene ${scene.sceneNumber}`],
        projectId, ownerUserId: project.ownerUserId, projectMedia: true,
        projectName,
        timelineTrack: 'SFX',
      });
      count += 2;
    }

    if (scene.vfxStatus === 'ready' && scene.vfxPreset) {
      registerExistingLibraryAsset({
        name: `Scene ${scene.sceneNumber}: ${scene.vfxPreset} (VFX)`,
        category: 'vfx',
        subcategory: 'Fire, Smoke & Magic VFX',
        source: 'ai_generated',
        format: 'EXR',
        mimeType: 'image/png',
        sizeBytes: 510000,
        url: `/api/cartoon-projects/${projectId}#vfx-s${scene.sceneNumber}`,
        thumbnail: '/assets/images/cartoon_vfx_explosions_1794980039460.jpg',
        description: `VFX compositing layer (${scene.vfxPreset}) for Scene ${scene.sceneNumber}.`,
        tags: ['VFX', scene.vfxPreset, `Scene ${scene.sceneNumber}`],
        projectId, ownerUserId: project.ownerUserId, projectMedia: true,
        projectName,
        timelineTrack: 'VFX',
      });
      registerExistingLibraryAsset({
        name: `Scene ${scene.sceneNumber}: ${scene.title} (Animation Motion)`,
        category: 'animation',
        subcategory: 'Cartoon Motion Layer',
        source: 'ai_generated',
        format: 'MP4',
        mimeType: 'video/mp4',
        sizeBytes: 920000,
        url: `/api/cartoon-projects/${projectId}#anim-s${scene.sceneNumber}`,
        thumbnail: thumb,
        description: `Character animation & motion layer for Scene ${scene.sceneNumber}.`,
        tags: ['Animation', styleTag, `Scene ${scene.sceneNumber}`],
        projectId, ownerUserId: project.ownerUserId, projectMedia: true,
        projectName,
        timelineTrack: 'Video',
      });
      count += 2;
    }

    if (scene.subtitleStatus === 'ready' && scene.subtitleText) {
      registerExistingLibraryAsset({
        name: `Scene ${scene.sceneNumber}: Subtitles (.SRT)`,
        category: 'subtitle',
        subcategory: 'Synchronized Captions',
        source: 'ai_generated',
        format: 'SRT',
        mimeType: 'text/plain',
        sizeBytes: Math.max(128, scene.subtitleText.length * 4),
        url: `/api/cartoon-projects/${projectId}#sub-s${scene.sceneNumber}`,
        thumbnail: thumb,
        description: scene.subtitleText,
        tags: ['Subtitles', 'SRT', `Scene ${scene.sceneNumber}`],
        projectId, ownerUserId: project.ownerUserId, projectMedia: true,
        projectName,
        timelineTrack: 'Overlay',
      });
      count++;
    }
  }

  // 4. Final verified MP4 render -> Video (Timeline: Video)
  if (project.renderJob?.verified) {
    registerExistingLibraryAsset({
      name: project.renderJob.fileName || `${projectName}.mp4`,
      category: 'video',
      subcategory: 'Rendered Cartoon Film (FFmpeg H.264)',
      source: 'ai_generated',
      format: 'MP4',
      mimeType: 'video/mp4',
      sizeBytes: project.renderJob.fileSizeBytes || 1048576,
      url: `/api/cartoon-projects/${projectId}/download-mp4`,
      thumbnail: project.thumbnailUrl || '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
      description: `Verified final MP4 render from "${projectName}" (${styleTag}, ${project.aspectRatio || '16:9'}).`,
      tags: ['Rendered MP4', 'FFmpeg Verified', styleTag, project.projectType || 'Cartoon Film'],
      projectId, ownerUserId: project.ownerUserId, projectMedia: true,
      projectName,
      timelineTrack: 'Video',
    });
    count++;
  }

  return count;
}

export function deleteUploadedLibraryAsset(id: string): boolean {
  const all = readDb();
  const target = all.find((item) => item.id === id);
  if (!target) return false;

  const remaining = all.filter((item) => item.id !== id);
  writeDb(remaining);

  if (target.url.startsWith('/api/library-uploads/')) {
    const filePath = path.join(UPLOADS_DIR, path.basename(target.url));
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // Ignore cleanup failure
      }
    }
  }
  return true;
}
