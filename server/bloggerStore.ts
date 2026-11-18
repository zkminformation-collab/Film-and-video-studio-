import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

export interface BloggerBlogSite {
  id: string;
  name: string;
  url: string;
  description: string;
  postsCount: number;
  locale: string;
}

export interface BloggerAccountState {
  connected: boolean;
  connectionMode: 'live_oauth' | 'sandbox' | 'disconnected';
  accountName: string;
  email: string;
  scope: string;
  connectedAt?: string;
}

interface EncryptedBloggerToken {
  iv: string;
  tag: string;
  ciphertext: string;
  updatedAt: string;
}

export interface BloggerPostRecord {
  id: string;
  blogId: string;
  blogName: string;
  filmTitle: string;
  title: string;
  description: string;
  contentHtml: string;
  posterUrl: string;
  posterName: string;
  youtubeUrl: string;
  labels: string[];
  seoMetaDescription: string;
  seoKeywords: string;
  status: 'Draft' | 'Scheduled' | 'Published';
  scheduledForIso?: string;
  bloggerPostUrl?: string;
  externalPostId?: string;
  mode: 'live_blogger_v3' | 'sandbox';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface BloggerWorkflowSettings {
  publishMode: 'review_before_publish' | 'auto_draft_on_render';
  defaultLabels: string;
  autoEmbedLatestYoutube: boolean;
}

interface BloggerDatabase {
  account: BloggerAccountState;
  tokenVault: EncryptedBloggerToken | null;
  blogs: BloggerBlogSite[];
  selectedBlogId: string;
  posts: BloggerPostRecord[];
  settings: BloggerWorkflowSettings;
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
const DB_FILE = path.join(DATA_DIR, 'blogger_db.json');

const ENCRYPTION_SECRET = crypto
  .createHash('sha256')
  .update(process.env.SOCIAL_TOKEN_SECRET || 'film-video-studio-ultimate-token-vault-key')
  .digest();

function encryptPayload(payload: object): { iv: string; tag: string; ciphertext: string } {
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

function decryptPayload(rec: EncryptedBloggerToken | null): Record<string, any> | null {
  if (!rec) return null;
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

const DEFAULT_BLOGS: BloggerBlogSite[] = [
  {
    id: 'blog-cinema-ultimate',
    name: 'Film & Video Studio Ultimate – Behind The Scenes',
    url: 'https://filmvideostudioultimate.blogspot.com',
    description: 'VFX breakdowns, AI animation devlogs, and official theatrical trailers.',
    postsCount: 28,
    locale: 'en-US',
  },
  {
    id: 'blog-director-journal',
    name: 'Director & Animation Production Journal',
    url: 'https://directorjournalstudio.blogspot.com',
    description: 'Episode guides, Kannada/English screenplays, character profiles & official film releases.',
    postsCount: 14,
    locale: 'en-IN / kn-IN',
  },
];

const DEFAULT_DB: BloggerDatabase = {
  account: {
    connected: false,
    connectionMode: 'disconnected',
    accountName: 'Not connected',
    email: 'Connect Google Account for Blogger API v3',
    scope: 'https://www.googleapis.com/auth/blogger',
  },
  tokenVault: null,
  blogs: DEFAULT_BLOGS,
  selectedBlogId: 'blog-cinema-ultimate',
  posts: [],
  settings: {
    publishMode: 'review_before_publish',
    defaultLabels: 'Animated Film, Kannada Cinema, Behind The Scenes, Official Release',
    autoEmbedLatestYoutube: true,
  },
};

function loadDb(): BloggerDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      return {
        ...DEFAULT_DB,
        ...parsed,
        settings: { ...DEFAULT_DB.settings, ...(parsed.settings || {}) },
        blogs: Array.isArray(parsed.blogs) && parsed.blogs.length > 0 ? parsed.blogs : DEFAULT_BLOGS,
      };
    }
  } catch {
    // Fallback to clean seed
  }
  return JSON.parse(JSON.stringify(DEFAULT_DB));
}

let db: BloggerDatabase = loadDb();

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

export function getBloggerRedirectUri(): string {
  return `${getAppBaseUrl()}/auth/blogger/callback`;
}

function isValidGoogleOAuthClientId(id: string | undefined): boolean {
  const trimmed = String(id || '').trim();
  return trimmed.endsWith('.apps.googleusercontent.com') && trimmed.length > 32;
}

function getGoogleBloggerCredentials() {
  const clientId = process.env.GOOGLE_BLOGGER_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID || '';
  const clientSecret =
    process.env.GOOGLE_BLOGGER_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET || '';
  const validClientId = isValidGoogleOAuthClientId(clientId);
  return { clientId, clientSecret, validClientId };
}

export function buildBloggerOAuthUrl() {
  const redirectUri = getBloggerRedirectUri();
  const { clientId, clientSecret, validClientId } = getGoogleBloggerCredentials();
  if (!clientId || !clientSecret || !validClientId) {
    return {
      mode: 'sandbox' as const,
      redirectUri,
      invalidClientId: Boolean(clientId) && !validClientId,
      missingCredentials: ['GOOGLE_BLOGGER_CLIENT_ID', 'GOOGLE_BLOGGER_CLIENT_SECRET'],
    };
  }

  const params = new URLSearchParams({
    client_id: clientId.trim(),
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope:
      'https://www.googleapis.com/auth/blogger https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
    state: `blogger_${Date.now()}`,
  });

  return {
    mode: 'live_oauth' as const,
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    redirectUri,
  };
}

export async function completeBloggerOAuthCallback(code: string) {
  const { clientId, clientSecret } = getGoogleBloggerCredentials();
  const redirectUri = getBloggerRedirectUri();

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  });

  const tokenJson: any = await tokenRes.json();
  if (!tokenJson.access_token) {
    throw new Error(tokenJson.error_description || 'Google Blogger OAuth token exchange failed');
  }

  let accountName = 'Google Blogger Publisher';
  let email = 'blogger-user@gmail.com';

  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    const userJson: any = await userRes.json();
    accountName = userJson.name || accountName;
    email = userJson.email || email;
  } catch {
    // Non-fatal
  }

  let fetchedBlogs: BloggerBlogSite[] = [];
  try {
    const blogsRes = await fetch('https://www.googleapis.com/blogger/v3/users/self/blogs', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    const blogsJson: any = await blogsRes.json();
    if (Array.isArray(blogsJson.items) && blogsJson.items.length > 0) {
      fetchedBlogs = blogsJson.items.map((b: any) => ({
        id: String(b.id),
        name: String(b.name || 'Untitled Blog'),
        url: String(b.url || ''),
        description: String(b.description || 'Connected Google Blogger site'),
        postsCount: Number(b.posts?.totalItems || 0),
        locale: `${b.locale?.language || 'en'}-${b.locale?.country || 'US'}`,
      }));
    }
  } catch {
    // Keep existing list if Blogger API call fails
  }

  const enc = encryptPayload(tokenJson);
  db.tokenVault = { ...enc, updatedAt: new Date().toISOString() };
  db.account = {
    connected: true,
    connectionMode: 'live_oauth',
    accountName,
    email,
    scope: 'https://www.googleapis.com/auth/blogger',
    connectedAt: new Date().toISOString(),
  };
  if (fetchedBlogs.length > 0) {
    db.blogs = fetchedBlogs;
    db.selectedBlogId = fetchedBlogs[0].id;
  }
  saveDb();
}

