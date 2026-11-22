import { useId, useState } from 'react';
import { builtinProductionAssets, type BuiltinProductionAsset, type ProductionAssetFolder } from '../../data/builtinProductionAssets';
import { productionAssetVariant, variantsPerAsset } from '../../data/productionAssetVariants';

export function BuiltinProductionLibrary({ title, folders, soundOnly = false, onAdd, addLabel = 'Add to timeline' }: {
  title: string;
  folders: ProductionAssetFolder[];
  soundOnly?: boolean;
  onAdd?: (asset: BuiltinProductionAsset) => void;
  addLabel?: string;
}) {
  const chooserId = useId();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [addedId, setAddedId] = useState('');
  const [search, setSearch] = useState('');
  const [variantEnabled, setVariantEnabled] = useState(false);
  const [variantIndex, setVariantIndex] = useState(1);
  const assets = builtinProductionAssets.filter((asset) => folders.includes(asset.folder) && (!soundOnly || asset.subfolder !== 'Music'));
  const query = search.trim().toLowerCase();
  const families = assets.filter((asset) => `${asset.name} ${asset.folder} ${asset.subfolder}`.toLowerCase().includes(query));
  const family = families.find((asset) => asset.assetId === selectedId) ?? families[0];
  const selected = family && variantEnabled ? productionAssetVariant(family, variantIndex) : family;

  return (
    <details onToggle={(event) => setOpen(event.currentTarget.open)} className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-slate-100">
      <summary className="cursor-pointer text-sm font-semibold">{title} · {(assets.length * (variantsPerAsset + 1)).toLocaleString()} assets</summary>
      {open && (
        <div className="mt-3 space-y-2">
          <label htmlFor={`${chooserId}-search`} className="block text-xs font-medium">Search asset families</label>
          <input id={`${chooserId}-search`} value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Fire, footsteps, storyboard…" className="w-full rounded-md border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm" />
          {!selected ? <p role="status" className="text-sm">No asset families match.</p> : <>
          <label htmlFor={chooserId} className="block text-xs font-medium">Choose an asset family</label>
          <select id={chooserId} value={family?.assetId} onChange={(event) => { setSelectedId(event.target.value); setAddedId(''); }}
            className="w-full rounded-md border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm">
            {families.map((asset) => <option key={asset.assetId} value={asset.assetId}>{asset.subfolder} · {asset.name}</option>)}
          </select>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={variantEnabled} onChange={(event) => setVariantEnabled(event.target.checked)} /> Generated variant</label>
            {variantEnabled && <label className="flex items-center gap-2">Variant
              <select value={variantIndex} onChange={(event) => setVariantIndex(Number(event.target.value))}
                className="rounded-md border border-slate-600 bg-slate-950 px-2 py-1">
                {Array.from({ length: variantsPerAsset }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}
              </select>
            </label>}
          </div>
          <p className="text-xs text-slate-300">{selected.name} · {selected.format}{variantEnabled && selected.format === 'SVG' && selected.folder !== 'Film Production' ? ' animation' : ''}</p>
          {selected.format === 'WebM' && <video key={selected.assetId} src={selected.url} controls playsInline muted preload="metadata" aria-label={selected.name} className="max-h-40 w-full rounded bg-slate-950 object-contain" />}
          {selected.format === 'WAV' && <audio key={selected.assetId} src={selected.url} controls preload="metadata" aria-label={selected.name} className="w-full" />}
          {selected.format === 'SVG' && <img src={selected.url} alt={selected.name} className="max-h-40 w-full object-contain" />}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a href={selected.url} download className="text-cyan-300 underline">Download {selected.format}</a>
            {onAdd && selected.durationSec && <button type="button" onClick={() => { onAdd(selected); setAddedId(selected.assetId); }}
              className="rounded border border-cyan-400/40 px-2 py-1 text-cyan-200">{addLabel}</button>}
            {addedId === selected.assetId && <span role="status" className="text-emerald-300">Added {selected.name}</span>}
          </div>
          </>}
        </div>
      )}
    </details>
  );
}
