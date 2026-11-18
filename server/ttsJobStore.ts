import fs from 'fs';
import path from 'path';
import { registerExistingLibraryAsset } from './mediaLibraryStore.ts';

export type TtsJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface TtsJobRecord {
  id: string;
  projectId?: string;
  projectName?: string;
  characterName: string;
  dialogueText: string;
  voiceId: string;
  voiceName: string;
  languageCode: string;
  emotion: string;
  speed: number;
  pitch: number;
  provider: string;
  status: TtsJobStatus;
  format?: 'mp3' | 'wav';
  mimeType?: string;
  fileName?: string;
  storageUrl?: string;
  durationSec?: number;
  sizeBytes?: number;
  libraryAssetId?: string;
  error?: string;
  explanation?: string;
  suggestedFix?: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const JOBS_FILE = path.join(DATA_DIR, 'tts-jobs.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'library-uploads');

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function readJobs(): TtsJobRecord[] {
  ensureDirs();
  if (!fs.existsSync(JOBS_FILE)) {
    fs.writeFileSync(JOBS_FILE, '[]', 'utf8');
    return [];
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJobs(jobs: TtsJobRecord[]) {
  ensureDirs();
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs.slice(0, 100), null, 2), 'utf8');
}

export function listTtsJobs(projectId?: string): TtsJobRecord[] {
  const all = readJobs();
  if (!projectId || projectId === 'all') return all;
  return all.filter((j) => j.projectId === projectId);
}

export function getTtsJob(jobId: string): TtsJobRecord | null {
  return readJobs().find((j) => j.id === jobId) || null;
}

export function createTtsJob(input: {
  projectId?: string;
  projectName?: string;
  characterName?: string;
  dialogueText: string;
  voiceId: string;
  voiceName: string;
  languageCode: string;
  emotion?: string;
  speed?: number;
  pitch?: number;
  provider?: string;
}): TtsJobRecord {
  const now = new Date().toISOString();
  const job: TtsJobRecord = {
    id: `tts-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    projectId: input.projectId ? String(input.projectId).trim() : undefined,
    projectName: input.projectName ? String(input.projectName).trim() : undefined,
    characterName: String(input.characterName || 'Character').trim().slice(0, 80),
    dialogueText: String(input.dialogueText || '').trim(),
    voiceId: String(input.voiceId || '').trim(),
    voiceName: String(input.voiceName || 'Studio Voice').trim(),
    languageCode: String(input.languageCode || 'kn-IN').trim(),
    emotion: String(input.emotion || 'Calm').trim(),
    speed: Number(input.speed || 1.0),
    pitch: Number(input.pitch || 1.0),
    provider: String(input.provider || 'ElevenLabs').trim(),
    status: 'processing',
    createdAt: now,
    updatedAt: now,
  };
  const all = readJobs();
  all.unshift(job);
  writeJobs(all);
  return job;
}

export function completeTtsJobAndSaveToLibrary(
  jobId: string,
  payload: {
    provider: string;
    voiceName: string;
    audioBuffer: Buffer;
    extension: 'mp3' | 'wav';
    mimeType: string;
  }
): { job: TtsJobRecord; libraryAssetId: string } {
  ensureDirs();
  const all = readJobs();
  const idx = all.findIndex((j) => j.id === jobId);
  if (idx < 0) throw new Error('TTS job not found.');

  const job = all[idx];
  const safeChar = job.characterName.replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 32) || 'Voice';
  const fileName = `${job.id}_${safeChar}.${payload.extension}`;
  const fullPath = path.join(UPLOADS_DIR, fileName);
  fs.writeFileSync(fullPath, payload.audioBuffer);

  const storageUrl = `/api/library-uploads/${fileName}`;
  const estDuration = Math.max(2, Math.round(job.dialogueText.split(/\s+/).length / 2.3));

  const libAsset = registerExistingLibraryAsset({
    name: `${job.characterName} — ${job.dialogueText.slice(0, 42)}${job.dialogueText.length > 42 ? '…' : ''}`,
    category: 'voice',
    subcategory: `${payload.provider} (${job.languageCode})`,
    source: 'ai_generated',
    format: payload.extension.toUpperCase(),
    mimeType: payload.mimeType,
    sizeBytes: payload.audioBuffer.length,
    url: storageUrl,
    thumbnail: '/assets/images/feature_voice_dubbing_1794901010817.jpg',
    description: `[${job.characterName} · ${job.emotion}] ${job.dialogueText}`,
    tags: ['Voice', 'TTS', payload.provider, job.languageCode, job.characterName, job.emotion],
    projectId: job.projectId,
    projectName: job.projectName,
    timelineTrack: 'Voice',
  });

  const updated: TtsJobRecord = {
    ...job,
    provider: payload.provider,
    voiceName: payload.voiceName,
    status: 'completed',
    format: payload.extension,
    mimeType: payload.mimeType,
    fileName,
    storageUrl,
    durationSec: estDuration,
    sizeBytes: payload.audioBuffer.length,
    libraryAssetId: libAsset.id,
    error: undefined,
    explanation: undefined,
    suggestedFix: undefined,
    updatedAt: new Date().toISOString(),
  };

  all[idx] = updated;
  writeJobs(all);
  return { job: updated, libraryAssetId: libAsset.id };
}

export function failTtsJob(
  jobId: string,
  errorInfo: { error: string; explanation: string; suggestedFix: string }
): TtsJobRecord | null {
  const all = readJobs();
  const idx = all.findIndex((j) => j.id === jobId);
  if (idx < 0) return null;

  all[idx] = {
    ...all[idx],
    status: 'failed',
    error: errorInfo.error,
    explanation: errorInfo.explanation,
    suggestedFix: errorInfo.suggestedFix,
    updatedAt: new Date().toISOString(),
  };
  writeJobs(all);
  return all[idx];
}

export function getTtsJobAudioFile(jobId: string): { filePath: string; fileName: string; mimeType: string } | null {
  const job = getTtsJob(jobId);
  if (!job || job.status !== 'completed' || !job.fileName) return null;
  const fullPath = path.join(UPLOADS_DIR, path.basename(job.fileName));
  if (!fs.existsSync(fullPath)) return null;
  return {
    filePath: fullPath,
    fileName: job.fileName,
    mimeType: job.mimeType || 'audio/mpeg',
  };
}
