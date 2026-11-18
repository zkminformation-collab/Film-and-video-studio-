import React, { useCallback, useEffect, useState } from 'react';
import {
  Search,
  Download,
  ExternalLink,
  Film,
  Sparkles,
  Box,
  Image as ImageIcon,
  Layers,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { FilmProject, StudioModule, StudioTheme } from '../../types';
import { useStudioAi } from '../../context/StudioAiContext';

interface IconScoutItem {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  asset: 'lottie' | '3d' | 'icon' | 'illustration' | string;
  isPremium: boolean;
  price: number;
  width: number;
  height: number;
  previewUrl: string;
  isVideo: boolean;
  pageUrl: string;
}

interface IconScoutBrowserProps {
  activeFilm: FilmProject;
  theme?: StudioTheme;
  onSendToEditor?: () => void;
  onNavigate?: (module: StudioModule) => void;
}

type AssetType = 'lottie' | '3d' | 'icon' | 'illustration';

const QUICK_QUERIES = ['camera', 'film', 'robot', 'fire', 'sword', 'rocket', 'music', 'magic'];

export const IconScoutBrowser: React.FC<IconScoutBrowserProps> = ({
  activeFilm,
  theme = 'elevenlabs',
  onSendToEditor,
  onNavigate,
}) => {
  const isLight = theme === 'elevenlabs';
  const { addAssetToTimeline, addQueueItem } = useStudioAi();

  const [queryInput, setQueryInput] = useState<string>('camera');
  const [activeQuery, setActiveQuery] = useState<string>('camera');
  const [assetType, setAssetType] = useState<AssetType>('lottie');
  const [priceFilter, setPriceFilter] = useState<'' | 'free'>('');
  const [sortBy, setSortBy] = useState<'relevant' | 'popular' | 'latest'>('relevant');
  const [page, setPage] = useState<number>(1);

  const [items, setItems] = useState<IconScoutItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [lastPage, setLastPage] = useState<number>(1);
  const [hasDownloadSecret, setHasDownloadSecret] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [selected, setSelected] = useState<IconScoutItem | null>(null);
  const [previewSurface, setPreviewSurface] = useState<'dark' | 'light'>(isLight ? 'light' : 'dark');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const fetchResults = useCallback(
    async (q: string, asset: AssetType, price: '' | 'free', sort: string, targetPage: number) => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          query: q || 'cinema',
          asset,
          sort,
          page: String(targetPage),
          per_page: '24',
        });
        if (price) params.set('price', price);

        const resp = await fetch(`/api/iconscout/search?${params.toString()}`);
        const data = await resp.json();
        if (!resp.ok || !data?.success) {
          setError(data?.error || 'Failed to load IconScout assets.');
          setItems([]);
          return;
        }
        const list: IconScoutItem[] = Array.isArray(data.items) ? data.items : [];
        setItems(list);
        setTotal(Number(data.total || list.length));
        setLastPage(Number(data.lastPage || 1));
        setHasDownloadSecret(Boolean(data.hasDownloadSecret));
        setSelected((prev) => {
          if (prev && list.some((i) => i.uuid === prev.uuid)) return prev;
          return list[0] || null;
        });
      } catch {
        setError('Unable to reach the IconScout search proxy.');
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchResults(activeQuery, assetType, priceFilter, sortBy, page);
  }, [activeQuery, assetType, priceFilter, sortBy, page, fetchResults]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveQuery(queryInput.trim() || 'cinema');
  };

  const handleQuickQuery = (q: string) => {
    setQueryInput(q);
    setPage(1);
    setActiveQuery(q);
  };

  const handleAddToTimeline = () => {
    if (!selected) return;
    addAssetToTimeline({
      id: `iconscout-${selected.id}-${Date.now()}`,
      name: `${selected.name.replace(/\s+/g, '_')}_IconScout.${selected.isVideo ? 'mp4' : 'png'}`,
      category: 'animation',
      subcategory: `IconScout ${selected.asset.toUpperCase()}`,
      source: 'licensed',
      format: selected.isVideo ? 'MP4 / Lottie' : 'PNG / Vector',
      size: selected.isVideo ? '120 KB' : '64 KB',
      duration: selected.isVideo ? '00:04' : '00:05',
      resolution: selected.width && selected.height ? `${selected.width}x${selected.height}` : '1080x1080',
      thumbnail: selected.previewUrl,
      mediaUrl: selected.previewUrl,
      description: `IconScout ${selected.asset} asset "${selected.name}" added to ${activeFilm.title}`,
      tags: ['IconScout', selected.asset, activeQuery],
      license: {
        type: 'Royalty-Free Worldwide',
        commercialUse: true,
        attribution: 'IconScout API v3',
        certificateId: `IS-${selected.id}`,
        verified: true,
      },
      specs: { codec: selected.isVideo ? 'H.264 / Lottie' : 'PNG', fps: 30 },
      isFavorite: false,
      addedAt: new Date().toISOString().split('T')[0],
      usageCount: 1,
    });

    addQueueItem({
      tool: 'IconScout Library',
      prompt: `${selected.asset.toUpperCase()}: ${selected.name} (#${selected.id})`,
      provider: 'IconScout API v3',
      status: 'Completed',
      progress: 100,
    });

    setStatusMessage(`Added "${selected.name}" to ${activeFilm.title} timeline.`);
    if (onSendToEditor) {
      onSendToEditor();
    } else if (onNavigate) {
      onNavigate('editor');
    }
  };

  const handleApiDownload = async (format: string) => {
    if (!selected) return;
    setDownloading(true);
    setStatusMessage('');
    try {
      const resp = await fetch('/api/iconscout/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid: selected.uuid, format }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.success || !data?.downloadUrl) {
        setStatusMessage(data?.error || 'Download endpoint returned no file URL.');
        return;
      }
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = `${selected.slug || selected.id}.${format}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
      setStatusMessage(`Download ready for "${selected.name}" (${format.toUpperCase()}).`);
    } catch {
      setStatusMessage('Unable to complete IconScout API download.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search & Asset Type Controls */}
      <div className={`px-6 py-3 border-b space-y-2.5 shrink-0 ${isLight ? 'bg-white border-neutral-200' : 'bg-slate-950/70 border-slate-800'}`}>
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
            <div className="relative flex-1">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-neutral-400' : 'text-slate-500'}`} />
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Search IconScout icons, 3D, illustrations, Lottie..."
                className={`w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border outline-none ${
                  isLight
                    ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-purple-500'
                    : 'bg-slate-900 border-slate-700 text-slate-100 focus:border-purple-500'
                }`}
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
            >
              Search
            </button>
          </form>

          {/* Asset Type Selector */}
          <div className="flex items-center gap-1">
            {(
              [
                ['lottie', 'Lottie', Sparkles],
                ['3d', '3D Assets', Box],
                ['icon', 'Icons', Layers],
                ['illustration', 'Illustrations', ImageIcon],
              ] as [AssetType, string, React.ElementType][]
            ).map(([type, label, IconComp]) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setAssetType(type);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  assetType === type
                    ? 'bg-purple-600 text-white border-purple-600'
                    : isLight
                    ? 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Price & Sort */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPriceFilter((p) => (p === 'free' ? '' : 'free'));
                setPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                priceFilter === 'free'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : isLight
                  ? 'bg-white border-neutral-200 text-neutral-700'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              {priceFilter === 'free' ? 'Free Only: ON' : 'All Prices'}
            </button>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as 'relevant' | 'popular' | 'latest');
                setPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border outline-none ${
                isLight
                  ? 'bg-white border-neutral-300 text-neutral-800'
                  : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            >
              <option value="relevant">Relevant</option>
              <option value="popular">Popular</option>
              <option value="latest">Latest</option>
            </select>
          </div>
        </div>

        {/* Quick Film Queries */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className={`text-[11px] font-semibold mr-1 ${isLight ? 'text-neutral-500' : 'text-slate-400'}`}>
            Quick:
          </span>
          {QUICK_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleQuickQuery(q)}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium capitalize border transition-colors ${
                activeQuery === q
                  ? 'bg-purple-600 text-white border-purple-600'
                  : isLight
                  ? 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {q}
            </button>
          ))}
          <span className={`ml-auto text-[11px] font-mono whitespace-nowrap ${isLight ? 'text-neutral-500' : 'text-slate-400'}`}>
            {total.toLocaleString()} results
          </span>
        </div>
      </div>

      {/* Main Split View: Results Grid + Inspector */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          {statusMessage && (
            <div className={`mb-4 px-3.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between border ${isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
              <span>{statusMessage}</span>
              <button type="button" onClick={() => setStatusMessage('')} className="text-xs underline ml-3">
                Dismiss
              </button>
            </div>
          )}

          {error && (
            <div className={`mb-4 px-4 py-3 rounded-xl border text-xs flex items-center gap-2 ${isLight ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {Array.from({ length: 18 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-32 rounded-xl border animate-pulse ${isLight ? 'bg-neutral-100 border-neutral-200' : 'bg-slate-900 border-slate-800'}`}
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className={`py-16 text-center rounded-xl border ${isLight ? 'bg-neutral-50 border-neutral-200 text-neutral-600' : 'bg-slate-900/50 border-slate-800 text-slate-400'}`}>
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">No IconScout assets found for &ldquo;{activeQuery}&rdquo;</p>
              <p className="text-xs mt-1">Try another search term or switch asset category.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                {items.map((item) => {
                  const isSelected = selected?.uuid === item.uuid;
                  return (
                    <button
                      key={item.uuid || item.id}
                      type="button"
                      onClick={() => setSelected(item)}
                      className={`flex flex-col items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? isLight
                            ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500'
                            : 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500'
                          : isLight
                          ? 'bg-white border-neutral-200 hover:border-purple-300 hover:shadow-sm'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="w-full h-24 rounded-lg flex items-center justify-center overflow-hidden bg-white/5">
                        {item.isVideo ? (
                          <video
                            src={item.previewUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="max-h-24 max-w-full object-contain rounded"
                          />
                        ) : (
                          <img
                            src={item.previewUrl}
                            alt={item.name}
                            loading="lazy"
                            className="max-h-20 max-w-full object-contain"
                          />
                        )}
                      </div>
                      <div className="w-full mt-2 pt-1.5 border-t border-current/10 flex items-center justify-between gap-1">
                        <span className="text-[11px] font-semibold truncate">{item.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono shrink-0 ${
                            item.isPremium
                              ? isLight
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-amber-500/20 text-amber-300'
                              : isLight
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {item.isPremium ? 'Pro' : 'Free'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-40 ${
                    isLight ? 'bg-white border-neutral-300 text-neutral-800' : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </button>
                <span className="text-xs font-mono opacity-75">
                  Page {page} of {Math.min(lastPage, 500)}
                </span>
                <button
                  type="button"
                  disabled={page >= lastPage}
                  onClick={() => setPage((p) => p + 1)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-40 ${
                    isLight ? 'bg-white border-neutral-300 text-neutral-800' : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Inspector Panel */}
        {selected && (
          <aside className={`w-full lg:w-96 border-t lg:border-t-0 lg:border-l overflow-y-auto p-5 space-y-5 shrink-0 ${isLight ? 'bg-[#FAFAFB] border-neutral-200' : 'bg-slate-900/70 border-slate-800'}`}>
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold truncate">{selected.name}</h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${isLight ? 'bg-purple-100 text-purple-800' : 'bg-purple-500/20 text-purple-300'}`}>
                  {selected.asset}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-neutral-600' : 'text-slate-400'}`}>
                ID #{selected.id} · {selected.width && selected.height ? `${selected.width}×${selected.height}px` : 'Vector'} · {selected.isPremium ? 'Premium' : 'Free'}
              </p>
            </div>

            {/* Stage Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider opacity-70">Asset Preview</span>
                <button
                  type="button"
                  onClick={() => setPreviewSurface((s) => (s === 'dark' ? 'light' : 'dark'))}
                  className={`px-2 py-0.5 rounded text-[11px] border ${isLight ? 'bg-white border-neutral-300 text-neutral-700' : 'bg-slate-950 border-slate-700 text-slate-300'}`}
                >
                  {previewSurface === 'dark' ? 'Light Stage' : 'Dark Stage'}
                </button>
              </div>
              <div
                className={`h-48 rounded-xl border flex items-center justify-center p-4 overflow-hidden ${
                  previewSurface === 'dark'
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-white border-neutral-300'
                }`}
              >
                {selected.isVideo ? (
                  <video
                    key={selected.uuid}
                    src={selected.previewUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="max-h-40 max-w-full object-contain rounded-lg"
                  />
                ) : (
                  <img
                    src={selected.previewUrl}
                    alt={selected.name}
                    className="max-h-40 max-w-full object-contain"
                  />
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleAddToTimeline}
                className="w-full py-2.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Film className="w-4 h-4" />
                <span>Add to Video Timeline Overlay</span>
              </button>

              {hasDownloadSecret && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={downloading}
                    onClick={() => handleApiDownload(selected.asset === 'lottie' ? 'json' : 'png')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 ${
                      isLight
                        ? 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100'
                        : 'bg-slate-950 border-slate-700 text-slate-200 hover:border-purple-500'
                    }`}
                  >
                    {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Download {selected.asset === 'lottie' ? 'JSON' : 'PNG'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={downloading}
                    onClick={() => handleApiDownload(selected.asset === 'lottie' ? 'mp4' : 'svg')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 ${
                      isLight
                        ? 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100'
                        : 'bg-slate-950 border-slate-700 text-slate-200 hover:border-purple-500'
                    }`}
                  >
                    {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Download {selected.asset === 'lottie' ? 'MP4' : 'SVG'}</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={selected.previewUrl}
                  download={`${selected.slug || selected.id}.${selected.isVideo ? 'mp4' : 'png'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                    isLight
                      ? 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100'
                      : 'bg-slate-950 border-slate-700 text-slate-200 hover:border-purple-500'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Preview File</span>
                </a>
                <a
                  href={selected.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                    isLight
                      ? 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100'
                      : 'bg-slate-950 border-slate-700 text-slate-200 hover:border-purple-500'
                  }`}
                >
                  <span>IconScout Page</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
