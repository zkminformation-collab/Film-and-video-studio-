import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FolderOpen,
  Search,
  Sparkles,
  Box,
  Film,
  Music,
  Volume2,
  Image as ImageIcon,
  Wrench,
  FileText,
  ExternalLink,
  Download,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Clapperboard,
  Wand2,
  Share2,
  Check,
  X,
  Play,
} from 'lucide-react';
import { FilmProject, StudioModule } from '../../types';
import { UniversalAsset } from '../../data/libraryData';
import { useStudioAi } from '../../context/StudioAiContext';
import { soundFx } from '../../utils/audioSynth';
import { LottieIcon } from '../common/LottieIcon';

interface FreeAssetRecord {
  assetId: string;
  name: string;
  folder: string;
  subfolder: string;
  format: string;
  source: string;
  sourceUrl: string;
  downloadUrl: string;
  previewUrl: string;
  previewType: 'lottie' | 'video' | 'audio' | 'image' | 'model3d' | 'tool';
  license: string;
  commercialUse: 'Yes' | 'Check' | 'No';
  modificationAllowed?: 'Yes' | 'Check' | 'No';
  redistributionAllowed?: 'Yes' | 'Check' | 'No';
  packageStatus?: 'included_in_zip' | 'official_source_link';
  zipFolderPath?: string;
  licenseNote: string;
  description: string;
  tags: string[];
  projectId: string;
  customImported?: boolean;
}

interface FreeAssetLibraryWorkspaceProps {
  activeFilm: FilmProject;
  onSendToEditor?: (asset: UniversalAsset) => void;
  onNavigate?: (module: StudioModule) => void;
}

const FOLDER_ICONS: Record<string, React.ElementType> = {
  Animation: Sparkles,
  VFX: Wand2,
  '3D Assets': Box,
  Images: ImageIcon,
  Audio: Music,
  Video: Film,
  'Film Production': FileText,
  'Open-Source Software': Wrench,
};

