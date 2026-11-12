import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Scissors, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  Plus, 
  Layers, 
  Volume2, 
  VolumeX,
  Sparkles,
  Maximize2,
  Sliders,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Wand2,
  Download,
  Film,
  Music,
  Tv,
  CheckCircle2,
  Clock,
  Radio,
  Share2,
  Gauge,
  ChevronRight,
  Flame,
  Zap,
  Repeat
} from 'lucide-react';
import { TimelineClip, FilmProject, CostEstimate } from '../../types';
import { INITIAL_TIMELINE_CLIPS } from '../../data/initialData';
import { soundFx } from '../../utils/audioSynth';
import { useStudioAi } from '../../context/StudioAiContext';
import { handleImageError } from '../../utils/imageUtils';

interface VideoEditorProps {
  activeFilm: FilmProject;
}

type EditorTab = 'timeline' | 'tracks' | 'effects' | 'transitions' | 'export';

interface VideoTrackMeta {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'title';
  muted: boolean;
  locked: boolean;
  solo: boolean;
  opacity: number;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({ activeFilm }) => {
  const { wallet, requestCostApproval, addQueueItem } = useStudioAi();

  const [clips, setClips] = useState<TimelineClip[]>(INITIAL_TIMELINE_CLIPS);
  const [selectedClipId, setSelectedClipId] = useState<string | null>('clip-1');
  const [currentTime, setCurrentTime] = useState<number>(3.2); // seconds
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(34); // px per second
  const [activeLut, setActiveLut] = useState<string>('teal-orange');
  const [aspectRatio, setAspectRatio] = useState<string>(activeFilm.aspectRatio || '2.39:1');
  const [activeTab, setActiveTab] = useState<EditorTab>('timeline');
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [showSafeZones, setShowSafeZones] = useState<boolean>(true);
  const [inPoint, setInPoint] = useState<number | null>(null);
  const [outPoint, setOutPoint] = useState<number | null>(null);
  const [snapping, setSnapping] = useState<boolean>(true);
  const [lastAutosave, setLastAutosave] = useState<string>('Just now');

  // AI Quick Gen Modal
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>('Cinematic drone tracking shot over neo-tokyo neon rain, anamorphic lens, 8k');
  const [aiCameraMove, setAiCameraMove] = useState<string>('Dolly Zoom In');
  const [aiDuration, setAiDuration] = useState<number>(4);
  const [aiGenStatus, setAiGenStatus] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Audio VU Meter levels (simulated dynamic peak meters)
  const [vuLeft, setVuLeft] = useState<number>(-18);
  const [vuRight, setVuRight] = useState<number>(-20);

  // Tracks State
  const [tracks, setTracks] = useState<VideoTrackMeta[]>([
    { id: 'v2', name: 'V2 (Overlay / B-Roll)', type: 'video', muted: false, locked: false, solo: false, opacity: 1 },
    { id: 'v1', name: 'V1 (Master Cinema)', type: 'video', muted: false, locked: false, solo: false, opacity: 1 },
    { id: 'titles', name: 'Titles & Graphics', type: 'title', muted: false, locked: false, solo: false, opacity: 1 },
    { id: 'a1', name: 'A1 (Dialog / VO)', type: 'audio', muted: false, locked: false, solo: false, opacity: 1 },
    { id: 'a2', name: 'A2 (Foley & SFX)', type: 'audio', muted: false, locked: false, solo: false, opacity: 1 },
  ]);

  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const playheadInterval = useRef<any>(null);

  const [totalDuration, setTotalDuration] = useState<number>(24.0); // seconds
  const [importedFilmInfo, setImportedFilmInfo] = useState<string | null>(null);

  const handleLoadFilmScenes = async (projectToLoad?: FilmProject) => {
    const proj = projectToLoad || activeFilm;
    try {
      let scenes = proj.scenes;
      if (!scenes || scenes.length === 0) {
        const res = await fetch(`/api/films/${proj.id || 'film-kannada-01'}`);
        const data = await res.json();
        if (data.project?.scenes) {
          scenes = data.project.scenes;
        }
      }

      if (!scenes || scenes.length === 0) {
        alert('No scenes found in this film project yet. Please generate scenes in AI Film Maker first.');
        return;
      }

      const clipDuration = 5.0; // standard display length per scene
      const generatedClips: TimelineClip[] = [];

      scenes.forEach((sc: any, idx: number) => {
        const startSec = idx * clipDuration;

        // Track V1: Master Scene Video
        generatedClips.push({
          id: `clip-v1-${sc.sceneNumber || idx + 1}`,
          trackId: 'v1',
          name: `Scene ${sc.sceneNumber || idx + 1}: ${(sc.heading || 'EXT. LOCATION').split(' - ')[0]}`,
          start: startSec,
          duration: clipDuration,
          color: idx % 2 === 0 ? '#8b5cf6' : '#06b6d4',
          type: 'video',
          speed: 1.0,
          volume: 1.0,
          filter: activeLut,
          assetUrl: sc.videoUrl || (idx % 2 === 0 ? '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg' : '/src/assets/images/cinema_cyberpunk_alley_1794406568416.jpg'),
        });

        // Track Titles: Scene Heading Cards
        generatedClips.push({
          id: `clip-titles-${sc.sceneNumber || idx + 1}`,
          trackId: 'titles',
          name: `Scene ${sc.sceneNumber || idx + 1}`,
          start: startSec,
          duration: Math.min(3.0, clipDuration),
          color: '#eab308',
          type: 'title',
          speed: 1.0,
          volume: 1.0,
        });

        // Track A1: Dialogue ADR
        generatedClips.push({
          id: `clip-a1-${sc.sceneNumber || idx + 1}`,
          trackId: 'a1',
          name: `VO_${(sc.dialogue || `Scene ${idx + 1}`).slice(0, 20)}...`,
          start: startSec,
          duration: clipDuration - 0.5,
          color: '#10b981',
          type: 'audio',
          speed: 1.0,
          volume: 1.0,
        });
      });

      // Track A2: Continuous Soundtrack Score
      const fullLen = Math.max(30, scenes.length * clipDuration);
      generatedClips.push({
        id: 'clip-a2-score',
        trackId: 'a2',
        name: 'Master_Soundtrack_Orchestral.wav',
        start: 0,
        duration: fullLen,
        color: '#0284c7',
        type: 'audio',
        speed: 1.0,
        volume: 0.7,
      });

      setClips(generatedClips);
      setSelectedClipId(generatedClips[0]?.id || null);
      setTotalDuration(fullLen);
      setImportedFilmInfo(`${proj.title} (${scenes.length} Scenes)`);
      soundFx.playCinematicImpact();
    } catch (e) {
      console.error('Failed to load scenes into editor:', e);
    }
  };

  // Auto-load if activeFilm has scenes or when activeFilm changes
  useEffect(() => {
    if (activeFilm.scenes && activeFilm.scenes.length > 0) {
      handleLoadFilmScenes(activeFilm);
    }
  }, [activeFilm.id, activeFilm.scenes?.length]);

  // Handle Playback Loop
  useEffect(() => {
    if (isPlaying) {
      soundFx.startScorePlayback(0.45);
      playheadInterval.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.05;
          if (outPoint && next >= outPoint) {
            return inPoint || 0;
          }
          if (next >= totalDuration) {
            if (isLooping) return inPoint || 0;
            setIsPlaying(false);
            return 0;
          }
          return next;
        });

        // Animate VU meter
        setVuLeft(-12 + Math.random() * 8);
        setVuRight(-14 + Math.random() * 8);
      }, 50);
    } else {
      soundFx.stopScorePlayback();
      if (playheadInterval.current) {
        clearInterval(playheadInterval.current);
      }
      setVuLeft(-36);
      setVuRight(-38);
    }
    return () => {
      soundFx.stopScorePlayback();
      if (playheadInterval.current) clearInterval(playheadInterval.current);
    };
  }, [isPlaying, isLooping, inPoint, outPoint, totalDuration]);

  // Periodic autosave simulation
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLastAutosave(`${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  const togglePlay = () => {
    soundFx.playScannerBeep();
    setIsPlaying(!isPlaying);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineContainerRef.current) return;
    const rect = timelineContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + timelineContainerRef.current.scrollLeft;
    let newTime = Math.max(0, Math.min(totalDuration, clickX / zoomLevel));
    
    // Snapping to clips
    if (snapping) {
      for (const c of clips) {
        if (Math.abs(newTime - c.start) < 0.2) {
          newTime = c.start;
          break;
        }
        if (Math.abs(newTime - (c.start + c.duration)) < 0.2) {
          newTime = c.start + c.duration;
          break;
        }
      }
    }
    setCurrentTime(newTime);
  };

  const handleSplitClip = () => {
    if (!selectedClipId) return;
    const clip = clips.find((c) => c.id === selectedClipId);
    if (!clip) return;

    if (currentTime > clip.start && currentTime < clip.start + clip.duration) {
      soundFx.playShutterSound();
      const firstDuration = currentTime - clip.start;
      const secondDuration = clip.duration - firstDuration;

      const splitFirst: TimelineClip = {
        ...clip,
        duration: firstDuration,
      };

      const splitSecond: TimelineClip = {
        ...clip,
        id: `clip-${Date.now()}`,
        name: `${clip.name} (Part 2)`,
        start: currentTime,
        duration: secondDuration,
      };

      setClips((prev) =>
        prev.map((c) => (c.id === clip.id ? splitFirst : c)).concat(splitSecond)
      );
      setSelectedClipId(splitSecond.id);
    }
  };

  const handleDeleteClip = () => {
    if (!selectedClipId) return;
    soundFx.playWhoosh();
    setClips((prev) => prev.filter((c) => c.id !== selectedClipId));
    setSelectedClipId(null);
  };

  const handleAddClip = () => {
    soundFx.playScannerBeep();
    const newClip: TimelineClip = {
      id: `clip-${Date.now()}`,
      trackId: 'v1',
      name: `Shot_${Math.floor(Math.random() * 80) + 1}_4K.mov`,
      start: currentTime,
      duration: 4.5,
      color: '#8b5cf6',
      type: 'video',
      speed: 1.0,
      volume: 1.0,
      filter: activeLut,
      assetUrl: '/src/assets/images/cinema_cyberpunk_alley_1794406568416.jpg',
    };
    setClips((prev) => [...prev, newClip]);
    setSelectedClipId(newClip.id);
  };

  // Trigger AI Quick Generation to inject clip directly into Timeline
  const handleQuickAiGenerate = () => {
    const costEstimate: CostEstimate = {
      operationName: `AI Shot (${aiCameraMove})`,
      scenesCount: 1,
      durationSec: aiDuration,
      resolution: '4K DCI Scope',
      estimatedCredits: wallet.plan === 'Unlimited' ? 0 : aiDuration * 10,
      estimatedFinancialCostUsd: aiDuration * 0.06,
      currentBalance: wallet.balance,
      isUnlimitedEligible: true,
    };

    requestCostApproval(costEstimate, async () => {
      setIsGenerating(true);
      setAiGenStatus('Synthesizing neural latents & temporal motion frames...');
      soundFx.playScannerBeep();

      await new Promise((r) => setTimeout(r, 1400));

      const newAiClip: TimelineClip = {
        id: `clip-ai-${Date.now()}`,
        trackId: 'v1',
        name: `AI_${aiCameraMove.replace(/\s+/g, '')}_${aiDuration}s.mov`,
        start: currentTime,
        duration: aiDuration,
        color: '#8b5cf6',
        type: 'video',
        speed: 1.0,
        volume: 1.0,
        filter: activeLut,
        assetUrl: '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
      };

      setClips((prev) => [...prev, newAiClip]);
      setSelectedClipId(newAiClip.id);
      setIsGenerating(false);
      setShowAiModal(false);
      setAiGenStatus('');
      soundFx.playCinematicImpact();

      addQueueItem({
        tool: 'AI Video Generator',
        prompt: aiPrompt,
        provider: 'Runway Gen-3 Alpha',
        status: 'Completed',
        progress: 100,
        resultUrl: '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
      });
    });
  };

  // Convert current time in seconds to Timecode (HH:MM:SS:FF at 24fps)
  const formatTimecode = (sec: number) => {
    const totalFrames = Math.floor(sec * 24);
    const frames = totalFrames % 24;
    const s = Math.floor(sec) % 60;
    const m = Math.floor(sec / 60) % 60;
    const h = Math.floor(sec / 3600);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  };

  const selectedClip = clips.find((c) => c.id === selectedClipId);

  // Active video frame to show in preview based on playhead
  const currentVideoClip = clips.find(
    (c) => c.type === 'video' && currentTime >= c.start && currentTime <= c.start + c.duration
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#090b11] text-slate-100">
      {/* Top Workspace Header Bar */}
      <div className="h-11 border-b border-purple-500/20 bg-[#0d111c] px-4 flex items-center justify-between shrink-0 select-none">
        {/* Left: Project & Autosave status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-white tracking-wide">
              {activeFilm.title}
            </span>
          </div>
          <span className="text-slate-600 text-xs">/</span>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Autosaved {lastAutosave}</span>
          </div>
          <span className="text-slate-600 text-xs hidden sm:inline">·</span>
          <span className="text-[10px] text-purple-300/80 bg-purple-950/60 border border-purple-800/50 px-2 py-0.5 rounded font-mono hidden md:inline">
            ACEScc 32-bit Float
          </span>
        </div>

        {/* Center: Workspace Mode Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-purple-500/30 rounded-lg p-0.5">
          {[
            { id: 'timeline', label: 'Timeline', icon: Layers },
            { id: 'tracks', label: 'Tracks', icon: Sliders },
            { id: 'effects', label: 'Effects & LUTs', icon: Wand2 },
            { id: 'transitions', label: 'Transitions', icon: ChevronRight },
            { id: 'export', label: 'Export', icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundFx.playScannerBeep();
                  setActiveTab(tab.id as EditorTab);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  isTabActive
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold shadow-md shadow-purple-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Load Film Scenes & AI Shot Gen Button */}
        <div className="flex items-center gap-2">
          {importedFilmInfo && (
            <span className="hidden xl:inline text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded font-mono truncate max-w-[200px]">
              ✓ Synced: {importedFilmInfo}
            </span>
          )}
          <button
            onClick={() => handleLoadFilmScenes()}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition-all active:scale-95"
            title="Import all scenes from active film project into timeline"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Load Scenes ({activeFilm.scenesCount || 100})</span>
          </button>
          <button
            onClick={() => {
              soundFx.playScannerBeep();
              setShowAiModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-lg shadow-purple-600/30 transition-all active:scale-95"
            title="Generate AI Video Shot directly to timeline"
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
            <span>AI Shot Gen</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Upper Body: Program Monitor & Inspector / Tabs */}
      <div className="h-[48%] border-b border-purple-500/20 flex flex-col lg:flex-row bg-[#07090e]">
        {/* Program Monitor / Canvas Area */}
        <div className="flex-1 bg-black relative flex flex-col items-center justify-center p-3 overflow-hidden select-none">
          {/* Aspect Ratio Box with live effects */}
          <div
            className={`relative bg-[#090b11] border border-purple-500/30 shadow-[0_0_50px_rgba(139,92,246,0.15)] flex items-center justify-center overflow-hidden transition-all duration-300 ${
              aspectRatio === '2.39:1'
                ? 'w-[94%] h-[74%]'
                : aspectRatio === '9:16'
                ? 'w-[32%] h-[94%]'
                : aspectRatio === '4:3'
                ? 'w-[68%] h-[90%]'
                : 'w-[84%] h-[84%]'
            }`}
          >
            {/* Live Visual Media Preview */}
            <img
              src={currentVideoClip?.assetUrl || '/assets/images/cinema_sci_fi_scene_1794406566762.jpg'}
              alt="Program Monitor"
              referrerPolicy="no-referrer"
              onError={(e) => handleImageError(e, currentVideoClip?.name || 'Program Monitor', 1)}
              className={`w-full h-full object-cover transition-all duration-200 ${
                activeLut === 'teal-orange'
                  ? 'contrast-125 saturate-125 hue-rotate-15'
                  : activeLut === 'cyberpunk'
                  ? 'contrast-130 saturate-200 hue-rotate-90'
                  : activeLut === 'bleach'
                  ? 'contrast-150 saturate-50'
                  : activeLut === 'noir'
                  ? 'grayscale contrast-150 brightness-90'
                  : activeLut === 'warm'
                  ? 'sepia-50 saturate-125'
                  : ''
              }`}
            />

            {/* Simulated 35mm Film Grain / Vignette overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black/60" />

            {/* Safe Zones (Action & Title Safe) */}
            {showSafeZones && (
              <div className="absolute inset-0 pointer-events-none border border-cyan-500/20 m-6 flex items-center justify-center">
                <div className="w-[90%] h-[90%] border border-cyan-500/15" />
              </div>
            )}

            {/* On-Screen Title Preview */}
            {currentTime >= 1.0 && currentTime <= 5.5 && (
              <div className="absolute inset-x-0 bottom-10 text-center pointer-events-none">
                <span className="text-xl md:text-2xl font-cinzel font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-cyan-300 tracking-[0.25em] drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                  THE CHRONOS GATE
                </span>
              </div>
            )}

            {/* Subtitle burn-in preview */}
            {currentTime >= 5.6 && currentTime <= 10.0 && (
              <div className="absolute inset-x-0 bottom-5 text-center pointer-events-none">
                <span className="bg-black/80 px-3.5 py-1 rounded-md text-xs md:text-sm font-sans font-medium text-cyan-300 border border-cyan-500/30 shadow-lg">
                  DR. VALERIE: "Telemetry confirm... the frequency is conscious."
                </span>
              </div>
            )}

            {/* Aspect Ratio Badge HUD */}
            <div className="absolute top-2 left-2 text-[10px] text-cyan-300 font-mono bg-black/85 px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1.5 shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>{aspectRatio} DCI SCOPE</span>
            </div>

            {/* Timecode Counter HUD */}
            <div className="absolute bottom-2 right-2 font-mono text-xs text-white bg-black/90 px-3 py-1 rounded border border-purple-500/30 shadow flex items-center gap-2">
              <span className="text-[10px] text-purple-400 font-bold">REC TC</span>
              <span className="font-bold text-cyan-300">{formatTimecode(currentTime)}</span>
            </div>

            {/* Audio VU Stereo Peak Meter Overlay */}
            <div className="absolute top-2 right-2 bg-black/80 p-1.5 rounded border border-slate-800 flex items-center gap-1 text-[9px] font-mono">
              <span className="text-slate-500">L</span>
              <div className="w-16 h-2 bg-slate-900 rounded-xs overflow-hidden flex">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 h-full transition-all duration-75"
                  style={{ width: `${Math.max(4, Math.min(100, (vuLeft + 40) * 2.5))}%` }}
                />
              </div>
              <span className="text-slate-500 ml-1">R</span>
              <div className="w-16 h-2 bg-slate-900 rounded-xs overflow-hidden flex">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 h-full transition-all duration-75"
                  style={{ width: `${Math.max(4, Math.min(100, (vuRight + 40) * 2.5))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Transport Controls Bar */}
          <div className="h-10 w-full flex items-center justify-between px-4 mt-2 bg-[#090b11]/80 rounded-xl border border-purple-500/20 max-w-4xl">
            {/* Left Transport Readout */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-purple-400">
                {formatTimecode(currentTime)}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ 00:00:24:00</span>
              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                24.00 fps
              </span>
            </div>

            {/* Center Transport Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setInPoint(currentTime)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                  inPoint !== null ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-white'
                }`}
                title="Mark In (I)"
              >
                [IN]
              </button>

              <button
                onClick={() => setCurrentTime((t) => Math.max(0, t - 1 / 24))}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
                title="Step 1 Frame Back (Left Arrow)"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="p-2 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold transition-all shadow-lg shadow-purple-600/40 active:scale-95"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => setCurrentTime((t) => Math.min(totalDuration, t + 1 / 24))}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
                title="Step 1 Frame Forward (Right Arrow)"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={() => setOutPoint(currentTime)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                  outPoint !== null ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-white'
                }`}
                title="Mark Out (O)"
              >
                [OUT]
              </button>

              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`p-1.5 rounded-lg transition-colors ml-1 ${
                  isLooping ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Loop Playback"
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right Display Tools */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSafeZones(!showSafeZones)}
                className={`p-1.5 rounded text-[11px] font-mono border transition-colors ${
                  showSafeZones ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
                title="Toggle Safe Margins Overlay"
              >
                <Tv className="w-3.5 h-3.5" />
              </button>

              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="bg-slate-900 border border-purple-500/30 text-xs text-slate-300 rounded px-2 py-1 outline-none font-mono"
              >
                <option value="2.39:1">2.39:1 Scope</option>
                <option value="16:9">16:9 Cinema</option>
                <option value="9:16">9:16 Reels</option>
                <option value="4:3">4:3 Academy</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Tab Content Panel (Clip Inspector / Tracks / Effects / Transitions / Export) */}
        <div className="w-full lg:w-80 bg-[#0d111c] border-l border-purple-500/20 p-4 overflow-y-auto space-y-4">
          {/* TAB 1: TIMELINE / CLIP INSPECTOR */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 font-mono">
                  Clip Inspector
                </span>
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              </div>

              {selectedClip ? (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Source Name</label>
                    <input
                      type="text"
                      value={selectedClip.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setClips((prev) =>
                          prev.map((c) => (c.id === selectedClip.id ? { ...c, name: newName } : c))
                        );
                      }}
                      className="w-full bg-[#090b11] border border-purple-500/30 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">In Point</label>
                      <div className="bg-[#090b11] border border-purple-500/20 rounded-lg px-2.5 py-1.5 font-mono text-cyan-300">
                        {selectedClip.start.toFixed(2)}s
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Duration</label>
                      <div className="bg-[#090b11] border border-purple-500/20 rounded-lg px-2.5 py-1.5 font-mono text-purple-300">
                        {selectedClip.duration.toFixed(2)}s
                      </div>
                    </div>
                  </div>

                  {/* Speed Ramping */}
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1 flex items-center justify-between">
                      <span>Speed Ramp</span>
                      <span className="text-cyan-400 font-mono font-bold">{(selectedClip.speed || 1.0)}x</span>
                    </label>
                    <div className="grid grid-cols-5 gap-1">
                      {[0.25, 0.5, 1.0, 2.0, 4.0].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => {
                            setClips((prev) =>
                              prev.map((c) => (c.id === selectedClip.id ? { ...c, speed: spd } : c))
                            );
                          }}
                          className={`py-1 rounded-md text-[11px] font-mono font-bold transition-all ${
                            (selectedClip.speed || 1.0) === spd
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Audio Gain */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-mono mb-1">
                      <span>Audio Volume</span>
                      <span className="text-emerald-400 font-mono font-bold">{Math.round((selectedClip.volume ?? 1) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.05"
                      value={selectedClip.volume ?? 1}
                      onChange={(e) => {
                        const vol = parseFloat(e.target.value);
                        setClips((prev) =>
                          prev.map((c) => (c.id === selectedClip.id ? { ...c, volume: vol } : c))
                        );
                      }}
                      className="w-full accent-purple-500"
                    />
                  </div>

                  {/* Clip Actions */}
                  <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between">
                    <button
                      onClick={handleDeleteClip}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded-lg border border-rose-500/30 text-xs font-medium transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Clip</span>
                    </button>

                    <button
                      onClick={handleSplitClip}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 rounded-lg border border-purple-500/30 text-xs font-medium transition-colors"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Split At Playhead</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs space-y-2">
                  <p>Click any clip on the multi-track timeline below to inspect and modify speed, gain, or parameters.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TRACKS MANAGER */}
          {activeTab === 'tracks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 font-mono">
                  Master Tracks Manager
                </span>
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              </div>

              <div className="space-y-2.5">
                {tracks.map((t) => (
                  <div key={t.id} className="bg-[#090b11] border border-purple-500/20 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${t.type === 'video' ? 'bg-cyan-400' : t.type === 'audio' ? 'bg-emerald-400' : 'bg-purple-400'}`} />
                        {t.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setTracks((prev) =>
                              prev.map((trk) => (trk.id === t.id ? { ...trk, muted: !trk.muted } : trk))
                            );
                          }}
                          className={`p-1 rounded ${t.muted ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'}`}
                          title="Mute Track"
                        >
                          {t.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => {
                            setTracks((prev) =>
                              prev.map((trk) => (trk.id === t.id ? { ...trk, locked: !trk.locked } : trk))
                            );
                          }}
                          className={`p-1 rounded ${t.locked ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
                          title="Lock Track"
                        >
                          {t.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">Opacity</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={t.opacity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setTracks((prev) =>
                            prev.map((trk) => (trk.id === t.id ? { ...trk, opacity: val } : trk))
                          );
                        }}
                        className="flex-1 accent-purple-500 h-1 bg-slate-800 rounded"
                      />
                      <span className="text-[10px] text-purple-400 font-mono w-8 text-right">
                        {Math.round(t.opacity * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EFFECTS & LUTS */}
          {activeTab === 'effects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 font-mono">
                  Cinematic LUTs & Shaders
                </span>
                <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase font-mono block">Active 3D Color LUT</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'teal-orange', name: 'Hollywood Teal & Orange 35mm', desc: 'Warm skin tones, cool cinematic shadows' },
                    { id: 'cyberpunk', name: 'Cyberpunk Neon Glow', desc: 'Hyper-saturated violet and electric cyan tones' },
                    { id: 'bleach', name: 'Bleach Bypass Silver', desc: 'High contrast, silver halide desaturation' },
                    { id: 'noir', name: 'Film Noir 1940s B&W', desc: 'Deep crushed blacks, striking key light' },
                    { id: 'warm', name: 'Golden Hour Sunset 70mm', desc: 'Amber warmth with soft optical halation' },
                    { id: 'none', name: 'Rec.709 Flat Studio Master', desc: 'Unprocessed broadcast standard curve' },
                  ].map((lut) => (
                    <button
                      key={lut.id}
                      onClick={() => {
                        soundFx.playScannerBeep();
                        setActiveLut(lut.id);
                      }}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        activeLut === lut.id
                          ? 'bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500 text-white shadow-md'
                          : 'bg-[#090b11] border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>{lut.name}</span>
                        {activeLut === lut.id && <span className="text-[10px] text-cyan-400 font-mono font-bold">ACTIVE</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{lut.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TRANSITIONS */}
          {activeTab === 'transitions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 font-mono">
                  Optical Transitions
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { name: 'Cross Dissolve', dur: '1.0s' },
                  { name: 'Dip to Black', dur: '0.8s' },
                  { name: 'Dip to White', dur: '0.5s' },
                  { name: 'Glitch Wipe', dur: '0.4s' },
                  { name: 'Light Leak Flare', dur: '1.2s' },
                  { name: 'Whip Pan Blur', dur: '0.3s' },
                  { name: 'Iris Circle Out', dur: '1.0s' },
                  { name: 'Zoom Dissolve', dur: '0.6s' },
                ].map((trans) => (
                  <div
                    key={trans.name}
                    className="p-2.5 bg-[#090b11] border border-purple-500/20 rounded-xl space-y-1 hover:border-cyan-400 transition-colors cursor-pointer"
                    onClick={() => {
                      soundFx.playWhoosh();
                      alert(`Transition "${trans.name}" applied between clips at playhead.`);
                    }}
                  >
                    <div className="font-bold text-white text-xs">{trans.name}</div>
                    <div className="text-[10px] text-cyan-400 font-mono">{trans.dur} default</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: EXPORT PRESETS */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 font-mono">
                  Master Render & Export
                </span>
                <Download className="w-3.5 h-3.5 text-cyan-400" />
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-[#090b11] border border-purple-500/30 rounded-xl space-y-1.5">
                  <div className="flex justify-between font-bold text-white">
                    <span>Cinema DCI 4K Master</span>
                    <span className="text-purple-400 font-mono">ProRes 422 HQ</span>
                  </div>
                  <div className="text-[11px] text-slate-400">4096x1714 @ 24fps · 220 Mbps bitrate</div>
                  <button
                    onClick={() => {
                      soundFx.playCinematicImpact();
                      alert('ProRes 422 HQ 4K render queued in background!');
                    }}
                    className="w-full mt-2 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold text-xs shadow-md"
                  >
                    Queue Cinema Master
                  </button>
                </div>

                <div className="p-3 bg-[#090b11] border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex justify-between font-bold text-white">
                    <span>Web & YouTube 4K</span>
                    <span className="text-cyan-400 font-mono">H.265 / HEVC</span>
                  </div>
                  <div className="text-[11px] text-slate-400">3840x2160 @ 60fps · Rec.709 color</div>
                  <button
                    onClick={() => {
                      soundFx.playScannerBeep();
                      alert('YouTube 4K export started!');
                    }}
                    className="w-full mt-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg font-bold text-xs"
                  >
                    Export for YouTube
                  </button>
                </div>

                <div className="p-3 bg-[#090b11] border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex justify-between font-bold text-white">
                    <span>Vertical Social Reel</span>
                    <span className="text-emerald-400 font-mono">MP4 9:16</span>
                  </div>
                  <div className="text-[11px] text-slate-400">1080x1920 @ 30fps · TikTok & Instagram</div>
                  <button
                    onClick={() => {
                      soundFx.playScannerBeep();
                      alert('Vertical Reel exported!');
                    }}
                    className="w-full mt-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg font-bold text-xs"
                  >
                    Export TikTok / Reels
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Workspace Lower Body: Multi-Track Timeline */}
      <div className="h-[52%] flex flex-col bg-[#090b11]">
        {/* Timeline Tools Control Bar */}
        <div className="h-10 border-b border-purple-500/20 px-4 flex items-center justify-between bg-[#0d111c] select-none">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSplitClip}
              disabled={!selectedClipId}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-slate-900 hover:bg-purple-950/60 disabled:opacity-40 text-slate-200 rounded-lg border border-purple-500/30 transition-colors"
              title="Split selected clip at current playhead position (Ctrl+B)"
            >
              <Scissors className="w-3.5 h-3.5 text-purple-400" />
              <span>Razor Cut</span>
            </button>

            <button
              onClick={handleAddClip}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-slate-900 hover:bg-cyan-950/60 text-slate-200 rounded-lg border border-cyan-500/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add Take</span>
            </button>

            <button
              onClick={() => setSnapping(!snapping)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-lg border transition-colors ${
                snapping ? 'bg-cyan-950/50 text-cyan-300 border-cyan-500/40 font-bold' : 'text-slate-500 border-slate-800'
              }`}
              title="Magnetic Clip Snapping"
            >
              <Zap className="w-3 h-3" />
              <span>Snap: {snapping ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Zoom and Playhead TC info */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 font-mono">TIMELINE ZOOM:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel((z) => Math.max(16, z - 6))}
                className="p-1 rounded-md hover:bg-slate-800 text-slate-400"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono text-purple-300 w-10 text-center">{zoomLevel}px/s</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(90, z + 6))}
                className="p-1 rounded-md hover:bg-slate-800 text-slate-400"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tracks Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Track Headers Bar */}
          <div className="w-32 border-r border-purple-500/20 bg-[#0d111c] shrink-0 flex flex-col divide-y divide-slate-800/80 text-xs font-mono select-none">
            <div className="h-6 flex items-center px-2 text-[10px] text-purple-400 font-bold uppercase tracking-wider bg-purple-950/30">
              Tracks
            </div>
            <div className="h-12 flex items-center justify-between px-2.5 text-slate-300 bg-slate-900/30">
              <span className="font-bold text-cyan-400">V2 (Overlay)</span>
            </div>
            <div className="h-12 flex items-center justify-between px-2.5 text-slate-300 bg-slate-900/30">
              <span className="font-bold text-cyan-300">V1 (Master)</span>
            </div>
            <div className="h-10 flex items-center justify-between px-2.5 text-slate-300 bg-slate-900/30">
              <span className="font-bold text-purple-300">Titles & FX</span>
            </div>
            <div className="h-10 flex items-center justify-between px-2.5 text-slate-300 bg-slate-900/30">
              <span className="font-bold text-emerald-400">A1 (Dialog)</span>
            </div>
            <div className="h-10 flex items-center justify-between px-2.5 text-slate-300 bg-slate-900/30">
              <span className="font-bold text-emerald-300">A2 (Foley)</span>
            </div>
          </div>

          {/* Right Scrollable Timeline Canvas */}
          <div
            ref={timelineContainerRef}
            onClick={handleTimelineClick}
            className="flex-1 overflow-x-auto overflow-y-hidden relative bg-[#090b11] divide-y divide-purple-500/10 cursor-pointer select-none"
            style={{ width: `${totalDuration * zoomLevel + 300}px` }}
          >
            {/* Timecode Ruler Bar with In/Out region */}
            <div className="h-6 bg-[#0d111c]/80 relative border-b border-purple-500/20">
              {Array.from({ length: Math.ceil(totalDuration) }).map((_, sec) => (
                <div
                  key={sec}
                  className="absolute top-0 bottom-0 border-l border-slate-800 text-[9px] text-slate-400 font-mono pl-1.5 pt-0.5"
                  style={{ left: `${sec * zoomLevel}px` }}
                >
                  {sec}s
                </div>
              ))}

              {/* In-Out highlighted region */}
              {inPoint !== null && outPoint !== null && (
                <div
                  className="absolute top-0 bottom-0 bg-purple-500/20 border-x-2 border-purple-400 pointer-events-none"
                  style={{
                    left: `${Math.min(inPoint, outPoint) * zoomLevel}px`,
                    width: `${Math.abs(outPoint - inPoint) * zoomLevel}px`,
                  }}
                />
              )}
            </div>

            {/* Glowing Red/Purple Playhead Line */}
            <div
              className="absolute top-0 bottom-0 z-30 pointer-events-none"
              style={{ left: `${currentTime * zoomLevel}px` }}
            >
              <div className="w-0.5 h-full bg-gradient-to-b from-cyan-400 to-purple-500 shadow-[0_0_12px_rgba(6,182,212,0.9)] relative">
                <div className="w-3.5 h-3.5 bg-cyan-400 -ml-1.5 rotate-45 border border-white shadow" />
              </div>
            </div>

            {/* Track Rows with Interactive Clips */}
            {(['v2', 'v1', 'titles', 'a1', 'a2'] as const).map((trackId) => {
              const trackClips = clips.filter((c) => c.trackId === trackId);
              const isVideoTrack = trackId.startsWith('v');
              const rowHeight = isVideoTrack ? 'h-12' : 'h-10';

              return (
                <div key={trackId} className={`${rowHeight} relative bg-[#090b11]/60 hover:bg-slate-900/20`}>
                  {trackClips.map((clip) => {
                    const isSelected = clip.id === selectedClipId;
                    const leftPx = clip.start * zoomLevel;
                    const widthPx = clip.duration * zoomLevel;

                    return (
                      <div
                        key={clip.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClipId(clip.id);
                        }}
                        className={`absolute top-1 bottom-1 rounded-lg px-2 flex items-center justify-between text-xs font-mono truncate transition-all shadow-md select-none border ${
                          isSelected
                            ? 'ring-2 ring-cyan-400 border-white z-20 shadow-lg shadow-purple-600/30 scale-[1.01]'
                            : 'opacity-90 hover:opacity-100 border-white/10'
                        }`}
                        style={{
                          left: `${leftPx}px`,
                          width: `${Math.max(24, widthPx)}px`,
                          backgroundColor: clip.color || '#8b5cf6',
                        }}
                      >
                        <span className="truncate font-bold text-white drop-shadow-sm flex items-center gap-1.5">
                          {clip.name}
                        </span>
                        <span className="text-[10px] text-white/90 shrink-0 font-mono font-medium">
                          {clip.duration.toFixed(1)}s
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Direct AI Shot Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d111c] border-2 border-purple-500 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white font-cinzel">
                  Generate AI Video Shot to Timeline
                </h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ ESC
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-purple-300 uppercase font-mono block mb-1">
                  Cinematic Prompt (Scene & Action)
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                  className="w-full bg-[#090b11] border border-purple-500/40 rounded-xl p-3 text-white font-mono text-xs outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                    Camera Movement
                  </label>
                  <select
                    value={aiCameraMove}
                    onChange={(e) => setAiCameraMove(e.target.value)}
                    className="w-full bg-[#090b11] border border-purple-500/40 rounded-lg p-2 text-white font-mono outline-none"
                  >
                    <option value="Dolly Zoom In">Dolly Zoom In</option>
                    <option value="Orbit 360">Orbit 360</option>
                    <option value="Crane Jib Down">Crane Jib Down</option>
                    <option value="High Speed FPV">High Speed FPV</option>
                    <option value="Steadicam Follow">Steadicam Follow</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                    Shot Duration
                  </label>
                  <select
                    value={aiDuration}
                    onChange={(e) => setAiDuration(Number(e.target.value))}
                    className="w-full bg-[#090b11] border border-purple-500/40 rounded-lg p-2 text-white font-mono outline-none"
                  >
                    <option value={3}>3 Seconds</option>
                    <option value={4}>4 Seconds</option>
                    <option value={5}>5 Seconds</option>
                    <option value={8}>8 Seconds</option>
                  </select>
                </div>
              </div>

              {/* Wallet Cost Estimation Box */}
              <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl flex items-center justify-between font-mono text-[11px]">
                <div className="space-y-0.5">
                  <span className="text-slate-400 block">Studio Credit Cost:</span>
                  <span className="text-white font-bold">
                    {wallet.plan === 'Unlimited' ? '0 Credits (Unlimited Pass)' : `${aiDuration * 10} Credits`}
                  </span>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-slate-400 block">Provider Raw Cost:</span>
                  <span className="text-cyan-400 font-bold">${(aiDuration * 0.06).toFixed(2)} USD</span>
                </div>
              </div>

              {aiGenStatus && (
                <div className="p-2.5 bg-blue-950/60 border border-blue-500/40 rounded-xl text-center text-cyan-300 font-mono animate-pulse">
                  {aiGenStatus}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-500/20">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-mono"
              >
                Cancel
              </button>
              <button
                disabled={isGenerating}
                onClick={handleQuickAiGenerate}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold font-mono shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGenerating ? 'Synthesizing...' : 'Generate & Insert to V1'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
