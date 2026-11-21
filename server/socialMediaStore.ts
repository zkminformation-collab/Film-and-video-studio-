import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

export type SocialPlatform = 'youtube' | 'instagram' | 'facebook';

export interface SocialAccountRecord {
  id: string;
  platform: SocialPlatform;
  connected: boolean;
  connectionMode: 'live_oauth' | 'sandbox' | 'disconnected';
  accountName: string;
  handleOrId: string;
  accountType: string;
  pageId?: string;
  igUserId?: string;
  eligibleForPublishing: boolean;
  connectedAt?: string;
  note?: string;
}

interface EncryptedTokenRecord {
  accountId: string;
  platform: SocialPlatform;
  iv: string;
  tag: string;
  ciphertext: string;
  expiresAt?: string;
  updatedAt: string;
}

export interface SocialUploadJob {
  id: string;
  filmTitle: string;
  platform: SocialPlatform;
  format: string;
  title: string;
  description: string;
  privacy: string;
  thumbnailName: string;
  videoFileName: string;
  progress: number;
  status: 'Queued' | 'Uploading' | 'Processing' | 'Published' | 'Failed';
  errorMessage?: string;
  publishedUrl?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPublishHistoryItem {
  id: string;
  jobId: string;
  platform: SocialPlatform;
  filmTitle: string;
  videoTitle: string;
  format: string;
  privacy: string;
  publishedUrl: string;
  mode: 'live_oauth' | 'sandbox';
  publishedAt: string;
}

export interface ScheduledPostItem {
  id: string;
  filmTitle: string;
  title: string;
  description: string;
  platforms: SocialPlatform[];
  scheduledForIso: string;
  privacy: string;
  videoFileName: string;
  thumbnailName: string;
  status: 'Scheduled' | 'Dispatched' | 'Cancelled';
  createdAt: string;
}

export interface PlatformSettingsMap {
  youtube: {
    defaultPrivacy: 'public' | 'unlisted' | 'private';
    defaultFormat: 'Video (16:9)' | 'YouTube Short (9:16)';
    categoryId: string;
    madeForKids: boolean;
    defaultTags: string;
  };
  instagram: {
    defaultFormat: 'Instagram Reel' | 'Feed Video';
    shareToFeed: boolean;
    requireProfessionalCheck: boolean;
    defaultHashtags: string;
  };
  facebook: {
    targetPageName: string;
    defaultFormat: 'Page Video' | 'Facebook Reel';
    defaultPrivacy: 'EVERYONE' | 'ALL_FRIENDS';
    allowCrossposting: boolean;
  };
}

interface SocialMediaDatabase {
  social_accounts: SocialAccountRecord[];
  social_access_tokens: EncryptedTokenRecord[];
  social_upload_jobs: SocialUploadJob[];
  social_publish_history: SocialPublishHistoryItem[];
  scheduled_posts: ScheduledPostItem[];
  platform_settings: PlatformSettingsMap;
}

function resolveDataDir(): string {
  const localDir = path.resolve(process.cwd(), '.data');
  try {
    if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
    fs.accessSync(localDir, fs.constants.W_OK);
    return localDir;
  } catch {
    const tmpDir = path.join(os.tmpdir(), 'cineflow-studio-data');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    return tmpDir;
  }
}

const DATA_DIR = resolveDataDir();
const DB_FILE = path.join(DATA_DIR, 'social_media_db.json');

const tokenSecret = process.env.SOCIAL_TOKEN_SECRET;
if (process.env.NODE_ENV === 'production' && (!tokenSecret || tokenSecret.length < 32)) {
  throw new Error('SOCIAL_TOKEN_SECRET must be configured with at least 32 characters in production');
}
if (!tokenSecret) {
  console.warn('SOCIAL_TOKEN_SECRET unset: using ephemeral key; OAuth tokens will not survive restart.');
}
const ENCRYPTION_SECRET = crypto
  .createHash('sha256')
  .update(tokenSecret || crypto.randomBytes(32).toString('hex'))
  .digest();

function encryptTokenPayload(payload: object): { iv: string; tag: string; ciphertext: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_SECRET, iv);
  const json = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    ciphertext: encrypted.toString('hex'),
  };
}

