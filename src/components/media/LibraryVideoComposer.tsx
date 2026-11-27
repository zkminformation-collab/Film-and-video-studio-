import { useState, type FormEvent } from 'react';
import { Download, Film } from 'lucide-react';
import type { LibraryUploadedAsset } from '../../../server/mediaLibraryStore.ts';
import {
  isStoredLibraryMedia, LIBRARY_VIDEO_EFFECTS, MAX_LIBRARY_VIDEO_IMAGES, VIDEO_EFFECT_MEDIA, VIDEO_SCENE_IMAGE, VIDEO_SOUND_MEDIA,
} from '../../data/libraryMediaFormats';
import type { UniversalAsset } from '../../data/libraryData';

interface LibraryVideoResult {
  asset: LibraryUploadedAsset;
  duration: number;
  width: number;
  height: number;
}

interface Props {
  assets: UniversalAsset[];
  initialImage?: UniversalAsset;
  onRendered: (result: LibraryVideoResult) => void;
  onClose: () => void;
}

const fieldClass = 'w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100';
const actionClass = 'rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 disabled:opacity-40';

export function isLibraryRenderImage(asset?: UniversalAsset | null): boolean {
  return Boolean(isStoredLibraryMedia(asset?.mediaUrl) && VIDEO_SCENE_IMAGE.test(asset.mediaUrl));
}

export function LibraryVideoComposer({ assets, initialImage, onRendered, onClose }: Props) {
  const available = assets.filter(asset => isStoredLibraryMedia(asset.mediaUrl));
  const images = available.filter(isLibraryRenderImage);
  const overlays = available.filter(asset => ['vfx', 'animation', 'transition'].includes(asset.category) && VIDEO_EFFECT_MEDIA.test(asset.mediaUrl || ''));
  const audio = available.filter(asset => VIDEO_SOUND_MEDIA.test(asset.mediaUrl || ''));
  const [imageIds, setImageIds] = useState<string[]>(initialImage ? [initialImage.id] : []);
  const [title, setTitle] = useState(initialImage?.name.replace(/\.[^.]+$/, '') || '');
  const [overlayId, setOverlayId] = useState('');
  const [audioId, setAudioId] = useState('');
  const [effect, setEffect] = useState('fade');
  const [seconds, setSeconds] = useState(3);
  const [aspect, setAspect] = useState('16:9');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<LibraryVideoResult | null>(null);

  const moveImage = (index: number, direction: number) => {
    setImageIds(current => {
      const reordered = [...current];
      const nextIndex = index + direction;
      [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
      return reordered;
    });
  };

  const render = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!imageIds.length || busy) return;
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/library/render-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds, title, overlayId, audioId, effect, seconds, aspect }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.error || 'Video rendering failed.');
      setResult(data);
      onRendered(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Video rendering failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="library-video-title"
        className="max-h-[90vh] w-full max-w-lg select-text overflow-y-auto rounded-2xl border border-purple-500/40 bg-[#090b11] p-5 text-xs">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="library-video-title" className="flex items-center gap-2 text-sm font-bold text-white">
            <Film className="h-4 w-4 text-purple-300" /> Create MP4 from Images
          </h2>
          <button type="button" onClick={onClose} disabled={busy} className={actionClass}>Close</button>
        </div>
        <form onSubmit={render} className="space-y-3">
          <fieldset disabled={busy} className="space-y-3">
            <label className="block">Video title
              <input value={title} maxLength={100} className={fieldClass} onChange={e => setTitle(e.target.value)} placeholder="Library video" />
            </label>
            <label className="block">Add scene image
              <select value="" className={fieldClass} disabled={imageIds.length >= MAX_LIBRARY_VIDEO_IMAGES || !images.length}
                onChange={e => { if (e.target.value) setImageIds(ids => [...ids, e.target.value]); }}>
                <option value="">{images.length ? 'Choose an uploaded image' : 'Upload a JPG, PNG or WebP first'}</option>
                {images.filter(asset => !imageIds.includes(asset.id)).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
            {imageIds.length > 0 && (
              <ol aria-label="Scene order" className="space-y-1">
                {imageIds.map((id, index) => (
                  <li key={id} className="flex items-center gap-1 rounded-lg bg-slate-900 p-1">
                    <span className="min-w-0 flex-1 truncate px-2">{index + 1}. {images.find(a => a.id === id)?.name || 'Unavailable image'}</span>
                    <button type="button" aria-label={'Move scene ' + (index + 1) + ' up'} className={actionClass} disabled={index === 0} onClick={() => moveImage(index, -1)}>↑</button>
                    <button type="button" aria-label={'Move scene ' + (index + 1) + ' down'} className={actionClass} disabled={index === imageIds.length - 1} onClick={() => moveImage(index, 1)}>↓</button>
                    <button type="button" aria-label={'Remove scene ' + (index + 1)} className={actionClass} onClick={() => setImageIds(ids => ids.filter(value => value !== id))}>×</button>
                  </li>
                ))}
              </ol>
            )}
            <div className="grid grid-cols-2 gap-2">
              <label>Scene effect
                <select className={fieldClass} value={effect} onChange={e => setEffect(e.target.value)}>
                  {Object.entries(LIBRARY_VIDEO_EFFECTS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
              </label>
              <label>Seconds per image
                <select className={fieldClass} value={seconds} onChange={e => setSeconds(Number(e.target.value))}>
                  {[2, 3, 5].map(value => <option key={value}>{value}</option>)}
                </select>
              </label>
              <label>VFX overlay
                <select className={fieldClass} value={overlayId} onChange={e => setOverlayId(e.target.value)}>
                  <option value="">None</option>
                  {overlays.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </label>
              <label>Audio track
                <select className={fieldClass} value={audioId} onChange={e => setAudioId(e.target.value)}>
                  <option value="">None</option>
                  {audio.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </label>
            </div>
            <label className="block">Video aspect ratio
              <select className={fieldClass} value={aspect} onChange={e => setAspect(e.target.value)}>
                <option value="16:9">16:9 · Landscape</option>
                <option value="9:16">9:16 · Portrait</option>
              </select>
            </label>
          </fieldset>
          <button type="submit" disabled={busy || !imageIds.length}
            className="w-full rounded-lg bg-purple-600 px-3 py-3 font-bold text-white hover:bg-purple-500 disabled:opacity-50">
            {busy ? 'Rendering MP4…' : 'Create MP4'}
          </button>
          {error && <p role="alert" className="text-rose-300">{error}</p>}
        </form>
        {result && (
          <div className="mt-4 space-y-2 border-t border-slate-800 pt-4">
            <p role="status" className="text-emerald-300">Saved in Video Library · {result.width} × {result.height} · {result.duration}s</p>
            <video key={result.asset.url} src={result.asset.url} controls playsInline preload="metadata" className="w-full rounded-lg bg-black" />
            <a href={result.asset.url} download={result.asset.name} className={actionClass + ' inline-flex items-center gap-2'}>
              <Download className="h-4 w-4" /> Download MP4
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
