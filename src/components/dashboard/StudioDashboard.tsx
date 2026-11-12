import React, { useState, useEffect } from 'react';
import { 
  Clapperboard, 
  Film, 
  FileText, 
  Camera, 
  Music, 
  Wand2, 
  Calendar, 
  Clock, 
  DollarSign, 
  ArrowRight,
  TrendingUp,
  Play,
  Bot,
  Sparkles,
  User,
  Radio,
  Sliders,
  Cloud,
  Workflow,
  CheckCircle2,
  Cpu,
  Layers,
  Zap,
  Activity,
  HardDrive
} from 'lucide-react';
import { FilmProject, StudioModule, StudioTheme } from '../../types';
import { soundFx } from '../../utils/audioSynth';
import { useStudioAi } from '../../context/StudioAiContext';

interface StudioDashboardProps {
  activeFilm: FilmProject;
  allFilms: FilmProject[];
  onSelectFilm: (film: FilmProject) => void;
  onNavigate: (module: StudioModule) => void;
  theme: StudioTheme;
}

export const StudioDashboard: React.FC<StudioDashboardProps> = ({
  activeFilm,
  allFilms,
  onSelectFilm,
  onNavigate,
  theme,
}) => {
  const { wallet, queue } = useStudioAi();

  const [autosaveText, setAutosaveText] = useState<string>('Autosaved 3s ago');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setAutosaveText(`Autosaved at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const percentScenes = Math.round((activeFilm.completedScenes / activeFilm.scenesCount) * 100);
  const percentDays = Math.round((activeFilm.shootingDaysDone / activeFilm.shootingDaysTotal) * 100);
  const percentBudget = Math.round((activeFilm.spent / activeFilm.budget) * 100);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#090b11] text-slate-100 space-y-6">
      {/* Top Banner: Autosave Pill & Global Creative Engine Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#0d111c] border border-purple-500/30 rounded-full text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">{autosaveText}</span>
            <span className="text-slate-600">·</span>
            <span className="text-cyan-400">ACEScc Color Pipeline</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-purple-950/40 border border-purple-500/30 rounded-full text-xs font-mono text-purple-300">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Cluster: 5 Providers Online</span>
          </div>
        </div>

        {/* Credit Wallet Snapshot on Dashboard */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Wallet:</span>
          <div className="px-3 py-1 bg-gradient-to-r from-purple-900/60 to-blue-900/60 border border-purple-500/40 rounded-lg text-xs font-mono flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-white">
              {wallet.plan === 'Unlimited' ? 'UNLIMITED PASS' : `${wallet.balance.toLocaleString()} Credits`}
            </span>
          </div>
        </div>
      </div>

      {/* Hero Banner for Active Production */}
      <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 bg-[#0d111c] shadow-2xl">
        <div className="absolute inset-0">
          <img
            src={activeFilm.coverImage}
            alt={activeFilm.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-20 filter saturate-150"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090b11] via-[#090b11]/90 to-transparent" />
        </div>

        <div className="relative p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-purple-300 font-mono">
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                {activeFilm.status.toUpperCase()}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-cyan-400 font-semibold">{activeFilm.aspectRatio} Cinema Scope</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300">{activeFilm.resolution} @ {activeFilm.fps}fps</span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white font-cinzel">
              {activeFilm.title}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              {activeFilm.tagline}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400 font-medium">
              <span>Director: <strong className="text-slate-200">{activeFilm.director}</strong></span>
              <span className="text-slate-600">·</span>
              <span>DP: <strong className="text-slate-200">{activeFilm.dp}</strong></span>
              <span className="text-slate-600">·</span>
              <span>Updated {activeFilm.updatedAt}</span>
            </div>
          </div>

          {/* Call-to-action buttons with approved purple/blue gradient */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                soundFx.playCinematicImpact();
                onNavigate('editor');
              }}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-xl shadow-purple-600/30 whitespace-nowrap active:scale-95"
            >
              <Play className="w-4 h-4 fill-current text-white" />
              <span>Launch Video Editor</span>
            </button>

            <button
              onClick={() => {
                soundFx.playCinematicImpact();
                onNavigate('ai_wizard');
              }}
              className="flex items-center gap-2 px-5 py-3 bg-[#090b11] hover:bg-slate-900 text-purple-300 font-bold text-xs rounded-xl border border-purple-500/40 hover:border-purple-400 transition-all shadow-md whitespace-nowrap active:scale-95"
            >
              <Workflow className="w-4 h-4 text-cyan-400" />
              <span>AI Film Creator</span>
            </button>

            <button
              onClick={() => {
                soundFx.playSlateBeep();
                onNavigate('films');
              }}
              className="flex items-center gap-2 px-4 py-3 bg-[#090b11]/80 hover:bg-slate-900 text-slate-300 font-medium text-xs rounded-xl border border-slate-800 transition-colors whitespace-nowrap"
            >
              <Clapperboard className="w-4 h-4 text-amber-400" />
              <span>Digital Slate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Production KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scenes Logged Progress */}
        <div className="bg-[#0d111c] border border-purple-500/20 rounded-2xl p-4 space-y-2.5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">Scenes Logged</span>
            <Film className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">
              {activeFilm.completedScenes} / {activeFilm.scenesCount}
            </span>
            <span className="text-xs text-emerald-400 font-mono font-semibold">
              {percentScenes}% Done
            </span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-purple-600 to-cyan-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]"
              style={{ width: `${percentScenes}%` }}
            />
          </div>
        </div>

        {/* Shooting Schedule */}
        <div className="bg-[#0d111c] border border-purple-500/20 rounded-2xl p-4 space-y-2.5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">Principal Photography</span>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">
              Day {activeFilm.shootingDaysDone} <span className="text-xs font-normal text-slate-500">of {activeFilm.shootingDaysTotal}</span>
            </span>
            <span className="text-xs text-cyan-400 font-mono font-semibold">
              {percentDays}%
            </span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
              style={{ width: `${percentDays}%` }}
            />
          </div>
        </div>

        {/* Budget Allocation */}
        <div className="bg-[#0d111c] border border-purple-500/20 rounded-2xl p-4 space-y-2.5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">Production Budget</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">
              ${(activeFilm.spent / 1000000).toFixed(2)}M
            </span>
            <span className="text-xs text-slate-400 font-mono">
              of ${(activeFilm.budget / 1000000).toFixed(1)}M
            </span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${percentBudget}%` }}
            />
          </div>
        </div>

        {/* Daily Call Time */}
        <div className="bg-[#0d111c] border border-purple-500/20 rounded-2xl p-4 space-y-2.5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">Next Call Time</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">
              06:00 AM
            </span>
            <span className="text-xs text-emerald-400 font-medium">Stage 7 Call</span>
          </div>
          <p className="text-[11px] text-slate-400 truncate font-mono">
            Soundstage Exterior Tank · Pinewood
          </p>
        </div>
      </div>

      {/* AI Studio Quick Launchpad */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-purple-300 font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Studio Creation Suites</span>
          </h2>
          <span className="text-xs text-cyan-400 font-mono">Multi-Provider Neural Pipeline</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <button
            onClick={() => {
              soundFx.playScannerBeep();
              onNavigate('ai_video');
            }}
            className="p-4 bg-[#0d111c] hover:bg-slate-900 border border-purple-500/30 hover:border-purple-400 rounded-2xl text-left transition-all group shadow-md"
          >
            <Bot className="w-6 h-6 text-purple-400 mb-2.5 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">AI Video Generator</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Text-to-Video & Camera Dolly</div>
          </button>

          <button
            onClick={() => {
              soundFx.playScannerBeep();
              onNavigate('ai_image');
            }}
            className="p-4 bg-[#0d111c] hover:bg-slate-900 border border-purple-500/30 hover:border-cyan-400 rounded-2xl text-left transition-all group shadow-md"
          >
            <Sparkles className="w-6 h-6 text-cyan-400 mb-2.5 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">AI Image Generator</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Cinematic 8K Stills & Concept Art</div>
          </button>

          <button
            onClick={() => {
              soundFx.playScannerBeep();
              onNavigate('character');
            }}
            className="p-4 bg-[#0d111c] hover:bg-slate-900 border border-purple-500/30 hover:border-purple-400 rounded-2xl text-left transition-all group shadow-md"
          >
            <User className="w-6 h-6 text-amber-400 mb-2.5 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">Character Dossiers</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Actors, Archetypes & Continuity</div>
          </button>

          <button
            onClick={() => {
              soundFx.playScannerBeep();
              onNavigate('ai_voice');
            }}
            className="p-4 bg-[#0d111c] hover:bg-slate-900 border border-purple-500/30 hover:border-emerald-400 rounded-2xl text-left transition-all group shadow-md"
          >
            <Radio className="w-6 h-6 text-emerald-400 mb-2.5 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-white">AI Voice & Dialogue</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Neural VO, ADR & Cloning</div>
          </button>
        </div>
      </div>

      {/* Production Suites Launchpad */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-purple-300 font-mono">
            Filmmaking & Post-Production Suites
          </h2>
          <span className="text-xs text-slate-400 font-mono">18 Integrated Modules</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigate('editor')}
            className="p-3.5 bg-[#0d111c] hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-xl text-left transition-all group"
          >
            <Film className="w-4 h-4 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-semibold text-white">Video Editor</div>
            <div className="text-[10px] text-slate-400">Multi-track timeline</div>
          </button>

          <button
            onClick={() => onNavigate('color_grading')}
            className="p-3.5 bg-[#0d111c] hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-left transition-all group"
          >
            <Sliders className="w-4 h-4 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-semibold text-white">Color Grading</div>
            <div className="text-[10px] text-slate-400">3-Way color wheels</div>
          </button>

          <button
            onClick={() => onNavigate('script')}
            className="p-3.5 bg-[#0d111c] hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-xl text-left transition-all group"
          >
            <FileText className="w-4 h-4 text-sky-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-semibold text-white">Screenplay</div>
            <div className="text-[10px] text-slate-400">Standard Courier script</div>
          </button>

          <button
            onClick={() => onNavigate('vfx')}
            className="p-3.5 bg-[#0d111c] hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-left transition-all group"
          >
            <Wand2 className="w-4 h-4 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-semibold text-white">VFX & Shaders</div>
            <div className="text-[10px] text-slate-400">Chroma key & flare</div>
          </button>

          <button
            onClick={() => onNavigate('audio')}
            className="p-3.5 bg-[#0d111c] hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition-all group"
          >
            <Music className="w-4 h-4 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-semibold text-white">Audio Studio</div>
            <div className="text-[10px] text-slate-400">Foley, mixer & VO</div>
          </button>

          <button
            onClick={() => onNavigate('cloud_storage')}
            className="p-3.5 bg-[#0d111c] hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all group"
          >
            <Cloud className="w-4 h-4 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-semibold text-white">Cloud Storage</div>
            <div className="text-[10px] text-slate-400">Firebase & S3 Sync</div>
          </button>
        </div>
      </div>
    </div>
  );
};