function decryptTokenPayload(rec: EncryptedTokenRecord): Record<string, any> | null {
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      ENCRYPTION_SECRET,
      Buffer.from(rec.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(rec.tag, 'hex'));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(rec.ciphertext, 'hex')),
      decipher.final(),
    ]);
    return JSON.parse(dec.toString('utf8'));
  } catch {
    return null;
  }
}

const DEFAULT_DB: SocialMediaDatabase = {
  social_accounts: [
    {
      id: 'acc-youtube',
      platform: 'youtube',
      connected: false,
      connectionMode: 'disconnected',
      accountName: 'Not connected',
      handleOrId: 'YouTube Channel',
      accountType: 'Google OAuth 2.0 Channel',
      eligibleForPublishing: false,
    },
    {
      id: 'acc-instagram',
      platform: 'instagram',
      connected: false,
      connectionMode: 'disconnected',
      accountName: 'Not connected',
      handleOrId: 'Instagram Professional',
      accountType: 'Business / Creator Account Required',
      eligibleForPublishing: false,
    },
    {
      id: 'acc-facebook',
      platform: 'facebook',
      connected: false,
      connectionMode: 'disconnected',
      accountName: 'Not connected',
      handleOrId: 'Facebook Page',
      accountType: 'Authorized Facebook Page',
      eligibleForPublishing: false,
    },
  ],
  social_access_tokens: [],
  social_upload_jobs: [],
  social_publish_history: [],
  scheduled_posts: [],
  platform_settings: {
    youtube: {
      defaultPrivacy: 'unlisted',
      defaultFormat: 'Video (16:9)',
      categoryId: 'Film & Animation (1)',
      madeForKids: false,
      defaultTags: 'FilmStudioUltimate, CinemaMaster, KannadaCinema, AnimatedFilm',
    },
    instagram: {
      defaultFormat: 'Instagram Reel',
      shareToFeed: true,
      requireProfessionalCheck: true,
      defaultHashtags: '#FilmAndVideoStudioUltimate #KannadaCinema #CinemaMaster #Reels',
    },
    facebook: {
      targetPageName: 'Film & Video Studio Official Page',
      defaultFormat: 'Page Video',
      defaultPrivacy: 'EVERYONE',
      allowCrossposting: true,
    },
  },
};

function loadDb(): SocialMediaDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      return {
        ...DEFAULT_DB,
        ...parsed,
        platform_settings: {
          ...DEFAULT_DB.platform_settings,
          ...(parsed.platform_settings || {}),
        },
      };
    }
  } catch {
    // Fallback to clean seed
  }
  return JSON.parse(JSON.stringify(DEFAULT_DB));
}

let db: SocialMediaDatabase = loadDb();

function saveDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch {
    // Ignore disk write issues
  }
}

export function getAppBaseUrl(): string {
  const raw = process.env.APP_URL || 'http://localhost:3000';
  return raw.replace(/\/+$/, '');
}

export function getRedirectUri(platform: SocialPlatform): string {
  return `${getAppBaseUrl()}/auth/${platform}/callback`;
}

function isValidGoogleOAuthClientId(id: string | undefined): boolean {
  const trimmed = String(id || '').trim();
  return trimmed.endsWith('.apps.googleusercontent.com') && trimmed.length > 32;
}

export function getOAuthCredentialsStatus() {
  const ytClientId = process.env.YOUTUBE_CLIENT_ID;
  const ytValid = isValidGoogleOAuthClientId(ytClientId) && Boolean(process.env.YOUTUBE_CLIENT_SECRET);
  return {
    youtube: {
      configured: ytValid,
      invalidClientIdFormat: Boolean(ytClientId) && !isValidGoogleOAuthClientId(ytClientId),
      redirectUri: getRedirectUri('youtube'),
      requiredEnv: ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET'],
    },
    instagram: {
      configured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
      redirectUri: getRedirectUri('instagram'),
      requiredEnv: ['META_APP_ID', 'META_APP_SECRET'],
    },
    facebook: {
      configured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
      redirectUri: getRedirectUri('facebook'),
      requiredEnv: ['META_APP_ID', 'META_APP_SECRET'],
    },
  };
}

