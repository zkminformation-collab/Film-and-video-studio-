import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { builtinProductionAssets } from '../src/data/builtinProductionAssets.ts';

const output = fileURLToPath(new URL('../public/assets/production-pack/', import.meta.url));
mkdirSync(output, { recursive: true });
const tau = Math.PI * 2;
const sin = Math.sin;
const clamp = (n) => Math.max(0, Math.min(1, n));
const fract = (n) => n - Math.floor(n);
const noise = (n) => fract(sin(n * 127.1 + 31.7) * 43758.5453);
const glow = (distance, size) => clamp(1 - Math.abs(distance) / size);

function drawVideo(asset, path) {
  const width = 240, height = 136, fps = 20, frameCount = fps * asset.durationSec;
  const pixels = Buffer.alloc(width * height * 4 * frameCount);
  const overlay = asset.folder === 'VFX';
  const id = asset.slug;
  for (let frame = 0, i = 0; frame < frameCount; frame++) {
    const t = frame / frameCount;
    for (let row = 0; row < height; row++) for (let col = 0; col < width; col++) {
      const x = col / width, y = row / height;
      const dx = x - .5, dy = (y - .52) * .72;
      const r = Math.hypot(dx, dy);
      let rgb = [104, 222, 255], a = 0;
      switch (id) {
        case 'campfire': {
          const lift = (.86 - y) / .56;
          const widthAtHeight = .23 * (1 - lift);
          a = lift >= 0 && lift < 1 ? glow(dx + sin(y * 29 + t * tau * 4) * lift * .05, widthAtHeight) * (1 - lift * .7) : 0;
          rgb = [255, 80 + Math.round(a * 158), 24]; break;
        }
        case 'ground-fog':
        case 'rising-smoke': {
          const fog = id === 'ground-fog';
          const distance = fog ? y - .72 + .07 * sin(x * 9 + tau * t) : dx + .10 * sin(y * 8 + tau * t);
          a = glow(distance, fog ? .19 : .15) * (.36 + .18 * sin(x * 25 + y * 31 + t * tau * 2));
          a *= fog ? 1 : glow(y - .49, .45);
          rgb = fog ? [178, 202, 222] : [164, 152, 176]; break;
        }
        case 'energy-burst':
        case 'impact-flash': {
          const fade = (1 - t) ** 2;
          a = fade * (id === 'energy-burst' ? glow(r - t * .58, .055) : glow(r, .20 + t * .48));
          rgb = id === 'energy-burst' ? [255, 139, 49] : [255, 244, 184]; break;
        }
        case 'lightning-bolt':
        case 'electric-arc': {
          const arc = id === 'electric-arc';
          const axis = arc ? x : y;
          const bolt = .49 + .08 * sin(axis * 67) + .06 * sin(axis * 21 + Math.floor(t * 8));
          a = glow((arc ? y : x) - bolt, .032) * glow(axis - .5, .51) * (.28 + .72 * Math.abs(sin(t * tau * 4)));
          rgb = arc ? [181, 113, 255] : [136, 210, 255]; break;
        }
        case 'portal-ring':
          a = glow(r - .25 - .017 * sin(t * tau), .035) * (.80 + .20 * sin(Math.atan2(dy, dx) * 9 + t * tau * 2));
          rgb = [187, 103, 255]; break;
        case 'lens-flare':
          a = glow(y - .51, .038) * glow(dx - .23 * sin(t * tau), .45) * .65;
          a = Math.max(a, glow(Math.hypot(dx - .23 * sin(t * tau), dy), .075));
          rgb = [189, 221, 255]; break;
        case 'light-sweep':
          a = glow(x + y * .4 - (t * 1.7 - .16), .16) * .85; rgb = [235, 247, 255]; break;
        case 'iris-wipe':
          a = clamp((r - t * .69) * 85); rgb = [5, 7, 18]; break;
        case 'glitch-sweep':
          a = glow(x - t, .24) * noise(Math.floor(y * 54) + frame * 11) * (Math.floor(y * 71) % 3 === 0 ? .95 : .25);
          rgb = Math.floor(y * 22) % 2 ? [247, 65, 157] : [57, 220, 251]; break;
        case 'neon-city-loop': {
          const u = fract(x + .1 * sin(t * tau));
          const block = Math.floor(u * 14);
          const building = y > .34 + noise(block) * .34 && fract(u * 14) < .87;
          const window = building && fract(u * 56) < .45 && fract(y * 23) < .32;
          rgb = window ? [67, 232, 250] : building ? [25, 20, 63] : [20 + y * 68, 10, 43 + y * 79]; a = 1; break;
        }
        case 'ocean-loop': {
          const crest = .46 + .021 * sin(x * 19 + t * tau);
          const wave = sin(y * 85 + x * 8 + t * tau);
          rgb = y < crest ? [48 + y * 78, 129 + y * 63, 181] : [14, 94 + wave * 23, 153 + wave * 30]; a = 1; break;
        }
        case 'green-screen-test-plate':
          rgb = r < .12 ? [159, 52, 237] : [0, 210, 47]; a = 1; break;
        default: {
          const rain = id === 'rain';
          const stars = id === 'star-field-loop';
          const upward = ['embers', 'bubbles', 'magic-sparkles'].includes(id);
          const shift = (upward ? 1 : -1) * t;
          const u = fract(x + (rain ? y * .16 : 0) + .012 * sin(y * 9 + t * tau));
          const v = fract(y + shift);
          const gx = u * (rain ? 22 : 13), gy = v * (rain ? 15 : 8);
          const seed = Math.floor(gx) + Math.floor(gy) * 29;
          const px = fract(gx) - .22 - noise(seed) * .55;
          const py = fract(gy) - .23 - noise(seed + 441) * .55;
          const distance = Math.hypot(px, py);
          a = rain ? glow(px, .056) * glow(py, .43) : id === 'bubbles' ? glow(distance - .14, .055) : glow(distance, id === 'snow' ? .21 : .13);
          a *= .42 + .58 * noise(seed + 714);
          rgb = id === 'embers' ? [255, 104, 26] : id === 'magic-sparkles' ? [231, 147, 255] : id === 'dust-motes' ? [244, 215, 152] : [196, 234, 255];
          if (stars) { rgb = rgb.map((channel) => 10 + channel * a); a = 1; }
        }
      }
      pixels[i++] = rgb[0]; pixels[i++] = rgb[1]; pixels[i++] = rgb[2]; pixels[i++] = Math.round(clamp(a) * 255);
    }
  }
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pixel_format', 'rgba',
    '-video_size', `${width}x${height}`, '-framerate', String(fps), '-i', 'pipe:0', '-an', '-c:v', 'libvpx-vp9',
    '-pix_fmt', overlay ? 'yuva420p' : 'yuv420p', '-b:v', '0', '-crf', '34', '-deadline', 'realtime', '-cpu-used', '5', path],
  { input: pixels, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.error?.message ?? result.stderr);
}

