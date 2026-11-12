import React, { useState } from 'react';
import { 
  Smartphone, 
  Film, 
  Camera, 
  FileText, 
  Sparkles, 
  Share2, 
  Play, 
  Pause,
  Scissors, 
  Volume2, 
  Plus, 
  Sliders, 
  Layers,
  Clapperboard,
  Home,
  User,
  Settings,
  Zap,
  Repeat
} from 'lucide-react';
import { FilmProject } from '../../types';
import { soundFx } from '../../utils/audioSynth';
import { useStudioAi } from '../../context/StudioAiContext';

interface AndroidPreviewProps {
  activeFilm: FilmProject;
}

export const AndroidPreview: React.FC<AndroidPreviewProps> = ({ activeFilm }) => {
  const { wallet } = useStudioAi();
  const [activeTab, setActiveTab] = useState<'home' | 'editor' | 'camera' | 'script' | 'more'>('editor');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeMobileLut, setActiveMobileLut] = useState<'Teal & Orange' | 'Cyberpunk' | 'Noir'>('Teal & Orange');

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#090b11] text-slate-100 flex flex-col items-center justify-center">
      {/* Informational Header */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between text-xs text-slate-400 font-mono">
        <span className="flex items-center gap-1.5 text-purple-400 font-semibold">
          <Smartphone className="w-4 h-4 text-cyan-400" />
          Android 15 · Kotlin + Jetpack Compose
        </span>
        <span className="text-[10px] bg-purple-950/60 text-purple-300 border border-purple-800/40 px-2 py-0.5 rounded">
          Design: B · Creative Studio
        </span>
      </div>

      {/* Realistic Android Phone Device Shell */}
      <div className="w-[360px] h-[720px] bg-[#090b11] rounded-[48px] p-3.5 shadow-2xl border-4 border-slate-800 relative flex flex-col select-none overflow-hidden ring-2 ring-purple-500/30">
        {/* Dynamic Island / Front Punch Hole Camera */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full z-50 flex items-center justify-center border border-slate-800">
          <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
        </div>

        {/* Android Display Screen (Inside Phone) */}
        <div className="flex-1 bg-[#090b11] rounded-[38px] overflow-hidden flex flex-col relative text-slate-100">
          {/* Status Bar */}
          <div className="h-7 px-6 pt-1 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0 z-40 bg-[#090b11]/90 backdrop-blur">
            <span>09:41</span>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-cyan-400">5G</span>
              <div className="w-5 h-2.5 border border-slate-400 rounded-sm p-0.5 flex items-center">
                <div className="w-3 h-full bg-cyan-400 rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Android App Top Bar (Material 3 TopAppBar in Modern Creative Studio) */}
          <div className="h-12 px-4 border-b border-purple-500/20 bg-[#0d111c] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Clapperboard className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-white font-cinzel tracking-wider">
                Film & Video Studio
              </span>
            </div>
            <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
              PRO M3
            </span>
          </div>

          {/* Screen Content based on bottom navigation */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {activeTab === 'home' && (
              <div className="space-y-4">
                {/* Active Film Card */}
                <div className="rounded-2xl overflow-hidden border border-purple-500/30 bg-[#0d111c] relative shadow-lg">
                  <div className="h-32 relative">
                    <img
                      src={activeFilm.coverImage}
                      alt={activeFilm.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090b11] via-[#090b11]/40 to-transparent" />
                    <div className="absolute bottom-2 left-3">
                      <span className="text-[9px] text-cyan-400 font-mono font-bold">
                        {activeFilm.aspectRatio} · {activeFilm.resolution}
                      </span>
                      <h3 className="text-sm font-bold text-white font-cinzel">
                        {activeFilm.title}
                      </h3>
                    </div>
                  </div>

                  <div className="p-3 text-xs space-y-2">
                    <div className="flex justify-between text-slate-400 text-[11px] font-mono">
                      <span>Scenes Done</span>
                      <span className="text-purple-400 font-bold">{activeFilm.completedScenes}/{activeFilm.scenesCount}</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-cyan-500 h-full rounded-full"
                        style={{ width: `${(activeFilm.completedScenes / activeFilm.scenesCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => {
                      soundFx.playScannerBeep();
                      setActiveTab('editor');
                    }}
                    className="p-3 bg-[#0d111c] hover:bg-slate-900 border border-purple-500/30 rounded-xl text-left space-y-1 transition-all"
                  >
                    <Film className="w-4 h-4 text-purple-400" />
                    <div className="font-bold text-white">Video Editor</div>
                    <div className="text-[10px] text-slate-400">Mobile Timeline</div>
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playShutterSound();
                      setActiveTab('camera');
                    }}
                    className="p-3 bg-[#0d111c] hover:bg-slate-900 border border-purple-500/30 rounded-xl text-left space-y-1 transition-all"
                  >
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <div className="font-bold text-white">Camera Rec</div>
                    <div className="text-[10px] text-slate-400">2.39:1 & 9:16</div>
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playSlateBeep();
                      alert('Slate take logged in Android Room SQLite DB!');
                    }}
                    className="p-3 bg-[#0d111c] hover:bg-slate-900 border border-purple-500/30 rounded-xl text-left space-y-1 transition-all"
                  >
                    <Clapperboard className="w-4 h-4 text-amber-400" />
                    <div className="font-bold text-white">Slate Take</div>
                    <div className="text-[10px] text-slate-400">1kHz Sync Beep</div>
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playCinematicImpact();
                      alert('Render started on Android Media3 / FFmpeg pipeline!');
                    }}
                    className="p-3 bg-[#0d111c] hover:bg-slate-900 border border-purple-500/30 rounded-xl text-left space-y-1 transition-all"
                  >
                    <Share2 className="w-4 h-4 text-emerald-400" />
                    <div className="font-bold text-white">Export 4K</div>
                    <div className="text-[10px] text-slate-400">Direct Share</div>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'editor' && (
              <div className="space-y-3 text-xs">
                {/* Mobile Preview Screen */}
                <div className="aspect-video bg-black rounded-xl overflow-hidden border border-purple-500/30 relative flex items-center justify-center shadow-lg">
                  <img
                    src="/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg"
                    alt="Editor preview"
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover ${
                      activeMobileLut === 'Teal & Orange'
                        ? 'contrast-125 saturate-125 hue-rotate-15'
                        : activeMobileLut === 'Cyberpunk'
                        ? 'contrast-130 saturate-200 hue-rotate-90'
                        : 'grayscale contrast-150'
                    }`}
                  />
                  <button
                    onClick={() => {
                      soundFx.playScannerBeep();
                      setIsPlaying(!isPlaying);
                    }}
                    className="absolute p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-bold shadow-lg shadow-purple-600/40 active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>

                  {/* TC Overlay */}
                  <div className="absolute bottom-2 right-2 text-[9px] font-mono text-cyan-300 bg-black/80 px-2 py-0.5 rounded border border-cyan-500/30">
                    00:00:08:14
                  </div>
                </div>

                {/* Mobile Timeline Tracks */}
                <div className="bg-[#0d111c] border border-purple-500/20 rounded-xl p-2.5 space-y-1.5 font-mono text-[10px]">
                  <div className="flex justify-between text-slate-400">
                    <span className="text-cyan-400 font-bold">TC: 00:00:08:14</span>
                    <span className="text-purple-300">{activeMobileLut}</span>
                  </div>
                  <div className="h-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-md flex items-center px-2 text-white font-bold truncate shadow-sm">
                    Take_01_Basalt_4K.mov
                  </div>
                  <div className="h-5 bg-cyan-700/80 rounded-md flex items-center px-2 text-white truncate">
                    Atmo_Wind_Ambience.wav
                  </div>
                </div>

                {/* Mobile Editing Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => soundFx.playShutterSound()}
                    className="py-2 bg-[#0d111c] border border-purple-500/30 rounded-xl font-semibold text-center text-slate-200 text-xs active:bg-purple-900/40"
                  >
                    Split
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playScannerBeep();
                      setActiveMobileLut(
                        activeMobileLut === 'Teal & Orange' ? 'Cyberpunk' : activeMobileLut === 'Cyberpunk' ? 'Noir' : 'Teal & Orange'
                      );
                    }}
                    className="py-2 bg-[#0d111c] border border-purple-500/30 rounded-xl font-semibold text-center text-cyan-300 text-xs active:bg-cyan-900/40"
                  >
                    Cycle LUT
                  </button>
                  <button
                    onClick={() => soundFx.playWhoosh()}
                    className="py-2 bg-[#0d111c] border border-purple-500/30 rounded-xl font-semibold text-center text-purple-300 text-xs active:bg-purple-900/40"
                  >
                    Speed 2x
                  </button>
                </div>

                {/* Direct AI mobile generation button */}
                <button
                  onClick={() => {
                    soundFx.playCinematicImpact();
                    alert('Mobile AI Text-to-Video generation sent to Cloud GPU worker queue!');
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Shot Direct Inject</span>
                </button>
              </div>
            )}

            {activeTab === 'camera' && (
              <div className="space-y-3 text-xs">
                <div className="aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-purple-500/30 relative flex items-center justify-center">
                  <img
                    src="/src/assets/images/cinema_cyberpunk_alley_1794406568416.jpg"
                    alt="Mobile Camera"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 inset-x-2 flex justify-between text-[10px] font-mono text-white bg-black/80 px-2.5 py-1 rounded-lg border border-purple-500/20">
                    <span className="text-cyan-400 font-bold">STBY · 24 FPS</span>
                    <span className="text-purple-300">ISO 800 · 1/48s</span>
                  </div>
                  <button
                    onClick={() => soundFx.playShutterSound()}
                    className="absolute bottom-4 w-12 h-12 rounded-full border-4 border-white bg-gradient-to-r from-purple-600 to-rose-600 shadow-xl"
                  />
                </div>
              </div>
            )}

            {activeTab === 'script' && (
              <div className="space-y-3 text-xs font-screenplay p-3 bg-[#0d111c] rounded-xl border border-purple-500/20">
                <div className="font-bold text-cyan-400 text-[11px]">
                  INT. OBSERVATION DECK - NIGHT
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Valerie checks the telemetry monitor. The signal waveform syncs with the lunar beacon.
                </p>
                <div className="text-center font-bold text-purple-300">VALERIE</div>
                <div className="text-center italic text-slate-400 text-[10px]">(whispering)</div>
                <div className="text-center text-slate-100 text-[11px]">
                  "Physics doesn't negotiate. The gate is opening."
                </div>
              </div>
            )}
          </div>

          {/* Android Material 3 Bottom Navigation Bar */}
          <div className="h-14 border-t border-purple-500/20 bg-[#0d111c] flex items-center justify-around px-2 shrink-0">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'editor', label: 'Editor', icon: Film },
              { id: 'camera', label: 'Camera', icon: Camera },
              { id: 'script', label: 'Script', icon: FileText },
            ].map((nav) => {
              const Icon = nav.icon;
              const isSelected = activeTab === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => {
                    soundFx.playScannerBeep();
                    setActiveTab(nav.id as any);
                  }}
                  className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
                    isSelected ? 'text-cyan-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-mono">{nav.label}</span>
                </button>
              );
            })}
          </div>

          {/* Android Home Navigation Bar Pill */}
          <div className="h-4 flex items-center justify-center shrink-0 pb-1">
            <div className="w-24 h-1 bg-slate-600 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