export const FreeAssetLibraryWorkspace: React.FC<FreeAssetLibraryWorkspaceProps> = ({
  activeFilm,
  onSendToEditor,
  onNavigate,
}) => {
  const { addAssetToTimeline, addQueueItem } = useStudioAi();

  const [folders, setFolders] = useState<Record<string, string[]>>({});
  const [assets, setAssets] = useState<FreeAssetRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [activeFolder, setActiveFolder] = useState<string>('All');
  const [activeSubfolder, setActiveSubfolder] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [commercialOnly, setCommercialOnly] = useState<boolean>(false);

  const [selected, setSelected] = useState<FreeAssetRecord | null>(null);
  const [statusNotice, setStatusNotice] = useState<string>('');

  // Import Modal State
  const [showImport, setShowImport] = useState<boolean>(false);
  const [importName, setImportName] = useState<string>('');
  const [importFolder, setImportFolder] = useState<string>('VFX');
  const [importSubfolder, setImportSubfolder] = useState<string>('Explosions');
  const [importFormat, setImportFormat] = useState<string>('MP4');
  const [importSource, setImportSource] = useState<string>('ActionVFX');
  const [importSourceUrl, setImportSourceUrl] = useState<string>('');
  const [importLicense, setImportLicense] = useState<string>('CC0');
  const [importCommercial, setImportCommercial] = useState<'Yes' | 'Check' | 'No'>('Yes');
  const [importing, setImporting] = useState<boolean>(false);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/free-assets');
      const data = await resp.json();
      if (data?.success) {
        setFolders(data.folders || {});
        const list: FreeAssetRecord[] = Array.isArray(data.assets) ? data.assets : [];
        setAssets(list);
        setSelected((prev) => (prev && list.some((a) => a.assetId === prev.assetId) ? prev : list[0] || null));
      }
    } catch {
      // ignore load errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const filteredAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return assets.filter((a) => {
      if (activeFolder !== 'All' && a.folder !== activeFolder) return false;
      if (activeSubfolder !== 'All' && a.subfolder !== activeSubfolder) return false;
      if (commercialOnly && a.commercialUse !== 'Yes') return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.assetId.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q) ||
        a.license.toLowerCase().includes(q) ||
        a.subfolder.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [assets, activeFolder, activeSubfolder, commercialOnly, searchQuery]);

  const toUniversalAsset = (rec: FreeAssetRecord): UniversalAsset => {
    const cat: UniversalAsset['category'] =
      rec.folder === 'VFX'
        ? 'vfx'
        : rec.folder === 'Audio'
        ? rec.subfolder === 'Music'
          ? 'music'
          : 'sfx'
        : rec.folder === 'Video'
        ? 'video'
        : rec.folder === 'Images'
        ? 'image'
        : 'animation';

    return {
      id: `${rec.assetId}-${Date.now()}`,
      name: rec.name,
      category: cat,
      subcategory: `${rec.folder} / ${rec.subfolder}`,
      source: 'licensed',
      format: rec.format,
      size: 'Cloud Reference',
      duration: rec.folder === 'Audio' || rec.folder === 'Video' || rec.folder === 'VFX' ? '00:10' : undefined,
      thumbnail: rec.previewType === 'lottie' ? '' : rec.previewUrl,
      mediaUrl: rec.downloadUrl || rec.sourceUrl,
      description: `${rec.description} (${rec.licenseNote})`,
      tags: [...rec.tags, rec.assetId, activeFilm.title],
      license: {
        type: rec.license.toUpperCase().includes('CC0') ? 'Creative Commons CC0' : 'Royalty-Free Worldwide',
        commercialUse: rec.commercialUse === 'Yes',
        attribution: `${rec.source} (${rec.license})`,
        certificateId: rec.assetId,
        verified: rec.commercialUse === 'Yes',
      },
      specs: { codec: rec.format, fps: 24 },
      isFavorite: false,
      addedAt: new Date().toISOString().split('T')[0],
      usageCount: 1,
    };
  };

  const handleAddToProject = async (rec: FreeAssetRecord) => {
    const universal = toUniversalAsset(rec);
    addAssetToTimeline(universal);
    addQueueItem({
      tool: 'Unified Free Asset Library',
      prompt: `Added ${rec.assetId} · ${rec.name} (${rec.source}) to ${activeFilm.title}`,
      provider: rec.source,
      status: 'Completed',
      progress: 100,
    });

    const firstExt = (rec.format.split(/[\s/,(]+/)[0] || 'png').toLowerCase();
    try {
      await fetch('/api/library/assets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rec.assetId,
          project_id: activeFilm.id,
          name: rec.name,
          category: rec.folder,
          file_type: firstExt,
          storage_path: rec.downloadUrl || rec.sourceUrl,
          source: rec.source,
          source_url: rec.sourceUrl,
          preview_url: rec.previewUrl,
          license_name: rec.license,
          commercial_use: rec.commercialUse.toLowerCase(),
          attribution: rec.source,
        }),
      });
    } catch {
      // non-blocking persistence
    }

    soundFx.playCinematicImpact();
    setStatusNotice(`Saved "${rec.name}" (${rec.assetId}) once to Unified Media Library & linked to "${activeFilm.title}".`);
  };

  const handleSendToModule = (rec: FreeAssetRecord, target: StudioModule, label: string) => {
    const universal = toUniversalAsset(rec);
    addAssetToTimeline(universal);
    soundFx.playScannerBeep();
    if (target === 'editor' && onSendToEditor) {
      onSendToEditor(universal);
      return;
    }
    setStatusNotice(`Sent "${rec.name}" to ${label}.`);
    if (onNavigate) onNavigate(target);
  };

  const handlePreviewAudio = (rec: FreeAssetRecord) => {
    if (rec.subfolder === 'Music') {
      soundFx.playCinematicImpact();
    } else {
      soundFx.playShutterSound();
    }
    setStatusNotice(`Auditioned "${rec.name}" audio preview cue.`);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importName.trim() || !importSourceUrl.trim()) return;
    setImporting(true);
    try {
      const resp = await fetch('/api/free-assets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: importName.trim(),
          folder: importFolder,
          subfolder: importSubfolder,
          format: importFormat,
          source: importSource,
          sourceUrl: importSourceUrl.trim(),
          downloadUrl: importSourceUrl.trim(),
          previewUrl: importFormat.toUpperCase().includes('JSON') ? importSourceUrl.trim() : '',
          previewType: importFormat.toUpperCase().includes('JSON')
            ? 'lottie'
            : importFolder === 'Audio'
            ? 'audio'
            : importFolder === '3D Assets'
            ? 'model3d'
            : 'video',
          license: importLicense,
          commercialUse: importCommercial,
          projectId: activeFilm.id,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        setShowImport(false);
        setImportName('');
        setImportSourceUrl('');
        await loadAssets();
        if (data.asset) setSelected(data.asset);
        setStatusNotice(`Imported "${data.asset?.name}" (${data.asset?.assetId}) into Unified Free Asset Library.`);
      }
    } finally {
      setImporting(false);
    }
  };

  const folderNames = Object.keys(folders);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#07090e] text-slate-100">
      {/* Top Toolbar */}
      <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-sm font-extrabold tracking-tight flex items-center gap-2 text-white">
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span>Unified Free Asset Library</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-mono">
              {assets.length} Verified Resources · 8 Categories
            </span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Project: {activeFilm.title} · Lottie, 3D CC0, VFX, Stock Video, Music, SFX, Templates & Open-Source Tools
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search VFX, Poly Haven, CC0, Lottie..."
              className="pl-8 pr-3 py-1.5 w-60 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setCommercialOnly((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              commercialOnly
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Commercial Safe Only</span>
          </button>

          <a
            href="/api/free-assets/export-zip"
            download="Film-Video-Studio-Complete-Library.zip"
            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Complete Library (ZIP)</span>
          </a>

          <div className="hidden xl:flex items-center gap-1">
            <a
              href="/api/free-assets/catalog/assets.json"
              download="assets.json"
              className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-500 text-[11px] font-mono text-slate-300"
            >
              assets.json
            </a>
            <a
              href="/api/free-assets/catalog/download-links.csv"
              download="download-links.csv"
              className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-500 text-[11px] font-mono text-slate-300"
            >
              links.csv
            </a>
            <a
              href="/api/free-assets/catalog/licenses.csv"
              download="licenses.csv"
              className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-500 text-[11px] font-mono text-slate-300"
            >
              licenses.csv
            </a>
          </div>

          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Import Asset URL</span>
          </button>
        </div>
      </div>

      {/* Main 3-Pane Studio Layout: Folder Tree + Asset Grid + Inspector */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Folder Tree (Section 9 Hierarchy) */}
        <aside className="w-full lg:w-60 border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#0b0e17] overflow-y-auto p-3 space-y-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveFolder('All');
              setActiveSubfolder('All');
            }}
            className={`w-full px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-colors ${
              activeFolder === 'All'
                ? 'bg-amber-500 text-black'
                : 'text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <span className="flex items-center gap-2">
              <FolderOpen className="w-3.5 h-3.5" />
              All Library Folders
            </span>
            <span className="text-[10px] font-mono opacity-80">{assets.length}</span>
          </button>

          {folderNames.map((folder) => {
            const IconComp = FOLDER_ICONS[folder] || FolderOpen;
            const isExpanded = activeFolder === folder;
            const count = assets.filter((a) => a.folder === folder).length;
            const subs = folders[folder] || [];
            return (
              <div key={folder} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveFolder(folder);
                    setActiveSubfolder('All');
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-colors ${
                    isExpanded
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800/70'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <IconComp className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{folder}</span>
                  </span>
                  <span className="text-[10px] font-mono opacity-80">{count}</span>
                </button>

                {isExpanded && subs.length > 0 && (
                  <div className="pl-6 pr-1 py-1 space-y-0.5">
                    {subs.map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setActiveSubfolder(activeSubfolder === sub ? 'All' : sub)}
                        className={`w-full px-2.5 py-1 rounded text-[11px] text-left transition-colors ${
                          activeSubfolder === sub
                            ? 'bg-amber-500/20 text-amber-300 font-bold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        └ {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        {/* Center Asset Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {statusNotice && (
            <div className="mb-4 px-3.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5" />
                {statusNotice}
              </span>
              <button type="button" onClick={() => setStatusNotice('')} className="text-xs underline">
                Dismiss
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {Array.from({ length: 9 }).map((_, idx) => (
                <div key={idx} className="h-44 rounded-xl bg-slate-900 border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="py-16 text-center rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">No assets match your current filter.</p>
              <p className="text-xs mt-1">Clear the search query or switch back to All Library Folders.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredAssets.map((rec) => {
                const isSelected = selected?.assetId === rec.assetId;
                return (
                  <div
                    key={rec.assetId}
                    onClick={() => setSelected(rec)}
                    className={`rounded-xl border overflow-hidden cursor-pointer transition-all flex flex-col ${
                      isSelected
                        ? 'bg-slate-900 border-amber-500 ring-1 ring-amber-500/50'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {/* Preview Stage */}
                    <div className="h-28 bg-slate-950 relative flex items-center justify-center overflow-hidden">
                      {rec.previewType === 'lottie' && rec.previewUrl ? (
                        <LottieIcon
                          src={rec.previewUrl}
                          size={52}
                          interaction="loop"
                          color="#a855f7"
                          ariaLabel={rec.name}
                        />
                      ) : rec.previewType === 'audio' ? (
                        <div className="flex flex-col items-center gap-1.5 text-amber-400">
                          <Volume2 className="w-7 h-7" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewAudio(rec);
                            }}
                            className="px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" />
                            Audition Audio
                          </button>
                        </div>
                      ) : rec.previewUrl ? (
                        <img
                          src={rec.previewUrl}
                          alt={rec.name}
                          loading="lazy"
                          className="w-full h-full object-cover opacity-85"
                        />
                      ) : (
                        <Box className="w-8 h-8 text-slate-600" />
                      )}

                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-amber-300 text-[10px] font-mono font-bold">
                        {rec.assetId}
                      </span>
                      <span
                        className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          rec.commercialUse === 'Yes'
                            ? 'bg-emerald-600/90 text-white'
                            : 'bg-amber-600/90 text-white'
                        }`}
                      >
                        {rec.commercialUse === 'Yes' ? 'Commercial OK' : 'Check License'}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-bold text-white line-clamp-1">{rec.name}</div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{rec.description}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="truncate">{rec.folder} / {rec.subfolder}</span>
                        <span className="text-purple-400 shrink-0 ml-2">{rec.format}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Asset Inspector & Studio Router */}
        {selected && (
          <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/70 overflow-y-auto p-5 space-y-4 shrink-0">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[11px] font-mono font-bold">
                  {selected.assetId}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{selected.format}</span>
              </div>
              <h3 className="text-sm font-extrabold text-white mt-2">{selected.name}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{selected.description}</p>
            </div>

            {/* Structured Database Schema Card (Section 10 & Option 6 License Matrix) */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Package Status</span>
                <span
                  className={`font-bold ${
                    selected.packageStatus === 'included_in_zip' ? 'text-emerald-400' : 'text-sky-400'
                  }`}
                >
                  {selected.packageStatus === 'included_in_zip' ? 'Included in ZIP (MIT)' : 'Official Source Link'}
                </span>
              </div>
              {selected.zipFolderPath && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">ZIP Folder</span>
                  <span className="font-mono text-[11px] text-slate-200">{selected.zipFolderPath}</span>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Category</span>
                <span className="font-semibold text-white">{selected.folder} → {selected.subfolder}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Source</span>
                <span className="font-semibold text-purple-300">{selected.source}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">License</span>
                <span className="font-semibold text-amber-300">{selected.license}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Commercial</div>
                  <div className={`text-[11px] font-bold ${selected.commercialUse === 'Yes' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {selected.commercialUse}
                  </div>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Modify</div>
                  <div className={`text-[11px] font-bold ${selected.modificationAllowed === 'Yes' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {selected.modificationAllowed || 'Check'}
                  </div>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Redistribute</div>
                  <div className={`text-[11px] font-bold ${selected.redistributionAllowed === 'Yes' ? 'text-emerald-400' : selected.redistributionAllowed === 'No' ? 'text-rose-400' : 'text-amber-400'}`}>
                    {selected.redistributionAllowed || 'Check'}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 flex items-start gap-1.5">
                {selected.commercialUse === 'Yes' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <span>{selected.licenseNote}</span>
              </div>
            </div>

            {/* Add to Project & Download */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleAddToProject(selected)}
                className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Project ({activeFilm.title})</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={selected.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-700 hover:border-amber-500 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <a
                  href={selected.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-700 hover:border-purple-500 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <span>Source Page</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Direct Send to Studio Modules */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Send Directly to Studio Module
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSendToModule(selected, 'animation', 'Animation Studio')}
                  className="py-2 px-2.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Animation Studio</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendToModule(selected, 'vfx', 'VFX Studio')}
                  className="py-2 px-2.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>VFX Studio</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendToModule(selected, 'storyboard', 'Storyboard Studio')}
                  className="py-2 px-2.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Clapperboard className="w-3.5 h-3.5" />
                  <span>Storyboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendToModule(selected, 'editor', 'Timeline Editor')}
                  className="py-2 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Timeline Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendToModule(selected, 'export', 'Export Studio')}
                  className="col-span-2 py-2 px-2.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-200 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Export Studio</span>
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Import Custom Asset Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <form
            onSubmit={handleImportSubmit}
            className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-5 space-y-3.5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white">Import Asset to Unified Free Library</h3>
              <button type="button" onClick={() => setShowImport(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Asset Name</label>
              <input
                required
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                placeholder="e.g. Fire Explosion Pack 4K"
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Folder</label>
                <select
                  value={importFolder}
                  onChange={(e) => {
                    const nextFolder = e.target.value;
                    setImportFolder(nextFolder);
                    setImportSubfolder(folders[nextFolder]?.[0] || 'General');
                  }}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-2 text-xs text-white"
                >
                  {folderNames.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Subfolder</label>
                <select
                  value={importSubfolder}
                  onChange={(e) => setImportSubfolder(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-2 text-xs text-white"
                >
                  {(folders[importFolder] || ['General']).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Source</label>
                <input
                  value={importSource}
                  onChange={(e) => setImportSource(e.target.value)}
                  placeholder="ActionVFX / Poly Haven"
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Format</label>
                <input
                  value={importFormat}
                  onChange={(e) => setImportFormat(e.target.value)}
                  placeholder="MP4 / GLB / JSON"
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Source / Download URL</label>
              <input
                required
                type="url"
                value={importSourceUrl}
                onChange={(e) => setImportSourceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">License</label>
                <input
                  value={importLicense}
                  onChange={(e) => setImportLicense(e.target.value)}
                  placeholder="CC0 / MIT / CC BY"
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Commercial Use</label>
                <select
                  value={importCommercial}
                  onChange={(e) => setImportCommercial(e.target.value as 'Yes' | 'Check' | 'No')}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-2 text-xs text-white"
                >
                  <option value="Yes">Yes</option>
                  <option value="Check">Check</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={importing}
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold disabled:opacity-50"
            >
              {importing ? 'Importing...' : 'Save Asset to Unified Library'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