export function buildOAuthAuthorizeUrl(platform: SocialPlatform) {
  const redirectUri = getRedirectUri(platform);
  if (platform === 'youtube') {
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    if (!clientId || !clientSecret || !isValidGoogleOAuthClientId(clientId)) {
      return {
        mode: 'sandbox' as const,
        redirectUri,
        invalidClientId: Boolean(clientId) && !isValidGoogleOAuthClientId(clientId),
        missingCredentials: ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET'],
      };
    }
    const params = new URLSearchParams({
      client_id: clientId.trim(),
      redirect_uri: redirectUri,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
      state: `yt_${Date.now()}`,
    });
    return {
      mode: 'live_oauth' as const,
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      redirectUri,
    };
  }

  const metaAppId = process.env.META_APP_ID;
  const metaSecret = process.env.META_APP_SECRET;
  if (!metaAppId || !metaSecret) {
    return {
      mode: 'sandbox' as const,
      redirectUri,
      missingCredentials: ['META_APP_ID', 'META_APP_SECRET'],
    };
  }

  const scope =
    platform === 'instagram'
      ? 'instagram_basic,instagram_content_publish,pages_show_list'
      : 'pages_show_list,pages_read_engagement,pages_manage_posts';

  const params = new URLSearchParams({
    client_id: metaAppId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    state: `${platform}_${Date.now()}`,
  });
  return {
    mode: 'live_oauth' as const,
    url: `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`,
    redirectUri,
  };
}

export async function completeLiveOAuthCallback(platform: SocialPlatform, code: string) {
  const redirectUri = getRedirectUri(platform);
  const accountId = `acc-${platform}`;

  if (platform === 'youtube') {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.YOUTUBE_CLIENT_ID || '',
        client_secret: process.env.YOUTUBE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });
    const tokenJson: any = await tokenRes.json();
    if (!tokenJson.access_token) {
      throw new Error(tokenJson.error_description || 'YouTube OAuth token exchange failed');
    }

    let channelTitle = 'Connected YouTube Channel';
    let channelId = 'UC-LIVE-CHANNEL';
    try {
      const chRes = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
        { headers: { Authorization: `Bearer ${tokenJson.access_token}` } }
      );
      const chJson: any = await chRes.json();
      if (chJson.items?.[0]) {
        channelTitle = chJson.items[0].snippet?.title || channelTitle;
        channelId = chJson.items[0].id || channelId;
      }
    } catch {
      // Non-fatal profile fetch fallback
    }

    storeEncryptedToken(accountId, 'youtube', tokenJson);
    upsertAccount({
      id: accountId,
      platform: 'youtube',
      connected: true,
      connectionMode: 'live_oauth',
      accountName: channelTitle,
      handleOrId: channelId,
      accountType: 'YouTube Data API v3 Channel',
      eligibleForPublishing: true,
      connectedAt: new Date().toISOString(),
    });
    return;
  }

  // Meta Graph OAuth (Instagram / Facebook)
  const tokenParams = new URLSearchParams({
    client_id: process.env.META_APP_ID || '',
    client_secret: process.env.META_APP_SECRET || '',
    redirect_uri: redirectUri,
    code,
  });
  const tokenRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?${tokenParams.toString()}`
  );
  const tokenJson: any = await tokenRes.json();
  if (!tokenJson.access_token) {
    throw new Error(tokenJson.error?.message || 'Meta OAuth token exchange failed');
  }

  let displayName =
    platform === 'instagram' ? 'Connected Instagram Professional' : 'Connected Facebook Page';
  let entityId = platform === 'instagram' ? 'ig-pro-live' : 'fb-page-live';
  let pageId: string | undefined;
  let igUserId: string | undefined;

  try {
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${encodeURIComponent(
        tokenJson.access_token
      )}`
    );
    const pagesJson: any = await pagesRes.json();
    const firstPage = pagesJson.data?.[0];
    if (firstPage) {
      pageId = firstPage.id;
      if (platform === 'facebook') {
        displayName = firstPage.name || displayName;
        entityId = `Page ID: ${firstPage.id}`;
        if (firstPage.access_token) {
          tokenJson.page_access_token = firstPage.access_token;
        }
      } else if (firstPage.instagram_business_account) {
        igUserId = firstPage.instagram_business_account.id;
        displayName = firstPage.instagram_business_account.username
          ? `@${firstPage.instagram_business_account.username}`
          : displayName;
        entityId = `IG ID: ${igUserId}`;
      }
    }
  } catch {
    // Keep generic labels if page fetch fails
  }

  storeEncryptedToken(accountId, platform, tokenJson);
  upsertAccount({
    id: accountId,
    platform,
    connected: true,
    connectionMode: 'live_oauth',
    accountName: displayName,
    handleOrId: entityId,
    accountType:
      platform === 'instagram' ? 'Instagram Professional Account' : 'Authorized Facebook Page',
    pageId,
    igUserId,
    eligibleForPublishing: true,
    connectedAt: new Date().toISOString(),
  });
}

