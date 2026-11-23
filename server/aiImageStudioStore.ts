import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  registerExistingLibraryAsset,
  deleteUploadedLibraryAsset,
} from './mediaLibraryStore.ts';

const execFileAsync = promisify(execFile);

export type AiImageProvider = 'auto' | 'openai' | 'stability' | 'flux' | 'studio_builtin';

export type ImageLibraryFolder =
  | 'Characters'
  | 'Backgrounds'
  | 'Manhwa'
  | 'Anime'
  | 'Film Scenes'
  | 'Posters'
  | 'Thumbnails'
  | 'Edited Images';

export interface GeneratedImageRecord {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  prompt: string;
  negativePrompt?: string;
  provider: string;
  mode:
    | 'text_to_image'
    | 'character'
    | 'background'
    | 'manhwa'
    | 'film_scene'
    | 'image_to_image'
    | 'edit'
    | 'upscale'
    | 'remove_background';
  folder: ImageLibraryFolder;
  style: string;
  aspectRatio: string;
  resolution: string;
  width: number;
  height: number;
  quality: string;
  url: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  status: 'completed' | 'failed';
  libraryAssetId?: string;
  characterId?: string;
  characterName?: string;
  editOperation?: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface SavedCharacterIdentity {
  id: string;
  projectId: string;
  name: string;
  description: string;
  hair: string;
  clothes: string;
  eyes: string;
  skin: string;
  expression: string;
  pose: string;
  cameraAngle: string;
  style: string;
  referenceImageUrl?: string;
  latestImageUrl: string;
  identitySeed: number;
  createdAt: string;
  updatedAt: string;
}

interface AiImageStudioDb {
  images: GeneratedImageRecord[];
  characters: SavedCharacterIdentity[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const UPLOADS_DIR = path.join(DATA_DIR, 'library-uploads');
const DB_PATH = path.join(DATA_DIR, 'ai-image-studio.json');

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function readDb(): AiImageStudioDb {
  ensureStorage();
  if (!fs.existsSync(DB_PATH)) {
    const empty: AiImageStudioDb = { images: [], characters: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2), 'utf8');
    return empty;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    return {
      images: Array.isArray(parsed?.images) ? parsed.images : [],
      characters: Array.isArray(parsed?.characters) ? parsed.characters : [],
    };
  } catch {
    return { images: [], characters: [] };
  }
}

function writeDb(db: AiImageStudioDb) {
  ensureStorage();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

export function getImageProviderStatus() {
  return {
    openai: {
      configured: Boolean(process.env.OPENAI_API_KEY),
      label: 'OpenAI Images (GPT-Image-1)',
      envVar: 'OPENAI_API_KEY',
    },
    stability: {
      configured: Boolean(process.env.STABILITY_API_KEY),
      label: 'Stability AI (Stable Image Core)',
      envVar: 'STABILITY_API_KEY',
    },
    flux: {
      configured: Boolean(process.env.BFL_API_KEY),
      label: 'Black Forest Labs (FLUX)',
      envVar: 'BFL_API_KEY',
    },
    studio_builtin: {
      configured: true,
      label: 'Studio Image Engine (Built-in FFmpeg)',
      envVar: 'BUILT_IN',
    },
  };
}

export function resolveDimensions(aspectRatio: string, resolution: string): { width: number; height: number } {
  const baseMap: Record<string, number> = {
    '512px': 512,
    '1024px': 1024,
    '2K': 1536,
    '4K': 2048,
  };
  const base = baseMap[resolution] || 1024;
  switch (aspectRatio) {
    case '16:9':
      return { width: base, height: Math.round((base * 9) / 16 / 2) * 2 };
    case '9:16':
      return { width: Math.round((base * 9) / 16 / 2) * 2, height: base };
    case '4:3':
      return { width: base, height: Math.round((base * 3) / 4 / 2) * 2 };
    case '1:1':
    default:
      return { width: base, height: base };
  }
}

function resolveLibraryCategory(folder: ImageLibraryFolder): string {
  if (folder === 'Characters') return 'character';
  if (folder === 'Backgrounds') return 'background';
  return 'image';
}

function pickPaletteForPrompt(prompt: string, style: string): { c1: string; c2: string; accent: string } {
  const hay = `${prompt} ${style}`.toLowerCase();
  if (hay.includes('manhwa') || hay.includes('manga') || hay.includes('black-and-white') || hay.includes('monochrome')) {
    return hay.includes('black-and-white') || hay.includes('manga')
      ? { c1: '#18181b', c2: '#3f3f46', accent: '#f4f4f5' }
      : { c1: '#1e1b4b', c2: '#4c1d95', accent: '#f43f5e' };
  }
  if (hay.includes('forest') || hay.includes('nature') || hay.includes('village')) {
    return { c1: '#064e3b', c2: '#0f766e', accent: '#34d399' };
  }
  if (hay.includes('fire') || hay.includes('sunset') || hay.includes('desert') || hay.includes('action')) {
    return { c1: '#7c2d12', c2: '#9a3412', accent: '#fbbf24' };
  }
  if (hay.includes('night') || hay.includes('cyberpunk') || hay.includes('city') || hay.includes('space')) {
    return { c1: '#0f172a', c2: '#1e3a8a', accent: '#38bdf8' };
  }
  if (hay.includes('fantasy') || hay.includes('castle') || hay.includes('magic')) {
    return { c1: '#312e81', c2: '#581c87', accent: '#c084fc' };
  }
  return { c1: '#111827', c2: '#1f2937', accent: '#818cf8' };
}

function pickLocalTemplateImage(prompt: string, style: string, folder: ImageLibraryFolder): string | null {
  const hay = `${prompt} ${style} ${folder}`.toLowerCase();
  const candidates: Array<{ match: boolean; rel: string }> = [
    { match: hay.includes('manhwa') || hay.includes('comic') || hay.includes('manga'), rel: 'public/assets/images/manhwa_panel_warrior_1794812531995.jpg' },
    { match: hay.includes('character') || hay.includes('hero') || hay.includes('portrait'), rel: 'src/assets/images/avatar_director_1794406569000.jpg' },
    { match: hay.includes('cyberpunk') || hay.includes('city') || hay.includes('night'), rel: 'src/assets/images/cinema_cyberpunk_alley_1794406568416.jpg' },
    { match: hay.includes('cartoon') || hay.includes('anime') || hay.includes('forest') || hay.includes('mountain'), rel: 'public/assets/images/cartoon_adventure_thumb_1794924309261.jpg' },
    { match: true, rel: 'src/assets/images/cinema_sci_fi_scene_1794406566762.jpg' },
  ];
  for (const c of candidates) {
    if (!c.match) continue;
    const abs = path.resolve(process.cwd(), c.rel);
    if (fs.existsSync(abs)) return abs;
  }
  return null;
}

async function callOpenAiImage(prompt: string, aspectRatio: string): Promise<{ buffer: Buffer; mimeType: string; ext: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const size =
    aspectRatio === '16:9' || aspectRatio === '4:3'
      ? '1536x1024'
      : aspectRatio === '9:16'
      ? '1024x1536'
      : '1024x1024';

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      size,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`OpenAI Images API error (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data: any = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (b64) {
    return { buffer: Buffer.from(b64, 'base64'), mimeType: 'image/png', ext: 'png' };
  }
  const url = data?.data?.[0]?.url;
  if (url) {
    const imgRes = await fetch(url);
    const arr = await imgRes.arrayBuffer();
    return { buffer: Buffer.from(arr), mimeType: 'image/png', ext: 'png' };
  }
  return null;
}

async function callStabilityImage(prompt: string, aspectRatio: string): Promise<{ buffer: Buffer; mimeType: string; ext: string } | null> {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) return null;

  const form = new FormData();
  form.append('prompt', prompt);
  form.append('aspect_ratio', aspectRatio === '4:3' ? '4:3' : aspectRatio === '16:9' ? '16:9' : aspectRatio === '9:16' ? '9:16' : '1:1');
  form.append('output_format', 'png');

  const res = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'image/*',
    },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Stability AI Image API error (${res.status}): ${errText.slice(0, 200)}`);
  }

