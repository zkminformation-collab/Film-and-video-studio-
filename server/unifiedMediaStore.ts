import fs from 'fs';
import path from 'path';

export type UnifiedMediaCategory =
  | 'animation'
  | 'vfx'
  | '3d_assets'
  | 'images'
  | 'audio'
  | 'video'
  | 'textures'
  | 'fonts'
  | 'projects';

export interface UnifiedMediaAsset {
  id: string;
  owner_id: string;
  project_id: string;
  name: string;
  category: UnifiedMediaCategory;
  file_type: string;
  storage_path: string;
  source: string;
  source_url: string;
  preview_url: string;
  license_name: string;
  commercial_use: 'yes' | 'no' | 'unknown' | 'check';
  attribution: string;
  file_size: number;
  status: 'imported' | 'verified' | 'deleted';
  created_at: string;
  deleted_at?: string | null;
}

export interface AssetProjectLink {
  asset_id: string;
  project_id: string;
  linked_at: string;
}

interface UnifiedMediaDb {
  media_assets: UnifiedMediaAsset[];
  asset_project_links: AssetProjectLink[];
}

export const SUPPORTED_CATEGORY_FORMATS: Record<UnifiedMediaCategory, string[]> = {
  animation: ['json', 'lottie', 'gif', 'mp4'],
  vfx: ['mp4', 'mov', 'webm', 'png', 'jpg', 'jpeg', 'webp', 'gif'],
  '3d_assets': ['glb', 'gltf', 'fbx', 'obj'],
  images: ['png', 'jpg', 'jpeg', 'webp'],
  audio: ['mp3', 'wav', 'ogg', 'm4a'],
  video: ['mp4', 'mov', 'webm'],
  textures: ['png', 'jpg', 'jpeg', 'webp', 'exr', 'hdr'],
  fonts: ['ttf', 'otf', 'woff2'],
  projects: ['json', 'zip', 'fvs', 'srt', 'vtt', 'cube'],
};

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'unified-media-db.json');

function readDb(): UnifiedMediaDb {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) {
      const initial: UnifiedMediaDb = { media_assets: [], asset_project_links: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    return {
      media_assets: Array.isArray(parsed?.media_assets) ? parsed.media_assets : [],
      asset_project_links: Array.isArray(parsed?.asset_project_links) ? parsed.asset_project_links : [],
    };
  } catch {
    return { media_assets: [], asset_project_links: [] };
  }
}

function writeDb(db: UnifiedMediaDb): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const tempPath = DB_FILE + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tempPath, DB_FILE);
}

export function validateSafeExternalUrl(rawUrl: string): { valid: boolean; reason?: string } {
  if (!rawUrl) return { valid: true };
  if (rawUrl.startsWith('/')) return { valid: true };
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { valid: false, reason: 'Only http and https URLs are permitted.' };
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.startsWith('127.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return { valid: false, reason: 'Internal or private network addresses are blocked.' };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Invalid URL format.' };
  }
}

export function normalizeCategory(raw: string): UnifiedMediaCategory {
  const s = String(raw || '').toLowerCase().trim().replace(/\s+/g, '_');
  if (Object.hasOwn(SUPPORTED_CATEGORY_FORMATS, s)) return s as UnifiedMediaCategory;
  if (s.includes('3d')) return '3d_assets';
  if (s.includes('vfx') || s.includes('effect')) return 'vfx';
  if (s.includes('anim') || s.includes('lottie')) return 'animation';
  if (s.includes('music') || s.includes('sfx') || s.includes('sound') || s.includes('audio')) return 'audio';
  if (s.includes('video')) return 'video';
  if (s.includes('texture') || s.includes('pbr')) return 'textures';
  if (s.includes('font')) return 'fonts';
  if (s.includes('project')) return 'projects';
  return 'images';
}

export function validateFormatForCategory(category: UnifiedMediaCategory, fileType: string): boolean {
  const clean = fileType.toLowerCase().replace(/^\./, '').split('/')[0].trim();
  const allowed = SUPPORTED_CATEGORY_FORMATS[category] || [];
  return allowed.includes(clean);
}

