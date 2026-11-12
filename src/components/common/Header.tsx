import React from 'react';
import { 
  Clapperboard, 
  Smartphone, 
  Globe, 
  ShieldCheck, 
  Code2, 
  Share2,
  FolderSync,
  Package,
  Workflow,
  Sparkles,
  Palette,
  RotateCcw
} from 'lucide-react';
import { ViewPlatform, FilmProject, StudioTheme } from '../../types';
import { useStudioAi } from '../../context/StudioAiContext';
import { soundFx } from '../../utils/audioSynth';

interface HeaderProps {
  currentPlatform: ViewPlatform;
  onSelectPlatform: (platform: ViewPlatform) => void;
  activeFilm: FilmProject;
  onSelectFilm: (film: FilmProject) => void;
  allFilms: FilmProject[];
  theme: StudioTheme;
  onSelectTheme: (theme: StudioTheme) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPlatform,
  onSelectPlatform,
  activeFilm,
  onSelectFilm,
  allFilms,
  theme,
  onSelectTheme,
}) => {
  const { queue, isReprocessing, reprocessAllPending } = useStudioAi();
  const pendingCount = queue.filter((i) => i.status === 'Queued' || i.status === 'Failed').length;
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/95 backdrop-blur px-4 flex items-center justify-between gap-6 shrink-0 z-40 select-none">
      {/* Zone 1: Wordmark & Brand Badge */}
      <div className="flex items-center gap-3 shrink-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm ${
          theme === 'creative'
            ? 'bg-purple-600/20 border-purple-500/40 text-purple-400'
            : theme === 'cinematic'
            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            : 'bg-sky-500/20 border-sky-500/40 text-sky-400'
        }`}>
          <Clapperboard className="w-4 h-4" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-extrabold tracking-tight text-white whitespace-nowrap font-cinzel">
            Film & Video Studio
          </span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
            theme === 'creative' ? 'bg-purple-500/20 text-purple-300' : 'bg-amber-500/20 text-amber-300'
          }`}>
            ULTIMATE
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation & Platform Viewport Selectors */}
      <div className="hidden lg:flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
        <button
          onClick={() => onSelectPlatform('workstation')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            currentPlatform === 'workstation'
              ? 'bg-purple-600 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Full Studio Workstation"
        >
          <Clapperboard className="w-3.5 h-3.5" />
          <span>Workstation</span>
        </button>

        <button
          onClick={() => onSelectPlatform('android')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            currentPlatform === 'android'
              ? 'bg-purple-600 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Kotlin Jetpack Compose Android Mobile App"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Android App</span>
        </button>

        <button
          onClick={() => onSelectPlatform('deliverables')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            currentPlatform === 'deliverables'
              ? 'bg-purple-600 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Download APK, Website zip, WordPress Plugin, Backend and Source"
        >
          <Package className="w-3.5 h-3.5 text-emerald-400" />
          <span>Deliverables & APK</span>
        </button>

        <button
          onClick={() => onSelectPlatform('website')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            currentPlatform === 'website'
              ? 'bg-purple-600 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Website</span>
        </button>

        <button
          onClick={() => onSelectPlatform('admin')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            currentPlatform === 'admin'
              ? 'bg-purple-600 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin</span>
        </button>

        <button
          onClick={() => onSelectPlatform('wordpress')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            currentPlatform === 'wordpress'
              ? 'bg-purple-600 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FolderSync className="w-3.5 h-3.5" />
          <span>WordPress</span>
        </button>

        <button
          onClick={() => onSelectPlatform('code_viewer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            currentPlatform === 'code_viewer'
              ? 'bg-purple-600 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Kotlin Code</span>
        </button>
      </div>

      {/* Zone 3: Studio Theme Selector & Film Picker */}
      <div className="flex items-center gap-3 shrink-0">
        {pendingCount > 0 && (
          <button
            disabled={isReprocessing}
            onClick={() => reprocessAllPending()}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-mono transition-all"
            title="Click to reprocess all pending queue tasks"
          >
            <RotateCcw className={`w-3 h-3 text-cyan-400 ${isReprocessing ? 'animate-spin' : ''}`} />
            <span>{isReprocessing ? 'Reprocessing...' : `${pendingCount} Pending · Reprocess All`}</span>
          </button>
        )}
        {/* Audio Monitor Quick Test */}
        <button
          type="button"
          onClick={() => {
            soundFx.unlock();
            soundFx.playCinematicImpact();
          }}
          className="px-2 py-1 bg-purple-950/60 hover:bg-purple-900/80 text-cyan-300 border border-purple-500/40 rounded text-[11px] font-mono flex items-center gap-1 active:scale-95"
          title="Test Studio Audio Monitor Output"
        >
          <span>🔊 Sound Test</span>
        </button>

        {/* Theme Picker */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-md p-0.5">
          <button
            onClick={() => onSelectTheme('creative')}
            className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${
              theme === 'creative' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400'
            }`}
            title="Modern Creative Studio (Obsidian, Purple & Cyan) [RECOMMENDED]"
          >
            🟣 Creative
          </button>
          <button
            onClick={() => onSelectTheme('cinematic')}
            className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${
              theme === 'cinematic' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
            title="Dark Cinematic (Black & Gold)"
          >
            🟡 Cinema
          </button>
          <button
            onClick={() => onSelectTheme('premiere')}
            className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${
              theme === 'premiere' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'
            }`}
            title="Premiere Pro (Slate & Blue)"
          >
            🔵 Premiere
          </button>
        </div>

        {/* Active Film Project Select */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1">
          <select
            value={activeFilm.id}
            onChange={(e) => {
              const selected = allFilms.find((f) => f.id === e.target.value);
              if (selected) onSelectFilm(selected);
            }}
            aria-label="Active Film Project"
            className="bg-transparent text-xs text-purple-300 font-medium border-0 focus:ring-0 cursor-pointer outline-none"
          >
            {allFilms.map((film) => (
              <option key={film.id} value={film.id} className="bg-slate-900 text-slate-100">
                {film.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
