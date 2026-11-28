import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { CartoonStoryScene } from '../src/data/cartoonStoryPlan.ts';

const exec = promisify(execFile);
const inputArgs = ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y'];

export async function cartoonizeSceneImage(source: string, output: string) {
  await exec('ffmpeg', [
    ...inputArgs, '-protocol_whitelist', 'file', '-threads', '1', '-max_pixels', '17000000', '-i', source,
    '-vf', "scale=1280:1280:force_original_aspect_ratio=decrease,format=rgb24," +
      "lutrgb=r='floor(val/32)*32+12':g='floor(val/32)*32+12':b='floor(val/32)*32+12'," +
      'eq=contrast=1.08:saturation=1.30,unsharp=5:5:0.65,format=rgb24',
    '-frames:v', '1', '-threads', '1', output,
  ], { timeout: 25_000 });
}

export async function encodePlannedCartoonScene(input: {
  source: string;
  motion?: boolean;
  output: string;
  duration: number;
  aspect: string;
  dimensions?: readonly [number, number];
  effect: CartoonStoryScene['effect'];
}) {
  const [width, height] = input.dimensions ?? (input.aspect === '9:16' ? [720, 1280] : [1280, 720]);
  const duration = input.duration;
  const fit = 'scale=' + width + ':' + height + ':force_original_aspect_ratio=decrease,' +
    'pad=' + width + ':' + height + ':(ow-iw)/2:(oh-ih)/2,setsar=1';
  const effectFilters = {
    none: 'null',
    fade: 'fade=t=in:d=0.4,fade=t=out:st=' + Math.max(0.5, duration - 0.4) + ':d=0.4',
    warm: 'colorbalance=rs=0.09:bs=-0.08,eq=saturation=1.12',
    monochrome: 'hue=s=0',
    zoom: "zoompan=z='min(max(zoom,pzoom)+0.0013,1.18)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=" + width + 'x' + height + ':fps=24',
  };
  const extend = input.motion ? 'tpad=stop_mode=clone:stop_duration=' + duration
    : 'trim=end_frame=1,loop=loop=-1:size=1:start=0,setpts=N/(24*TB)';

  await exec('ffmpeg', [
    ...inputArgs, '-protocol_whitelist', 'file', '-threads', '1', '-max_pixels', '17000000', '-i', input.source,
    '-map', '0:v:0', '-vf', [fit, extend, 'fps=24', effectFilters[input.effect] || 'null', 'setsar=1', 'format=yuv420p'].join(','),
    '-t', String(duration), '-an', '-c:v', 'libx264', '-threads', '2', '-preset', 'veryfast', '-crf', '23',
    '-movflags', '+faststart', input.output,
  ], { timeout: 75_000 });
}