export function importUnifiedMediaAsset(input: {
  id?: string;
  owner_id?: string;
  project_id?: string;
  name: string;
  category: string;
  file_type: string;
  storage_path?: string;
  source?: string;
  source_url?: string;
  preview_url?: string;
  license_name?: string;
  commercial_use?: string;
  attribution?: string;
  file_size?: number;
}): { asset: UnifiedMediaAsset; linkedProjects: string[] } {
  const db = readDb();
  const category = normalizeCategory(input.category);
  const rawType = String(input.file_type || '').toLowerCase().replace(/^\./, '').split(/[\s/]+/)[0] || SUPPORTED_CATEGORY_FORMATS[category][0];

  if (!validateFormatForCategory(category, rawType)) {
    throw new Error(
      `Unsupported file format "${rawType}" for category "${category}". Supported: ${SUPPORTED_CATEGORY_FORMATS[category].join(', ')}.`
    );
  }

  const srcCheck = validateSafeExternalUrl(input.source_url || '');
  if (!srcCheck.valid) throw new Error(srcCheck.reason || 'Untrusted source_url.');

  const prevCheck = validateSafeExternalUrl(input.preview_url || '');
  if (!prevCheck.valid) throw new Error(prevCheck.reason || 'Untrusted preview_url.');

  const prefix = category.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const assetId = input.id?.trim() || `${prefix}_${String(db.media_assets.length + 1).padStart(5, '0')}`;
  const projectId = String(input.project_id || 'default-project');

  // Deduplicate by source_url + name if already imported: link to project instead of duplicating
  const existing = db.media_assets.find(
    (a) =>
      a.status !== 'deleted' &&
      ((input.id && a.id === input.id) ||
        (input.source_url && a.source_url === input.source_url && a.name.toLowerCase() === input.name.trim().toLowerCase()))
  );

  if (existing) {
    const linked = linkAssetToProject(existing.id, projectId);
    return { asset: existing, linkedProjects: linked };
  }

  const rawComm = String(input.commercial_use || 'unknown').toLowerCase();
  const commercial_use: UnifiedMediaAsset['commercial_use'] =
    rawComm === 'yes' || rawComm === 'true'
      ? 'yes'
      : rawComm === 'no' || rawComm === 'false'
      ? 'no'
      : rawComm === 'check'
      ? 'check'
      : 'unknown';

  const record: UnifiedMediaAsset = {
    id: assetId,
    owner_id: String(input.owner_id || 'studio-owner'),
    project_id: projectId,
    name: input.name.trim(),
    category,
    file_type: rawType,
    storage_path: String(input.storage_path || input.source_url || ''),
    source: String(input.source || 'Unified Media Library'),
    source_url: String(input.source_url || ''),
    preview_url: String(input.preview_url || input.storage_path || ''),
    license_name: String(input.license_name || 'pending_verification'),
    commercial_use,
    attribution: String(input.attribution || ''),
    file_size: Number(input.file_size || 0),
    status: commercial_use === 'yes' && input.license_name && input.license_name !== 'pending_verification' ? 'verified' : 'imported',
    created_at: new Date().toISOString(),
    deleted_at: null,
  };

  db.media_assets.unshift(record);
  if (!db.asset_project_links.some((l) => l.asset_id === record.id && l.project_id === projectId)) {
    db.asset_project_links.push({
      asset_id: record.id,
      project_id: projectId,
      linked_at: new Date().toISOString(),
    });
  }
  writeDb(db);
  return { asset: record, linkedProjects: [projectId] };
}

