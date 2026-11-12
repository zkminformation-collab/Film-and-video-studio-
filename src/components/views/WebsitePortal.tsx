import React, { useState } from 'react';
import { 
  Clapperboard, 
  Film, 
  Sparkles, 
  Camera, 
  Music, 
  Wand2, 
  ArrowRight, 
  Check, 
  Play, 
  ShieldCheck, 
  Download,
  Globe,
  RotateCcw,
  Clock,
  Layers,
  ChevronRight,
  Zap,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import { FilmProject } from '../../types';
import { soundFx } from '../../utils/audioSynth';
import { useStudioAi } from '../../context/StudioAiContext';

interface WebsitePortalProps {
  allFilms: FilmProject[];
  onOpenWorkstation: () => void;
}

export const WebsitePortal: React.FC<WebsitePortalProps> = ({ allFilms, onOpenWorkstation }) => {
  const { queue, reprocessAllPending, isReprocessing, reprocessStatusText } = useStudioAi();
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'plans'>('overview');

  const pendingCount = queue.filter((i) => i.status === 'Queued' || i.status === 'Failed').length;

  return (
    <div className="flex-1 overflow-y-auto bg-[#090b11] text-slate-100 selection:bg-purple-500 selection:text-white">
      {/* Top Navbar */}
      <div className="border-b border-purple-500/20 bg-[#0d111c]/90 backdrop-blur sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center font-extrabold text-white text-base shadow-md shadow-purple-600/30">
            F
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-wider font-cinzel text-white flex items-center gap-1">
              <span>FILM</span>
              <span className="text-purple-400">&</span>
              <span>VIDEO</span>
            </div>
            <div className="text-[9px] text-cyan-400 font-mono tracking-widest uppercase">
              CREATIVE STUDIO
            </div>
          </div>
        </div>

        {/* Center Quick Queue Notification */}
        {pendingCount > 0 && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-purple-950/60 border border-purple-500/40 rounded-full text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-slate-300">{pendingCount} Pending Generation Tasks</span>
            <button
              disabled={isReprocessing}
              onClick={() => reprocessAllPending()}
              className="text-cyan-400 hover:text-cyan-300 font-bold ml-1 flex items-center gap-1 underline"
            >
              <RotateCcw className={`w-3 h-3 ${isReprocessing ? 'animate-spin' : ''}`} />
              <span>{isReprocessing ? 'Reprocessing...' : 'Reprocess All'}</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundFx.playScannerBeep();
              onOpenWorkstation();
            }}
            className="px-5 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-purple-600/30 active:scale-95"
          >
            Launch Creative Suite ↗
          </button>
        </div>
      </div>

      {/* Hero Welcome Banner */}
      <section className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        <div className="relative rounded-3xl overflow-hidden border border-purple-500/30 bg-gradient-to-br from-[#1a1336] via-[#0d111c] to-[#090b11] p-8 md:p-12 shadow-2xl">
          {/* Subtle glowing ambient orbs */}
          <div className="absolute top-0 right-10 w-72 h-72 rounded-full bg-gradient-to-br from-purple-600/30 to-blue-600/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-36 w-60 h-60 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

          <div className="relative max-w-2xl space-y-4">
            <div className="text-xs text-purple-400 uppercase font-mono font-bold tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>YOUR CREATIVE WORKSPACE</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight font-cinzel text-white leading-tight">
              Make something <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400">
                extraordinary.
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-300 leading-relaxed font-sans max-w-xl">
              Bring your next story to life with film tools, a professional timeline video editor,
              neural AI generation, and multi-track audio studios.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  soundFx.playCinematicImpact();
                  onOpenWorkstation();
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white font-bold text-xs rounded-xl shadow-xl shadow-purple-600/30 transition-all hover:scale-102 flex items-center gap-2"
              >
                <span>Open Video Editor</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={async () => {
                  soundFx.playScannerBeep();
                  try {
                    const res = await fetch('/api/films/film-kannada-01/screenplay/generate', { method: 'POST' });
                    const data = await res.json();
                    soundFx.playCinematicImpact();
                    alert(`AI Screenplay Generated successfully for "${data.projectTitle || 'The Chronos Gate'}"!\nOpening Creative Suite...`);
                    onOpenWorkstation();
                  } catch (e) {
                    onOpenWorkstation();
                  }
                }}
                className="px-5 py-3 bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-mono font-bold text-xs rounded-xl border border-purple-500/40 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span>Generate screenplay with AI</span>
              </button>

              <button
                disabled={isReprocessing}
                onClick={() => reprocessAllPending()}
                className="px-5 py-3 bg-[#0d111c] hover:bg-slate-900 text-cyan-300 font-mono font-bold text-xs rounded-xl border border-cyan-500/40 transition-all flex items-center gap-2"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isReprocessing ? 'animate-spin' : ''}`} />
                <span>Reprocess All {pendingCount > 0 ? `(${pendingCount})` : 'Queue'}</span>
              </button>
            </div>

            {reprocessStatusText && (
              <p className="text-xs text-cyan-300 font-mono animate-pulse pt-2">
                ▶ {reprocessStatusText}
              </p>
            )}
          </div>
        </div>

        {/* Creative Tools Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-cinzel text-white">Creative Tools & Workspaces</h2>
              <p className="text-xs text-slate-400 font-mono">Choose a suite to begin production</p>
            </div>
            <button
              onClick={onOpenWorkstation}
              className="text-xs text-purple-400 hover:text-purple-300 font-mono flex items-center gap-1"
            >
              <span>ALL 18 MODULES</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tool 1 */}
            <div
              onClick={() => {
                soundFx.playCinematicImpact();
                onOpenWorkstation();
              }}
              className="p-6 bg-gradient-to-br from-[#17132e] to-[#0d111c] border border-purple-500/40 rounded-2xl space-y-3 cursor-pointer hover:border-purple-400 transition-all group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl text-purple-400">▣</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded font-mono font-bold">
                  AI WORKFLOW
                </span>
              </div>
              <h3 className="text-base font-bold text-white font-cinzel group-hover:text-cyan-300 transition-colors">
                AI Film Maker
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Turn a story brief into a screenplay, scenes, character dossiers, and complete production plan.
              </p>
              <span className="text-xs text-purple-400 font-mono font-bold flex items-center gap-1 pt-1">
                <span>Open Workspace</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>

            {/* Tool 2 */}
            <div
              onClick={() => {
                soundFx.playScannerBeep();
                onOpenWorkstation();
              }}
              className="p-6 bg-[#0d111c] border border-purple-500/20 rounded-2xl space-y-3 cursor-pointer hover:border-cyan-400 transition-all group shadow-lg"
            >
              <span className="text-2xl text-cyan-400">▤</span>
              <h3 className="text-base font-bold text-white font-cinzel group-hover:text-cyan-300 transition-colors">
                Video Editor
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Arrange clips, multi-track audio, 3D LUT shaders, titles and optical transitions on a timeline.
              </p>
              <span className="text-xs text-cyan-400 font-mono font-bold flex items-center gap-1 pt-1">
                <span>Open Editor</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>

            {/* Tool 3 */}
            <div
              onClick={() => {
                soundFx.playScannerBeep();
                onOpenWorkstation();
              }}
              className="p-6 bg-[#0d111c] border border-purple-500/20 rounded-2xl space-y-3 cursor-pointer hover:border-purple-400 transition-all group shadow-lg"
            >
              <span className="text-2xl text-indigo-400">✧</span>
              <h3 className="text-base font-bold text-white font-cinzel group-hover:text-purple-300 transition-colors">
                Animation & VFX
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Plan motion graphics, real-time green screen chroma keying, 35mm grain, and anamorphic flares.
              </p>
              <span className="text-xs text-indigo-400 font-mono font-bold flex items-center gap-1 pt-1">
                <span>Explore Tools</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </div>

        {/* Recent Productions Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0d111c] border border-purple-500/20 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div>
                <h3 className="text-sm font-bold font-cinzel text-white">Active Film Projects</h3>
                <p className="text-[11px] text-slate-400 font-mono">Pick up where you left off</p>
              </div>
              <button onClick={onOpenWorkstation} className="text-xs text-cyan-400 font-mono">
                View All →
              </button>
            </div>

            <div className="space-y-3">
              {allFilms.map((film) => (
                <div
                  key={film.id}
                  onClick={onOpenWorkstation}
                  className="flex items-center justify-between p-3 bg-[#090b11] hover:bg-slate-900 border border-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                      ▶
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{film.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {film.aspectRatio} · {film.completedScenes}/{film.scenesCount} Scenes Done
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40 font-mono">
                    {film.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tip Box */}
          <div className="bg-gradient-to-br from-[#17132e] to-[#0d111c] border border-purple-500/30 rounded-2xl p-6 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] text-cyan-400 uppercase font-mono font-bold tracking-wider">
                CREATOR TIP
              </span>
              <h4 className="text-base font-bold text-white font-cinzel">
                Start with a strong story.
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Build a scene outline before generating shots. It keeps characters, locations and visual style consistent across all 18 modules.
              </p>
            </div>

            <button
              onClick={() => {
                soundFx.playScannerBeep();
                onOpenWorkstation();
              }}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold font-mono transition-colors shadow"
            >
              Create a Film Plan →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 py-8 px-6 text-center text-xs text-slate-500 font-mono">
        <p>© 2026 Film & Video Studio. Professional Cinema & Animation Architecture.</p>
      </footer>
    </div>
  );
};
