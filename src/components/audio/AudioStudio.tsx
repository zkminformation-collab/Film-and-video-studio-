import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, 
  Volume2, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Sliders, 
  Sparkles, 
  Radio, 
  Activity,
  Layers
} from 'lucide-react';
import { FilmProject } from '../../types';
import { soundFx } from '../../utils/audioSynth';

interface AudioStudioProps {
  activeFilm: FilmProject;
}

interface AudioTrackState {
  id: string;
  name: string;
  volume: number; // 0 to 100
  pan: number; // -50 to 50
  isMuted: boolean;
  isSolo: boolean;
  color: string;
}

export const AudioStudio: React.FC<AudioStudioProps> = ({ activeFilm }) => {
  const [tracks, setTracks] = useState<AudioTrackState[]>([
    { id: 'trk-1', name: '01 Dialogue (Boom & Lav)', volume: 82, pan: 0, isMuted: false, isSolo: false, color: '#38bdf8' },
    { id: 'trk-2', name: '02 Foley (Footsteps & Props)', volume: 68, pan: -10, isMuted: false, isSolo: false, color: '#4ade80' },
    { id: 'trk-3', name: '03 Sound FX (Sci-Fi & Impacts)', volume: 75, pan: 15, isMuted: false, isSolo: false, color: '#f59e0b' },
    { id: 'trk-4', name: '04 Film Score (Orchestral)', volume: 60, pan: 0, isMuted: false, isSolo: false, color: '#a855f7' },
  ]);

  const [masterVolume, setMasterVolume] = useState(85);
  const [isPlayingMasterBus, setIsPlayingMasterBus] = useState(false);
  const [isRecordingVo, setIsRecordingVo] = useState(false);
  const [voDuration, setVoDuration] = useState(0);
  const [aiMood, setAiMood] = useState('Epic and suspenseful deep space atmosphere');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [audioCues, setAudioCues] = useState([
    { timecode: '00:00:02', track: 'Ambience', cue: 'Low frequency 55Hz subterranean rumble' },
    { timecode: '00:00:14', track: 'Foley', cue: 'Magnetic boot steps on resonant steel grating' },
    { timecode: '00:00:26', track: 'SFX', cue: 'Electro-static ionization crackle near obelisk' },
    { timecode: '00:00:42', track: 'Score', cue: 'D minor crescendo with French horn & deep cellos' },
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Animated Audio Waveform Spectrum on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const draw = () => {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const numBars = 48;
      const barWidth = canvas.width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        // Generate dynamic waveform heights
        const wave = Math.sin(phase + i * 0.2) * 0.5 + 0.5;
        const noise = Math.random() * 0.15;
        const barHeight = Math.max(4, (wave + noise) * (canvas.height * 0.8) * (masterVolume / 100));

        const x = i * (barWidth + 2);
        const y = (canvas.height - barHeight) / 2;

        // Gradient color: Green to Amber to Rose
        const hue = i < 28 ? 150 : i < 40 ? 45 : 350;
        ctx.fillStyle = `hsl(${hue}, 80%, 55%)`;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      phase += 0.08;
      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [masterVolume]);

  // Voiceover Recording Timer
  useEffect(() => {
    let t: any;
    if (isRecordingVo) {
      t = setInterval(() => setVoDuration((d) => d + 1), 1000);
    } else {
      setVoDuration(0);
    }
    return () => clearInterval(t);
  }, [isRecordingVo]);

  const toggleVoRecord = async () => {
    if (!isRecordingVo) {
      soundFx.playSlateBeep();
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      } catch (err) {
        console.log('Mic fallback simulation:', err);
      }
      setIsRecordingVo(true);
    } else {
      soundFx.playShutterSound();
      setIsRecordingVo(false);
      alert('Voiceover track recorded and synced to Audio Track 1!');
    }
  };

  const handleAiSoundtrack = async () => {
    setIsAiLoading(true);
    soundFx.playScannerBeep();
    try {
      const res = await fetch('/api/ai/soundtrack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: aiMood,
          sceneDescription: activeFilm.tagline,
        }),
      });
      const data = await res.json();
      if (data.cues && Array.isArray(data.cues)) {
        setAudioCues(data.cues);
        soundFx.playCinematicImpact();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* Top Banner: Master Output Spectrum & Voiceover Bar */}
      <div className="h-44 border-b border-slate-800 bg-slate-900/80 p-4 flex flex-col md:flex-row items-center gap-6 shrink-0">
        {/* Real-time Spectrum Visualizer */}
        <div className="flex-1 w-full h-full bg-slate-950 border border-slate-800 rounded-lg p-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono-cinema text-slate-400">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Activity className="w-3.5 h-3.5" />
              MASTER BUS SPECTRUM (96kHz / 24-bit Surround)
            </span>
            <span className="text-emerald-400 font-bold">
              PEAK: -1.2 dBFS (Nominal)
            </span>
          </div>

          <canvas
            ref={canvasRef}
            width={600}
            height={80}
            className="w-full h-20 rounded"
          />

          <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono-cinema">
            <span>20 Hz</span>
            <span>250 Hz</span>
            <span>1 kHz</span>
            <span>4 kHz</span>
            <span>12 kHz</span>
            <span>20 kHz</span>
          </div>
        </div>

        {/* Master Output & Voiceover Control */}
        <div className="w-full md:w-80 h-full flex flex-col justify-between bg-slate-950 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono-cinema text-slate-300">
              VOICEOVER BOOTH
            </span>
            {isRecordingVo ? (
              <span className="text-xs text-rose-500 font-mono-cinema font-bold animate-pulse">
                RECORDING {voDuration}s
              </span>
            ) : (
              <span className="text-xs text-slate-500 font-mono-cinema">Ready</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleVoRecord}
              className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                isRecordingVo
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isRecordingVo ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <Mic className="w-4 h-4 text-rose-400" />
              )}
              <span>{isRecordingVo ? 'Stop Recording' : 'Record Mic VO'}</span>
            </button>

            <button
              onClick={() => {
                if (isPlayingMasterBus) {
                  soundFx.stopScorePlayback();
                  setIsPlayingMasterBus(false);
                } else {
                  soundFx.startScorePlayback(masterVolume / 100);
                  setIsPlayingMasterBus(true);
                }
              }}
              className={`px-3 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow ${
                isPlayingMasterBus
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white'
              }`}
              title="Play live master score bus audio"
            >
              {isPlayingMasterBus ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlayingMasterBus ? 'Stop Bus' : 'Play Master Bus'}</span>
            </button>

            <button
              onClick={() => soundFx.playCinematicImpact()}
              className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono font-bold"
              title="Test Monitor Sound"
            >
              Impact SFX
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-mono-cinema">Master Volume</span>
            <input
              type="range"
              min="0"
              max="100"
              value={masterVolume}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setMasterVolume(val);
                if (isPlayingMasterBus) {
                  soundFx.startScorePlayback(val / 100);
                }
              }}
              className="flex-1 accent-amber-500"
            />
            <span className="text-xs font-mono-cinema text-amber-400 w-8 text-right font-bold">
              {masterVolume}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Bottom Section: Multi-Channel Mixing Console & Foley Soundboard */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Multi-Track Channel Strips (Mixing Console) */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-6 bg-slate-950">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono-cinema mb-4">
            Studio Mixing Console & Stems
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-lg"
              >
                {/* Track Name */}
                <div className="border-b border-slate-800 pb-2">
                  <div
                    className="text-xs font-bold truncate"
                    style={{ color: track.color }}
                  >
                    {track.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono-cinema mt-0.5">
                    Bus: Stereo Master
                  </div>
                </div>

                {/* Solo / Mute Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setTracks((prev) =>
                        prev.map((t) => (t.id === track.id ? { ...t, isMuted: !t.isMuted } : t))
                      );
                    }}
                    className={`flex-1 py-1 rounded text-xs font-mono font-bold border transition-colors ${
                      track.isMuted
                        ? 'bg-rose-500 text-white border-rose-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    MUTE
                  </button>

                  <button
                    onClick={() => {
                      setTracks((prev) =>
                        prev.map((t) => (t.id === track.id ? { ...t, isSolo: !t.isSolo } : t))
                      );
                    }}
                    className={`flex-1 py-1 rounded text-xs font-mono font-bold border transition-colors ${
                      track.isSolo
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    SOLO
                  </button>
                </div>

                {/* Vertical Fader Slider */}
                <div className="flex items-center justify-center py-2">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-mono-cinema text-slate-300 font-bold">
                      {track.volume} dB
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={track.volume}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setTracks((prev) =>
                          prev.map((t) => (t.id === track.id ? { ...t, volume: val } : t))
                        );
                      }}
                      className="h-32 accent-amber-500 -rotate-90 w-32 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Pan Knob Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono-cinema">
                    <span>PAN</span>
                    <span>{track.pan === 0 ? 'CENTER' : track.pan < 0 ? `L${Math.abs(track.pan)}` : `R${track.pan}`}</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={track.pan}
                    onChange={(e) => {
                      const p = parseInt(e.target.value);
                      setTracks((prev) =>
                        prev.map((t) => (t.id === track.id ? { ...t, pan: p } : t))
                      );
                    }}
                    className="w-full accent-amber-500"
                  />
                </div>

                {/* Real Web Audio Audition Button */}
                <button
                  type="button"
                  onClick={() => soundFx.playTrackAudition(track.name, track.volume, track.pan)}
                  className="w-full py-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Audition Audio</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar: Real WebAudio Foley Soundboard & AI Cue Sheet */}
        <div className="w-full lg:w-84 bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto space-y-6">
          {/* Foley Soundboard */}
          <div className="space-y-3 pb-5 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono-cinema block">
              Foley & SFX Soundboard
            </span>
            <p className="text-[11px] text-slate-400">
              Instant Web Audio physical foley triggers:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => soundFx.playCinematicImpact()}
                className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-lg text-left transition-colors active:scale-95"
              >
                <div className="text-xs font-bold text-amber-400">Sub-Boom</div>
                <div className="text-[10px] text-slate-500">Low 35Hz drop</div>
              </button>

              <button
                onClick={() => soundFx.playSlateBeep()}
                className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-lg text-left transition-colors active:scale-95"
              >
                <div className="text-xs font-bold text-sky-400">1kHz Slate</div>
                <div className="text-[10px] text-slate-500">Hollywood sync</div>
              </button>

              <button
                onClick={() => soundFx.playShutterSound()}
                className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-lg text-left transition-colors active:scale-95"
              >
                <div className="text-xs font-bold text-emerald-400">Shutter Snap</div>
                <div className="text-[10px] text-slate-500">Mechanical click</div>
              </button>

              <button
                onClick={() => soundFx.playWhoosh()}
                className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-lg text-left transition-colors active:scale-95"
              >
                <div className="text-xs font-bold text-purple-400">Foley Whoosh</div>
                <div className="text-[10px] text-slate-500">Filtered noise</div>
              </button>
            </div>
          </div>

          {/* AI Cue Sheet Generator */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono-cinema">
                AI Soundscape Designer
              </h3>
            </div>

            <textarea
              rows={2}
              value={aiMood}
              onChange={(e) => setAiMood(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white outline-none focus:border-amber-500"
              placeholder="Describe scene mood..."
            />

            <button
              onClick={handleAiSoundtrack}
              disabled={isAiLoading}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAiLoading ? 'Synthesizing Cues...' : 'Generate Cue Sheet'}</span>
            </button>

            {/* Cue List */}
            <div className="space-y-2 pt-2">
              {audioCues.map((cue, idx) => (
                <div key={idx} className="p-2.5 bg-slate-950 border border-slate-800 rounded text-xs space-y-1">
                  <div className="flex items-center justify-between font-mono-cinema text-[10px]">
                    <span className="text-amber-400 font-bold">{cue.timecode}</span>
                    <span className="text-slate-400 uppercase">{cue.track}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-tight">
                    {cue.cue}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