function writeAudio(asset, path) {
  const rate = 24000, count = rate * asset.durationSec;
  const wav = Buffer.alloc(44 + count * 2);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36);
  wav.writeUInt32LE(count * 2, 40);
  let low = 0;
  for (let i = 0; i < count; i++) {
    const t = i / rate, n = noise(i) * 2 - 1;
    const tone = (hz) => sin(tau * hz * t);
    low = low * .91 + n * .09;
    let sample;
    switch (asset.slug) {
      case 'ambient-bed': sample = (.45 * tone(130.81) + .26 * tone(196) + .13 * tone(261.63)) * (.74 + .26 * tone(.5)); break;
      case 'cartoon-cue': sample = sin(tau * [392, 523.25, 440, 659.25][Math.floor(t * 4) % 4] * fract(t * 4) / 4) * Math.exp(-3 * fract(t * 4)); break;
      case 'tension-pulse': sample = (.7 * tone(55) + .3 * tone(110)) * Math.exp(-3 * fract(t * 2)); break;
      case 'whoosh': sample = (low + .22 * n) * sin(Math.PI * t / 2) ** 3; break;
      case 'hit-impact': sample = (tone(68) * .62 + n * .38) * Math.exp(-11 * t); break;
      case 'door-creak': sample = (sin(tau * (91 * t + 44 * t ** 2)) + n * .24) * (.35 + .30 * tone(8)) * sin(Math.PI * t / 2); break;
      case 'magic-chime': sample = (tone(660) + .4 * tone(1325) + .3 * tone(1740)) * Math.exp(-3 * t); break;
      case 'cartoon-pop': sample = sin(tau * (470 * t - 215 * t ** 2)) * Math.exp(-11 * t); break;
      case 'ui-beep': sample = (t < .17 || (t > .28 && t < .47)) ? .6 * tone(t < .17 ? 620 : 830) : 0; break;
      case 'wood-footsteps':
      case 'gravel-footsteps': {
        const heel = fract(t * 2);
        sample = Math.exp(-24 * heel) * (asset.slug === 'wood-footsteps' ? .8 * tone(115) + .2 * n : .85 * n + .15 * tone(95)); break;
      }
      case 'rain-ambience': sample = n * .20 + low * .35 + (noise(i + 11245) > .987 ? .3 : 0); break;
      case 'wind-gust': sample = low * (1 + tone(1.2)) * 1.2; break;
      case 'thunder': sample = (low + tone(36) * .26) * (Math.exp(-2 * t) + .4 * Math.exp(-18 * (t - .36) ** 2)); break;
      case 'bird-chirps': sample = sin(tau * (880 * t + 125 * sin(t * 12))) * Math.exp(-90 * (fract(t * 2.4) - .25) ** 2) * .48; break;
      case 'bass-drop': sample = sin(tau * (30 * t + 21 * (1 - Math.exp(-4 * t)))) * Math.exp(-1.2 * t); break;
      case 'riser': sample = (sin(tau * (80 * t + 145 * t ** 2)) * .45 + low) * (t / 2) ** 2; break;
      default: sample = (tone(44) * .48 + low + n * .28) * Math.exp(-3.2 * t);
    }
    const edgeFade = Math.min(1, t * 160, (count - i - 1) / (rate * .035));
    const bounded = Math.max(-1, Math.min(1, sample * .59 * edgeFade));
    wav.writeInt16LE(Math.round(bounded * 32767), 44 + i * 2);
  }
  writeFileSync(path, wav);
}