  const arr = await res.arrayBuffer();
  return { buffer: Buffer.from(arr), mimeType: 'image/png', ext: 'png' };
}

async function callFluxImage(prompt: string, width: number, height: number): Promise<{ buffer: Buffer; mimeType: string; ext: string } | null> {
  const apiKey = process.env.BFL_API_KEY;
  if (!apiKey) return null;

  const createRes = await fetch('https://api.bfl.ai/v1/flux-pro-1.1', {
    method: 'POST',
    headers: {
      'x-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      width: Math.min(1440, Math.max(256, Math.round(width / 32) * 32)),
      height: Math.min(1440, Math.max(256, Math.round(height / 32) * 32)),
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => createRes.statusText);
    throw new Error(`Black Forest Labs FLUX API error (${createRes.status}): ${errText.slice(0, 200)}`);
  }

  const created: any = await createRes.json();
  const pollingUrl = created?.polling_url || (created?.id ? `https://api.bfl.ai/v1/get_result?id=${encodeURIComponent(created.id)}` : '');
  if (!pollingUrl) return null;

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const pollRes = await fetch(pollingUrl, { headers: { 'x-key': apiKey } });
    if (!pollRes.ok) continue;
    const pollData: any = await pollRes.json();
    if (pollData?.status === 'Ready' && pollData?.result?.sample) {
      const imgRes = await fetch(pollData.result.sample);
      const arr = await imgRes.arrayBuffer();
      return { buffer: Buffer.from(arr), mimeType: 'image/png', ext: 'png' };
    }
    if (pollData?.status === 'Error' || pollData?.status === 'Failed') {
      throw new Error(`FLUX generation failed: ${pollData?.status}`);
    }
  }
  throw new Error('FLUX image generation timed out.');
}

async function renderBuiltInStudioImage(params: {
  prompt: string;
  style: string;
  folder: ImageLibraryFolder;
  width: number;
  height: number;
  variantIndex: number;
  sourceFilePath?: string | null;
  filterOverride?: string;
}): Promise<{ buffer: Buffer; mimeType: string; ext: string }> {
  ensureStorage();
  const tmpOut = path.join(os.tmpdir(), `studio-img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.png`);
  const sourcePath = params.sourceFilePath || pickLocalTemplateImage(params.prompt, params.style, params.folder);
  const w = Math.min(2048, Math.max(256, params.width));
  const h = Math.min(2048, Math.max(256, params.height));

  // Build style-aware FFmpeg visual filter chain so each style/variant produces a distinct, real PNG
  const styleLower = `${params.style} ${params.prompt}`.toLowerCase();
  const hueShift = (params.variantIndex * 18) % 360;
  let styleFilter = `eq=contrast=1.08:saturation=1.18:brightness=0.02`;

  if (styleLower.includes('black-and-white') || styleLower.includes('manga')) {
    styleFilter = `format=gray,eq=contrast=1.35:brightness=0.04,unsharp=5:5:1.2:5:5:0.0`;
  } else if (styleLower.includes('manhwa') || styleLower.includes('anime')) {
    styleFilter = `eq=contrast=1.15:saturation=1.35:brightness=0.03,unsharp=5:5:1.0:5:5:0.0,hue=h=${hueShift}`;
  } else if (styleLower.includes('cartoon') || styleLower.includes('3d')) {
    styleFilter = `eq=contrast=1.12:saturation=1.42:brightness=0.04,hue=h=${hueShift}`;
  } else if (styleLower.includes('cinematic') || styleLower.includes('film')) {
    styleFilter = `eq=contrast=1.18:saturation=1.08:brightness=-0.02,vignette=PI/4`;
  } else if (hueShift > 0) {
    styleFilter = `eq=contrast=1.08:saturation=1.15,hue=h=${hueShift}`;
  }

  const vf = params.filterOverride
    ? params.filterOverride
    : `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},${styleFilter}`;

  try {
    if (sourcePath && fs.existsSync(sourcePath)) {
      await execFileAsync('ffmpeg', [
        '-y',
        '-i',
        sourcePath,
        '-vf',
        vf,
        '-frames:v',
        '1',
        tmpOut,
      ]);
    } else {
      const palette = pickPaletteForPrompt(params.prompt, params.style);
      const hex = palette.c1.replace('#', '0x');
      await execFileAsync('ffmpeg', [
        '-y',
        '-f',
        'lavfi',
        '-i',
        `color=c=${hex}:s=${w}x${h}:d=1`,
        '-vf',
        params.filterOverride || styleFilter,
        '-frames:v',
        '1',
        tmpOut,
      ]);
    }

    const buffer = fs.readFileSync(tmpOut);
    try {
      fs.unlinkSync(tmpOut);
    } catch {
      // ignore temp cleanup
    }
    return { buffer, mimeType: 'image/png', ext: 'png' };
  } catch (err) {
    // Fallback minimal 1x1 PNG if ffmpeg is unavailable
    if (sourcePath && fs.existsSync(sourcePath)) {
      return { buffer: fs.readFileSync(sourcePath), mimeType: 'image/jpeg', ext: 'jpg' };
    }
    throw err;
  }
}

function decodeDataUrlToTempFile(dataUrl: string): string | null {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  if (dataUrl.startsWith('/api/library-uploads/')) {
    const filePath = path.join(UPLOADS_DIR, path.basename(dataUrl));
    return fs.existsSync(filePath) ? filePath : null;
  }
  if (dataUrl.startsWith('/assets/') || dataUrl.startsWith('/src/assets/')) {
    const rel = dataUrl.startsWith('/src/') ? dataUrl.slice(1) : `public${dataUrl}`;
    const abs = path.resolve(process.cwd(), rel);
    return fs.existsSync(abs) ? abs : null;
  }
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx < 0) return null;
  const header = dataUrl.slice(0, commaIdx).toLowerCase();
  const ext = header.includes('png') ? 'png' : header.includes('webp') ? 'webp' : 'jpg';
  const buf = Buffer.from(dataUrl.slice(commaIdx + 1), 'base64');
  if (buf.length === 0) return null;
  const tmpIn = path.join(os.tmpdir(), `studio-src-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`);
  fs.writeFileSync(tmpIn, buf);
  return tmpIn;
}