export function connectBloggerSandbox(accountName?: string, email?: string) {
  const enc = encryptPayload({
    sandbox: true,
    scope: 'https://www.googleapis.com/auth/blogger',
    issuedAt: new Date().toISOString(),
  });
  db.tokenVault = { ...enc, updatedAt: new Date().toISOString() };
  db.account = {
    connected: true,
    connectionMode: 'sandbox',
    accountName: accountName?.trim() || 'Film Studio Google Account',
    email: email?.trim() || 'studio@filmvideostudio.pro',
    scope: 'https://www.googleapis.com/auth/blogger',
    connectedAt: new Date().toISOString(),
  };
  if (db.blogs.length === 0) {
    db.blogs = DEFAULT_BLOGS;
  }
  if (!db.selectedBlogId) {
    db.selectedBlogId = db.blogs[0].id;
  }
  saveDb();
  return db.account;
}

export function disconnectBloggerAccount() {
  db.tokenVault = null;
  db.account = {
    connected: false,
    connectionMode: 'disconnected',
    accountName: 'Not connected',
    email: 'Connect Google Account for Blogger API v3',
    scope: 'https://www.googleapis.com/auth/blogger',
  };
  saveDb();
}

export function selectBloggerSite(blogId: string): BloggerBlogSite | null {
  const found = db.blogs.find((b) => b.id === blogId);
  if (!found) return null;
  db.selectedBlogId = found.id;
  saveDb();
  return found;
}

