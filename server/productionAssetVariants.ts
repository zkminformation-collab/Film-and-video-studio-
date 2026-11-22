import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ProductionAssetVariant } from '../src/data/productionAssetVariants';

function renderAudioVariant({ base, index }: ProductionAssetVariant) {
  // The starter WAV files are generated as mono PCM16 with a 44-byte header.
  const source = readFileSync(join(process.cwd(), 'public', base.url.slice(1)));
  const output = Buffer.from(source);
  const samples = (source.length - 44) / 2;
  const rate = source.readUInt32LE(24);
  const pitch = 0.78 + (index % 29) * .015;
  const depth = .08 + Math.floor(index / 29) * .045;
  const delay = Math.floor(rate * (.028 + index * .00031));
  const get = (position: number) => {
    const i = Math.floor(position);
    if (i < 0 || i >= samples - 1) return 0;
    const a = source.readInt16LE(44 + i * 2);
    const b = source.readInt16LE(46 + i * 2);
    return a + (b - a) * (position - i);
  };
  for (let i = 0; i < samples; i++) {
    const fade = Math.min(1, i / 50, (samples - i - 1) / 280);
    const sample = (get(i * pitch) * (1 - depth) + get((i - delay) * pitch) * depth) * fade;
    output.writeInt16LE(Math.round(sample), 44 + i * 2);
  }
  return output;
}