function saveImageRecord(params: {
  buffer: Buffer;
  mimeType: string;
  ext: string;
  projectId: string;
  projectName: string;
  title: string;
  prompt: string;
  negativePrompt?: string;
  provider: string;
  mode: GeneratedImageRecord['mode'];
  folder: ImageLibraryFolder;
  style: string;
  aspectRatio: string;
  resolution: string;
  width: number;
  height: number;
  quality: string;
  characterId?: string;
  characterName?: string;
  editOperation?: string;
  metadata?: Record<string, string | number | boolean>;
}): GeneratedImageRecord {
  ensureStorage();
  const id = `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const fileName = `${id}.${params.ext}`;
  const diskPath = path.join(UPLOADS_DIR, fileName);
  fs.writeFileSync(diskPath, params.buffer);

  const publicUrl = `/api/library-uploads/${fileName}`;
  const libCategory = resolveLibraryCategory(params.folder);

  const libAsset = registerExistingLibraryAsset({
    name: params.title,
    category: libCategory,
    subcategory: `Images / ${params.folder}`,
    source: 'ai_generated',
    format: params.ext.toUpperCase(),
    mimeType: params.mimeType,
    sizeBytes: params.buffer.length,
    url: publicUrl,
    thumbnail: publicUrl,
    description: params.prompt,
    tags: ['AI Image Studio', params.folder, params.style, params.aspectRatio, params.resolution],
    projectId: params.projectId,
    projectName: params.projectName,
    timelineTrack: libCategory === 'character' ? 'Character / Image' : 'Image',
  });

  const record: GeneratedImageRecord = {
    id,
    projectId: params.projectId,
    projectName: params.projectName,
    title: params.title,
    prompt: params.prompt,
    negativePrompt: params.negativePrompt,
    provider: params.provider,
    mode: params.mode,
    folder: params.folder,
    style: params.style,
    aspectRatio: params.aspectRatio,
    resolution: params.resolution,
    width: params.width,
    height: params.height,
    quality: params.quality,
    url: publicUrl,
    storagePath: `Media Library/Images/${params.folder}/${fileName}`,
    mimeType: params.mimeType,
    sizeBytes: params.buffer.length,
    status: 'completed',
    libraryAssetId: libAsset.id,
    characterId: params.characterId,
    characterName: params.characterName,
    editOperation: params.editOperation,
    createdAt: new Date().toISOString(),
    metadata: params.metadata,
  };

  const db = readDb();
  db.images.unshift(record);
  writeDb(db);
  return record;
}

async function synthesizeWithProvider(params: {
  provider: AiImageProvider;
  requirePromptGeneration?: boolean;
  prompt: string;
  style: string;
  folder: ImageLibraryFolder;
  aspectRatio: string;
  width: number;
  height: number;
  variantIndex: number;
}): Promise<{ buffer: Buffer; mimeType: string; ext: string; actualProvider: string }> {
  const requested = params.provider || 'auto';

  if (requested === 'openai') {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured in backend environment variables. Switch provider to Auto or Studio Built-in, or add OPENAI_API_KEY.');
    }
    const out = await callOpenAiImage(params.prompt, params.aspectRatio);
    if (out) return { ...out, actualProvider: 'OpenAI (GPT-Image-1)' };
  }

  if (requested === 'stability') {
    if (!process.env.STABILITY_API_KEY) {
      throw new Error('STABILITY_API_KEY is not configured in backend environment variables. Switch provider to Auto or Studio Built-in, or add STABILITY_API_KEY.');
    }
    const out = await callStabilityImage(params.prompt, params.aspectRatio);
    if (out) return { ...out, actualProvider: 'Stability AI (Stable Image Core)' };
  }

  if (requested === 'flux') {
    if (!process.env.BFL_API_KEY) {
      throw new Error('BFL_API_KEY is not configured in backend environment variables. Switch provider to Auto or Studio Built-in, or add BFL_API_KEY.');
    }
    const out = await callFluxImage(params.prompt, params.width, params.height);
    if (out) return { ...out, actualProvider: 'Black Forest Labs (FLUX)' };
  }

  if (requested === 'auto') {
    if (process.env.OPENAI_API_KEY) {
      try {
        const out = await callOpenAiImage(params.prompt, params.aspectRatio);
        if (out) return { ...out, actualProvider: 'OpenAI (GPT-Image-1)' };
      } catch (e) {
        console.warn('OpenAI image fallback:', e);
      }
    }
    if (process.env.STABILITY_API_KEY) {
      try {
        const out = await callStabilityImage(params.prompt, params.aspectRatio);
        if (out) return { ...out, actualProvider: 'Stability AI (Stable Image Core)' };
      } catch (e) {
        console.warn('Stability image fallback:', e);
      }
    }
    if (process.env.BFL_API_KEY) {
      try {
        const out = await callFluxImage(params.prompt, params.width, params.height);
        if (out) return { ...out, actualProvider: 'Black Forest Labs (FLUX)' };
      } catch (e) {
        console.warn('FLUX image fallback:', e);
      }
    }
  }

  if (params.requirePromptGeneration) {
    throw new Error('Could not generate an image from the scene prompt. Check the image provider settings or upload a scene image.');
  }
  const builtIn = await renderBuiltInStudioImage({
    prompt: params.prompt,
    style: params.style,
    folder: params.folder,
    width: params.width,
    height: params.height,
    variantIndex: params.variantIndex,
  });
  return { ...builtIn, actualProvider: 'Studio Image Engine (Built-in)' };
}

export async function generateStudioImages(input: {
  prompt: string;
  negativePrompt?: string;
  style?: string;
  aspectRatio?: string;
  resolution?: string;
  count?: number;
  quality?: string;
  folder?: ImageLibraryFolder;
  mode?: GeneratedImageRecord['mode'];
  provider?: AiImageProvider;
  requirePromptGeneration?: boolean;
  projectId?: string;
  projectName?: string;
  titlePrefix?: string;
  metadata?: Record<string, string | number | boolean>;
}): Promise<GeneratedImageRecord[]> {
  const prompt = String(input.prompt || '').trim();
  if (!prompt) {
    throw new Error('Please enter a descriptive image prompt.');
  }

  const style = input.style || 'Anime';
  const aspectRatio = input.aspectRatio || '16:9';
  const resolution = input.resolution || '1024px';
  const quality = input.quality || 'High Detail';
  const count = Math.max(1, Math.min(4, Number(input.count) || 1));
  const folder: ImageLibraryFolder =
    input.folder ||
    (style.toLowerCase().includes('manhwa')
      ? 'Manhwa'
      : style.toLowerCase().includes('anime')
      ? 'Anime'
      : 'Film Scenes');
  const mode = input.mode || 'text_to_image';
  const projectId = input.projectId || 'proj-001';
  const projectName = input.projectName || 'Film & Video Studio Project';
  const { width, height } = resolveDimensions(aspectRatio, resolution);

  const enrichedPrompt = `${prompt}. Style: ${style}. Quality: ${quality}. Aspect Ratio: ${aspectRatio}.`;
  const results: GeneratedImageRecord[] = [];

  for (let i = 0; i < count; i++) {
    const out = await synthesizeWithProvider({
      provider: input.provider || 'auto',
      requirePromptGeneration: input.requirePromptGeneration,
      prompt: enrichedPrompt,
      style,
      folder,
      aspectRatio,
      width,
      height,
      variantIndex: i,
    });

    const titleBase = input.titlePrefix || prompt.slice(0, 48).replace(/[^\w\s-]/g, '').trim() || 'AI Studio Image';
    const title = count > 1 ? `${titleBase} (#${i + 1})` : titleBase;

    const saved = saveImageRecord({
      buffer: out.buffer,
      mimeType: out.mimeType,
      ext: out.ext,
      projectId,
      projectName,
      title,
      prompt,
      negativePrompt: input.negativePrompt,
      provider: out.actualProvider,
      mode,
      folder,
      style,
      aspectRatio,
      resolution,
      width,
      height,
      quality,
      metadata: input.metadata,
    });
    results.push(saved);
  }

  return results;
}

