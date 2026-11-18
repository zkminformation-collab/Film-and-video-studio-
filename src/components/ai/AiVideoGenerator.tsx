import React, { useState, useMemo, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Play,
  Pause,
  Film,
  Download,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  UserCheck,
  LayoutGrid,
  Clapperboard,
  Mic,
  Music,
  Upload,
  Lock,
  Layers,
  Trash2,
} from 'lucide-react';
import { FilmProject } from '../../types';
import { soundFx } from '../../utils/audioSynth';
import { useStudioAi } from '../../context/StudioAiContext';
import {
  STUDIO_ANIMATION_STYLES,
  STUDIO_CHARACTER_LOCKS,
  StudioAnimationStyleId,
  getScenePreset,
} from '../../data/studioAnimationPresets';

interface AiVideoGeneratorProps {
  activeFilm: FilmProject;
  onSendToTimeline?: (clipName: string, assetUrl: string) => void;
}

type VideoGenMode =
  | 'text_to_video'
  | 'image_to_video'
  | 'script_to_video'
  | 'character_to_video'
  | 'storyboard_to_video'
  | 'ai_scene_generator'
  | 'voice_to_animation'
  | 'music_generator';

interface BatchShot {
  shotNumber: number;
  title: string;
  durationSec: number;
  cameraMotion: string;
  action: string;
  dialogueKn: string;
  dialogueEn: string;
  vfx: string;
}

const GENERATION_MODES: {
  id: VideoGenMode;
  label: string;
  hint: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'text_to_video', label: 'Text to Video', hint: 'Generate shots from cinematic prompts', icon: Sparkles },
  { id: 'image_to_video', label: 'Image to Video', hint: 'Animate uploaded or studio keyframe plates', icon: ImageIcon },
  { id: 'script_to_video', label: 'Script to Video', hint: 'Convert screenplay dialogue & action to scenes', icon: FileText },
  { id: 'character_to_video', label: 'Character to Video', hint: 'Animate locked character continuity seeds', icon: UserCheck },
  { id: 'storyboard_to_video', label: 'Storyboard to Video', hint: 'Turn multi-shot panels into motion clips', icon: LayoutGrid },
  { id: 'ai_scene_generator', label: 'AI Scene Generator', hint: 'Build full multi-shot scene blocks', icon: Clapperboard },
  { id: 'voice_to_animation', label: 'Voice to Animation', hint: 'Sync Kannada/English speech to character animation', icon: Mic },
  { id: 'music_generator', label: 'Music Generator', hint: 'Compose & sync scene background score', icon: Music },
];

