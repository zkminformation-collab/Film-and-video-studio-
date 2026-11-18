import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Download,
  Copy,
  Check,
  ExternalLink,
  Film,
  RotateCcw,
  Sparkles,
  Code2,
  Package,
  BookOpen,
  Layers,
} from 'lucide-react';
import { FilmProject, StudioModule, StudioTheme } from '../../types';
import { useStudioAi } from '../../context/StudioAiContext';
import { LottieIcon, LottieInteractionMode } from '../common/LottieIcon';
import { IconScoutBrowser } from './IconScoutBrowser';
import { WebMotionKit } from './WebMotionKit';

interface LottieCatalogIcon {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  interaction: LottieInteractionMode;
  jsonUrl: string;
  zipUrl: string;
}

interface LottieMotionLibraryProps {
  activeFilm: FilmProject;
  theme?: StudioTheme;
  onSendToEditor?: () => void;
  onNavigate?: (module: StudioModule) => void;
}

type CodePlatformTab = 'web' | 'react' | 'react-native' | 'ios' | 'android' | 'flutter';

const COLOR_PRESETS = [
  { label: 'Studio White', hex: '#ffffff' },
  { label: 'Obsidian', hex: '#111827' },
  { label: 'Electric Purple', hex: '#a855f7' },
  { label: 'Cinema Amber', hex: '#f59e0b' },
  { label: 'Neon Cyan', hex: '#06b6d4' },
  { label: 'Emerald', hex: '#10b981' },
  { label: 'Crimson', hex: '#f43f5e' },
];

