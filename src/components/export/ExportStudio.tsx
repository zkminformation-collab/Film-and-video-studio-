import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Download, 
  Play, 
  CheckCircle2, 
  Film, 
  Smartphone, 
  Tv, 
  Monitor, 
  Sliders, 
  Sparkles,
  Layers
} from 'lucide-react';
import { FilmProject } from '../../types';
import { soundFx } from '../../utils/audioSynth';

interface ExportStudioProps {
  activeFilm: FilmProject;
}

interface ExportPreset {
  id: string;
  name: string;
  resolution: string;
  aspectRatio: string;
  fps: number;
  format: string;
  codec: string;
  bitrate: string;
  icon: React.ElementType;
}

const PRESETS: ExportPreset[] = [
  {
    id: 'cinema_dci',
    name: 'Cinema DCI 4K Master',
    resolution: '4096 x 1716 (2.39:1 Scope)',
    aspectRatio: '2.39:1',
    fps: 24,
    format: 'MOV',
    codec: 'Apple ProRes 422 HQ',
    bitrate: '220 Mbps',
    icon: Film,
  },
  {
    id: 'youtube_4k',
    name: 'YouTube & Vimeo 4K UHD',
    resolution: '3840 x 2160 (16:9)',
    aspectRatio: '16:9',
    fps: 60,
    format: 'MP4',
    codec: 'H.264 / HEVC High Profile',
    bitrate: '45 Mbps',
    icon: Monitor,
  },
  {
    id: 'tiktok_reels',
    name: 'TikTok & Reels Vertical',
    resolution: '1080 x 1920 (9:16 Mobile)',
    aspectRatio: '9:16',
    fps: 30,
    format: 'MP4',
    codec: 'H.264 AAC Stereo',
    bitrate: '15 Mbps',
    icon: Smartphone,
  },
  {
    id: 'broadcast_1080p',
    name: 'Broadcast Television',
    resolution: '1920 x 1080 (16:9 Full HD)',
    aspectRatio: '16:9',
    fps: 24,
    format: 'MXF / MOV',
    codec: 'Avid DNxHD / ProRes',
    bitrate: '35 Mbps',
    icon: Tv,
  },
];

export const ExportStudio: React.FC<ExportStudioProps> = ({ activeFilm }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('cinema_dci');
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderFinished, setRenderFinished] = useState<boolean>(false);
  const [burnSubtitles, setBurnSubtitles] = useState<boolean>(true);
  const [colorSpace, setColorSpace] = useState<string>('Rec.709');

  const selectedPreset = PRESETS.find((p) => p.id === selectedPresetId) || PRESETS[0];

  useEffect(() => {
    let interval: any;
    if (isRendering) {
      interval = setInterval(() => {
        setRenderProgress((prev) => {
          if (prev >= 100) {
            setIsRendering(false);
            setRenderFinished(true);
            soundFx.playCinematicImpact();
            return 100;
          }
          return prev + 2;
        });
      }, 70);
    }
    return () => clearInterval(interval);
  }, [isRendering]);

  const handleStartRender = () => {
    soundFx.playSlateBeep();
    setRenderProgress(0);
    setRenderFinished(false);
    setIsRendering(true);
  };

  const handleDownloadMaster = () => {
    soundFx.playShutterSound();
    const manifest = {
      project: activeFilm.title,
      preset: selectedPreset.name,
      resolution: selectedPreset.resolution,
      codec: selectedPreset.codec,
      renderedAt: new Date().toISOString(),
      status: 'Master Quality Approved',
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeFilm.title.replace(/\s+/g, '_')}_${selectedPreset.id}_Master.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-100 space-y-6">
      {/* Top Banner */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs text-amber-400 font-mono-cinema">
          <span>Multi-Format Render Engine</span>
          <span aria-hidden="true">·</span>
          <span>Hardware Accelerated WebGL / MediaStream</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-cinzel">
          Export & Deliverables Studio
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Presets List (Left 7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono-cinema block">
            Select Output Delivery Preset
          </span>

          <div className="space-y-3">
            {PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isSelected = preset.id === selectedPresetId;
              return (
                <div
                  key={preset.id}
                  onClick={() => {
                    soundFx.playScannerBeep();
                    setSelectedPresetId(preset.id);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{preset.name}</span>
                        {isSelected && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                            SELECTED
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono-cinema mt-0.5">
                        {preset.resolution} · {preset.fps} FPS · {preset.codec}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono-cinema text-xs">
                    <div className="text-amber-400 font-bold">{preset.format}</div>
                    <div className="text-slate-500 text-[11px]">{preset.bitrate}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Render Engine & Queue (Right 5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono-cinema block">
            Render Pipeline Inspector
          </span>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-xl">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Target Deliverable:</span>
                <span className="font-bold text-white font-mono-cinema">{selectedPreset.name}</span>
              </div>

              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Master Resolution:</span>
                <span className="font-mono-cinema text-amber-300">{selectedPreset.resolution}</span>
              </div>

              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Codec / Wrapper:</span>
                <span className="font-mono-cinema text-sky-300">{selectedPreset.codec}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Burn Subtitles:</span>
                <button
                  onClick={() => setBurnSubtitles(!burnSubtitles)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    burnSubtitles ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {burnSubtitles ? 'ENABLED' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Color Management:</span>
                <select
                  value={colorSpace}
                  onChange={(e) => setColorSpace(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono outline-none"
                >
                  <option value="Rec.709">Rec.709 (SDR Standard)</option>
                  <option value="DCI-P3">DCI-P3 (Theatrical)</option>
                  <option value="Rec.2020">Rec.2020 HDR (Dolby Vision)</option>
                  <option value="ACEScc">ACEScc Linear Cinema</option>
                </select>
              </div>
            </div>

            {/* Render Progress Bar */}
            {isRendering && (
              <div className="space-y-2 p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="flex justify-between text-xs font-mono-cinema">
                  <span className="text-amber-400 font-bold animate-pulse">
                    RENDERING MASTER...
                  </span>
                  <span className="text-white font-bold">{renderProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-100"
                    style={{ width: `${renderProgress}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 font-mono-cinema text-right">
                  Encoding Frame {Math.round((renderProgress / 100) * 576)} of 576
                </div>
              </div>
            )}

            {/* Render Complete Banner */}
            {renderFinished && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Master render complete and verified!</span>
                </div>
                <button
                  onClick={handleDownloadMaster}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold rounded"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            )}

            {/* Render Trigger */}
            <button
              onClick={handleStartRender}
              disabled={isRendering}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm rounded-lg transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>{isRendering ? 'Rendering in Progress...' : 'Start Master Render & Export'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
