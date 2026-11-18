import fs from 'fs';
import path from 'path';
import { registerExistingLibraryAsset } from './mediaLibraryStore.ts';

export interface ManhwaPanelItem {
  id: string;
  panelNumber: number;
  sceneLabel: string;
  imageUrl: string;
  animationStyle: string;
  clipStatus: 'pending' | 'ready';
  dialogueText: string;
  characterName?: string;
  subtitleText: string;
  durationSec: number;
}

export interface ManhwaCharacterProfile {
  id: string;
  name: string;
  imageUrl: string;
  gender: string;
  voiceId: string;
  language: string;
  personality: string;
  expression: string;
}

export interface ManhwaProjectRecord {
  id: string;
  name: string;
  chapterUrl?: string;
  language: string;
  resolution: '720p' | '1080p' | '4K';
  frameRate: 24 | 30 | 60;
  originalPages: string[];
  panels: ManhwaPanelItem[];
  characters: ManhwaCharacterProfile[];
  exportStatus: 'pending' | 'exported';
  exportedVideoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const MANHWA_DB = path.join(DATA_DIR, 'manhwa-projects.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readDb(): ManhwaProjectRecord[] {
  ensureDir();
  if (!fs.existsSync(MANHWA_DB)) {
    fs.writeFileSync(MANHWA_DB, '[]', 'utf8');
    return [];
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(MANHWA_DB, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDb(items: ManhwaProjectRecord[]) {
  ensureDir();
  fs.writeFileSync(MANHWA_DB, JSON.stringify(items, null, 2), 'utf8');
}

export function listManhwaProjects(): ManhwaProjectRecord[] {
  return readDb();
}

export function getManhwaProject(id: string): ManhwaProjectRecord | null {
  return readDb().find((p) => p.id === id) || null;
}

export function createManhwaProject(input: {
  name?: string;
  chapterUrl?: string;
  language?: string;
  resolution?: '720p' | '1080p' | '4K';
  frameRate?: 24 | 30 | 60;
}): ManhwaProjectRecord {
  const all = readDb();
  const now = new Date().toISOString();
  const project: ManhwaProjectRecord = {
    id: `manhwa-${Date.now().toString(36)}`,
    name: String(input.name || `Manhwa Project ${String(all.length + 1).padStart(2, '0')}`).trim(),
    chapterUrl: input.chapterUrl ? String(input.chapterUrl).trim() : undefined,
    language: String(input.language || 'Kannada').trim(),
    resolution: input.resolution || '1080p',
    frameRate: input.frameRate || 24,
    originalPages: [],
    panels: [],
    characters: [],
    exportStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  all.unshift(project);
  writeDb(all);
  return project;
}

export function saveManhwaProject(project: ManhwaProjectRecord): ManhwaProjectRecord {
  const all = readDb();
  const updated = { ...project, updatedAt: new Date().toISOString() };
  const idx = all.findIndex((p) => p.id === updated.id);
  if (idx >= 0) all[idx] = updated;
  else all.unshift(updated);
  writeDb(all);
  return updated;
}

export function registerManhwaAssetToLibrary(params: {
  projectId: string;
  projectName: string;
  category: 'image' | 'character' | 'video' | 'voice' | 'music' | 'sfx' | 'subtitle';
  subcategory: string;
  name: string;
  url: string;
  thumbnail?: string;
  description?: string;
  format?: string;
  timelineTrack?: string;
}) {
  return registerExistingLibraryAsset({
    name: params.name,
    category: params.category,
    subcategory: `Manhwa Projects / ${params.projectName} / ${params.subcategory}`,
    source: 'ai_generated',
    format: params.format || 'PNG',
    mimeType: params.category === 'video' ? 'video/mp4' : params.category === 'voice' ? 'audio/mpeg' : 'image/png',
    url: params.url,
    thumbnail: params.thumbnail || params.url,
    description: params.description || `Manhwa Studio asset from ${params.projectName}`,
    tags: ['Manhwa Studio', params.subcategory, params.projectId],
    projectId: params.projectId,
    projectName: params.projectName,
    timelineTrack: params.timelineTrack,
  });
}