export const LottieMotionLibrary: React.FC<LottieMotionLibraryProps> = ({
  activeFilm,
  theme = 'elevenlabs',
  onSendToEditor,
  onNavigate,
}) => {
  const isLight = theme === 'elevenlabs';
  const { addAssetToTimeline, addQueueItem } = useStudioAi();

  const [librarySource, setLibrarySource] = useState<'iconscout' | 'useanimations' | 'motion_kit'>('iconscout');
  const [icons, setIcons] = useState<LottieCatalogIcon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [catalogSource, setCatalogSource] = useState<string>('useanimations.com');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedId, setSelectedId] = useState<string>('playPause');

  const [iconColor, setIconColor] = useState<string>(isLight ? '#111827' : '#a855f7');
  const [iconSize, setIconSize] = useState<number>(40);
  const [playbackMode, setPlaybackMode] = useState<'auto' | LottieInteractionMode>('auto');
  const [previewSurface, setPreviewSurface] = useState<'dark' | 'light'>(isLight ? 'light' : 'dark');
  const [playTrigger, setPlayTrigger] = useState<number>(0);

  const [codeTab, setCodeTab] = useState<CodePlatformTab>('web');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch('/api/lottie/icons')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const list: LottieCatalogIcon[] = Array.isArray(data?.icons)
          ? data.icons.map((item: any) => ({
              id: String(item.id || ''),
              title: String(item.title || item.id || 'Icon'),
              category: String(item.category || 'General'),
              keywords: Array.isArray(item.keywords) ? item.keywords : [],
              interaction:
                item.interaction === 'loop' || item.interaction === 'click' || item.interaction === 'hover'
                  ? item.interaction
                  : 'hover',
              jsonUrl: String(item.jsonUrl || `https://useanimations.com/icons/${item.id}.json`),
              zipUrl: String(item.zipUrl || `https://useanimations.com/icons/${item.id}.zip`),
            }))
          : [];
        setIcons(list);
        if (data?.source) setCatalogSource(String(data.source));
        if (list.length > 0 && !list.some((ic) => ic.id === selectedId)) {
          setSelectedId(list[0].id);
        }
      })
      .catch(() => {
        if (!active) return;
        setIcons([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    icons.forEach((ic) => {
      if (ic.category) set.add(ic.category);
    });
    return ['All', ...Array.from(set).sort()];
  }, [icons]);

  const filteredIcons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return icons.filter((ic) => {
      if (selectedCategory !== 'All' && ic.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        ic.title.toLowerCase().includes(q) ||
        ic.id.toLowerCase().includes(q) ||
        ic.category.toLowerCase().includes(q) ||
        ic.keywords.some((kw) => kw.toLowerCase().includes(q))
      );
    });
  }, [icons, searchQuery, selectedCategory]);

  const selectedIcon = useMemo(() => {
    return icons.find((ic) => ic.id === selectedId) || filteredIcons[0] || icons[0] || null;
  }, [icons, filteredIcons, selectedId]);

  const resolveInteraction = (ic: LottieCatalogIcon): LottieInteractionMode => {
    return playbackMode === 'auto' ? ic.interaction : playbackMode;
  };

  const embedSnippet = useMemo(() => {
    if (!selectedIcon) return '';
    const { id, jsonUrl } = selectedIcon;
    const interaction = resolveInteraction(selectedIcon);

    switch (codeTab) {
      case 'web':
        return `import lottie from 'lottie-web';

const anim = lottie.loadAnimation({
  container: document.getElementById('icon-${id}'),
  renderer: 'svg',
  loop: ${interaction === 'loop'},
  autoplay: ${interaction === 'loop'},
  path: '${jsonUrl}',
});`;
      case 'react':
        return `import UseAnimations from 'react-useanimations';
import ${id} from 'react-useanimations/lib/${id}';

export function AnimatedIcon() {
  return (
    <UseAnimations
      animation={${id}}
      size={${iconSize}}
      strokeColor="${iconColor}"
    />
  );
}`;
      case 'react-native':
        return `import LottieView from 'lottie-react-native';

export function AnimatedIcon() {
  return (
    <LottieView
      source={{ uri: '${jsonUrl}' }}
      autoPlay={${interaction === 'loop'}}
      loop={${interaction === 'loop'}}
      style={{ width: ${iconSize}, height: ${iconSize} }}
    />
  );
}`;
      case 'ios':
        return `import Lottie
import SwiftUI

struct AnimatedIconView: View {
  var body: some View {
    LottieView {
      try await DotLottieFile.loadedFrom(url: URL(string: "${jsonUrl}")!)
    }
    .playing(loopMode: ${interaction === 'loop' ? '.loop' : '.playOnce'})
    .frame(width: ${iconSize}, height: ${iconSize})
  }
}`;
      case 'android':
        return `val composition by rememberLottieComposition(
  LottieCompositionSpec.Url("${jsonUrl}")
)
LottieAnimation(
  composition = composition,
  iterations = ${interaction === 'loop' ? 'LottieConstants.IterateForever' : '1'},
  modifier = Modifier.size(${iconSize}.dp)
)`;
      case 'flutter':
        return `import 'package:lottie/lottie.dart';

Lottie.network(
  '${jsonUrl}',
  width: ${iconSize},
  height: ${iconSize},
  repeat: ${interaction === 'loop'},
)`;
      default:
        return '';
    }
  }, [selectedIcon, codeTab, iconSize, iconColor, playbackMode]);

  const handleCopySnippet = async () => {
    if (!embedSnippet) return;
    try {
      await navigator.clipboard.writeText(embedSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      setStatusMessage('Clipboard permission unavailable in this browser.');
    }
  };

  const handleAddToTimeline = () => {
    if (!selectedIcon) return;
    addAssetToTimeline({
      id: `lottie-${selectedIcon.id}-${Date.now()}`,
      name: `${selectedIcon.title}_LottieOverlay.json`,
      category: 'animation',
      subcategory: 'Lottie Motion Graphic',
      source: 'licensed',
      format: 'Lottie JSON (SVG)',
      size: '18 KB',
      duration: '00:04',
      resolution: 'Vector (4K Ready)',
      thumbnail: '',
      mediaUrl: selectedIcon.jsonUrl,
      description: `useAnimations MIT Lottie motion graphic (${selectedIcon.title}) styled in ${iconColor} for ${activeFilm.title}`,
      tags: ['Lottie', 'Motion Graphics', selectedIcon.category, selectedIcon.id],
      license: {
        type: 'Royalty-Free Worldwide',
        commercialUse: true,
        attribution: 'useanimations.com (MIT License)',
        certificateId: `LOTTIE-${selectedIcon.id.toUpperCase()}`,
        verified: true,
      },
      specs: { codec: 'Lottie JSON', fps: 60 },
      isFavorite: false,
      addedAt: new Date().toISOString().split('T')[0],
      usageCount: 1,
    });

    addQueueItem({
      tool: 'Lottie Motion Library',
      prompt: `Overlay: ${selectedIcon.title} (${selectedIcon.id}.json · ${iconColor})`,
      provider: 'useAnimations / lottie-web',
      status: 'Completed',
      progress: 100,
    });

    setStatusMessage(`Added "${selectedIcon.title}" Lottie overlay to ${activeFilm.title} timeline.`);
    if (onSendToEditor) {
      onSendToEditor();
    } else if (onNavigate) {
      onNavigate('editor');
    }
  };

  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${isLight ? 'bg-white text-neutral-900' : 'bg-[#07090e] text-slate-100'}`}>
      {/* Top Studio Header */}
      <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 shrink-0 ${isLight ? 'bg-[#FAFAFB] border-neutral-200' : 'bg-slate-900/90 border-slate-800'}`}>
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="text-base font-bold tracking-tight">Lottie Icons & Motion Graphics Library</h2>
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${isLight ? 'bg-purple-100 text-purple-800' : 'bg-purple-500/20 text-purple-300'}`}>
              MIT License · {icons.length} Icons
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-neutral-600' : 'text-slate-400'}`}>
            Standard Lottie JSON vector animations via {catalogSource} · Rendered live with lottie-web SVG & CSS currentColor
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className={`inline-flex rounded-lg p-0.5 border ${isLight ? 'bg-neutral-100 border-neutral-200' : 'bg-slate-950 border-slate-800'}`}>
            <button
              type="button"
              onClick={() => setLibrarySource('iconscout')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                librarySource === 'iconscout'
                  ? 'bg-purple-600 text-white'
                  : isLight
                  ? 'text-neutral-700 hover:text-neutral-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              IconScout API (Icons · 3D · Lottie)
            </button>
            <button
              type="button"
              onClick={() => setLibrarySource('useanimations')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                librarySource === 'useanimations'
                  ? 'bg-purple-600 text-white'
                  : isLight
                  ? 'text-neutral-700 hover:text-neutral-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              useAnimations ({icons.length} Free MIT)
            </button>
            <button
              type="button"
              onClick={() => setLibrarySource('motion_kit')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                librarySource === 'motion_kit'
                  ? 'bg-purple-600 text-white'
                  : isLight
                  ? 'text-neutral-700 hover:text-neutral-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Motion · Anime.js · Animate.css
            </button>
          </div>
          <a
            href="https://developer.mozilla.org/en-US/docs/Web"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              isLight
                ? 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100'
                : 'bg-slate-950 border-slate-700 text-slate-200 hover:border-purple-500'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-500" />
            <span>MDN Web Docs</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </div>
      </div>

      {librarySource === 'iconscout' ? (
        <IconScoutBrowser
          activeFilm={activeFilm}
          theme={theme}
          onSendToEditor={onSendToEditor}
          onNavigate={onNavigate}
        />
      ) : librarySource === 'motion_kit' ? (
        <WebMotionKit theme={theme} />
      ) : (
        <>

      {/* Filter & Styling Toolbar */}
      <div className={`px-6 py-3 border-b flex flex-wrap items-center gap-4 shrink-0 ${isLight ? 'bg-white border-neutral-200' : 'bg-slate-950/70 border-slate-800'}`}>
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-neutral-400' : 'text-slate-500'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search icons (play, heart, loading, arrow...)"
            className={`w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border outline-none ${
              isLight
                ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-purple-500'
                : 'bg-slate-900 border-slate-700 text-slate-100 focus:border-purple-500'
            }`}
          />
        </div>

        {/* Color Controls */}
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-semibold ${isLight ? 'text-neutral-600' : 'text-slate-400'}`}>Stroke</span>
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.hex}
              type="button"
              title={preset.label}
              onClick={() => setIconColor(preset.hex)}
              className={`w-5 h-5 rounded-full border transition-transform ${
                iconColor.toLowerCase() === preset.hex.toLowerCase()
                  ? 'scale-110 ring-2 ring-purple-500 border-white'
                  : 'border-neutral-400/50 hover:scale-105'
              } ${
                preset.hex === '#ffffff'
                  ? 'bg-white'
                  : preset.hex === '#111827'
                  ? 'bg-gray-900'
                  : preset.hex === '#a855f7'
                  ? 'bg-purple-500'
                  : preset.hex === '#f59e0b'
                  ? 'bg-amber-500'
                  : preset.hex === '#06b6d4'
                  ? 'bg-cyan-500'
                  : preset.hex === '#10b981'
                  ? 'bg-emerald-500'
                  : 'bg-rose-500'
              }`}
            />
          ))}
          <input
            type="color"
            aria-label="Custom icon color"
            value={iconColor}
            onChange={(e) => setIconColor(e.target.value)}
            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
          />
        </div>

        {/* Size Slider */}
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold ${isLight ? 'text-neutral-600' : 'text-slate-400'}`}>
            Size {iconSize}px
          </span>
          <input
            type="range"
            min={24}
            max={64}
            step={4}
            value={iconSize}
            onChange={(e) => setIconSize(Number(e.target.value))}
            className="w-24 accent-purple-500"
          />
        </div>

        {/* Playback Interaction Mode */}
        <div className="flex items-center gap-1">
          {(['auto', 'loop', 'hover', 'click'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setPlaybackMode(mode)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize border transition-colors ${
                playbackMode === mode
                  ? 'bg-purple-600 text-white border-purple-600'
                  : isLight
                  ? 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Strip */}
      <div className={`px-6 py-2 border-b flex items-center gap-1.5 overflow-x-auto shrink-0 ${isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-slate-950 border-slate-800/80'}`}>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-purple-600 text-white'
                : isLight
                ? 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Split Workspace: Icon Grid + Inspector */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Icon Catalog Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {statusMessage && (
            <div className={`mb-4 px-3.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between border ${isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
              <span>{statusMessage}</span>
              <button type="button" onClick={() => setStatusMessage('')} className="text-xs underline ml-3">
                Dismiss
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {Array.from({ length: 15 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-28 rounded-xl border animate-pulse ${isLight ? 'bg-neutral-100 border-neutral-200' : 'bg-slate-900 border-slate-800'}`}
                />
              ))}
            </div>
          ) : filteredIcons.length === 0 ? (
            <div className={`py-16 text-center rounded-xl border ${isLight ? 'bg-neutral-50 border-neutral-200 text-neutral-600' : 'bg-slate-900/50 border-slate-800 text-slate-400'}`}>
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">No Lottie icons match &ldquo;{searchQuery}&rdquo;</p>
              <p className="text-xs mt-1">Try another keyword or switch category back to All.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredIcons.slice(0, 120).map((ic) => {
                const isSelected = selectedIcon?.id === ic.id;
                const mode = resolveInteraction(ic);
                return (
                  <button
                    key={ic.id}
                    type="button"
                    onClick={() => setSelectedId(ic.id)}
                    className={`group flex flex-col items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? isLight
                          ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500'
                          : 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500'
                        : isLight
                        ? 'bg-white border-neutral-200 hover:border-purple-300 hover:shadow-sm'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="h-16 flex items-center justify-center w-full">
                      <LottieIcon
                        src={ic.jsonUrl}
                        size={Math.min(iconSize, 52)}
                        interaction={mode}
                        color={iconColor}
                        ariaLabel={ic.title}
                      />
                    </div>
                    <div className="w-full mt-2 pt-2 border-t border-current/10 flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold truncate">{ic.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-mono ${isLight ? 'bg-neutral-100 text-neutral-600' : 'bg-slate-800 text-slate-400'}`}>
                        {mode}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Inspector Panel */}
        {selectedIcon && (
          <aside className={`w-full lg:w-96 border-t lg:border-t-0 lg:border-l overflow-y-auto p-5 space-y-5 shrink-0 ${isLight ? 'bg-[#FAFAFB] border-neutral-200' : 'bg-slate-900/70 border-slate-800'}`}>
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold">{selectedIcon.title}</h3>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${isLight ? 'bg-neutral-200 text-neutral-700' : 'bg-slate-800 text-slate-300'}`}>
                  {selectedIcon.id}.json
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-neutral-600' : 'text-slate-400'}`}>
                Category: {selectedIcon.category} · Interaction: {resolveInteraction(selectedIcon)}
              </p>
            </div>

            {/* Live Stage Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider opacity-70">Live SVG Preview</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewSurface((s) => (s === 'dark' ? 'light' : 'dark'))}
                    className={`px-2 py-0.5 rounded text-[11px] border ${isLight ? 'bg-white border-neutral-300 text-neutral-700' : 'bg-slate-950 border-slate-700 text-slate-300'}`}
                  >
                    {previewSurface === 'dark' ? 'Light Stage' : 'Dark Stage'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlayTrigger((n) => n + 1)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border ${isLight ? 'bg-white border-neutral-300 text-neutral-700' : 'bg-slate-950 border-slate-700 text-slate-300'}`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    Replay
                  </button>
                </div>
              </div>
              <div
                className={`h-36 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors ${
                  previewSurface === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-slate-400'
                    : 'bg-white border-neutral-300 text-neutral-500'
                }`}
              >
                <LottieIcon
                  src={selectedIcon.jsonUrl}
                  size={Math.max(iconSize, 56)}
                  interaction={resolveInteraction(selectedIcon)}
                  color={iconColor}
                  playTrigger={playTrigger}
                  ariaLabel={`${selectedIcon.title} live preview`}
                />
                <span className="text-[10px]">
                  {resolveInteraction(selectedIcon) === 'click'
                    ? 'Click icon to toggle state'
                    : resolveInteraction(selectedIcon) === 'hover'
                    ? 'Hover or click to replay'
                    : 'Looping (respects prefers-reduced-motion)'}
                </span>
              </div>
            </div>

            {/* Studio Actions */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleAddToTimeline}
                className="w-full py-2.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Film className="w-4 h-4" />
                <span>Add to Video Timeline Overlay</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={selectedIcon.jsonUrl}
                  download={`${selectedIcon.id}.json`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                    isLight
                      ? 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100'
                      : 'bg-slate-950 border-slate-700 text-slate-200 hover:border-purple-500'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Lottie JSON</span>
                </a>
                <a
                  href={selectedIcon.zipUrl}
                  download={`${selectedIcon.id}.zip`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                    isLight
                      ? 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100'
                      : 'bg-slate-950 border-slate-700 text-slate-200 hover:border-purple-500'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>ZIP + SVGs</span>
                </a>
              </div>
            </div>

            {/* Multi-Platform Embed Code */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 opacity-80">
                  <Code2 className="w-3.5 h-3.5 text-purple-500" />
                  Player Integration Code
                </span>
                <button
                  type="button"
                  onClick={handleCopySnippet}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold border ${
                    isLight
                      ? 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100'
                      : 'bg-slate-950 border-slate-700 text-slate-200 hover:border-purple-500'
                  }`}
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1">
                {(
                  [
                    ['web', 'Web'],
                    ['react', 'React'],
                    ['react-native', 'RN'],
                    ['ios', 'iOS'],
                    ['android', 'Android'],
                    ['flutter', 'Flutter'],
                  ] as [CodePlatformTab, string][]
                ).map(([tabKey, label]) => (
                  <button
                    key={tabKey}
                    type="button"
                    onClick={() => setCodeTab(tabKey)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                      codeTab === tabKey
                        ? 'bg-purple-600 text-white'
                        : isLight
                        ? 'bg-white border border-neutral-200 text-neutral-700'
                        : 'bg-slate-950 border border-slate-800 text-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <pre className={`p-3 rounded-lg text-[11px] font-mono overflow-x-auto border leading-relaxed ${isLight ? 'bg-neutral-900 text-neutral-100 border-neutral-800' : 'bg-black/60 text-slate-200 border-slate-800'}`}>
                <code>{embedSnippet}</code>
              </pre>
            </div>

            {/* MDN Web Standards Reference */}
            <div className={`p-3.5 rounded-xl border space-y-1.5 ${isLight ? 'bg-white border-neutral-200' : 'bg-slate-950/80 border-slate-800'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-sky-500" />
                  MDN Web Platform Docs
                </span>
                <a
                  href="https://developer.mozilla.org/en-US/docs/Web"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-sky-500 hover:underline inline-flex items-center gap-1"
                >
                  Open MDN
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className={`text-[11px] leading-relaxed ${isLight ? 'text-neutral-600' : 'text-slate-400'}`}>
                Icons render via inline SVG using CSS <code className="font-mono">currentColor</code>, CORS-enabled JSON endpoints, and <code className="font-mono">prefers-reduced-motion</code> media queries.
              </p>
            </div>
          </aside>
        )}
      </div>
        </>
      )}
    </div>
  );
};
