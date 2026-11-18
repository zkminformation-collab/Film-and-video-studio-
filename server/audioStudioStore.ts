import fs from 'fs';
import path from 'path';
import {
  registerExistingLibraryAsset,
  deleteUploadedLibraryAsset,
} from './mediaLibraryStore.ts';

export type AudioAssetType = 'music' | 'sfx';
export type AudioJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface StudioAudioAssetRecord {
  assetId: string;
  jobId: string;
  projectId?: string;
  projectName?: string;
  assetType: AudioAssetType;
  title: string;
  prompt: string;
  provider: string;
  genreOrCategory: string;
  moodOrIntensity: string;
  instrument?: string;
  tempo?: string;
  loop?: boolean;
  fileName: string;
  filePath: string;
  format: 'mp3' | 'wav';
  mimeType: string;
  durationSec: number;
  sizeBytes: number;
  timelineTrack: 'A2' | 'A3' | 'A4';
  addedToTimeline: boolean;
  libraryAssetId: string;
  license: string;
  generationStatus: AudioJobStatus;
  error?: string;
  createdAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const AUDIO_JOBS_FILE = path.join(DATA_DIR, 'audio-studio-jobs.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'library-uploads');

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function readRecords(): StudioAudioAssetRecord[] {
  ensureDirs();
  if (!fs.existsSync(AUDIO_JOBS_FILE)) {
    fs.writeFileSync(AUDIO_JOBS_FILE, '[]', 'utf8');
    return [];
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(AUDIO_JOBS_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecords(records: StudioAudioAssetRecord[]) {
  ensureDirs();
  fs.writeFileSync(AUDIO_JOBS_FILE, JSON.stringify(records.slice(0, 150), null, 2), 'utf8');
}

export function listAudioStudioLibrary(filters?: {
  assetType?: string;
  projectId?: string;
}): StudioAudioAssetRecord[] {
  const all = readRecords();
  return all.filter((item) => {
    if (filters?.assetType && filters.assetType !== 'all' && item.assetType !== filters.assetType) {
      return false;
    }
    if (filters?.projectId && filters.projectId !== 'all' && item.projectId !== filters.projectId) {
      return false;
    }
    return true;
  });
}

export function getAudioStudioJob(jobId: string): StudioAudioAssetRecord | null {
  return readRecords().find((r) => r.jobId === jobId || r.assetId === jobId) || null;
}

export function markAudioAssetOnTimeline(
  assetId: string,
  track?: 'A2' | 'A3' | 'A4'
): StudioAudioAssetRecord | null {
  const all = readRecords();
  const idx = all.findIndex((r) => r.assetId === assetId || r.jobId === assetId);
  if (idx < 0) return null;
  all[idx] = {
    ...all[idx],
    addedToTimeline: true,
    timelineTrack: track || all[idx].timelineTrack,
  };
  writeRecords(all);
  return all[idx];
}

export function deleteAudioStudioAsset(assetId: string): boolean {
  const all = readRecords();
  const target = all.find((r) => r.assetId === assetId || r.jobId === assetId);
  if (!target) return false;

  const remaining = all.filter((r) => r.assetId !== target.assetId);
  writeRecords(remaining);

  if (target.libraryAssetId) {
    deleteUploadedLibraryAsset(target.libraryAssetId);
  }
  if (target.fileName) {
    const full = path.join(UPLOADS_DIR, path.basename(target.fileName));
    if (fs.existsSync(full)) {
      try {
        fs.unlinkSync(full);
      } catch {
        // Ignore cleanup failure
      }
    }
  }
  return true;
}

/**
 * Clean musical chord / percussive SFX PCM WAV generator used ONLY when STABILITY_API_KEY
 * is not configured in server environment, so users still get real playable/downloadable WAVs.
 */
function buildStudioInstrumentalWav(
  assetType: AudioAssetType,
  durationSec: number,
  seed: number,
  moodOrIntensity: string
): Buffer {
  const sampleRate = 22050;
  const clampedSec = Math.max(2, Math.min(20, Math.round(durationSec)));
  const numSamples = sampleRate * clampedSec;
  const dataBytes = numSamples * 2;
  const buf = Buffer.alloc(44 + dataBytes);

  // WAV RIFF header
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // Mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataBytes, 40);

  const isDark = /scary|suspense|sad|dark/i.test(moodOrIntensity);
  const chords = isDark
    ? [
        [220.0, 261.63, 329.63], // Am
        [174.61, 220.0, 261.63], // F
        [196.0, 246.94, 293.66], // G
        [164.81, 196.0, 246.94], // Em
      ]
    : [
        [261.63, 329.63, 392.0], // C
        [196.0, 246.94, 293.66], // G
        [220.0, 261.63, 329.63], // Am
        [174.61, 220.0, 261.63], // F
      ];

  let rng = (seed % 2147483647) || 12345;
  const nextRand = () => {
    rng = (rng * 48271) % 2147483647;
    return (rng / 2147483647) * 2 - 1;
  };

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const fadeIn = Math.min(1, t / 0.15);
    const fadeOut = Math.min(1, (clampedSec - t) / 0.25);
    let sample = 0;

    if (assetType === 'music') {
      const chordIdx = Math.floor(t / 2) % chords.length;
      const chord = chords[chordIdx];
      const beatPhase = (t * 2) % 1;
      const pluckEnv = Math.exp(-beatPhase * 3.5);
      for (let k = 0; k < chord.length; k++) {
        sample += Math.sin(2 * Math.PI * chord[k] * t) * (0.14 + 0.12 * pluckEnv);
      }
      // Subtle bass root
      sample += Math.sin(2 * Math.PI * (chord[0] * 0.5) * t) * 0.16;
    } else {
      // SFX: clean transient impact + textured filtered decay (no oscillating vocal hum)
      const intensityGain = /powerful/i.test(moodOrIntensity) ? 0.55 : /soft/i.test(moodOrIntensity) ? 0.28 : 0.4;
      const env = Math.exp(-t * (1.8 / Math.max(0.5, clampedSec * 0.35)));
      const noise = nextRand() * 0.45;
      const subBoom = Math.sin(2 * Math.PI * Math.max(42, 110 * Math.exp(-t * 3.2)) * t) * 0.55;
      sample = (noise + subBoom) * env * intensityGain;
    }

    const clamped = Math.max(-0.92, Math.min(0.92, sample * fadeIn * fadeOut));
    buf.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  return buf;
}

export async function generateStudioAudio(input: {
  assetType: AudioAssetType;
  prompt: string;
  title?: string;
  genreOrCategory: string;
  moodOrIntensity: string;
  instrument?: string;
  tempo?: string;
  durationSec: number;
  loop?: boolean;
  projectId?: string;
  projectName?: string;
}): Promise<StudioAudioAssetRecord> {
  ensureDirs();
  const cleanPrompt = String(input.prompt || '').trim();
  if (!cleanPrompt) {
    throw new Error('Audio prompt is required.');
  }

  const durationSec = Math.max(2, Math.min(60, Number(input.durationSec) || (input.assetType === 'music' ? 15 : 4)));
  const jobId = `audjob-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const assetId = `aud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  const fullPrompt =
    input.assetType === 'music'
      ? `${cleanPrompt}. Genre: ${input.genreOrCategory}. Mood: ${input.moodOrIntensity}. Instrument: ${input.instrument || 'Orchestral'}. Tempo: ${input.tempo || 'Medium'}.${input.loop ? ' Seamless loop.' : ''} Instrumental only.`
      : `${cleanPrompt}. Category: ${input.genreOrCategory}. Intensity: ${input.moodOrIntensity}. Clean studio sound effect.`;

  let audioBuffer: Buffer | null = null;
  let format: 'mp3' | 'wav' = 'wav';
  let mimeType = 'audio/wav';
  let provider = 'Studio Procedural Audio Engine (Set STABILITY_API_KEY for Stable Audio)';
  let license = 'ZKMAP Studio Production License';

  const stabilityKey = process.env.STABILITY_API_KEY;
  if (stabilityKey) {
    try {
      const formData = new FormData();
      formData.append('prompt', fullPrompt);
      formData.append('duration', String(durationSec));
      formData.append('output_format', 'mp3');

      const stabRes = await fetch(
        'https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${stabilityKey}`,
            Accept: 'audio/*',
          },
          body: formData,
        }
      );

      if (stabRes.ok) {
        audioBuffer = Buffer.from(await stabRes.arrayBuffer());
        format = 'mp3';
        mimeType = 'audio/mpeg';
        provider = 'Stability AI Stable Audio';
        license = 'Stable Audio Commercial License (Subject to Stability AI Terms)';
      } else {
        console.warn('Stable Audio API non-OK response:', stabRes.status);
      }
    } catch (err) {
      console.warn('Stable Audio API fallback:', err);
    }
  }

  if (!audioBuffer) {
    audioBuffer = buildStudioInstrumentalWav(
      input.assetType,
      Math.min(durationSec, 12),
      Date.now(),
      input.moodOrIntensity
    );
  }

  const safeTitle =
    String(input.title || `${input.genreOrCategory} ${input.assetType === 'music' ? 'Score' : 'SFX'}`)
      .trim()
      .slice(0, 80);
  const fileName = `${assetId}.${format}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, fileName), audioBuffer);
  const filePath = `/api/library-uploads/${fileName}`;

  const libCategory = input.assetType === 'music' ? 'music' : 'sfx';
  const timelineTrack: 'A2' | 'A3' = input.assetType === 'music' ? 'A2' : 'A3';

  const libAsset = registerExistingLibraryAsset({
    name: safeTitle,
    category: libCategory,
    subcategory: `${provider} · ${input.genreOrCategory}`,
    source: 'ai_generated',
    format: format.toUpperCase(),
    mimeType,
    sizeBytes: audioBuffer.length,
    url: filePath,
    thumbnail: '/assets/images/cinema_soundstage_set_1794406569758.jpg',
    description: `${cleanPrompt} (${durationSec}s · ${input.moodOrIntensity})`,
    tags: [
      input.assetType === 'music' ? 'Music' : 'SFX',
      input.genreOrCategory,
      input.moodOrIntensity,
      provider.includes('Stable Audio') ? 'Stable Audio' : 'Studio Audio',
    ],
    projectId: input.projectId,
    projectName: input.projectName,
    timelineTrack: input.assetType === 'music' ? 'Music' : 'SFX',
  });

  const record: StudioAudioAssetRecord = {
    assetId,
    jobId,
    projectId: input.projectId,
    projectName: input.projectName,
    assetType: input.assetType,
    title: safeTitle,
    prompt: cleanPrompt,
    provider,
    genreOrCategory: input.genreOrCategory,
    moodOrIntensity: input.moodOrIntensity,
    instrument: input.instrument,
    tempo: input.tempo,
    loop: Boolean(input.loop),
    fileName,
    filePath,
    format,
    mimeType,
    durationSec,
    sizeBytes: audioBuffer.length,
    timelineTrack,
    addedToTimeline: false,
    libraryAssetId: libAsset.id,
    license,
    generationStatus: 'completed',
    createdAt: new Date().toISOString(),
  };

  const all = readRecords();
  all.unshift(record);
  writeRecords(all);
  return record;
}

export function suggestSceneAudioItems(sceneDescription: string): Array<{
  id: string;
  assetType: AudioAssetType | 'voice';
  track: 'A1' | 'A2' | 'A3' | 'A4';
  label: string;
  prompt: string;
  category: string;
}> {
  const lower = String(sceneDescription || '').toLowerCase();
  const isForest = /forest|jungle|woods|tree|valley|village/.test(lower);
  const isBattle = /fight|battle|clash|sword|explosion|action/.test(lower);

  if (isBattle) {
    return [
      { id: 'sug-1', assetType: 'sfx', track: 'A3', label: 'Impact & Whoosh SFX', prompt: 'Cartoon punch impact and whoosh', category: 'Action' },
      { id: 'sug-2', assetType: 'sfx', track: 'A3', label: 'Cinematic Explosion', prompt: 'Cinematic explosion with a deep impact', category: 'Action' },
      { id: 'sug-3', assetType: 'sfx', track: 'A4', label: 'Wind & Debris Ambience', prompt: 'Dramatic wind gusts and battlefield ambience', category: 'Environment' },
      { id: 'sug-4', assetType: 'music', track: 'A2', label: 'Action Orchestral Score', prompt: 'Suspenseful orchestral action music for an animated battle scene', category: 'Cinematic' },
      { id: 'sug-5', assetType: 'voice', track: 'A1', label: 'Hero Battle Dialogue (ElevenLabs)', prompt: 'Character battle dialogue track on A1', category: 'Voice' },
    ];
  }

  return [
    { id: 'sug-1', assetType: 'sfx', track: 'A4', label: isForest ? 'Forest Ambience' : 'Environment Ambience', prompt: 'Birds, wind and rustling leaves in a peaceful forest', category: 'Nature' },
    { id: 'sug-2', assetType: 'sfx', track: 'A3', label: 'Footsteps SFX', prompt: 'Footsteps on a wooden floor and forest trail', category: 'Cartoon' },
    { id: 'sug-3', assetType: 'sfx', track: 'A3', label: 'Birds Chirping & Breeze', prompt: 'Morning birds chirping with soft breeze', category: 'Nature' },
    { id: 'sug-4', assetType: 'music', track: 'A2', label: 'Cinematic Adventure Music', prompt: 'Cinematic background music for an animated adventure with flute and soft strings', category: 'Cinematic' },
    { id: 'sug-5', assetType: 'voice', track: 'A1', label: 'Character Dialogue (ElevenLabs)', prompt: 'Main character dialogue track on A1', category: 'Voice' },
  ];
}
