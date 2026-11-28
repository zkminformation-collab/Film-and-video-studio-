import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { canAccessCartoonProject } from './cartoonProjectAccess.ts';
import type { BillingIdentity } from './razorpayStore.ts';
import type { CartoonFilmProject } from './cartoonWorkflowStore.ts';

type Viewer = Pick<BillingIdentity, 'userId' | 'isAdmin'>;
type Project = Pick<CartoonFilmProject, 'id' | 'ownerUserId' | 'referenceImages' | 'scenes' | 'thumbnailUrl'>;
type MediaRecord = {
  ownerUserId?: string;
  projectMedia?: boolean;
  projectId?: string;
  project_id?: string;
  url?: string;
  thumbnail?: string;
  storage_path?: string;
  preview_url?: string;
  source_url?: string;
  linked_projects?: string[];
};

const cookie = 'studio_media_session';
const sessionDuration = 5 * 60_000;
const sessions = new Map<string, { viewer: Viewer; expires: number }>();
const options = { path: '/api', sameSite: 'strict' as const, httpOnly: true, secure: process.env.NODE_ENV === 'production' };

function sessionToken(req: Request) {
  return /(?:^|;\s*)studio_media_session=([a-f0-9]{64})(?:;|$)/.exec(req.get('cookie') || '')?.[1];
}

export function studioMediaViewer(req: Request): Viewer | undefined {
  const token = sessionToken(req);
  if (!token) return;
  const session = sessions.get(token);
  if (!session || session.expires <= Date.now()) {
    sessions.delete(token);
    return;
  }
  return session.viewer;
}

export function clearStudioMediaSession(req: Request, res: Response) {
  const token = sessionToken(req);
  if (token) sessions.delete(token);
  res.clearCookie(cookie, options);
}

export function issueStudioMediaSession(req: Request, res: Response, viewer: Viewer) {
  const previous = sessionToken(req);
  if (previous) sessions.delete(previous);
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expires <= now) sessions.delete(token);
  }
  if (sessions.size >= 4096) {
    const oldest = sessions.keys().next().value;
    if (oldest) sessions.delete(oldest);
  }
  const token = randomBytes(32).toString('hex');
  sessions.set(token, { viewer: { userId: viewer.userId, isAdmin: viewer.isAdmin }, expires: now + sessionDuration });
  res.cookie(cookie, token, { ...options, maxAge: sessionDuration });
}

function mediaPath(value?: string) {
  if (!value) return '';
  try {
    return decodeURIComponent(new URL(value, 'https://studio.invalid').pathname);
  } catch {
    return '';
  }
}

export function createStudioMediaAccess(viewer: Viewer | undefined, projects: Project[], uploads: MediaRecord[]) {
  const projectById = new Map(projects.map(project => [project.id, project]));
  const files = new Map<string, Set<Project>>();
  const index = (value: string | undefined, project: Project) => {
    const url = mediaPath(value);
    if (url.startsWith('/api/cartoon-assets/') || url.startsWith('/api/library-uploads/')) {
      const owners = files.get(url) || new Set<Project>();
      owners.add(project);
      files.set(url, owners);
    }
  };
  for (const project of projects) {
    index(project.thumbnailUrl, project);
    for (const asset of project.referenceImages || []) index(asset.url, project);
    for (const scene of project.scenes || []) {
      for (const url of [scene.storyImageUrl, scene.originalImageUrl, scene.originalVideoUrl, scene.videoClipUrl, scene.dialogueAudioUrl, scene.soundtrackUrl]) {
        index(url, project);
      }
    }
  }

  const protectedUploads = new Map<string, MediaRecord>();
  for (const asset of uploads) {
    if (asset.ownerUserId || asset.projectMedia) protectedUploads.set(mediaPath(asset.url), asset);
    const project = projectById.get(asset.projectId || '');
    if (project) index(asset.url, project);
  }

  const allowsProject = (id?: string) => {
    const project = id && projectById.get(id);
    return !project || Boolean(viewer && canAccessCartoonProject(viewer, project));
  };
  const projectFor = (url: string) => {
    const projectId = /^\/api\/cartoon-projects\/([^/]+)/.exec(url)?.[1];
    const project = projectId && projectById.get(projectId);
    return project ? new Set([project]) : files.get(url);
  };
  const isPrivateUrl = (value?: string) => {
    const url = mediaPath(value);
    return Boolean(projectFor(url) || protectedUploads.has(url) ||
      /^\/api\/(?:cartoon-assets|cartoon-projects)\//.test(url));
  };
  const allowsUrl = (value?: string) => {
    const url = mediaPath(value);
    if (!isPrivateUrl(url)) return true;
    if (!viewer) return false;
    const projects = projectFor(url);
    if (projects && [...projects].some(project => !canAccessCartoonProject(viewer, project))) return false;
    const upload = protectedUploads.get(url);
    if (upload?.ownerUserId) return viewer.isAdmin || upload.ownerUserId === viewer.userId;
    return Boolean(projects || viewer.isAdmin);
  };
  const assetUrls = (asset: MediaRecord) =>
    [asset.url, asset.thumbnail, asset.storage_path, asset.preview_url, asset.source_url];
  const isPrivateRecord = (asset: MediaRecord) =>
    Boolean(asset.ownerUserId || asset.projectMedia || projectById.has(asset.projectId || asset.project_id || '') ||
      assetUrls(asset).some(isPrivateUrl));
  const allowsRecord = (asset: MediaRecord) =>
    (!asset.ownerUserId || Boolean(viewer && (viewer.isAdmin || viewer.userId === asset.ownerUserId))) &&
    (!asset.projectMedia || Boolean(viewer?.isAdmin || (viewer && (asset.ownerUserId === viewer.userId || projectById.has(asset.projectId || asset.project_id || ''))))) &&
    allowsProject(asset.projectId || asset.project_id) &&
    (asset.linked_projects || []).every(allowsProject) &&
    assetUrls(asset).every(allowsUrl);

  return { allowsUrl, allowsProject, allowsRecord, isPrivateRecord };
}