for (const asset of builtinProductionAssets) {
  const path = output + asset.url.split('/').at(-1);
  if (asset.format === 'WebM') drawVideo(asset, path);
  else if (asset.format === 'WAV') writeAudio(asset, path);
  else if (asset.format === 'SVG') {
    const panels = Array.from({ length: 6 }, (_, i) => {
      const x = 38 + (i % 3) * 309, y = 80 + Math.floor(i / 3) * 235;
      return `<rect x="${x}" y="${y}" width="281" height="158"/><path d="M${x} ${y + 183}h281m-281 22h281"/><text x="${x + 7}" y="${y + 22}">${i + 1}</text>`;
    });
    writeFileSync(path, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 560"><rect width="1000" height="560" fill="white"/><text x="38" y="48" font-size="25" font-family="sans-serif">Storyboard — project / scene / date</text><g fill="none" stroke="#334155">${panels.join('')}</g></svg>\n`);
  } else {
    writeFileSync(path, asset.slug === 'shot-list'
      ? 'Scene,Shot,Framing,Camera movement,Duration seconds,Notes,Status\n1,1,,,,,Planned\n'
      : 'Cue,Scene,Start time,End time,Type,Asset,Gain dB,Notes\n1,1,,,SFX,,,\n');
  }
}
console.log(`Generated ${builtinProductionAssets.length} production assets.`);