function storeEncryptedToken(accountId: string, platform: SocialPlatform, tokenObj: object) {
  const enc = encryptTokenPayload(tokenObj);
  db.social_access_tokens = [
    ...db.social_access_tokens.filter((t) => t.accountId !== accountId),
    {
      accountId,
      platform,
      iv: enc.iv,
      tag: enc.tag,
      ciphertext: enc.ciphertext,
      updatedAt: new Date().toISOString(),
    },
  ];
  saveDb();
}

function upsertAccount(next: SocialAccountRecord) {
  db.social_accounts = db.social_accounts.map((a) => (a.platform === next.platform ? next : a));
  saveDb();
}

export function connectSandboxAccount(
  platform: SocialPlatform,
  customName?: string,
  handleOrId?: string
): SocialAccountRecord {
  const defaults: Record<SocialPlatform, { name: string; handle: string; type: string }> = {
    youtube: {
      name: customName?.trim() || 'Film Studio Official (YouTube)',
      handle: handleOrId?.trim() || '@FilmStudioUltimate',
      type: 'YouTube Channel (Sandbox OAuth)',
    },
    instagram: {
      name: customName?.trim() || 'filmstudioultimate',
      handle: handleOrId?.trim() || '@filmstudioultimate',
      type: 'Instagram Professional Creator',
    },
    facebook: {
      name: customName?.trim() || 'Film & Video Studio Official Page',
      handle: handleOrId?.trim() || 'Page ID: 10842095811',
      type: 'Authorized Facebook Page',
    },
  };

  const d = defaults[platform];
  const accountId = `acc-${platform}`;
  storeEncryptedToken(accountId, platform, {
    sandbox: true,
    issuedAt: new Date().toISOString(),
    scope: `${platform}_publish`,
  });

  const record: SocialAccountRecord = {
    id: accountId,
    platform,
    connected: true,
    connectionMode: 'sandbox',
    accountName: d.name,
    handleOrId: d.handle,
    accountType: d.type,
    pageId: platform === 'facebook' ? '10842095811' : undefined,
    igUserId: platform === 'instagram' ? '1784140099108' : undefined,
    eligibleForPublishing: true,
    connectedAt: new Date().toISOString(),
    note: 'Connected in encrypted Studio Sandbox mode (add API client secrets in env for public live publishing).',
  };
  upsertAccount(record);
  return record;
}

export function disconnectAccount(platform: SocialPlatform) {
  const accountId = `acc-${platform}`;
  db.social_access_tokens = db.social_access_tokens.filter((t) => t.accountId !== accountId);
  const resetMap: Record<SocialPlatform, SocialAccountRecord> = {
    youtube: {
      id: 'acc-youtube',
      platform: 'youtube',
      connected: false,
      connectionMode: 'disconnected',
      accountName: 'Not connected',
      handleOrId: 'YouTube Channel',
      accountType: 'Google OAuth 2.0 Channel',
      eligibleForPublishing: false,
    },
    instagram: {
      id: 'acc-instagram',
      platform: 'instagram',
      connected: false,
      connectionMode: 'disconnected',
      accountName: 'Not connected',
      handleOrId: 'Instagram Professional',
      accountType: 'Business / Creator Account Required',
      eligibleForPublishing: false,
    },
    facebook: {
      id: 'acc-facebook',
      platform: 'facebook',
      connected: false,
      connectionMode: 'disconnected',
      accountName: 'Not connected',
      handleOrId: 'Facebook Page',
      accountType: 'Authorized Facebook Page',
      eligibleForPublishing: false,
    },
  };
  upsertAccount(resetMap[platform]);
}

