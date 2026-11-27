export const MAX_LIBRARY_UPLOAD_BYTES = 25 * 1024 * 1024;

export const LIBRARY_MEDIA_FORMATS = {
  jpg: { mime: 'image/jpeg', category: 'image' },
  jpeg: { mime: 'image/jpeg', category: 'image' },
  png: { mime: 'image/png', category: 'image' },
  webp: { mime: 'image/webp', category: 'image' },
  gif: { mime: 'image/gif', category: 'animation' },
  mp3: { mime: 'audio/mpeg', category: 'sfx' },
  wav: { mime: 'audio/wav', category: 'sfx' },
  ogg: { mime: 'audio/ogg', category: 'sfx' },
  m4a: { mime: 'audio/mp4', category: 'sfx' },
  mp4: { mime: 'video/mp4', category: 'video' },
  mov: { mime: 'video/quicktime', category: 'video' },
  webm: { mime: 'video/webm', category: 'video' },
  json: { mime: 'application/json', category: 'project' },
  zip: { mime: 'application/zip', category: 'project' },
  fvs: { mime: 'application/octet-stream', category: 'project' },
  cube: { mime: 'application/octet-stream', category: 'color' },
  srt: { mime: 'application/x-subrip', category: 'subtitle' },
  vtt: { mime: 'text/vtt', category: 'subtitle' },
  glb: { mime: 'model/gltf-binary', category: '3d_asset' },
  gltf: { mime: 'model/gltf+json', category: '3d_asset' },
  fbx: { mime: 'application/octet-stream', category: '3d_asset' },
  obj: { mime: 'model/obj', category: '3d_asset' },
  lottie: { mime: 'application/zip', category: 'animation' },
  ttf: { mime: 'font/ttf', category: 'project' },
  otf: { mime: 'font/otf', category: 'project' },
  woff2: { mime: 'font/woff2', category: 'project' },
  hdr: { mime: 'application/octet-stream', category: 'image' },
  exr: { mime: 'application/octet-stream', category: 'image' },
} as const;

export type LibraryFileExtension = keyof typeof LIBRARY_MEDIA_FORMATS;

export const LIBRARY_FILE_ACCEPT = Object.keys(LIBRARY_MEDIA_FORMATS).map(ext => '.' + ext).join(',');

export function isStoredLibraryMedia(url?: string): url is string {
  return Boolean(url && /^\/api\/(?:library-uploads|cartoon-assets)\/[a-z0-9_.-]+$/i.test(url));
}

export const VIDEO_SCENE_IMAGE = /\.(?:jpe?g|png|webp)$/i;
export const VIDEO_EFFECT_MEDIA = /\.(?:jpe?g|png|webp|gif|mp4|mov|webm)$/i;
export const VIDEO_SOUND_MEDIA = /\.(?:mp3|wav|ogg|m4a)$/i;

export const LIBRARY_VIDEO_EFFECTS = {
  none: 'None',
  fade: 'Fade in / out',
  warm: 'Warm color',
  monochrome: 'Black & white',
  zoom: 'Slow zoom',
} as const;

export const MAX_LIBRARY_VIDEO_IMAGES = 8;
