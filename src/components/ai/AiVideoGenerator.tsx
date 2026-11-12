import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  Film, 
  Camera, 
  Wand2, 
  Download,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { FilmProject } from '../../types';
import { soundFx } from '../../utils/audioSynth';

interface AiVideoGeneratorProps {
  activeFilm: FilmProject;
  onSendToTimeline?: (clipName: string, assetUrl: string) => void;
}

export const AiVideoGenerator: React.FC<AiVideoGeneratorProps> = ({ activeFilm, onSendToTimeline }) => {
  const [prompt, setPrompt] = useState('An astronaut in a weathered titanium EVA suit discovers a towering obsidian monolith emitting golden runes on a basalt alien moon');
  const [cameraMotion, setCameraMotion] = useState('Slow Dolly Push-In + Crane Up');
  const [stylePreset, setStylePreset] = useState('Cinematic Photoreal (Arri Alexa 65)');
  const [aspectRatio, setAspectRatio] = useState<'2.39:1' | '16:9' | '9:16'>('2.39:1');
  const [fps, setFps] = useState<24 | 30 | 60>(24);
  const [motionStrength, setMotionStrength] = useState<number>(65);
  const [seed, setSeed] = useState<number>(42891);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string>('/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg');
  const [enhancedSpecs, setEnhancedSpecs] = useState<any>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    soundFx.playScannerBeep();

    // Call server AI video prompt engineer
    try {
      const res = await fetch('/api/ai/video-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: prompt,
          cameraMotion,
          style: stylePreset,
        }),
      });
      const data = await res.json();
      setEnhancedSpecs(data);
    } catch (e) {
      console.warn('API error:', e);
    }

    // Simulate multi-pass neural rendering frames
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          soundFx.playCinematicImpact();
          setGeneratedVideoUrl(
            aspectRatio === '9:16'
              ? '/src/assets/images/cinema_cyberpunk_alley_1794406568416.jpg'
              : '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg'
          );
          return 100;
        }
        return p + 5;
      });
    }, 120);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950 text-slate-100">
      {/* Main Video Viewport & Playback Stage */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 select-none">
        {/* Cinema Video Frame */}
        <div
          className={`relative bg-black border-2 border-purple-500/40 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center transition-all duration-300 ${
            aspectRatio === '2.39:1'
              ? 'w-full max-w-3xl aspect-[2.39/1]'
              : aspectRatio === '9:16'
              ? 'w-[320px] aspect-[9/16]'
              : 'w-full max-w-3xl aspect-video'
          }`}
        >
          <img
            src={generatedVideoUrl}
            alt="AI Video Frame"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover filter contrast-110"
          />

          {/* Anamorphic letterbox badge */}
          <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded text-xs font-mono-cinema text-purple-400 border border-purple-500/30 flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5" />
            <span>AI NEURAL VIDEO ENGINE</span>
          </div>

          <div className="absolute top-3 right-3 bg-black/80 px-2.5 py-1 rounded text-xs font-mono-cinema text-slate-300 border border-white/10">
            {fps} FPS · {aspectRatio}
          </div>

          {/* Rendering Progress Overlay */}
          {isGenerating && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-3 z-30">
              <div className="w-12 h-12 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-sm font-bold text-white font-mono-cinema">
                SYNTHESIZING NEURAL FRAMES ({progress}%)
              </div>
              <div className="w-64 bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 font-mono text-center">
                Computing camera optical flow: {cameraMotion}
              </p>
            </div>
          )}
        </div>

        {/* Video Actions Bar */}
        <div className="w-full max-w-3xl mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playCinematicImpact();
                if (onSendToTimeline) {
                  onSendToTimeline('AI_Generated_Shot_01.mov', generatedVideoUrl);
                } else {
                  alert('Added generated AI shot directly into Video Editor timeline Track V1!');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-colors shadow-lg shadow-purple-600/30"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Send to Video Timeline</span>
            </button>

            <button
              onClick={() => {
                soundFx.playShutterSound();
                alert('Saved 4K video clip to Project Media Library.');
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export MP4</span>
            </button>
          </div>

          <span className="text-xs text-slate-400 font-mono-cinema">
            Engine: Pluggable AI Video Generator
          </span>
        </div>
      </div>

      {/* Right Sidebar: Prompt Director & Motion Controls */}
      <div className="w-full lg:w-96 bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto space-y-5">
        <div>
          <div className="flex items-center gap-2 text-purple-400 font-mono-cinema font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>AI Text-to-Video Director</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Cinematic generative video with camera trajectory control
          </p>
        </div>

        {/* Prompt Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 uppercase font-mono-cinema">
            Scene Description / Visual Prompt
          </label>
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-purple-500 resize-none"
            placeholder="Describe action, lighting, actor, environment..."
          />
        </div>

        {/* Camera Motion Selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 uppercase font-mono-cinema">
            Camera Trajectory & Motion
          </label>
          <select
            value={cameraMotion}
            onChange={(e) => setCameraMotion(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-amber-300 font-mono outline-none"
          >
            <option value="Slow Dolly Push-In + Crane Up">Slow Dolly Push-In + Crane Up</option>
            <option value="Orbit 360 Dramatic Rotation">Orbit 360 Dramatic Rotation</option>
            <option value="Tracking Steadicam Follow">Tracking Steadicam Follow</option>
            <option value="Fast Dynamic Whip Pan">Fast Dynamic Whip Pan</option>
            <option value="FPV Drone Landscape Sweep">FPV Drone Landscape Sweep</option>
            <option value="Static Tripod Lockdown">Static Tripod Lockdown</option>
          </select>
        </div>

        {/* Visual Style Preset */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 uppercase font-mono-cinema">
            Rendering Aesthetic
          </label>
          <select
            value={stylePreset}
            onChange={(e) => setStylePreset(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-cyan-300 font-mono outline-none"
          >
            <option value="Cinematic Photoreal (Arri Alexa 65)">Cinematic Photoreal (Arri Alexa 65)</option>
            <option value="Cyberpunk Neon Blade Runner Style">Cyberpunk Neon (Neo-Noir)</option>
            <option value="Vintage 35mm Technicolor 1970s">Vintage 35mm Technicolor</option>
            <option value="Unreal Engine 5 Hyper-Realistic">Unreal Engine 5 Hyper-Realistic</option>
            <option value="Studio Ghibli Hand-Drawn Anime">Studio Ghibli Anime Aesthetic</option>
          </select>
        </div>

        {/* Aspect Ratio & Frame Rate */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-mono-cinema block mb-1">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['2.39:1', '16:9', '9:16'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setAspectRatio(r)}
                  className={`py-1.5 rounded font-mono text-[11px] font-bold border transition-colors ${
                    aspectRatio === r
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-mono-cinema block mb-1">
              Frame Rate
            </label>
            <div className="grid grid-cols-3 gap-1">
              {([24, 30, 60] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFps(f)}
                  className={`py-1.5 rounded font-mono text-[11px] font-bold border transition-colors ${
                    fps === f
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Motion Dynamics Slider */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono-cinema">
            <span>MOTION STRENGTH</span>
            <span>{motionStrength}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={motionStrength}
            onChange={(e) => setMotionStrength(parseInt(e.target.value))}
            className="w-full accent-purple-500"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl transition-all shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isGenerating ? 'Synthesizing...' : 'Generate AI Video Shot'}</span>
        </button>

        {/* Director Specs Box */}
        {enhancedSpecs && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1.5 font-mono">
            <span className="text-[10px] text-purple-400 uppercase block font-bold">
              Optics Breakdown
            </span>
            <div className="text-slate-300 text-[11px]">
              Lens: {enhancedSpecs.cameraSpec?.focalLength}
            </div>
            <div className="text-slate-400 text-[11px]">
              Shutter: {enhancedSpecs.cameraSpec?.shutterSpeed} · {enhancedSpecs.cameraSpec?.lightingGrade}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