function renderSvgVariant({ base, index }: ProductionAssetVariant) {
  const hue = (index * 37 + base.slug.length * 13) % 360;
  const color = `hsl(${hue} 82% 61%)`;
  const period = (1 + index * .012).toFixed(2);
  const width = 960, height = 540;
  const svg = (inside: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${inside}</svg>`;
  if (base.folder === 'Film Production') {
    const columns = 2 + index % 3, rows = 2 + Math.floor(index / 3) % 3;
    const panelWidth = 884 / columns, panelHeight = 440 / rows;
    const panels = Array.from({ length: columns * rows }, (_, i) => {
      const x = 38 + i % columns * panelWidth, y = 66 + Math.floor(i / columns) * panelHeight;
      return `<rect x="${x}" y="${y}" width="${panelWidth - 12}" height="${panelHeight - 31}" fill="none" stroke="${color}"/><text x="${x + 8}" y="${y + 20}">${i + 1}</text><path d="M${x} ${y + panelHeight - 18}h${panelWidth - 12}" stroke="#334155"/>`;
    }).join('');
    return svg(`<rect width="960" height="540" fill="white"/><g font-family="sans-serif" fill="#0f172a"><text x="38" y="38" font-size="24">Storyboard · ${columns} × ${rows} · Layout ${index}</text>${panels}</g>`);
  }

  const motion = (from: string, to: string) =>
    `<animateTransform attributeName="transform" type="translate" values="${from};${to};${from}" dur="${period}s" repeatCount="indefinite"/>`;
  const spread = 25 + index % 87;
  if (base.folder === 'Video') {
    const background = base.slug === 'green-screen-test-plate' ? '#05c442' : `hsl(${hue} 48% 9%)`;
    const shapes = base.slug === 'neon-city-loop'
      ? Array.from({ length: 13 }, (_, i) => `<rect x="${i * 85 - 50}" y="${145 + (i * index * 17) % 230}" width="71" height="420" fill="${color}" opacity="${.2 + i % 5 * .11}"/>`).join('')
      : base.slug === 'ocean-loop'
      ? Array.from({ length: 9 }, (_, i) => `<path d="M-110 ${250 + i * 34}q240 -50 480 0t480 0t480 0v95H-110Z" fill="${color}" opacity=".17"/>`).join('')
      : base.slug === 'green-screen-test-plate'
      ? `<circle cx="480" cy="270" r="${spread + 20}" fill="#9a48f2"/>`
      : Array.from({ length: 58 }, (_, i) => `<circle cx="${i * 167 % 1040}" cy="${(i * 71 + index * i) % 540}" r="${1 + i % 4}" fill="${color}"/>`).join('');
    return svg(`<rect width="960" height="540" fill="${background}"/><g>${motion('0 0', `${spread - 60} ${index % 21 - 10}`)}${shapes}</g>`);
  }

  if (base.subfolder === 'Lightning') {
    const arc = base.slug === 'electric-arc';
    const points = Array.from({ length: 13 }, (_, i) => arc
      ? `${i * 80},${200 + ((i + 1) * index * 13) % 140}`
      : `${380 + ((i + 1) * index * 13) % 210},${i * 45}`).join(' ');
    return svg(`<polyline points="${points}" fill="none" stroke="${color}" stroke-width="${3 + index % 10}" stroke-linejoin="round" opacity=".9"><animate attributeName="opacity" values=".1;1;.3;.9;.1" dur="${period}s" repeatCount="indefinite"/></polyline>`);
  }
  if (base.subfolder === 'Transitions') {
    if (base.slug === 'iris-wipe') {
      return svg(`<circle cx="${420 + index % 121}" cy="270" r="12" stroke="${color}" stroke-width="55" fill="none"><animate attributeName="r" values="12;560" dur="${period}s" repeatCount="indefinite"/></circle>`);
    }
    return svg(`<g>${motion('-650 0', '1100 0')}<path d="M-150 0h${spread * 2}l-180 540h-${spread * 2}Z" fill="${color}" opacity=".72"/></g>`);
  }
  if (['Explosions', 'Magic', 'Lens Effects'].includes(base.subfolder) && base.slug !== 'magic-sparkles') {
    const radius = spread + 35;
    const fill = base.slug === 'impact-flash' || base.subfolder === 'Lens Effects' ? color : 'none';
    return svg(`<g><ellipse cx="${430 + index % 101}" cy="270" rx="${radius}" ry="${base.subfolder === 'Lens Effects' ? 18 : radius}" fill="${fill}" stroke="${color}" stroke-width="${5 + index % 8}"><animate attributeName="opacity" values=".12;.92;.12" dur="${period}s" repeatCount="indefinite"/><animate attributeName="rx" values="${radius / 2};${radius * 2};${radius / 2}" dur="${period}s" repeatCount="indefinite"/></ellipse></g>`);
  }
  const atmospheric = base.subfolder === 'Smoke';
  const rain = base.slug === 'rain';
  const flame = base.slug === 'campfire';
  const points = Array.from({ length: 32 + index % 33 }, (_, i) => {
    const x = (i * 113 + i * index * 11) % 960, y = (i * 67 + index * 19) % 540;
    const px = flame ? 340 + x % 280 : x, py = flame ? 270 + y % 230 : y;
    const size = atmospheric ? 18 + i % spread : 2 + i % 6;
    return rain
      ? `<path d="M${px} ${py}l-14 33" stroke="${color}" stroke-width="2" opacity=".58"/>`
      : `<circle cx="${px}" cy="${py}" r="${size}" fill="${base.slug === 'bubbles' ? 'none' : color}" stroke="${color}" opacity="${atmospheric ? .13 : .68}"/>`;
  }).join('');
  const up = atmospheric || base.subfolder === 'Fire' || base.slug === 'bubbles';
  return svg(`<g>${motion('0 0', `${index % 45 - 22} ${up ? -spread : spread}`)}${points}</g>`);
}

export function renderProductionVariant(asset: ProductionAssetVariant) {
  if (asset.format === 'WAV') return renderAudioVariant(asset);
  if (asset.format === 'SVG') return renderSvgVariant(asset);
  const columns = asset.base.slug === 'shot-list'
    ? 'Scene,Shot,Framing,Camera movement,Duration seconds,Notes,Status'
    : 'Cue,Scene,Start time,End time,Type,Asset,Gain dB,Notes';
  const rows = 5 + asset.index % 25;
  const start = 1 + Math.floor(asset.index / 25) * 25;
  return columns + '\n' + Array.from({ length: rows }, (_, i) => asset.base.slug === 'shot-list'
    ? `${start},${i + 1},,,,,Planned`
    : `${i + 1},${start},,,SFX,,,`).join('\n') + '\n';
}