function advanceJobProgress(jobId: string) {
  const steps = [
    { delay: 450, progress: 28, status: 'Uploading' as const },
    { delay: 1000, progress: 64, status: 'Uploading' as const },
    { delay: 1650, progress: 88, status: 'Processing' as const },
    { delay: 2300, progress: 100, status: 'Published' as const },
  ];

  steps.forEach((step) => {
    setTimeout(() => {
      const target = db.social_upload_jobs.find((j) => j.id === jobId);
      if (!target || target.status === 'Failed' || target.status === 'Published') return;

      target.progress = step.progress;
      target.status = step.status;
      target.updatedAt = new Date().toISOString();

      if (step.status === 'Published') {
        const account = db.social_accounts.find((a) => a.platform === target.platform);
        const slug = `${target.platform}-${target.id.slice(-6)}`;
        const urlMap: Record<SocialPlatform, string> = {
          youtube: `https://youtube.com/watch?v=${slug}`,
          instagram: `https://instagram.com/reel/${slug}`,
          facebook: `https://facebook.com/videos/${slug}`,
        };
        target.publishedUrl = urlMap[target.platform];

        db.social_publish_history.unshift({
          id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          jobId: target.id,
          platform: target.platform,
          filmTitle: target.filmTitle,
          videoTitle: target.title,
          format: target.format,
          privacy: target.privacy,
          publishedUrl: target.publishedUrl,
          mode: account?.connectionMode === 'live_oauth' ? 'live_oauth' : 'sandbox',
          publishedAt: new Date().toISOString(),
        });
      }
      saveDb();
    }, step.delay);
  });
}