export function addCustomBloggerSite(name: string, url: string, description: string): BloggerBlogSite {
  const site: BloggerBlogSite = {
    id: `blog-${Date.now()}`,
    name: name.trim() || 'Custom Film Blog',
    url: url.trim() || 'https://myfilmblog.blogspot.com',
    description: description.trim() || 'Film & Video Studio Ultimate Connected Blog',
    postsCount: 0,
    locale: 'en-IN',
  };
  db.blogs.unshift(site);
  db.selectedBlogId = site.id;
  saveDb();
  return site;
}

export async function refreshBloggerSites(): Promise<BloggerBlogSite[]> {
  if (db.account.connectionMode === 'live_oauth') {
    const tokenObj = decryptPayload(db.tokenVault);
    if (tokenObj?.access_token) {
      try {
        const res = await fetch('https://www.googleapis.com/blogger/v3/users/self/blogs', {
          headers: { Authorization: `Bearer ${tokenObj.access_token}` },
        });
        const json: any = await res.json();
        if (Array.isArray(json.items) && json.items.length > 0) {
          db.blogs = json.items.map((b: any) => ({
            id: String(b.id),
            name: String(b.name || 'Untitled Blog'),
            url: String(b.url || ''),
            description: String(b.description || ''),
            postsCount: Number(b.posts?.totalItems || 0),
            locale: `${b.locale?.language || 'en'}-${b.locale?.country || 'US'}`,
          }));
          if (!db.blogs.some((b) => b.id === db.selectedBlogId)) {
            db.selectedBlogId = db.blogs[0].id;
          }
          saveDb();
        }
      } catch {
        // Keep current list on transient network failure
      }
    }
  }
  return db.blogs;
}