export const AiVideoGenerator: React.FC<AiVideoGeneratorProps> = ({ activeFilm, onSendToTimeline }) => {
  const { addAssetToTimeline, addAudioClip, addQueueItem } = useStudioAi();

  const [activeMode, setActiveMode] = useState<VideoGenMode>('text_to_video');
  const [sceneSeqNum, setSceneSeqNum] = useState<number>(1);
  const activeScenePreset = useMemo(() => getScenePreset(sceneSeqNum), [sceneSeqNum]);

  const [styleId, setStyleId] = useState<StudioAnimationStyleId>('cinematic_scifi');
  const activeStyle = useMemo(
    () => STUDIO_ANIMATION_STYLES.find((s) => s.id === styleId) || STUDIO_ANIMATION_STYLES[0],
    [styleId]
  );

  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(STUDIO_CHARACTER_LOCKS[0].id);
  const selectedCharacter = useMemo(
    () => STUDIO_CHARACTER_LOCKS.find((c) => c.id === selectedCharacterId) || STUDIO_CHARACTER_LOCKS[0],
    [selectedCharacterId]
  );

  const [languageMode, setLanguageMode] = useState<'Kannada & English' | 'Kannada' | 'English'>('Kannada & English');
  const [prompt, setPrompt] = useState(
    'Lone astronaut walks across a misty basalt valley toward an ancient glowing obsidian monolith while volumetric blue lightning illuminates the sky'
  );
  const [scriptExcerpt, setScriptExcerpt] = useState(
    `EXT. BASALT VALLEY - TWILIGHT\nCOMMANDER VALERIE steps through mist holding her orbital scanner.\nVALERIE: "${STUDIO_CHARACTER_LOCKS[0].sampleKannadaLine}"`
  );
  const [voiceLine, setVoiceLine] = useState(STUDIO_CHARACTER_LOCKS[0].sampleKannadaLine);
  const [voiceLang, setVoiceLang] = useState<'kn-IN' | 'en-US'>('kn-IN');
  const [musicMood, setMusicMood] = useState('Epic Cinematic Orchestral + Analog Synth & Strings');

  const [referenceImageUrl, setReferenceImageUrl] = useState<string>(
    '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraMotion, setCameraMotion] = useState('Slow Dolly Push-In + Crane Up');
  const [aspectRatio, setAspectRatio] = useState<'2.39:1' | '16:9' | '9:16'>('2.39:1');
  const [fps, setFps] = useState<24 | 30 | 60>(24);
  const [motionStrength, setMotionStrength] = useState<number>(72);
  const [consistencyLock, setConsistencyLock] = useState<boolean>(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPreviewAnimating, setIsPreviewAnimating] = useState(true);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(
    '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg'
  );
  const [enhancedSpecs, setEnhancedSpecs] = useState<any>(null);
  const [batchShots, setBatchShots] = useState<BatchShot[]>([]);
  const [generatedMusicCues, setGeneratedMusicCues] = useState<{ timecode: string; track: string; cue: string }[]>([]);
  const [statusNotice, setStatusNotice] = useState<string>('');

  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice((prev) => (prev === msg ? '' : prev)), 5000);
  };

  const handleScenePresetChange = (num: number) => {
    const ch = getScenePreset(num);
    setSceneSeqNum(ch.sceneNumber);
    setStyleId(ch.recommendedStyle);
    setGeneratedVideoUrl(ch.previewImage);
    setReferenceImageUrl(ch.previewImage);
    setPrompt(
      `Scene ${ch.sceneNumber} (${ch.title}): ${ch.summary} Action: ${ch.keyAction}`
    );
    soundFx.playScannerBeep();
    showNotice(`Loaded Scene ${ch.sceneNumber} – ${ch.title}.`);
  };

  const handleModeSwitch = (mode: VideoGenMode) => {
    soundFx.playScannerBeep();
    setActiveMode(mode);
  };

  const handleUploadPlate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReferenceImageUrl(reader.result);
        setGeneratedVideoUrl(reader.result);
        showNotice(`Loaded plate "${file.name}" for Image-to-Video animation.`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(10);
    soundFx.playScannerBeep();

    try {
      if (activeMode === 'music_generator') {
        const res = await fetch('/api/ai/soundtrack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mood: musicMood,
            sceneDescription: `${activeFilm.title} Scene ${sceneSeqNum}: ${activeScenePreset.title} (${activeStyle.label})`,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.cues)) {
            setGeneratedMusicCues(data.cues);
            addAudioClip({
              id: `mus-scene-${sceneSeqNum}-${Date.now()}`,
              trackRole: 'music',
              name: `${activeFilm.title.replace(/\s+/g, '_')}_Sc${sceneSeqNum}_BGM.wav`,
              startSec: 0,
              durationSec: 18,
              color: '#a855f7',
              sourceAssetId: 'mus-orbital-synth',
            });
          }
        }
        soundFx.startScorePlayback(0.45, 0);
        setTimeout(() => soundFx.stopScorePlayback(), 2600);
      } else if (
        activeMode === 'ai_scene_generator' ||
        activeMode === 'storyboard_to_video' ||
        activeMode === 'script_to_video'
      ) {
        const res = await fetch('/api/ai/scene-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sceneNumber: sceneSeqNum,
            sceneTitle: activeScenePreset.title,
            filmTitle: activeFilm.title,
            animationStyle: activeStyle.label,
            language: languageMode,
            mode: GENERATION_MODES.find((m) => m.id === activeMode)?.label,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.shots)) {
            setBatchShots(data.shots);
          }
        }
      }

      if (activeMode === 'voice_to_animation') {
        soundFx.speakDialogue(voiceLine, voiceLang, 0.92, 0.96);
        addAudioClip({
          id: `adr-scene-${sceneSeqNum}-${Date.now()}`,
          trackRole: 'voice',
          name: `${selectedCharacter.name} (Sc.${sceneSeqNum} ${voiceLang})`,
          startSec: 0.5,
          durationSec: 5.5,
          color: selectedCharacter.primaryColor,
          dialogueText: voiceLine,
          voiceProfileName: selectedCharacter.voiceProfileName,
          language: voiceLang,
          pitch: 0.92,
          rate: 0.96,
        });
      }

      // Always fetch director optics specs cleanly
      const specRes = await fetch('/api/ai/video-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept:
            activeMode === 'script_to_video'
              ? scriptExcerpt
              : activeMode === 'character_to_video'
              ? `${selectedCharacter.name} (${selectedCharacter.seedCode}) — ${prompt}`
              : prompt,
          cameraMotion,
          style: activeStyle.label,
        }),
      });
      if (specRes.ok) {
        const specData = await specRes.json();
        setEnhancedSpecs(specData);
      }
    } catch {
      // Resilient local fallback
      setEnhancedSpecs({
        cameraSpec: {
          focalLength: '35mm Anamorphic',
          movement: cameraMotion,
          shutterSpeed: '1/48s (180 deg)',
          lightingGrade: activeStyle.label,
        },
      });
    }

    // Visual synthesis progress
    let p = 20;
    const timer = setInterval(() => {
      p += 16;
      if (p >= 100) {
        clearInterval(timer);
        setProgress(100);
        setIsGenerating(false);
        setIsPreviewAnimating(true);
        soundFx.playCinematicImpact();

        const resolvedImg =
          activeMode === 'image_to_video'
            ? referenceImageUrl
            : aspectRatio === '9:16'
            ? '/src/assets/images/cinema_cyberpunk_alley_1794406568416.jpg'
            : activeScenePreset.previewImage;
        setGeneratedVideoUrl(resolvedImg);

        addQueueItem({
          tool: `AI Video (${GENERATION_MODES.find((m) => m.id === activeMode)?.label})`,
          prompt: `Scene ${sceneSeqNum} · ${activeStyle.shortLabel} · ${prompt.slice(0, 64)}`,
          provider: activeStyle.renderEngine,
          status: 'Completed',
          progress: 100,
          resultUrl: resolvedImg,
        });

        showNotice(
          `Completed ${GENERATION_MODES.find((m) => m.id === activeMode)?.label} render for Scene ${sceneSeqNum} (${activeStyle.shortLabel}).`
        );
      } else {
        setProgress(p);
      }
    }, 95);
  };

  const handleDeleteVideoPreview = () => {
    soundFx.playWhoosh();
    setGeneratedVideoUrl(null);
    setEnhancedSpecs(null);
    setProgress(0);
    showNotice('Deleted generated video preview.');
  };

  const handleDeleteBatchShot = (shotNumber: number) => {
    soundFx.playWhoosh();
    setBatchShots((prev) => prev.filter((s) => s.shotNumber !== shotNumber));
    showNotice(`Deleted Shot #${shotNumber} from Scene ${sceneSeqNum} breakdown.`);
  };

  const handleSendClipToTimeline = (customTitle?: string) => {
    const mediaThumb = generatedVideoUrl || activeScenePreset.previewImage;
    const slug = activeFilm.title.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '') || 'StudioFilm';
    const clipName =
      customTitle ||
      `${slug}_Sc${String(sceneSeqNum).padStart(2, '0')}_${activeStyle.id}_${activeMode}.mov`;
    soundFx.playCinematicImpact();

    addAssetToTimeline({
      id: `ai-vid-${Date.now()}`,
      name: clipName,
      category: 'video',
      subcategory: activeStyle.label,
      source: 'ai_generated',
      format: 'ProRes 422 HQ',
      size: '480 MB',
      duration: '00:08',
      resolution: '3840x2160',
      thumbnail: mediaThumb,
      mediaUrl: mediaThumb,
      description: `${activeScenePreset.title} · ${prompt.slice(0, 90)}`,
      tags: [activeFilm.title, `Scene ${sceneSeqNum}`, activeStyle.shortLabel],
      license: {
        type: 'Studio Master Proprietary',
        commercialUse: true,
        attribution: 'Film & Video Studio Ultimate',
        certificateId: `FVS-VID-${sceneSeqNum}`,
        verified: true,
      },
      specs: { codec: 'ProRes 422 HQ', fps },
      isFavorite: true,
      addedAt: new Date().toISOString().split('T')[0],
      usageCount: 1,
    });

    showNotice(`Added "${clipName}" to Video Editor Track V1.`);
    if (onSendToTimeline) {
      onSendToTimeline(clipName, mediaThumb);
    }
  };

  const handleExportShot = async () => {
    if (!generatedVideoUrl) return;
    soundFx.playShutterSound();
    const offscreen = document.createElement('canvas');
    offscreen.width = aspectRatio === '9:16' ? 540 : 960;
    offscreen.height = aspectRatio === '9:16' ? 960 : 540;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = generatedVideoUrl;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });

    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    if (img.width > 0) {
      ctx.drawImage(img, 0, 0, offscreen.width, offscreen.height);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(16, offscreen.height - 54, offscreen.width - 32, 38);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(
      `SCENE ${sceneSeqNum} · ${activeScenePreset.title.toUpperCase()} · ${activeStyle.shortLabel.toUpperCase()}`,
      28,
      offscreen.height - 30
    );

    const link = document.createElement('a');
    link.href = offscreen.toDataURL('image/png');
    link.download = `Scene_${sceneSeqNum}_${activeMode}.png`;
    link.click();
    showNotice(`Downloaded rendered shot frame for Scene ${sceneSeqNum}.`);
  };

  const currentModeInfo = GENERATION_MODES.find((m) => m.id === activeMode) || GENERATION_MODES[0];

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#07090e] text-slate-100">
      {/* Main Viewport & 8-Mode Generation Workspace */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 lg:p-5 space-y-4">
        {/* Top Mode Selector Strip (All 8 AI Video Generation Modes) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                <span>AI Video Generation Studio · 8 Production Modes</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {activeFilm.title} · {currentModeInfo.hint}
              </p>
            </div>
            <div className="text-[11px] font-mono text-amber-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Character Seed Lock: {consistencyLock ? 'ON' : 'OFF'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {GENERATION_MODES.map((m) => {
              const Icon = m.icon;
              const isActive = activeMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleModeSwitch(m.id)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium border text-left transition-colors ${
                    isActive
                      ? 'bg-purple-600/25 border-purple-400 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-purple-300' : 'text-slate-500'}`} />
                  <span className="truncate">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Toast */}
        {statusNotice && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Cinema Video Preview Stage */}
        <div className="flex flex-col items-center">
          <div
            className={`relative bg-black border border-purple-500/40 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center transition-all duration-300 ${
              aspectRatio === '2.39:1'
                ? 'w-full max-w-3xl aspect-[2.39/1]'
                : aspectRatio === '9:16'
                ? 'w-[290px] aspect-[9/16]'
                : 'w-full max-w-3xl aspect-video'
            }`}
          >
            {generatedVideoUrl ? (
              <img
                src={generatedVideoUrl}
                alt="AI Video Frame"
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover transition-transform duration-[4000ms] ease-in-out ${
                  isPreviewAnimating ? 'scale-110' : 'scale-100'
                }`}
              />
            ) : (
              <div className="text-center p-6 space-y-2 text-slate-400 text-xs">
                <Film className="w-8 h-8 text-slate-600 mx-auto" />
                <p>Video preview deleted. Run generation or select a chapter to render a new clip.</p>
              </div>
            )}

            {/* Top HUD */}
            <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded text-[11px] font-mono-cinema text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>SC.{sceneSeqNum} · {currentModeInfo.label.toUpperCase()}</span>
            </div>

            <div className="absolute top-3 right-3 bg-black/80 px-2.5 py-1 rounded text-[11px] font-mono-cinema text-slate-300 border border-white/10">
              {fps} FPS · {aspectRatio} · {activeStyle.shortLabel}
            </div>

            {/* Bottom Character & Dialogue Overlay */}
            <div className="absolute bottom-3 inset-x-4 flex items-center justify-between gap-3 bg-black/75 border border-white/10 rounded-lg px-3 py-1.5 text-[11px]">
              <span className="text-amber-300 font-mono truncate">
                {selectedCharacter.name} ({selectedCharacter.seedCode})
              </span>
              <span className="text-slate-300 truncate">{cameraMotion}</span>
            </div>

            {/* Rendering Progress Overlay */}
            {isGenerating && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-3 z-30">
                <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-xs font-bold text-white font-mono-cinema">
                  SYNTHESIZING {currentModeInfo.label.toUpperCase()} ({progress}%)
                </div>
                <div className="w-64 bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-mono text-center">
                  Style: {activeStyle.label} · {cameraMotion}
                </p>
              </div>
            )}
          </div>

          {/* Stage Actions Bar */}
          <div className="w-full max-w-3xl mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsPreviewAnimating(!isPreviewAnimating)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs"
              >
                {isPreviewAnimating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPreviewAnimating ? 'Pause Motion' : 'Preview Motion'}</span>
              </button>

              <button
                onClick={() => handleSendClipToTimeline()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-colors shadow-lg shadow-purple-600/30"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Send to Video Timeline</span>
              </button>

              <button
                onClick={handleExportShot}
                disabled={!generatedVideoUrl}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-800 rounded-lg text-xs"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export Shot Frame</span>
              </button>

              {generatedVideoUrl && (
                <button
                  type="button"
                  onClick={handleDeleteVideoPreview}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Video</span>
                </button>
              )}
            </div>

            <span className="text-[11px] text-slate-400 font-mono">
              Scene {sceneSeqNum} · {activeFilm.title}
            </span>
          </div>
        </div>

        {/* Batch Storyboard / Scene Shots / Music Cues Output Tray */}
        {(batchShots.length > 0 || generatedMusicCues.length > 0) && (
          <div className="w-full max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            {batchShots.length > 0 && activeMode !== 'music_generator' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 font-mono-cinema uppercase">
                    Scene {sceneSeqNum} Shot Breakdown (Seed Locked)
                  </span>
                  <span className="text-[11px] text-slate-400">{batchShots.length} Master Shots</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {batchShots.map((s) => (
                    <div
                      key={s.shotNumber}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-white truncate">{s.title}</div>
                        <button
                          type="button"
                          onClick={() => handleDeleteBatchShot(s.shotNumber)}
                          className="p-1 bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded shrink-0"
                          title={`Delete ${s.title}`}
                          aria-label={`Delete ${s.title}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-[10px] font-mono text-amber-300">
                        {Math.max(1, Math.round(s.durationSec / 60))}m · {s.cameraMotion}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{s.action}</p>
                      <p className="text-[11px] text-cyan-300 line-clamp-2">{s.dialogueKn}</p>
                      <button
                        onClick={() => handleSendClipToTimeline(`Scene${sceneSeqNum}_Shot${s.shotNumber}.mov`)}
                        className="w-full mt-1 py-1 bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/40 rounded text-[11px] text-purple-200 font-medium"
                      >
                        + Queue Shot to Timeline
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {generatedMusicCues.length > 0 && activeMode === 'music_generator' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 font-mono-cinema uppercase">
                    Generated Scene {sceneSeqNum} Score Cues (Synced to Audio Track)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {generatedMusicCues.map((cue, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs space-y-0.5"
                    >
                      <div className="text-[10px] font-mono text-amber-300">
                        {cue.timecode} · {cue.track}
                      </div>
                      <div className="text-slate-300 text-[11px]">{cue.cue}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Sidebar: Scene Workflow & Mode Controls */}
      <div className="w-full lg:w-96 bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto space-y-4">
        {/* Scene Sequence Block */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-cinema uppercase font-bold text-amber-300">
              Scene Sequence Workflow
            </span>
            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">
              {activeFilm.title}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Scene Preset</label>
              <select
                value={sceneSeqNum}
                onChange={(e) => handleScenePresetChange(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white font-mono outline-none"
              >
                <option value={1}>Sc. 1 · Basalt Valley Discovery</option>
                <option value={2}>Sc. 2 · Neon Crossing Protocol</option>
                <option value={3}>Sc. 3 · Soundstage Master Setup</option>
                <option value={4}>Sc. 4 · Celestial Core Resonance</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Language ADR</label>
              <select
                value={languageMode}
                onChange={(e) => setLanguageMode(e.target.value as typeof languageMode)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-cyan-300 font-mono outline-none"
              >
                <option value="Kannada & English">Kannada + English</option>
                <option value="Kannada">Kannada Only</option>
                <option value="English">English Only</option>
              </select>
            </div>
          </div>

          <label className="flex items-center justify-between text-[11px] text-slate-300 pt-1 cursor-pointer">
            <span>Lock Character Face & Voice Across Scenes</span>
            <input
              type="checkbox"
              checked={consistencyLock}
              onChange={(e) => setConsistencyLock(e.target.checked)}
              className="accent-emerald-500"
            />
          </label>
        </div>

        {/* All 5 Animation & Render Styles */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 uppercase font-mono-cinema block">
            Animation / Rendering Style (5 Presets)
          </label>
          <select
            value={styleId}
            onChange={(e) => setStyleId(e.target.value as StudioAnimationStyleId)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-cyan-300 font-mono outline-none"
          >
            {STUDIO_ANIMATION_STYLES.map((st) => (
              <option key={st.id} value={st.id}>
                {st.label} — {st.renderEngine}
              </option>
            ))}
          </select>
        </div>

        {/* Mode-Specific Controls */}
        {activeMode === 'image_to_video' && (
          <div className="space-y-2 bg-slate-950 border border-slate-800 rounded-lg p-3">
            <div className="text-[10px] text-slate-400 uppercase font-mono-cinema">
              Source Image Plate for Animation
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Upload Reference Frame</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadPlate}
                className="hidden"
              />
            </div>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {[
                '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
                '/src/assets/images/cinema_cyberpunk_alley_1794406568416.jpg',
                '/src/assets/images/cinema_soundstage_set_1794406569758.jpg',
              ].map((img, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setReferenceImageUrl(img);
                    setGeneratedVideoUrl(img);
                  }}
                  className={`h-12 rounded overflow-hidden border ${
                    referenceImageUrl === img ? 'border-purple-400' : 'border-slate-800'
                  }`}
                >
                  <img src={img} alt="Plate" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {activeMode === 'character_to_video' && (
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 uppercase font-mono-cinema block">
              Locked Character Seed
            </label>
            <select
              value={selectedCharacterId}
              onChange={(e) => setSelectedCharacterId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-amber-300 font-mono outline-none"
            >
              {STUDIO_CHARACTER_LOCKS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.seedCode})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">
              Prop: {selectedCharacter.signatureProp} · Voice: {selectedCharacter.voiceProfileName}
            </p>
          </div>
        )}

        {activeMode === 'script_to_video' && (
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 uppercase font-mono-cinema block">
              Screenplay Scene Excerpt
            </label>
            <textarea
              rows={4}
              value={scriptExcerpt}
              onChange={(e) => setScriptExcerpt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono outline-none focus:border-purple-500 resize-none"
            />
          </div>
        )}

        {activeMode === 'voice_to_animation' && (
          <div className="space-y-2 bg-slate-950 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-amber-300 uppercase font-mono-cinema">
                Dialogue to Facial Animation
              </span>
              <div className="flex gap-1">
                {(['kn-IN', 'en-US'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setVoiceLang(lang);
                      setVoiceLine(
                        lang === 'kn-IN'
                          ? selectedCharacter.sampleKannadaLine
                          : selectedCharacter.sampleEnglishLine
                      );
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      voiceLang === lang
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {lang === 'kn-IN' ? 'Kannada' : 'English'}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={3}
              value={voiceLine}
              onChange={(e) => setVoiceLine(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white outline-none focus:border-amber-500 resize-none"
            />
          </div>
        )}

        {activeMode === 'music_generator' && (
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 uppercase font-mono-cinema block">
              Background Music Mood & Instrumentation
            </label>
            <input
              type="text"
              value={musicMood}
              onChange={(e) => setMusicMood(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-purple-500"
            />
          </div>
        )}

        {/* Universal Visual Prompt Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 uppercase font-mono-cinema block">
            Scene Description / Visual Prompt
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-purple-500 resize-none"
            placeholder="Describe action, lighting, actor, environment..."
          />
        </div>

        {/* Camera Motion Selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 uppercase font-mono-cinema block">
            Camera Trajectory & Motion
          </label>
          <select
            value={cameraMotion}
            onChange={(e) => setCameraMotion(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-amber-300 font-mono outline-none"
          >
            <option value="Slow Dolly Push-In + Crane Up">Slow Dolly Push-In + Crane Up</option>
            <option value="Orbit 360 Dramatic Rotation">Orbit 360 Dramatic Rotation</option>
            <option value="Tracking Steadicam Follow">Tracking Steadicam Follow</option>
            <option value="Fast Dynamic Whip Pan">Fast Dynamic Whip Pan</option>
            <option value="FPV Drone Landscape Sweep">FPV Drone Landscape Sweep</option>
            <option value="Static Tripod Lockdown">Static Tripod Lockdown</option>
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
            <span>MOTION INTENSITY</span>
            <span>{motionStrength}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            value={motionStrength}
            onChange={(e) => setMotionStrength(parseInt(e.target.value, 10))}
            className="w-full accent-purple-500"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wide rounded-xl transition-all shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isGenerating ? 'Synthesizing...' : `Run ${currentModeInfo.label}`}</span>
        </button>

        {/* Director Specs Box */}
        {enhancedSpecs && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1 font-mono">
            <span className="text-[10px] text-purple-400 uppercase block font-bold">
              Director Optics & Seed Spec
            </span>
            <div className="text-slate-300 text-[11px]">
              Lens: {enhancedSpecs.cameraSpec?.focalLength || '35mm Anamorphic'}
            </div>
            <div className="text-slate-400 text-[11px]">
              Shutter: {enhancedSpecs.cameraSpec?.shutterSpeed || '1/48s'} ·{' '}
              {enhancedSpecs.cameraSpec?.lightingGrade || activeStyle.shortLabel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