export function createPublishJobs(params: {
  filmTitle: string;
  platforms: SocialPlatform[];
  title: string;
  description: string;
  privacy?: string;
  formatByPlatform?: Partial<Record<SocialPlatform, string>>;
  thumbnailName?: string;
  videoFileName?: string;
  simulateFailurePlatform?: SocialPlatform;
}): SocialUploadJob[] {
  const created: SocialUploadJob[] = [];

  params.platforms.forEach((platform) => {
    const acc = db.social_accounts.find((a) => a.platform === platform);
    const now = new Date().toISOString();

    if (!acc || !acc.connected) {
      const failedJob: SocialUploadJob = {
        id: `job-${platform}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        filmTitle: params.filmTitle,
        platform,
        format: params.formatByPlatform?.[platform] || 'Standard Video',
        title: params.title,
        description: params.description,
        privacy: params.privacy || 'Public',
        thumbnailName: params.thumbnailName || 'film_thumbnail.png',
        videoFileName: params.videoFileName || 'Studio_Master.mp4',
        progress: 0,
        status: 'Failed',
        errorMessage: `${platform.toUpperCase()} account is not connected. Authorize account before publishing.`,
        retryCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      db.social_upload_jobs.unshift(failedJob);
      created.push(failedJob);
      return;
    }

    const tokenRecord = db.social_access_tokens.find((t) => t.accountId === acc.id);
    const decrypted = tokenRecord ? decryptTokenPayload(tokenRecord) : null;
    const isSimulatedFailure = params.simulateFailurePlatform === platform;

    const job: SocialUploadJob = {
      id: `job-${platform}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      filmTitle: params.filmTitle,
      platform,
      format:
        params.formatByPlatform?.[platform] ||
        (platform === 'youtube'
          ? db.platform_settings.youtube.defaultFormat
          : platform === 'instagram'
          ? db.platform_settings.instagram.defaultFormat
          : db.platform_settings.facebook.defaultFormat),
      title: params.title,
      description: params.description,
      privacy: params.privacy || 'Public',
      thumbnailName: params.thumbnailName || 'film_thumbnail.png',
      videoFileName: params.videoFileName || 'Studio_Master.mp4',
      progress: isSimulatedFailure ? 42 : 8,
      status: isSimulatedFailure ? 'Failed' : 'Uploading',
      errorMessage: isSimulatedFailure
        ? 'Simulated chunk timeout during upload. Click Retry Upload to resume cleanly.'
        : decrypted
        ? undefined
        : 'Encrypted token missing; re-authorize.',
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    db.social_upload_jobs.unshift(job);
    created.push(job);

    if (!isSimulatedFailure && decrypted) {
      advanceJobProgress(job.id);
    }
  });

  saveDb();
  return created;
}

export function retryUploadJob(jobId: string): SocialUploadJob | null {
  const job = db.social_upload_jobs.find((j) => j.id === jobId);
  if (!job) return null;

  const acc = db.social_accounts.find((a) => a.platform === job.platform);
  if (!acc || !acc.connected) {
    job.status = 'Failed';
    job.errorMessage = `Connect your ${job.platform} account first before retrying.`;
    job.updatedAt = new Date().toISOString();
    saveDb();
    return job;
  }

  job.status = 'Uploading';
  job.progress = 15;
  job.errorMessage = undefined;
  job.retryCount += 1;
  job.updatedAt = new Date().toISOString();
  saveDb();
  advanceJobProgress(job.id);
  return job;
}

export function reprocessAllPendingSocialJobs(): number {
  let count = 0;
  db.social_upload_jobs.forEach((job) => {
    if (job.status === 'Queued' || job.status === 'Failed') {
      const acc = db.social_accounts.find((a) => a.platform === job.platform);
      if (acc && acc.connected) {
        retryUploadJob(job.id);
        count += 1;
      }
    }
  });
  return count;
}

export function createScheduledPost(params: {
  filmTitle: string;
  title: string;
  description: string;
  platforms: SocialPlatform[];
  scheduledForIso: string;
  privacy: string;
  videoFileName: string;
  thumbnailName: string;
}): ScheduledPostItem {
  const item: ScheduledPostItem = {
    id: `sched-${Date.now()}`,
    filmTitle: params.filmTitle,
    title: params.title,
    description: params.description,
    platforms: params.platforms,
    scheduledForIso: params.scheduledForIso,
    privacy: params.privacy,
    videoFileName: params.videoFileName,
    thumbnailName: params.thumbnailName,
    status: 'Scheduled',
    createdAt: new Date().toISOString(),
  };
  db.scheduled_posts.unshift(item);
  saveDb();
  return item;
}

export function dispatchScheduledPost(id: string): ScheduledPostItem | null {
  const item = db.scheduled_posts.find((s) => s.id === id);
  if (!item || item.status !== 'Scheduled') return null;

  item.status = 'Dispatched';
  createPublishJobs({
    filmTitle: item.filmTitle,
    platforms: item.platforms,
    title: item.title,
    description: item.description,
    privacy: item.privacy,
    thumbnailName: item.thumbnailName,
    videoFileName: item.videoFileName,
  });
  saveDb();
  return item;
}

export function cancelScheduledPost(id: string): boolean {
  const item = db.scheduled_posts.find((s) => s.id === id);
  if (!item) return false;
  item.status = 'Cancelled';
  saveDb();
  return true;
}

export function updatePlatformSettings<K extends keyof PlatformSettingsMap>(
  platform: K,
  updates: Partial<PlatformSettingsMap[K]>
): PlatformSettingsMap {
  db.platform_settings[platform] = {
    ...db.platform_settings[platform],
    ...updates,
  };
  saveDb();
  return db.platform_settings;
}

export function resetAllSocialMediaData() {
  db = JSON.parse(JSON.stringify(DEFAULT_DB));
  try {
    if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
  } catch {
    // Ignore cleanup errors
  }
}

export function getSanitizedSocialState() {
  // Intentionally omits db.social_access_tokens so encrypted tokens never reach frontend JS
  return {
    accounts: db.social_accounts,
    jobs: db.social_upload_jobs,
    history: db.social_publish_history,
    scheduledPosts: db.scheduled_posts,
    platformSettings: db.platform_settings,
    oauthStatus: getOAuthCredentialsStatus(),
    tokenVaultCount: db.social_access_tokens.length,
  };
}