export function listUnifiedMediaAssets(filters?: {
  category?: string;
  q?: string;
  projectId?: string;
  license?: string;
  commercialUse?: string;
  includeDeleted?: boolean;
}): Array<UnifiedMediaAsset & { linked_projects: string[] }> {
  const db = readDb();
  const q = String(filters?.q || '').trim().toLowerCase();
  const cat = String(filters?.category || '').trim().toLowerCase();
  const projectId = String(filters?.projectId || '').trim();
  const license = String(filters?.license || '').trim().toLowerCase();
  const commercialUse = String(filters?.commercialUse || '').trim().toLowerCase();

  return db.media_assets
    .filter((a) => {
      if (!filters?.includeDeleted && a.status === 'deleted') return false;
      if (cat && cat !== 'all' && a.category !== normalizeCategory(cat)) return false;
      if (projectId && projectId !== 'all') {
        const linked = db.asset_project_links.some((l) => l.asset_id === a.id && l.project_id === projectId);
        if (a.project_id !== projectId && !linked) return false;
      }
      if (license && !a.license_name.toLowerCase().includes(license)) return false;
      if (commercialUse && a.commercial_use !== commercialUse) return false;
      if (q) {
        return (
          a.name.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q) ||
          a.license_name.toLowerCase().includes(q) ||
          a.file_type.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .map((a) => ({
      ...a,
      linked_projects: db.asset_project_links
        .filter((l) => l.asset_id === a.id)
        .map((l) => l.project_id),
    }));
}

export function getUnifiedMediaAsset(assetId: string): (UnifiedMediaAsset & { linked_projects: string[] }) | null {
  const db = readDb();
  const found = db.media_assets.find((a) => a.id === assetId);
  if (!found) return null;
  return {
    ...found,
    linked_projects: db.asset_project_links
      .filter((l) => l.asset_id === found.id)
      .map((l) => l.project_id),
  };
}

export function updateUnifiedMediaAsset(
  assetId: string,
  patch: Partial<Pick<UnifiedMediaAsset, 'name' | 'license_name' | 'commercial_use' | 'attribution' | 'status'>>
): UnifiedMediaAsset | null {
  const db = readDb();
  const idx = db.media_assets.findIndex((a) => a.id === assetId);
  if (idx === -1) return null;
  const current = db.media_assets[idx];
  const updated: UnifiedMediaAsset = {
    ...current,
    ...(patch.name ? { name: patch.name.trim() } : {}),
    ...(patch.license_name ? { license_name: patch.license_name.trim() } : {}),
    ...(patch.commercial_use ? { commercial_use: patch.commercial_use } : {}),
    ...(patch.attribution !== undefined ? { attribution: patch.attribution } : {}),
    ...(patch.status ? { status: patch.status, deleted_at: patch.status === 'deleted' ? new Date().toISOString() : null } : {}),
  };
  db.media_assets[idx] = updated;
  writeDb(db);
  return updated;
}

export function deleteUnifiedMediaAsset(assetId: string, hard = false): boolean {
  const db = readDb();
  const idx = db.media_assets.findIndex((a) => a.id === assetId);
  if (idx === -1) return false;
  if (hard) {
    db.media_assets.splice(idx, 1);
    db.asset_project_links = db.asset_project_links.filter((l) => l.asset_id !== assetId);
  } else {
    db.media_assets[idx] = {
      ...db.media_assets[idx],
      status: 'deleted',
      deleted_at: new Date().toISOString(),
    };
  }
  writeDb(db);
  return true;
}

export function linkAssetToProject(assetId: string, projectId: string): string[] {
  const db = readDb();
  if (!db.asset_project_links.some((l) => l.asset_id === assetId && l.project_id === projectId)) {
    db.asset_project_links.push({
      asset_id: assetId,
      project_id: projectId,
      linked_at: new Date().toISOString(),
    });
    writeDb(db);
  }
  return db.asset_project_links.filter((l) => l.asset_id === assetId).map((l) => l.project_id);
}

export function unlinkAssetFromProject(assetId: string, projectId: string): string[] {
  const db = readDb();
  db.asset_project_links = db.asset_project_links.filter(
    (l) => !(l.asset_id === assetId && l.project_id === projectId)
  );
  writeDb(db);
  return db.asset_project_links.filter((l) => l.asset_id === assetId).map((l) => l.project_id);
}

export function getUnifiedLicenseSummary(canRead: (asset: UnifiedMediaAsset) => boolean = () => true) {
  const db = readDb();
  const active = db.media_assets.filter((a) => a.status !== 'deleted' && canRead(a));
  const byLicense: Record<string, number> = {};
  let commercialYes = 0;
  let pendingVerification = 0;
  for (const a of active) {
    byLicense[a.license_name] = (byLicense[a.license_name] || 0) + 1;
    if (a.commercial_use === 'yes') commercialYes++;
    if (a.license_name === 'pending_verification' || a.commercial_use === 'unknown') pendingVerification++;
  }
  return {
    totalAssets: active.length,
    commercialYes,
    pendingVerification,
    byLicense,
  };
}