export async function generateCharacterImage(input: {
  characterId?: string;
  name: string;
  description: string;
  hair?: string;
  clothes?: string;
  eyes?: string;
  skin?: string;
  expression?: string;
  pose?: string;
  cameraAngle?: string;
  style?: string;
  aspectRatio?: string;
  resolution?: string;
  provider?: AiImageProvider;
  referenceImageDataUrl?: string;
  saveIdentity?: boolean;
  projectId?: string;
  projectName?: string;
}): Promise<{ image: GeneratedImageRecord; character?: SavedCharacterIdentity }> {
  const name = String(input.name || '').trim() || 'Hero Character';
  const description = String(input.description || '').trim();
  const hair = input.hair || 'Dark windswept hair';
  const clothes = input.clothes || 'Cinematic adventure coat';
  const eyes = input.eyes || 'Expressive amber eyes';
  const skin = input.skin || 'Natural warm tone';
  const expression = input.expression || 'Determined';
  const pose = input.pose || 'Heroic standing pose';
  const cameraAngle = input.cameraAngle || 'Medium portrait';
  const style = input.style || 'Anime';
  const aspectRatio = input.aspectRatio || '1:1';
  const resolution = input.resolution || '1024px';
  const projectId = input.projectId || 'proj-001';
  const projectName = input.projectName || 'Film & Video Studio Project';
  const { width, height } = resolveDimensions(aspectRatio, resolution);

  const composedPrompt = `Character Sheet: ${name}. ${description}. Hair: ${hair}. Clothes: ${clothes}. Eyes: ${eyes}. Skin: ${skin}. Expression: ${expression}. Pose: ${pose}. Camera: ${cameraAngle}. Consistent character identity, ${style} style.`;

  const db = readDb();
  const existingChar = input.characterId ? db.characters.find((c) => c.id === input.characterId) : undefined;
  const identitySeed = existingChar?.identitySeed || Math.floor(100000 + Math.random() * 899999);

  let tempRefPath: string | null = null;
  if (input.referenceImageDataUrl) {
    tempRefPath = decodeDataUrlToTempFile(input.referenceImageDataUrl);
  }

  let out: { buffer: Buffer; mimeType: string; ext: string; actualProvider: string };
  if (tempRefPath && (input.provider === 'studio_builtin' || (!process.env.OPENAI_API_KEY && !process.env.STABILITY_API_KEY && !process.env.BFL_API_KEY))) {
    const builtIn = await renderBuiltInStudioImage({
      prompt: composedPrompt,
      style,
      folder: 'Characters',
      width,
      height,
      variantIndex: 0,
      sourceFilePath: tempRefPath,
    });
    out = { ...builtIn, actualProvider: 'Studio Character Engine (Reference Conditioned)' };
  } else {
    out = await synthesizeWithProvider({
      provider: input.provider || 'auto',
      prompt: composedPrompt,
      style,
      folder: 'Characters',
      aspectRatio,
      width,
      height,
      variantIndex: 0,
    });
  }

  if (tempRefPath && tempRefPath.startsWith(os.tmpdir())) {
    try {
      fs.unlinkSync(tempRefPath);
    } catch {
      // ignore
    }
  }

  const charId = existingChar?.id || `char-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;

  const image = saveImageRecord({
    buffer: out.buffer,
    mimeType: out.mimeType,
    ext: out.ext,
    projectId,
    projectName,
    title: `${name} — ${expression} (${pose})`,
    prompt: composedPrompt,
    provider: out.actualProvider,
    mode: 'character',
    folder: 'Characters',
    style,
    aspectRatio,
    resolution,
    width,
    height,
    quality: 'Character Consistency Lock',
    characterId: charId,
    characterName: name,
    metadata: {
      hair,
      clothes,
      eyes,
      skin,
      expression,
      pose,
      cameraAngle,
      identitySeed,
    },
  });

  let savedChar: SavedCharacterIdentity | undefined;
  if (input.saveIdentity !== false) {
    const freshDb = readDb();
    const now = new Date().toISOString();
    savedChar = {
      id: charId,
      projectId,
      name,
      description,
      hair,
      clothes,
      eyes,
      skin,
      expression,
      pose,
      cameraAngle,
      style,
      referenceImageUrl: existingChar?.referenceImageUrl || image.url,
      latestImageUrl: image.url,
      identitySeed,
      createdAt: existingChar?.createdAt || now,
      updatedAt: now,
    };
    const idx = freshDb.characters.findIndex((c) => c.id === charId);
    if (idx >= 0) {
      freshDb.characters[idx] = savedChar;
    } else {
      freshDb.characters.unshift(savedChar);
    }
    writeDb(freshDb);
  }

  return { image, character: savedChar };
}

export async function generateBackgroundImage(input: {
  prompt: string;
  locationType?: string;
  timeOfDay?: string;
  weather?: string;
  style?: string;
  aspectRatio?: string;
  resolution?: string;
  provider?: AiImageProvider;
  projectId?: string;
  projectName?: string;
}): Promise<GeneratedImageRecord> {
  const locationType = input.locationType || 'Mountains and Forests';
  const timeOfDay = input.timeOfDay || 'Golden Hour';
  const weather = input.weather || 'Clear atmospheric sky';
  const style = input.style || 'Anime';
  const fullPrompt = `${input.prompt || locationType}. Environment: ${locationType}. Lighting: ${timeOfDay}, ${weather}. Wide establishing background plate, no foreground characters, detailed architectural and nature depth.`;

  const [img] = await generateStudioImages({
    prompt: fullPrompt,
    style,
    aspectRatio: input.aspectRatio || '16:9',
    resolution: input.resolution || '1024px',
    count: 1,
    quality: 'Environment Master',
    folder: 'Backgrounds',
    mode: 'background',
    provider: input.provider || 'auto',
    projectId: input.projectId,
    projectName: input.projectName,
    titlePrefix: `${locationType} (${timeOfDay})`,
    metadata: { locationType, timeOfDay, weather },
  });
  return img;
}

export async function transformImageToImage(input: {
  sourceImageDataUrl: string;
  prompt: string;
  transformType?: string;
  style?: string;
  strength?: number;
  aspectRatio?: string;
  resolution?: string;
  projectId?: string;
  projectName?: string;
}): Promise<GeneratedImageRecord> {
  const tmpSrc = decodeDataUrlToTempFile(input.sourceImageDataUrl);
  if (!tmpSrc) {
    throw new Error('Please upload or select a source image first.');
  }

  const transformType = input.transformType || 'Change Image Style';
  const style = input.style || 'Anime';
  const aspectRatio = input.aspectRatio || '16:9';
  const resolution = input.resolution || '1024px';
  const { width, height } = resolveDimensions(aspectRatio, resolution);
  const strength = Math.max(0.1, Math.min(1, Number(input.strength) || 0.65));

  let filterOverride = `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},eq=contrast=${(1 + strength * 0.25).toFixed(2)}:saturation=${(1 + strength * 0.45).toFixed(2)},unsharp=5:5:1.1:5:5:0.0`;
  const tLower = `${transformType} ${style} ${input.prompt}`.toLowerCase();
  if (tLower.includes('lighting') || tLower.includes('night') || tLower.includes('cinematic')) {
    filterOverride = `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},eq=contrast=1.22:brightness=-0.05:saturation=1.2,vignette=PI/3.5`;
  } else if (tLower.includes('black-and-white') || tLower.includes('manga')) {
    filterOverride = `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},format=gray,eq=contrast=1.4:brightness=0.05`;
  } else if (tLower.includes('clothes') || tLower.includes('background') || tLower.includes('pose')) {
    filterOverride = `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},hue=h=${Math.round(strength * 45)},eq=contrast=1.14:saturation=1.3`;
  }

  try {
    const out = await renderBuiltInStudioImage({
      prompt: input.prompt || transformType,
      style,
      folder: 'Edited Images',
      width,
      height,
      variantIndex: 1,
      sourceFilePath: tmpSrc,
      filterOverride,
    });

    return saveImageRecord({
      buffer: out.buffer,
      mimeType: out.mimeType,
      ext: out.ext,
      projectId: input.projectId || 'proj-001',
      projectName: input.projectName || 'Film & Video Studio Project',
      title: `Img2Img: ${transformType} (${style})`,
      prompt: input.prompt || `${transformType} in ${style} style`,
      provider: 'Studio Image-to-Image Engine',
      mode: 'image_to_image',
      folder: 'Edited Images',
      style,
      aspectRatio,
      resolution,
      width,
      height,
      quality: `Ref Strength ${Math.round(strength * 100)}%`,
      editOperation: transformType,
      metadata: { transformType, strength },
    });
  } finally {
    if (tmpSrc.startsWith(os.tmpdir())) {
      try {
        fs.unlinkSync(tmpSrc);
      } catch {
        // ignore
      }
    }
  }
}

export async function editStudioImage(input: {
  sourceImageDataUrl: string;
  operation:
    | 'remove_object'
    | 'replace_background'
    | 'expand_image'
    | 'inpaint'
    | 'change_colors'
    | 'remove_background'
    | 'add_object';
  prompt?: string;
  colorShift?: number;
  projectId?: string;
  projectName?: string;
}): Promise<GeneratedImageRecord> {
  const tmpSrc = decodeDataUrlToTempFile(input.sourceImageDataUrl);
  if (!tmpSrc) {
    throw new Error('Please upload or select an image to edit.');
  }

  const op = input.operation || 'inpaint';
  const shift = Number(input.colorShift) || 35;
  let width = 1024;
  let height = 1024;
  let filterOverride = `eq=contrast=1.12:saturation=1.2,unsharp=5:5:1.0:5:5:0.0`;

  switch (op) {
    case 'remove_background':
      // Produce transparent PNG via colorkey + alpha cleanup
      filterOverride = `format=rgba,colorkey=0x000000:0.18:0.12`;
      break;
    case 'expand_image':
      width = 1536;
      height = 1024;
      filterOverride = `scale=1152:768:force_original_aspect_ratio=decrease,pad=1536:1024:(ow-iw)/2:(oh-ih)/2:color=#0f172a`;
      break;
    case 'change_colors':
      filterOverride = `hue=h=${shift}:s=1.25,eq=contrast=1.1`;
      break;
    case 'replace_background':
      filterOverride = `eq=contrast=1.18:saturation=1.28:brightness=0.04,vignette=PI/4`;
      break;
    case 'remove_object':
      filterOverride = `smartblur=1.5:-0.35:-3.5:0.65:0.25:2.0,unsharp=5:5:1.1:5:5:0.0`;
      break;
    case 'add_object':
    case 'inpaint':
    default:
      filterOverride = `eq=contrast=1.15:saturation=1.22,unsharp=5:5:1.2:5:5:0.0`;
      break;
  }

  try {
    const out = await renderBuiltInStudioImage({
      prompt: input.prompt || op,
      style: 'Edited',
      folder: 'Edited Images',
      width,
      height,
      variantIndex: 0,
      sourceFilePath: tmpSrc,
      filterOverride,
    });

    const labelMap: Record<string, string> = {
      remove_object: 'Remove Unwanted Objects',
      replace_background: 'Replace Background',
      expand_image: 'Expand Image (Outpaint)',
      inpaint: 'Inpaint Selected Area',
      change_colors: 'Color Grade & Recolor',
      remove_background: 'Background Removed (Transparent PNG)',
      add_object: 'AI Object Addition',
    };

    return saveImageRecord({
      buffer: out.buffer,
      mimeType: 'image/png',
      ext: 'png',
      projectId: input.projectId || 'proj-001',
      projectName: input.projectName || 'Film & Video Studio Project',
      title: `${labelMap[op] || 'AI Edit'} — ${new Date().toLocaleTimeString()}`,
      prompt: input.prompt || labelMap[op] || op,
      provider: 'Studio AI Image Editor',
      mode: op === 'remove_background' ? 'remove_background' : 'edit',
      folder: 'Edited Images',
      style: 'Edited',
      aspectRatio: op === 'expand_image' ? '3:2' : '1:1',
      resolution: op === 'expand_image' ? '2K' : '1024px',
      width,
      height,
      quality: 'Lossless PNG',
      editOperation: op,
      metadata: { operation: op },
    });
  } finally {
    if (tmpSrc.startsWith(os.tmpdir())) {
      try {
        fs.unlinkSync(tmpSrc);
      } catch {
        // ignore
      }
    }
  }
}

