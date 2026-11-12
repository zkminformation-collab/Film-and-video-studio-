import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Video, 
  Circle, 
  Square, 
  Grid3X3, 
  Crosshair, 
  Sun, 
  Volume2, 
  RotateCcw,
  Sliders,
  Type,
  CheckCircle2
} from 'lucide-react';
import { FilmProject } from '../../types';
import { soundFx } from '../../utils/audioSynth';

interface CameraStudioProps {
  activeFilm: FilmProject;
}

export const CameraStudio: React.FC<CameraStudioProps> = ({ activeFilm }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<'2.39:1' | '1.85:1' | '16:9' | '9:16'>('2.39:1');
  const [showGrid, setShowGrid] = useState(true);
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [iso, setIso] = useState('800');
  const [kelvin, setKelvin] = useState('5600K');
  const [shutter, setShutter] = useState('1/48s');
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState(1);
  const [teleprompterText, setTeleprompterText] = useState(
    'Prometheus Station, do you copy? Atmospheric seal is holding. We have visual confirmation of the anomaly.'
  );

  const [hasWebcam, setHasWebcam] = useState(false);
  const [snapshots, setSnapshots] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize Camera
  useEffect(() => {
    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 },
            audio: false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setHasWebcam(true);
            streamRef.current = stream;
          }
        }
      } catch (err) {
        console.log('Webcam not accessible, using cinema simulation mode:', err);
        setHasWebcam(false);
      }
    }
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Recording timer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordSec((s) => s + 1);
      }, 1000);
    } else {
      setRecordSec(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleRecord = () => {
    if (!isRecording) {
      soundFx.playSlateBeep();
      setIsRecording(true);
    } else {
      soundFx.playShutterSound();
      setIsRecording(false);
      // Log captured clip
      setSnapshots((prev) => [
        '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
        ...prev,
      ]);
    }
  };

  const takeSnapshot = () => {
    soundFx.playShutterSound();
    setSnapshots((prev) => [
      '/src/assets/images/cinema_cyberpunk_alley_1794406568416.jpg',
      ...prev,
    ]);
  };

  const formatSec = (total: number) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950 text-slate-100">
      {/* Main Viewfinder Monitor */}
      <div className="flex-1 bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
        {/* Cinema Matte Frame */}
        <div
          className={`relative bg-slate-900 border border-slate-700 shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-300 ${
            aspectRatio === '2.39:1'
              ? 'w-full max-w-4xl h-[65%]'
              : aspectRatio === '9:16'
              ? 'w-[320px] h-[90%]'
              : 'w-full max-w-4xl h-[82%]'
          }`}
        >
          {/* Live Video Feed or Fallback Cinema Feed */}
          {hasWebcam ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src="/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg"
              alt="Cinema Camera Feed"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover filter contrast-110"
            />
          )}

          {/* Rule of Thirds Grid Overlay */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-white/20" />
              <div className="border-r border-white/20" />
              <div />
            </div>
          )}

          {/* Center Crosshair */}
          {showCrosshair && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 border border-white/40 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              </div>
            </div>
          )}

          {/* Safe Action Area (90%) */}
          <div className="absolute inset-4 md:inset-8 border border-dashed border-white/25 pointer-events-none" />

          {/* Top HUD: Camera Status, FPS, Timecode */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between text-xs font-mono-cinema pointer-events-none">
            <div className="flex items-center gap-2 bg-black/75 px-2.5 py-1 rounded border border-white/10">
              {isRecording ? (
                <div className="flex items-center gap-1.5 text-rose-500 font-bold">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>REC {formatSec(recordSec)}</span>
                </div>
              ) : (
                <span className="text-emerald-400 font-bold">STBY</span>
              )}
              <span className="text-slate-500">|</span>
              <span className="text-white">{activeFilm.fps} FPS</span>
              <span className="text-slate-500">|</span>
              <span className="text-amber-400">4K PRORES</span>
            </div>

            <div className="bg-black/75 px-2.5 py-1 rounded border border-white/10 text-white">
              TC: 01:14:32:18
            </div>
          </div>

          {/* Bottom HUD: ISO, Shutter, Kelvin, Audio VU */}
          <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-xs font-mono-cinema pointer-events-none">
            <div className="flex items-center gap-2 bg-black/75 px-2.5 py-1 rounded border border-white/10 text-slate-300">
              <span>ISO: <strong className="text-white">{iso}</strong></span>
              <span className="text-slate-600">·</span>
              <span>SHT: <strong className="text-white">{shutter}</strong></span>
              <span className="text-slate-600">·</span>
              <span>WB: <strong className="text-amber-300">{kelvin}</strong></span>
            </div>

            {/* Simulated Live Audio VU Meters */}
            <div className="bg-black/80 px-2 py-1 rounded border border-white/10 flex items-center gap-2">
              <span className="text-[10px] text-slate-400">L/R</span>
              <div className="space-y-0.5">
                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full bg-emerald-400 transition-all duration-100 ${
                      isRecording ? 'w-4/5' : 'w-2/5'
                    }`}
                  />
                  <div className="w-1/6 bg-amber-400 h-full" />
                </div>
                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full bg-emerald-400 transition-all duration-100 ${
                      isRecording ? 'w-3/4' : 'w-1/3'
                    }`}
                  />
                  <div className="w-1/6 bg-amber-400 h-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Teleprompter Overlay */}
          {showTeleprompter && (
            <div className="absolute inset-x-6 top-16 max-h-48 bg-black/80 backdrop-blur border border-amber-500/40 rounded-lg p-4 overflow-hidden pointer-events-none">
              <div className="text-[10px] text-amber-400 font-mono uppercase mb-1">
                Teleprompter Active
              </div>
              <p className="text-sm md:text-base font-medium text-white leading-relaxed">
                {teleprompterText}
              </p>
            </div>
          )}
        </div>

        {/* Viewfinder Bottom Controls Bar */}
        <div className="h-16 w-full flex items-center justify-center gap-6 mt-3">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2.5 rounded-lg border transition-colors ${
              showGrid
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle Rule of Thirds Framing Grid"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowCrosshair(!showCrosshair)}
            className={`p-2.5 rounded-lg border transition-colors ${
              showCrosshair
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle Center Crosshair"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Big Hero Record Button */}
          <button
            onClick={toggleRecord}
            className={`w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all shadow-xl active:scale-90 ${
              isRecording
                ? 'border-rose-500 bg-rose-600 shadow-rose-600/50'
                : 'border-white bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start Recording Take'}
          >
            {isRecording ? (
              <Square className="w-5 h-5 fill-white text-white" />
            ) : (
              <Circle className="w-6 h-6 fill-white text-white" />
            )}
          </button>

          <button
            onClick={takeSnapshot}
            className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
            title="Capture High-Res Still Frame (Snapshot)"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
          </button>

          <button
            onClick={() => setShowTeleprompter(!showTeleprompter)}
            className={`p-2.5 rounded-lg border transition-colors ${
              showTeleprompter
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle Teleprompter Overlay"
          >
            <Type className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right: Camera Settings & Stills Bin */}
      <div className="w-full lg:w-80 bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto space-y-6">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono-cinema">
            Camera Configuration
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Arri / RED Cinema Sensor Simulation
          </p>
        </div>

        {/* Aspect Ratio Framing Guides */}
        <div className="space-y-2 text-xs">
          <label className="text-[10px] text-slate-500 uppercase font-mono-cinema">
            Framing Mask
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: '2.39:1', label: '2.39:1 Scope' },
              { id: '1.85:1', label: '1.85:1 Flat' },
              { id: '16:9', label: '16:9 Cinema' },
              { id: '9:16', label: '9:16 Mobile' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => setAspectRatio(fmt.id as any)}
                className={`py-1.5 px-2 rounded text-xs font-mono font-semibold text-center border ${
                  aspectRatio === fmt.id
                    ? 'bg-amber-500 text-slate-950 border-amber-500'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ISO Dial */}
        <div className="space-y-2 text-xs">
          <label className="text-[10px] text-slate-500 uppercase font-mono-cinema">
            Sensor ISO Sensitivity
          </label>
          <div className="flex gap-1 overflow-x-auto py-1">
            {['100', '200', '400', '800', '1600', '3200'].map((val) => (
              <button
                key={val}
                onClick={() => setIso(val)}
                className={`flex-1 py-1 px-1 rounded text-xs font-mono font-bold text-center border ${
                  iso === val
                    ? 'bg-amber-500 text-slate-950 border-amber-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* White Balance Kelvin */}
        <div className="space-y-2 text-xs">
          <label className="text-[10px] text-slate-500 uppercase font-mono-cinema">
            White Balance (Kelvin)
          </label>
          <div className="grid grid-cols-3 gap-1">
            {['3200K (Tungsten)', '4300K (Floures.)', '5600K (Daylight)'].map((k) => (
              <button
                key={k}
                onClick={() => setKelvin(k.split(' ')[0])}
                className={`py-1.5 px-1 rounded text-[11px] font-mono text-center border truncate ${
                  kelvin === k.split(' ')[0]
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {k.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Captured Takes Bin */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <span className="text-[10px] text-slate-500 uppercase font-mono-cinema">
            Captured Dailies ({snapshots.length})
          </span>
          {snapshots.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {snapshots.map((url, i) => (
                <div key={i} className="relative rounded overflow-hidden border border-slate-800 aspect-video group">
                  <img src={url} alt={`Snap ${i}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-mono text-white transition-opacity">
                    Take #{snapshots.length - i}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">
              No takes recorded yet. Click REC or Snapshot to capture camera frames.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
