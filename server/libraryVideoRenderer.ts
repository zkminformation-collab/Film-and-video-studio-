import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  LIBRARY_VIDEO_EFFECTS, MAX_LIBRARY_VIDEO_IMAGES, VIDEO_EFFECT_MEDIA, VIDEO_SCENE_IMAGE, VIDEO_SOUND_MEDIA,
} from '../src/data/libraryMediaFormats.ts';
import { getStoredLibraryAsset, registerExistingLibraryAsset } from './mediaLibraryStore.ts';

const exec = promisify(execFile);
const fps = 24;
let rendering = false;

export class LibraryRenderError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function resolveInput(id: unknown, allowed: RegExp, label: string) {
  const item = typeof id === 'string' ? getStoredLibraryAsset(id) : undefined;
  if (!item || !allowed.test(item.filePath)) {
    throw new LibraryRenderError(400, label + ' is missing or has an unsupported format. Upload it again or choose another file.');
  }
  return item;
}

export async function renderLibraryVideo(input: Record<string, unknown>) {
  const { imageIds, overlayId, audioId, effect = 'none', seconds = 3, aspect = '16:9' } = input;
  if (!Array.isArray(imageIds) || !imageIds.length || imageIds.length > MAX_LIBRARY_VIDEO_IMAGES) {
    throw new LibraryRenderError(400, 'Choose between 1 and ' + MAX_LIBRARY_VIDEO_IMAGES + ' uploaded images.');
  }
  if (typeof effect !== 'string' || !Object.hasOwn(LIBRARY_VIDEO_EFFECTS, effect) ||
      typeof seconds !== 'number' || ![2, 3, 5].includes(seconds) ||
      (aspect !== '16:9' && aspect !== '9:16')) {
    throw new LibraryRenderError(400, 'Choose a supported duration, aspect ratio and effect.');
  }
  if (rendering) {
    throw new LibraryRenderError(429, 'A library video is rendering. Try again when it finishes.');
  }

  const images = imageIds.map(id => resolveInput(id, VIDEO_SCENE_IMAGE, 'A scene image'));
  const overlay = overlayId ? resolveInput(overlayId, VIDEO_EFFECT_MEDIA, 'The VFX overlay') : undefined;
  const audio = audioId ? resolveInput(audioId, VIDEO_SOUND_MEDIA, 'The audio') : undefined;
  const title = typeof input.title === 'string' && input.title.trim() ? input.title.trim().slice(0, 100) : 'Library video';
  const [width, height] = aspect === '9:16' ? [720, 1280] : [1280, 720];
  const duration = seconds * images.length;
  const frames = seconds * fps;

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'zkmap-library-video-'));
  const output = path.join(temp, 'render.mp4');
  rendering = true;
  try {
    const args = ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-filter_complex_threads', '1'];
    const imageInputOptions = ['-protocol_whitelist', 'file', '-threads', '1', '-max_pixels', '17000000'];
    for (const image of images) args.push(...imageInputOptions, '-i', image.filePath);
    const isStillOverlay = overlay && VIDEO_SCENE_IMAGE.test(overlay.filePath);
    if (overlay) {
      if (!isStillOverlay) args.push('-stream_loop', '-1');
      args.push(...imageInputOptions, '-i', overlay.filePath);
    }
    if (audio) args.push('-stream_loop', '-1', '-protocol_whitelist', 'file', '-i', audio.filePath);

    const fit = 'scale=' + width + ':' + height + ':force_original_aspect_ratio=decrease,' +
      'pad=' + width + ':' + height + ':(ow-iw)/2:(oh-ih)/2,setsar=1';
    const effectFilters: Record<string, string> = {
      fade: 'fade=t=in:d=0.4,fade=t=out:st=' + (seconds - 0.4) + ':d=0.4',
      warm: 'colorbalance=rs=0.09:bs=-0.08,eq=saturation=1.12',
      monochrome: 'hue=s=0',
    };
    const filters = images.map((_, i) => {
      const timing = effect === 'zoom'
        ? "zoompan=z='min(zoom+0.0016,1.18)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=" +
          frames + ':s=' + width + 'x' + height + ':fps=' + fps
        : 'loop=loop=-1:size=1:start=0,setpts=N/(' + fps + '*TB),fps=' + fps;
      const filtersForScene = [fit, 'trim=end_frame=1', timing, 'trim=end_frame=' + frames];
      if (Object.hasOwn(effectFilters, effect)) filtersForScene.push(effectFilters[effect]);
      filtersForScene.push('setsar=1', 'format=yuv420p', 'setpts=PTS-STARTPTS');
      return '[' + i + ':v]' + filtersForScene.join(',') + '[scene' + i + ']';
    });
    const scenes = images.map((_, i) => '[scene' + i + ']').join('');
    const outputLabel = overlay ? 'base' : 'out';
    filters.push(images.length === 1
      ? scenes + 'null[' + outputLabel + ']'
      : scenes + 'concat=n=' + images.length + ':v=1:a=0[' + outputLabel + ']');
    if (overlay) {
      const overlayInput = '[' + images.length + ':v]';
      const overlaySize = 'scale=' + width + ':' + height + ':force_original_aspect_ratio=decrease';
      const overlayPad = 'pad=' + width + ':' + height + ':(ow-iw)/2:(oh-ih)/2';
      if (isStillOverlay) {
        filters.push(overlayInput + overlaySize + ',format=rgba,' + overlayPad + ':color=black@0,' +
          'colorchannelmixer=aa=0.8,setpts=PTS-STARTPTS[effect]');
        filters.push('[base][effect]overlay=eof_action=repeat:format=auto,format=yuv420p[out]');
      } else {
        filters.push(overlayInput + overlaySize + ',' + overlayPad +
          ',setsar=1,fps=' + fps + ',format=yuv420p,setpts=PTS-STARTPTS[effect]');
        filters.push('[base][effect]blend=all_mode=screen:all_opacity=0.70:shortest=1,format=yuv420p[out]');
      }
    }
    args.push('-filter_complex', filters.join(';'), '-map', '[out]');
    if (audio) {
      const audioIndex = images.length + (overlay ? 1 : 0);
      args.push('-map', audioIndex + ':a:0', '-c:a', 'aac', '-b:a', '128k');
    } else {
      args.push('-an');
    }
    args.push('-t', String(duration), '-r', String(fps), '-c:v', 'libx264', '-threads', '2',
      '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output);
    try {
      await exec('ffmpeg', args, { timeout: 75_000, maxBuffer: 128 * 1024 });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new LibraryRenderError(503, 'FFmpeg is unavailable on the video server.');
      }
      console.warn('Library video render failed:', (error as { code?: string }).code);
      throw new LibraryRenderError(422, 'The video could not be encoded. Check that the selected media plays and try fewer or smaller files.');
    }

    const sizeBytes = fs.statSync(output).size;
    if (!sizeBytes) throw new LibraryRenderError(422, 'The encoder returned an empty video.');
    const filename = 'library-video-' + randomUUID() + '.mp4';
    const savedPath = path.resolve('.data/library-uploads', filename);
    fs.copyFileSync(output, savedPath, fs.constants.COPYFILE_EXCL);
    try {
      const asset = registerExistingLibraryAsset({
        name: title + '.mp4',
        category: 'video',
        subcategory: 'Image to Video',
        source: 'rendered',
        format: 'MP4',
        mimeType: 'video/mp4',
        sizeBytes,
        url: '/api/library-uploads/' + filename,
        thumbnail: images[0].asset.url,
        description: images.length + ' images · ' + duration + ' seconds · ' + LIBRARY_VIDEO_EFFECTS[effect as keyof typeof LIBRARY_VIDEO_EFFECTS],
        tags: ['Image to Video', 'Rendered', 'MP4'],
      });
      return { asset, duration, width, height, fps };
    } catch (error) {
      fs.rmSync(savedPath, { force: true });
      throw error;
    }
  } finally {
    rendering = false;
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