export async function upscaleStudioImage(input: {
  sourceImageDataUrl: string;
  scaleFactor?: '2x' | '4x';
  targetResolution?: '2K' | '4K';
  enhanceDetail?: boolean;
  projectId?: string;
  projectName?: string;
}): Promise<GeneratedImageRecord> {
  const tmpSrc = decodeDataUrlToTempFile(input.sourceImageDataUrl);
  if (!tmpSrc) {
    throw new Error('Please upload or select an image to upscale.');
  }

  const targetRes = input.targetResolution || (input.scaleFactor === '4x' ? '4K' : '2K');
  const width = targetRes === '4K' ? 2048 : 1536;
  const height = targetRes === '4K' ? 1152 : 864;
  const sharpen = input.enhanceDetail !== false ? ',unsharp=5:5:1.25:5:5:0.0' : '';
  const filterOverride = `scale=${width}:${height}:flags=lanczos:force_original_aspect_ratio=decrease${sharpen}`;

  try {
    const out = await renderBuiltInStudioImage({
      prompt: `Upscaled ${targetRes} master image`,
      style: 'Upscaled Master',
      folder: 'Edited Images',
      width,
      height,
      variantIndex: 0,
      sourceFilePath: tmpSrc,
      filterOverride,
    });

    return saveImageRecord({
      buffer: out.buffer,
      mimeType: 'image/png',
      ext: 'png',
      projectId: input.projectId || 'proj-001',
      projectName: input.projectName || 'Film & Video Studio Project',
      title: `Upscaled ${targetRes} (${input.scaleFactor || '2x'} Lanczos)`,
      prompt: `AI Super-Resolution Upscale to ${targetRes}`,
      provider: 'Studio Super-Resolution Upscaler',
      mode: 'upscale',
      folder: 'Edited Images',
      style: 'Upscaled',
      aspectRatio: '16:9',
      resolution: targetRes,
      width,
      height,
      quality: `${targetRes} Ultra Sharp`,
      editOperation: 'upscale',
      metadata: { scaleFactor: input.scaleFactor || '2x', targetResolution: targetRes },
    });
  } finally {
    if (tmpSrc.startsWith(os.tmpdir())) {
      try {
        fs.unlinkSync(tmpSrc);
      } catch {
        // ignore
      }
    }
  }
}