export async function saveOrPublishBloggerPost(input: {
  id?: string;
  blogId?: string;
  filmTitle: string;
  title: string;
  description: string;
  contentHtml: string;
  posterUrl: string;
  posterName: string;
  youtubeUrl: string;
  labels: string[];
  seoMetaDescription: string;
  seoKeywords: string;
  action: 'draft' | 'publish' | 'schedule';
  scheduledForIso?: string;
}): Promise<BloggerPostRecord> {
  const blog = db.blogs.find((b) => b.id === (input.blogId || db.selectedBlogId)) || db.blogs[0];
  const now = new Date().toISOString();
  const status: BloggerPostRecord['status'] =
    input.action === 'publish' ? 'Published' : input.action === 'schedule' ? 'Scheduled' : 'Draft';

  let externalPostId: string | undefined;
  let bloggerPostUrl: string | undefined;
  let mode: BloggerPostRecord['mode'] = 'sandbox';

  if (db.account.connected && db.account.connectionMode === 'live_oauth' && status !== 'Scheduled') {
    const tokenObj = decryptPayload(db.tokenVault);
    if (tokenObj?.access_token && blog?.id && !blog.id.startsWith('blog-')) {
      try {
        const isDraft = status === 'Draft' ? 'true' : 'false';
        const apiRes = await fetch(
          `https://www.googleapis.com/blogger/v3/blogs/${encodeURIComponent(blog.id)}/posts?isDraft=${isDraft}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${tokenObj.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              kind: 'blogger#post',
              blog: { id: blog.id },
              title: input.title,
              content: input.contentHtml,
              labels: input.labels,
            }),
          }
        );
        if (apiRes.ok) {
          const createdJson: any = await apiRes.json();
          externalPostId = String(createdJson.id || '');
          bloggerPostUrl = String(createdJson.url || '');
          mode = 'live_blogger_v3';
        }
      } catch {
        // Fallback to local studio archive if live API returns error
      }
    }
  }

  if (!bloggerPostUrl && status === 'Published') {
    const slug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
    const base = (blog?.url || 'https://filmvideostudioultimate.blogspot.com').replace(/\/+$/, '');
    const nowDate = new Date();
    bloggerPostUrl = `${base}/${nowDate.getFullYear()}/${String(nowDate.getMonth() + 1).padStart(
      2,
      '0'
    )}/${slug || 'film-release'}.html`;
  }

  const existingIdx = input.id ? db.posts.findIndex((p) => p.id === input.id) : -1;
  if (existingIdx >= 0) {
    const updated: BloggerPostRecord = {
      ...db.posts[existingIdx],
      blogId: blog.id,
      blogName: blog.name,
      filmTitle: input.filmTitle,
      title: input.title,
      description: input.description,
      contentHtml: input.contentHtml,
      posterUrl: input.posterUrl,
      posterName: input.posterName,
      youtubeUrl: input.youtubeUrl,
      labels: input.labels,
      seoMetaDescription: input.seoMetaDescription,
      seoKeywords: input.seoKeywords,
      status,
      scheduledForIso: input.scheduledForIso,
      externalPostId: externalPostId || db.posts[existingIdx].externalPostId,
      bloggerPostUrl: bloggerPostUrl || db.posts[existingIdx].bloggerPostUrl,
      mode,
      updatedAt: now,
      publishedAt: status === 'Published' ? now : db.posts[existingIdx].publishedAt,
    };
    db.posts[existingIdx] = updated;
    saveDb();
    return updated;
  }

  const created: BloggerPostRecord = {
    id: `bp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    blogId: blog.id,
    blogName: blog.name,
    filmTitle: input.filmTitle,
    title: input.title,
    description: input.description,
    contentHtml: input.contentHtml,
    posterUrl: input.posterUrl,
    posterName: input.posterName,
    youtubeUrl: input.youtubeUrl,
    labels: input.labels,
    seoMetaDescription: input.seoMetaDescription,
    seoKeywords: input.seoKeywords,
    status,
    scheduledForIso: input.scheduledForIso,
    externalPostId,
    bloggerPostUrl,
    mode,
    createdAt: now,
    updatedAt: now,
    publishedAt: status === 'Published' ? now : undefined,
  };

  db.posts.unshift(created);
  if (status === 'Published') {
    blog.postsCount += 1;
  }
  saveDb();
  return created;
}

export async function publishExistingPostById(id: string): Promise<BloggerPostRecord | null> {
  const existing = db.posts.find((p) => p.id === id);
  if (!existing) return null;
  return saveOrPublishBloggerPost({
    id: existing.id,
    blogId: existing.blogId,
    filmTitle: existing.filmTitle,
    title: existing.title,
    description: existing.description,
    contentHtml: existing.contentHtml,
    posterUrl: existing.posterUrl,
    posterName: existing.posterName,
    youtubeUrl: existing.youtubeUrl,
    labels: existing.labels,
    seoMetaDescription: existing.seoMetaDescription,
    seoKeywords: existing.seoKeywords,
    action: 'publish',
  });
}

export function deleteBloggerPost(id: string): boolean {
  const before = db.posts.length;
  db.posts = db.posts.filter((p) => p.id !== id);
  if (db.posts.length !== before) {
    saveDb();
    return true;
  }
  return false;
}

export function updateBloggerSettings(updates: Partial<BloggerWorkflowSettings>) {
  db.settings = { ...db.settings, ...updates };
  saveDb();
  return db.settings;
}

export function resetAllBloggerData() {
  db = {
    ...JSON.parse(JSON.stringify(DEFAULT_DB)),
    blogs: [],
    selectedBlogId: '',
    posts: [],
  };
  try {
    if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
  } catch {
    // Ignore cleanup errors
  }
}

export function getSanitizedBloggerState() {
  const { clientId, clientSecret, validClientId } = getGoogleBloggerCredentials();
  // Intentionally omits tokenVault so encrypted OAuth tokens never leave server
  return {
    account: db.account,
    blogs: db.blogs,
    selectedBlogId: db.selectedBlogId,
    posts: db.posts,
    settings: db.settings,
    oauthStatus: {
      configured: Boolean(validClientId && clientSecret),
      invalidClientIdFormat: Boolean(clientId) && !validClientId,
      redirectUri: getBloggerRedirectUri(),
      requiredEnv: ['GOOGLE_BLOGGER_CLIENT_ID', 'GOOGLE_BLOGGER_CLIENT_SECRET'],
    },
    tokenSecured: Boolean(db.tokenVault),
  };
}