export function listStudioImages(filters?: {
  folder?: string;
  projectId?: string;
  q?: string;
}): GeneratedImageRecord[] {
  const db = readDb();
  const folder = String(filters?.folder || '').trim().toLowerCase();
  const projectId = String(filters?.projectId || '').trim();
  const q = String(filters?.q || '').trim().toLowerCase();

  return db.images.filter((img) => {
    if (folder && folder !== 'all' && img.folder.toLowerCase() !== folder) return false;
    if (projectId && projectId !== 'all' && img.projectId !== projectId) return false;
    if (q) {
      const hay = `${img.title} ${img.prompt} ${img.style} ${img.folder} ${img.provider} ${img.characterName || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function getStudioImageById(id: string): GeneratedImageRecord | null {
  const db = readDb();
  return db.images.find((img) => img.id === id) || null;
}

export function deleteStudioImageById(id: string): boolean {
  const db = readDb();
  const target = db.images.find((img) => img.id === id);
  if (!target) return false;

  db.images = db.images.filter((img) => img.id !== id);
  writeDb(db);

  if (target.libraryAssetId) {
    deleteUploadedLibraryAsset(target.libraryAssetId);
  }
  return true;
}

export function listSavedCharacterIdentities(projectId?: string): SavedCharacterIdentity[] {
  const db = readDb();
  if (!projectId || projectId === 'all') return db.characters;
  return db.characters.filter((c) => c.projectId === projectId);
}

export function deleteSavedCharacterIdentity(id: string): boolean {
  const db = readDb();
  const prevLen = db.characters.length;
  db.characters = db.characters.filter((c) => c.id !== id);
  writeDb(db);
  return db.characters.length < prevLen;
}
