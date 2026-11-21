import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  AudioLines,
  Clapperboard,
  Copy,
  Download,
  Film,
  ImagePlus,
  Languages,
  Layers,
  Link2,
  Loader2,
  Mic,
  Music,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  SkipBack,
  SkipForward,
  Sparkles,
  Trash2,
  Upload,
  Video,
  Volume2,
  Wand2,
} from 'lucide-react';
import { FilmProject } from '../../types';
import type {
  ManhwaCameraMotion,
  ManhwaLanguage,
  ManhwaSfxPreset,
  ManhwaTransition,
  ManhwaVoiceGender,
} from '../../../server/manhwaEngine';
import { UniversalAsset } from '../../data/libraryData';
import { useStudioAi } from '../../context/StudioAiContext';
import { soundFx } from '../../utils/audioSynth';
import { ManhwaLibraryWorkspace } from './ManhwaLibraryWorkspace';

export type ManhwaAnimationStyle =
  | 'Ken Burns Motion'
  | 'Parallax Depth'
  | 'Action Impact Pulse'
  | 'Static Hold';

export interface ManhwaPanelItem {
  id: string;
  title: string;
  sceneNumber: number;
  imageUrl: string;
  sourceType: 'url' | 'upload' | 'sample';
  mimeType: string;
  durationSec: number;
  cameraMotion: ManhwaCameraMotion;
  transition: ManhwaTransition;
  animationStyle: ManhwaAnimationStyle;
  sfxPreset: ManhwaSfxPreset;
  voiceGender: ManhwaVoiceGender;
  speakerName: string;
  dialogue: string;
  narration: string;
}

interface ExportArtifact {
  id: string;
  exportFormat: 'mp4' | 'mp3';
  objectUrl: string;
  fileName: string;
  mimeType: string;
  durationSec: number;
  sizeBytes: number;
  resolution?: string;
  encoder: string;
}

interface ManhwaStudioProps {
  activeFilm: FilmProject;
  onSendToEditor?: () => void;
}

const LANGUAGES: Array<{ value: ManhwaLanguage; code: string; nativeLabel: string }> = [
  { value: 'Kannada', code: 'kn-IN', nativeLabel: 'ಕನ್ನಡ (Kannada)' },
  { value: 'English', code: 'en-US', nativeLabel: 'English' },
  { value: 'Hindi', code: 'hi-IN', nativeLabel: 'हिन्दी (Hindi)' },
  { value: 'Tamil', code: 'ta-IN', nativeLabel: 'தமிழ் (Tamil)' },
  { value: 'Telugu', code: 'te-IN', nativeLabel: 'తెలుగు (Telugu)' },
];

const CAMERA_MOTIONS: ManhwaCameraMotion[] = [
  'Slow Zoom In',
  'Zoom Out Reveal',
  'Pan Left-to-Right',
  'Pan Right-to-Left',
  'Vertical Scroll (Webtoon)',
  'Dramatic Shake',
];

const TRANSITIONS: ManhwaTransition[] = [
  'Crossfade',
  'Hard Cut',
  'Flash White',
  'Wipe Left',
  'Zoom Blur',
];

const ANIMATION_STYLES: ManhwaAnimationStyle[] = [
  'Ken Burns Motion',
  'Parallax Depth',
  'Action Impact Pulse',
  'Static Hold',
];

const SFX_PRESETS: ManhwaSfxPreset[] = [
  'Impact Boom',
  'Sword Clash',
  'Whoosh',
  'Thunder',
  'Orchestral Chime',
  'Sub-Bass Drop',
  'Glitch',
  'None',
];

const MUSIC_MOODS = [
  'Epic Orchestral',
  'Dark Suspense',
  'Emotional Piano',
  'Action Synth',
  'Traditional Flute',
];

const createSamplePanels = (): ManhwaPanelItem[] => [
  {
    id: 'sample-panel-1',
    title: 'Panel 01 · Cliffside Awakening',
    sceneNumber: 1,
    imageUrl: '/assets/images/manhwa_panel_warrior_1794812531995.jpg',
    sourceType: 'sample',
    mimeType: 'image/jpeg',
    durationSec: 5,
    cameraMotion: 'Slow Zoom In',
    transition: 'Crossfade',
    animationStyle: 'Ken Burns Motion',
    sfxPreset: 'Whoosh',
    voiceGender: 'male',
    speakerName: 'Kairo',
    dialogue: 'Tonight the seal breaks, and I will not turn back from the abyss.',
    narration: 'On the mist-covered ridge, the silver-haired swordsman raised his awakened blade.',
  },
  {
    id: 'sample-panel-2',
    title: 'Panel 02 · Ancient Sanctuary Gate',
    sceneNumber: 2,
    imageUrl: '/assets/images/manhwa_panel_temple_1794812532125.jpg',
    sourceType: 'sample',
    mimeType: 'image/jpeg',
    durationSec: 5,
    cameraMotion: 'Vertical Scroll (Webtoon)',
    transition: 'Crossfade',
    animationStyle: 'Parallax Depth',
    sfxPreset: 'Orchestral Chime',
    voiceGender: 'female',
    speakerName: 'Serena',
    dialogue: 'Step carefully. The sanctuary ward is already awake and watching.',
    narration: 'Golden spirit lanterns flickered alive along the stone temple gate.',
  },
  {
    id: 'sample-panel-3',
    title: 'Panel 03 · Twin Aura Clash',
    sceneNumber: 3,
    imageUrl: '/assets/images/manhwa_panel_clash_1794812531342.jpg',
    sourceType: 'sample',
    mimeType: 'image/jpeg',
    durationSec: 5,
    cameraMotion: 'Dramatic Shake',
    transition: 'Flash White',
    animationStyle: 'Action Impact Pulse',
    sfxPreset: 'Sword Clash',
    voiceGender: 'male',
    speakerName: 'Kairo',
    dialogue: 'Give everything you have—this final strike decides our fate!',
    narration: 'Storm clouds shattered as golden and crimson energy collided mid-air.',
  },
];

function triggerSfxPreset(preset: ManhwaSfxPreset) {
  switch (preset) {
    case 'Impact Boom':
      soundFx.playCinematicImpact();
      break;
    case 'Sword Clash':
      soundFx.playMetallicSlam();
      break;
    case 'Whoosh':
      soundFx.playWhoosh();
      break;
    case 'Thunder':
      soundFx.playThunderClap();
      break;
    case 'Orchestral Chime':
      soundFx.playOrchestralChime();
      break;
    case 'Sub-Bass Drop':
      soundFx.playSubBassDrop();
      break;
    case 'Glitch':
      soundFx.playGlitchTransition();
      break;
    default:
      break;
  }
}

function formatSec(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getMotionTransform(
  motion: ManhwaCameraMotion,
  style: ManhwaAnimationStyle,
  progress: number
): string {
  if (style === 'Static Hold') return 'scale(1) translate(0%, 0%)';
  const p = Math.max(0, Math.min(1, progress));
  const boost = style === 'Parallax Depth' ? 1.06 : 1.0;

  switch (motion) {
    case 'Slow Zoom In':
      return `scale(${(1.02 + p * 0.14 * boost).toFixed(3)})`;
    case 'Zoom Out Reveal':
      return `scale(${(1.18 - p * 0.16).toFixed(3)})`;
    case 'Pan Left-to-Right':
      return `scale(1.14) translateX(${(4 - p * 8).toFixed(2)}%)`;
    case 'Pan Right-to-Left':
      return `scale(1.14) translateX(${(-4 + p * 8).toFixed(2)}%)`;
    case 'Vertical Scroll (Webtoon)':
      return `scale(1.16) translateY(${(5 - p * 10).toFixed(2)}%)`;
    case 'Dramatic Shake': {
      const dx = Math.sin(p * Math.PI * 12) * (style === 'Action Impact Pulse' ? 1.8 : 1.1);
      const dy = Math.cos(p * Math.PI * 10) * 1.1;
      const sc = style === 'Action Impact Pulse' ? 1.12 + Math.sin(p * Math.PI * 4) * 0.03 : 1.1;
      return `scale(${sc.toFixed(3)}) translate(${dx.toFixed(2)}%, ${dy.toFixed(2)}%)`;
    }
    default:
      return 'scale(1.04)';
  }
}

export const ManhwaStudio: React.FC<ManhwaStudioProps> = ({ activeFilm, onSendToEditor }) => {
  const { addAssetToTimeline, addAudioClip, addQueueItem } = useStudioAi();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [studioMode, setStudioMode] = useState<'library' | 'video'>('library');
  const [linkedChapterId, setLinkedChapterId] = useState<string | null>(null);

  const [chapterTitle, setChapterTitle] = useState<string>(
    `${activeFilm.title} · Manhwa Chapter 1`
  );
  const [chapterUrl, setChapterUrl] = useState<string>('');
  const [panels, setPanels] = useState<ManhwaPanelItem[]>(() => createSamplePanels());
  const [selectedPanelId, setSelectedPanelId] = useState<string>('sample-panel-1');

  const [language, setLanguage] = useState<ManhwaLanguage>('Kannada');
  const [narratorGender, setNarratorGender] = useState<ManhwaVoiceGender>('male');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [musicMood, setMusicMood] = useState<string>('Epic Orchestral');
  const [includeAudio, setIncludeAudio] = useState<boolean>(true);
  const [isBgmPlaying, setIsBgmPlaying] = useState<boolean>(false);

  const [isImportingUrl, setIsImportingUrl] = useState<boolean>(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState<boolean>(false);
  const [isExportingFormat, setIsExportingFormat] = useState<'mp4' | 'mp3' | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState<boolean>(false);

  const [statusMessage, setStatusMessage] = useState<{
    type: 'info' | 'warning' | 'success' | 'error';
    text: string;
  } | null>(null);

  const [exportsList, setExportsList] = useState<ExportArtifact[]>([]);

  // Sequence playback state
  const [isPlayingSequence, setIsPlayingSequence] = useState<boolean>(false);
  const [panelElapsedSec, setPanelElapsedSec] = useState<number>(0);
  const [flashWhiteOpacity, setFlashWhiteOpacity] = useState<number>(0);
  const lastSpokenPanelKeyRef = useRef<string>('');

  const selectedIndex = useMemo(() => {
    const idx = panels.findIndex((p) => p.id === selectedPanelId);
    return idx >= 0 ? idx : 0;
  }, [panels, selectedPanelId]);

  const selectedPanel = panels[selectedIndex] || panels[0] || null;

  const totalChapterDuration = useMemo(
    () => panels.reduce((sum, p) => sum + p.durationSec, 0),
    [panels]
  );

  const elapsedChapterSec = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < selectedIndex; i++) {
      acc += panels[i]?.durationSec || 0;
    }
    return acc + panelElapsedSec;
  }, [panels, selectedIndex, panelElapsedSec]);

  useEffect(() => {
    return () => {
      soundFx.stopScorePlayback();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Trigger audio cues whenever playback enters a new panel
  useEffect(() => {
    if (!isPlayingSequence || !selectedPanel) return;

    const triggerKey = `${selectedPanel.id}-${selectedIndex}`;
    if (lastSpokenPanelKeyRef.current !== triggerKey) {
      lastSpokenPanelKeyRef.current = triggerKey;

      if (selectedPanel.transition === 'Flash White') {
        setFlashWhiteOpacity(0.85);
        setTimeout(() => setFlashWhiteOpacity(0), 220);
      }

      if (includeAudio) {
        if (selectedPanel.sfxPreset !== 'None') {
          triggerSfxPreset(selectedPanel.sfxPreset);
        }
        const voicePitch = selectedPanel.voiceGender === 'female' ? 1.24 : 0.85;
        const voiceRate = selectedPanel.voiceGender === 'female' ? 1.0 : 0.95;
        const spokenText = [selectedPanel.narration, selectedPanel.dialogue]
          .filter((x) => x && x.trim().length > 0)
          .join('. ');
        if (spokenText) {
          soundFx.speakDialogue(spokenText, language, voicePitch, voiceRate);
        }
      }
    }
  }, [isPlayingSequence, selectedPanel, selectedIndex, includeAudio, language]);

  // Frame ticker during sequence preview
  useEffect(() => {
    if (!isPlayingSequence || panels.length === 0) return;

    const tickMs = 60;
    const timer = setInterval(() => {
      setPanelElapsedSec((prev) => {
        const current = panels[selectedIndex];
        if (!current) return 0;
        const nextVal = prev + tickMs / 1000;
        if (nextVal >= current.durationSec) {
          if (selectedIndex < panels.length - 1) {
            const nextPanel = panels[selectedIndex + 1];
            setSelectedPanelId(nextPanel.id);
            return 0;
          } else {
            setIsPlayingSequence(false);
            soundFx.stopScorePlayback();
            setIsBgmPlaying(false);
            return 0;
          }
        }
        return nextVal;
      });
    }, tickMs);

    return () => clearInterval(timer);
  }, [isPlayingSequence, panels, selectedIndex]);

  const handleTogglePlaySequence = () => {
    soundFx.unlock();
    if (panels.length === 0) return;
    if (isPlayingSequence) {
      setIsPlayingSequence(false);
      soundFx.stopScorePlayback();
      setIsBgmPlaying(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }
    lastSpokenPanelKeyRef.current = '';
    setPanelElapsedSec(0);
    if (includeAudio) {
      soundFx.startScorePlayback(0.32, 0);
      setIsBgmPlaying(true);
    }
    setIsPlayingSequence(true);
  };

  const handleToggleBgmPreview = () => {
    soundFx.unlock();
    if (isBgmPlaying) {
      soundFx.stopScorePlayback();
      setIsBgmPlaying(false);
    } else {
      soundFx.startScorePlayback(0.38, 0);
      setIsBgmPlaying(true);
    }
  };

  const handleImportFromUrl = async () => {
    const trimmed = chapterUrl.trim();
    if (!trimmed) {
      setStatusMessage({
        type: 'warning',
        text: 'Paste a Manhwa chapter link first, or upload JPG, PNG, or WebP panels directly.',
      });
      return;
    }

    setIsImportingUrl(true);
    setStatusMessage(null);
    soundFx.playScannerBeep();

    try {
      const res = await fetch('/api/manhwa/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterUrl: trimmed }),
      });
      const data = await res.json();

      if (!res.ok || !data.success || !Array.isArray(data.panels) || data.panels.length === 0) {
        setStatusMessage({
          type: 'warning',
          text:
            data.message ||
            'Automatic chapter import was blocked or the link is protected. Please upload your JPG, PNG, or WebP images directly.',
        });
        return;
      }

      const importedPanels: ManhwaPanelItem[] = data.panels.map((p: any, idx: number) => ({
        id: p.id || `url-panel-${Date.now()}-${idx}`,
        title: p.title || `Imported Panel ${String(idx + 1).padStart(2, '0')}`,
        sceneNumber: idx + 1,
        imageUrl: p.imageUrl,
        sourceType: 'url',
        mimeType: p.mimeType || 'image/jpeg',
        durationSec: 5,
        cameraMotion: CAMERA_MOTIONS[idx % CAMERA_MOTIONS.length],
        transition: 'Crossfade',
        animationStyle: 'Ken Burns Motion',
        sfxPreset: idx % 2 === 0 ? 'Whoosh' : 'Orchestral Chime',
        voiceGender: idx % 2 === 0 ? 'male' : 'female',
        speakerName: idx % 2 === 0 ? 'Protagonist' : 'Companion',
        dialogue: '',
        narration: '',
      }));

      setPanels(importedPanels);
      setSelectedPanelId(importedPanels[0].id);
      setPanelElapsedSec(0);
      if (data.chapterTitle) {
        setChapterTitle(data.chapterTitle);
      }
      soundFx.playCinematicImpact();
      setStatusMessage({
        type: 'success',
        text: data.message || `Imported ${importedPanels.length} panels. Click Auto-Generate Dialogue & Audio next.`,
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Could not reach chapter importer service. Upload JPG, PNG, or WebP images directly below.',
      });
    } finally {
      setIsImportingUrl(false);
    }
  };

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const allowedTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
    const validFiles = Array.from(fileList).filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      return allowedTypes.has(f.type.toLowerCase()) || ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
    });

    if (validFiles.length === 0) {
      setStatusMessage({
        type: 'warning',
        text: 'Only JPG, PNG, and WebP panel images are supported.',
      });
      return;
    }

    const loaded = await Promise.all(
      validFiles.map(
        (file, idx) =>
          new Promise<ManhwaPanelItem>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const baseCount = panels.length + idx + 1;
              resolve({
                id: `upload-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
                title: file.name.replace(/\.[^.]+$/, ''),
                sceneNumber: baseCount,
                imageUrl: typeof reader.result === 'string' ? reader.result : '',
                sourceType: 'upload',
                mimeType: file.type || 'image/jpeg',
                durationSec: 5,
                cameraMotion: CAMERA_MOTIONS[(baseCount - 1) % CAMERA_MOTIONS.length],
                transition: 'Crossfade',
                animationStyle: 'Ken Burns Motion',
                sfxPreset: 'Whoosh',
                voiceGender: baseCount % 2 === 0 ? 'female' : 'male',
                speakerName: baseCount % 2 === 0 ? 'Character B' : 'Character A',
                dialogue: '',
                narration: '',
              });
            };
            reader.readAsDataURL(file);
          })
      )
    );

    const usable = loaded.filter((x) => x.imageUrl);
    if (usable.length > 0) {
      soundFx.playShutterSound();
      setPanels((prev) => [...prev, ...usable]);
      setSelectedPanelId(usable[0].id);
      setStatusMessage({
        type: 'success',
        text: `Added ${usable.length} uploaded panel(s) (JPG/PNG/WebP) to the scene sequence.`,
      });
    }
  };

  const handleAutoGenerateAudioAndDialogue = async () => {
    if (panels.length === 0) return;
    setIsGeneratingScript(true);
    setStatusMessage(null);
    soundFx.playScannerBeep();

    try {
      const res = await fetch('/api/manhwa/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterTitle,
          language,
          musicMood,
          panels: panels.map((p) => ({
            id: p.id,
            title: p.title,
            imageUrl: p.imageUrl.startsWith('data:image/') ? p.imageUrl : undefined,
            notes: p.dialogue || p.narration || p.title,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok || !Array.isArray(data.panels)) {
        throw new Error(data.error || 'Failed to generate dialogue & narration');
      }

      setPanels((prev) =>
        prev.map((panel, idx) => {
          const generated =
            data.panels.find((g: any) => g.panelId === panel.id) || data.panels[idx];
          if (!generated) return panel;
          return {
            ...panel,
            narration: generated.narration || panel.narration,
            dialogue: generated.dialogue || panel.dialogue,
            speakerName: generated.speakerName || panel.speakerName,
            voiceGender: generated.voiceGender === 'female' ? 'female' : 'male',
            sfxPreset: (generated.sfxPreset as ManhwaSfxPreset) || panel.sfxPreset,
            cameraMotion: (generated.cameraMotion as ManhwaCameraMotion) || panel.cameraMotion,
            transition: (generated.transition as ManhwaTransition) || panel.transition,
            durationSec: Number(generated.durationSec) || panel.durationSec,
          };
        })
      );

      addQueueItem({
        tool: 'Manhwa Script & Voice AI',
        prompt: `${chapterTitle} (${language} · ${panels.length} panels)`,
        provider: data.usedAi ? 'Google Gemini Vision' : 'Multilingual Script Engine',
        status: 'Completed',
        progress: 100,
      });

      soundFx.playCinematicImpact();
      setStatusMessage({
        type: 'success',
        text: `Generated ${language} narration, character dialogue, voice gender assignments, SFX & camera cues for ${panels.length} panels.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Unable to generate chapter dialogue.',
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const updatePanel = (panelId: string, patch: Partial<ManhwaPanelItem>) => {
    setPanels((prev) => prev.map((p) => (p.id === panelId ? { ...p, ...patch } : p)));
  };

  const movePanel = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= panels.length) return;
    soundFx.playShutterSound();
    setPanels((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next.map((p, idx) => ({ ...p, sceneNumber: idx + 1 }));
    });
  };

  const duplicatePanel = (panel: ManhwaPanelItem, index: number) => {
    soundFx.playShutterSound();
    const copy: ManhwaPanelItem = {
      ...panel,
      id: `panel-dup-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      title: `${panel.title} (Copy)`,
    };
    setPanels((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next.map((p, idx) => ({ ...p, sceneNumber: idx + 1 }));
    });
    setSelectedPanelId(copy.id);
  };

  const deletePanel = (panelId: string) => {
    soundFx.playWhoosh();
    setPanels((prev) => {
      const filtered = prev.filter((p) => p.id !== panelId);
      const renumbered = filtered.map((p, idx) => ({ ...p, sceneNumber: idx + 1 }));
      if (selectedPanelId === panelId) {
        setSelectedPanelId(renumbered[0]?.id || '');
      }
      return renumbered;
    });
  };

  const handleLoadSamples = () => {
    soundFx.playScannerBeep();
    const samples = createSamplePanels();
    setPanels(samples);
    setSelectedPanelId(samples[0].id);
    setPanelElapsedSec(0);
    setStatusMessage({
      type: 'info',
      text: 'Restored 3 starter Manhwa action panels.',
    });
  };

  const handlePreviewPanelVoice = (mode: 'dialogue' | 'narration') => {
    if (!selectedPanel) return;
    soundFx.unlock();
    const text = mode === 'dialogue' ? selectedPanel.dialogue : selectedPanel.narration;
    if (!text.trim()) {
      setStatusMessage({
        type: 'warning',
        text: `Add ${mode} text on this panel first, or click Auto-Generate Dialogue & Audio.`,
      });
      return;
    }
    const gender = mode === 'narration' ? narratorGender : selectedPanel.voiceGender;
    const pitch = gender === 'female' ? 1.24 : 0.84;
    const rate = gender === 'female' ? 1.0 : 0.94;
    soundFx.speakDialogue(text, language, pitch, rate);
  };

  const handleSendToVideoEditor = () => {
    if (panels.length === 0) return;
    soundFx.playCinematicImpact();

    let cursor = 0;
    panels.forEach((p, idx) => {
      const asset: UniversalAsset = {
        id: `manhwa-scene-${p.id}-${Date.now()}`,
        name: `Scene ${p.sceneNumber}: ${p.title}`,
        category: 'animation',
        subcategory: 'Manhwa Scene',
        source: 'ai_generated',
        format: 'MP4 / Webtoon Motion',
        resolution: aspectRatio === '9:16' ? '720x1280' : '1280x720',
        duration: `${p.durationSec}s`,
        size: '2.4 MB',
        thumbnail: p.imageUrl,
        mediaUrl: p.imageUrl,
        description: `${p.cameraMotion} · ${p.transition} · ${p.speakerName}`,
        tags: ['manhwa', language, p.cameraMotion],
        license: {
          type: 'Studio Master Proprietary',
          commercialUse: true,
          attribution: activeFilm.title,
          certificateId: `MANHWA-${idx + 1}`,
          verified: true,
        },
        specs: {
          fps: 24,
          aspect: aspectRatio,
        },
        isFavorite: false,
        addedAt: 'Just now',
        usageCount: 1,
      };
      addAssetToTimeline(asset);

      const spokenText = [p.narration, p.dialogue].filter(Boolean).join(' — ');
      if (spokenText) {
        addAudioClip({
          id: `aclip-manhwa-vo-${Date.now()}-${idx}`,
          trackRole: 'voice',
          name: `${p.speakerName} (${language} ${p.voiceGender})`,
          startSec: cursor,
          durationSec: p.durationSec,
          color: p.voiceGender === 'female' ? '#ec4899' : '#38bdf8',
          dialogueText: spokenText,
          language: LANGUAGES.find((l) => l.value === language)?.code || 'en-US',
          pitch: p.voiceGender === 'female' ? 1.24 : 0.85,
          rate: 0.96,
          characterName: p.speakerName,
          syncedToVideo: true,
        });
      }

      if (p.sfxPreset !== 'None') {
        addAudioClip({
          id: `aclip-manhwa-sfx-${Date.now()}-${idx}`,
          trackRole: 'sfx',
          name: `SFX: ${p.sfxPreset}`,
          startSec: cursor,
          durationSec: 2,
          color: '#f59e0b',
          soundMethod:
            p.sfxPreset === 'Sword Clash'
              ? 'playMetallicSlam'
              : p.sfxPreset === 'Thunder'
              ? 'playThunderClap'
              : p.sfxPreset === 'Whoosh'
              ? 'playWhoosh'
              : 'playCinematicImpact',
        });
      }

      cursor += p.durationSec;
    });

    addAudioClip({
      id: `aclip-manhwa-bgm-${Date.now()}`,
      trackRole: 'music',
      name: `Manhwa Score · ${musicMood}`,
      startSec: 0,
      durationSec: Math.max(5, cursor),
      color: '#a855f7',
      sourceAssetId: 'mus-orbital-synth',
    });

    if (onSendToEditor) {
      onSendToEditor();
    }
  };

  const handleExport = async (exportFormat: 'mp4' | 'mp3') => {
    if (panels.length === 0) {
      setStatusMessage({
        type: 'warning',
        text: 'Add at least one Manhwa panel before exporting.',
      });
      return;
    }

    setIsExportingFormat(exportFormat);
    setStatusMessage(null);
    soundFx.playScannerBeep();

    try {
      const res = await fetch('/api/manhwa/export-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: chapterTitle,
          aspectRatio,
          fps: 24,
          musicMood,
          includeAudio,
          exportFormat,
          panels: panels.map((p) => ({
            id: p.id,
            title: p.title,
            imageUrl: p.imageUrl,
            durationSec: p.durationSec,
            cameraMotion: p.cameraMotion,
            transition: p.transition,
            sfxPreset: p.sfxPreset,
            voiceGender: p.voiceGender,
            dialogue: p.dialogue,
            narration: p.narration,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Export failed (${exportFormat.toUpperCase()})`);
      }

      const b64 = exportFormat === 'mp4' ? data.videoBase64 : data.audioBase64;
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.mimeType });
      const objectUrl = URL.createObjectURL(blob);

      const artifact: ExportArtifact = {
        id: `exp-${Date.now()}`,
        exportFormat,
        objectUrl,
        fileName: data.fileName,
        mimeType: data.mimeType,
        durationSec: data.durationSec,
        sizeBytes: data.sizeBytes || blob.size,
        resolution: data.resolution,
        encoder: data.encoder,
      };

      setExportsList((prev) => [artifact, ...prev]);

      addQueueItem({
        tool: `Manhwa ${exportFormat.toUpperCase()} Export`,
        prompt: `${chapterTitle} (${panels.length} panels · ${language})`,
        provider: data.encoder || 'FFmpeg Pipeline',
        status: 'Completed',
        progress: 100,
      });

      if (linkedChapterId && exportFormat === 'mp4') {
        fetch(`/api/manhwa/chapters/${encodeURIComponent(linkedChapterId)}/video-jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.fileName || chapterTitle,
            resolution: data.resolution || '1080x1920',
            duration_sec: data.durationSec || totalChapterDuration,
            video_url: objectUrl,
          }),
        }).catch(() => {});
      }

      soundFx.playCinematicImpact();
      setStatusMessage({
        type: 'success',
        text: `Exported ${data.fileName} (${formatBytes(artifact.sizeBytes)}) ready for playback & download.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || `Unable to export ${exportFormat.toUpperCase()}.`,
      });
    } finally {
      setIsExportingFormat(null);
    }
  };

  const handleDeleteExport = (exportId: string) => {
    soundFx.playWhoosh();
    setExportsList((prev) => {
      const target = prev.find((e) => e.id === exportId);
      if (target) {
        URL.revokeObjectURL(target.objectUrl);
      }
      return prev.filter((e) => e.id !== exportId);
    });
  };

  const previewProgress =
    selectedPanel && selectedPanel.durationSec > 0
      ? Math.min(1, panelElapsedSec / selectedPanel.durationSec)
      : 0;

  const handleLoadChapterIntoVideoStudio = (payload: {
    seriesTitle: string;
    chapterId: string;
    chapterTitle: string;
    panels: ManhwaPanelItem[];
  }) => {
    setLinkedChapterId(payload.chapterId);
    setChapterTitle(`${payload.seriesTitle} · ${payload.chapterTitle}`);
    if (payload.panels.length > 0) {
      setPanels(payload.panels);
      setSelectedPanelId(payload.panels[0].id);
    }
    setStatusMessage({
      type: 'success',
      text: `Loaded "${payload.chapterTitle}" (${payload.panels.length} panels) from Manhwa Library. Ready to animate, voice & export MP4.`,
    });
    setStudioMode('video');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#090b11] text-slate-100">
      {/* Mode Switcher: Manhwa Library & Chapters vs AI Video & Animation Studio */}
      <div className="px-6 py-2.5 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStudioMode('library')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              studioMode === 'library'
                ? 'bg-amber-500 text-black'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Manhwa Library &amp; Chapters
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('video')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              studioMode === 'video'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            AI Manhwa-to-Video &amp; MP4 Studio
          </button>
        </div>
        {linkedChapterId && studioMode === 'video' && (
          <span className="text-xs text-amber-300 truncate max-w-md">
            Linked Chapter: {chapterTitle}
          </span>
        )}
      </div>

      {studioMode === 'library' ? (
        <ManhwaLibraryWorkspace onSendChapterToVideoStudio={handleLoadChapterIntoVideoStudio} />
      ) : (
        <>
      {/* Top Studio Header Bar */}
      <div className="px-6 py-4 border-b border-slate-800 bg-[#0d111c] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Manhwa-to-Video &amp; Audio Generator</span>
                <span className="text-[11px] font-mono text-cyan-400 font-normal">
                  · {panels.length} Panels · {formatSec(totalChapterDuration)}
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Import chapter panels, assign Male/Female character voices in Kannada, English, Hindi, Tamil or Telugu, add SFX &amp; camera motion, and export MP4 / MP3.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSendToVideoEditor}
            disabled={panels.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Clapperboard className="w-4 h-4 text-cyan-400" />
            <span>Send to Video Editor</span>
          </button>

          <button
            onClick={() => handleExport('mp3')}
            disabled={isExportingFormat !== null || panels.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold transition-colors"
          >
            {isExportingFormat === 'mp3' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <AudioLines className="w-4 h-4" />
            )}
            <span>Export MP3 Audio</span>
          </button>

          <button
            onClick={() => handleExport('mp4')}
            disabled={isExportingFormat !== null || panels.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/25 transition-all"
          >
            {isExportingFormat === 'mp4' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Video className="w-4 h-4" />
            )}
            <span>Export MP4 Video</span>
          </button>
        </div>
      </div>

      {/* Main Scrollable Studio Workspace */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Permission & Direct Upload Guidance Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[#0d111c] border border-amber-500/30 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Use images you own or have permission to adapt. Protected or private Manhwa chapter links may block automatic image import — in that case, upload your JPG, PNG, or WebP panels directly.
            </span>
          </div>
          <button
            onClick={handleLoadSamples}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-medium text-slate-300 shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Load Sample Panels</span>
          </button>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`px-4 py-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : statusMessage.type === 'warning'
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-[11px] text-slate-400 hover:text-white font-mono"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Step 1 & 2: URL Chapter Import + Multi-Format Image Upload + Language/Audio Config */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Import & Upload Panel */}
          <div className="xl:col-span-7 bg-[#0d111c] border border-slate-800 rounded-2xl p-4 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-purple-300 font-mono">
                1 · Chapter Source &amp; Panel Upload
              </div>
              <input
                type="text"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                placeholder="Chapter Title"
                className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 w-64 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Chapter URL + Import Button */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={chapterUrl}
                  onChange={(e) => setChapterUrl(e.target.value)}
                  placeholder="Paste Manhwa chapter URL (https://...) to import images"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                onClick={handleImportFromUrl}
                disabled={isImportingUrl}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold whitespace-nowrap transition-colors"
              >
                {isImportingUrl ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Import Chapter</span>
              </button>
            </div>

            {/* JPG / PNG / WebP Dropzone & Upload Button */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingFiles(true);
              }}
              onDragLeave={() => setIsDraggingFiles(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingFiles(false);
                handleUploadFiles(e.dataTransfer.files);
              }}
              className={`border border-dashed rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 transition-colors ${
                isDraggingFiles
                  ? 'border-cyan-400 bg-cyan-950/20'
                  : 'border-slate-700 bg-slate-950/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">
                  <ImagePlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    Upload Panel Images or Screenshots
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Supports JPG, PNG, WebP · Drag &amp; drop or select multiple panels
                  </div>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                multiple
                onChange={(e) => {
                  handleUploadFiles(e.target.files);
                  e.target.value = '';
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-semibold transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload JPG / PNG / WebP</span>
              </button>
            </div>
          </div>

          {/* Language, Character Voice Defaults, BGM & Auto-Script */}
          <div className="xl:col-span-5 bg-[#0d111c] border border-slate-800 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-cyan-300 font-mono flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5" />
                <span>2 · Voice Language, Music &amp; Auto-Dialogue</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">5 Audio Languages</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Audio &amp; Dialogue Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as ManhwaLanguage)}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.nativeLabel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Video Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as '9:16' | '16:9' | '1:1')}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="9:16">9:16 Vertical Webtoon (Reels/Shorts)</option>
                  <option value="16:9">16:9 Widescreen YouTube / Film</option>
                  <option value="1:1">1:1 Square Feed</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Background Music Mood</label>
                <div className="flex gap-1.5">
                  <select
                    value={musicMood}
                    onChange={(e) => setMusicMood(e.target.value)}
                    className="flex-1 px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  >
                    {MUSIC_MOODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleToggleBgmPreview}
                    title={isBgmPlaying ? 'Stop BGM Preview' : 'Preview Background Music'}
                    className={`px-2.5 py-2 rounded-xl border text-xs flex items-center gap-1 ${
                      isBgmPlaying
                        ? 'bg-purple-600/30 border-purple-400 text-purple-200'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Narrator Voice &amp; Audio Track</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNarratorGender('male')}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      narratorGender === 'male'
                        ? 'bg-sky-600/25 border-sky-400 text-sky-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Male Narrator
                  </button>
                  <button
                    type="button"
                    onClick={() => setNarratorGender('female')}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      narratorGender === 'female'
                        ? 'bg-pink-600/25 border-pink-400 text-pink-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Female Narrator
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAudio}
                  onChange={(e) => setIncludeAudio(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-purple-500"
                />
                <span>Include Voice, SFX &amp; Music in Video</span>
              </label>

              <button
                type="button"
                onClick={handleAutoGenerateAudioAndDialogue}
                disabled={isGeneratingScript || panels.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all"
              >
                {isGeneratingScript ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Auto-Generate Dialogue &amp; Audio</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main 3-Column Interactive Studio: Scene Sequence | Animated Preview Monitor | Panel Voice & Motion Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Column A: Scene Arrangement List (3 cols) */}
          <div className="lg:col-span-3 bg-[#0d111c] border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-3 max-h-[600px]">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                3 · Scenes &amp; Order ({panels.length})
              </div>
              <span className="text-[11px] font-mono tabular-nums text-slate-400">
                {formatSec(totalChapterDuration)}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {panels.length === 0 && (
                <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                  No panels yet. Paste a chapter URL or upload JPG, PNG, or WebP images above.
                </div>
              )}

              {panels.map((panel, index) => {
                const isSelected = selectedPanel?.id === panel.id;
                return (
                  <div
                    key={panel.id}
                    onClick={() => {
                      setSelectedPanelId(panel.id);
                      setPanelElapsedSec(0);
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? 'bg-purple-950/30 border-purple-500/70'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <img
                        src={panel.imageUrl}
                        alt={panel.title}
                        className="w-12 h-16 object-cover rounded-lg border border-slate-800 shrink-0 bg-slate-900"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono font-bold text-cyan-400">
                            SCENE {panel.sceneNumber}
                          </span>
                          <span className="text-[10px] font-mono tabular-nums text-slate-400">
                            {panel.durationSec}s
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-white truncate">
                          {panel.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {panel.cameraMotion} · {panel.voiceGender === 'female' ? 'Female' : 'Male'} VO
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between pt-1.5 border-t border-slate-800/80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => movePanel(index, -1)}
                          disabled={index === 0}
                          title="Move Scene Up"
                          className="p-1 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 border border-slate-800"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => movePanel(index, 1)}
                          disabled={index === panels.length - 1}
                          title="Move Scene Down"
                          className="p-1 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 border border-slate-800"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicatePanel(panel, index)}
                          title="Duplicate Panel"
                          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => deletePanel(panel.id)}
                        title="Delete Panel"
                        className="p-1 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column B: Animated Video Stage Preview (5 cols) */}
          <div className="lg:col-span-5 bg-[#0d111c] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between text-xs">
              <div className="font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-purple-400" />
                <span>Animated Scene Preview</span>
              </div>
              <span className="font-mono tabular-nums text-cyan-400">
                {formatSec(elapsedChapterSec)} / {formatSec(totalChapterDuration)}
              </span>
            </div>

            {/* Viewport Stage */}
            <div className="flex-1 flex items-center justify-center bg-black rounded-xl border border-slate-800 p-3 min-h-[380px] overflow-hidden relative">
              {selectedPanel ? (
                <div
                  className={`relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-2xl ${
                    aspectRatio === '9:16'
                      ? 'h-[360px] w-[202px]'
                      : aspectRatio === '1:1'
                      ? 'h-[320px] w-[320px]'
                      : 'w-full aspect-video max-h-[340px]'
                  }`}
                >
                  <img
                    src={selectedPanel.imageUrl}
                    alt={selectedPanel.title}
                    className="w-full h-full object-cover transition-transform duration-100 ease-linear"
                    style={{
                      transform: getMotionTransform(
                        selectedPanel.cameraMotion,
                        selectedPanel.animationStyle,
                        isPlayingSequence ? previewProgress : 0.15
                      ),
                    }}
                  />

                  {/* White Flash Transition Overlay */}
                  {flashWhiteOpacity > 0 && (
                    <div
                      className="absolute inset-0 bg-white pointer-events-none transition-opacity duration-200"
                      style={{ opacity: flashWhiteOpacity }}
                    />
                  )}

                  {/* Top Scene Tag */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-black/75 border border-white/10 text-cyan-300">
                      Scene {selectedPanel.sceneNumber} · {selectedPanel.cameraMotion}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-black/75 border border-white/10 text-slate-300">
                      {language}
                    </span>
                  </div>

                  {/* Bottom Spoken Subtitle / Dialogue Bar */}
                  {(selectedPanel.dialogue || selectedPanel.narration) && (
                    <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-sm border border-white/15 rounded-lg p-2 space-y-0.5">
                      {selectedPanel.narration && (
                        <div className="text-[10px] text-slate-300 italic leading-snug">
                          {selectedPanel.narration}
                        </div>
                      )}
                      {selectedPanel.dialogue && (
                        <div className="text-[11px] text-white font-semibold leading-snug">
                          <span className="text-amber-300 mr-1">
                            {selectedPanel.speakerName}:
                          </span>
                          “{selectedPanel.dialogue}”
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-500">Select or upload a panel to preview</div>
              )}
            </div>

            {/* Playback Transport & Scrub Progress */}
            <div className="space-y-2">
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-100"
                  style={{
                    width:
                      totalChapterDuration > 0
                        ? `${Math.min(100, (elapsedChapterSec / totalChapterDuration) * 100)}%`
                        : '0%',
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={selectedIndex <= 0}
                    onClick={() => {
                      const prev = panels[selectedIndex - 1];
                      if (prev) {
                        setSelectedPanelId(prev.id);
                        setPanelElapsedSec(0);
                        lastSpokenPanelKeyRef.current = '';
                      }
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-35 border border-slate-800 text-slate-200"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleTogglePlaySequence}
                    disabled={panels.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold transition-colors"
                  >
                    {isPlayingSequence ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause Chapter</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Preview Chapter</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={selectedIndex >= panels.length - 1}
                    onClick={() => {
                      const next = panels[selectedIndex + 1];
                      if (next) {
                        setSelectedPanelId(next.id);
                        setPanelElapsedSec(0);
                        lastSpokenPanelKeyRef.current = '';
                      }
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-35 border border-slate-800 text-slate-200"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-[11px] font-mono text-slate-400">
                  Panel {panels.length > 0 ? selectedIndex + 1 : 0}/{panels.length} ·{' '}
                  {selectedPanel?.transition || 'Crossfade'}
                </div>
              </div>
            </div>
          </div>

          {/* Column C: Selected Panel Dialogue, Voice Gender, Camera & SFX Inspector (4 cols) */}
          <div className="lg:col-span-4 bg-[#0d111c] border border-slate-800 rounded-2xl p-4 space-y-3 max-h-[600px] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-purple-300 font-mono flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5" />
                <span>4 · Panel Voice, Motion &amp; SFX</span>
              </div>
              {selectedPanel && (
                <span className="text-[11px] font-mono text-cyan-400">
                  Scene {selectedPanel.sceneNumber}
                </span>
              )}
            </div>

            {selectedPanel ? (
              <div className="space-y-3">
                {/* Title & Duration */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Panel Title</label>
                    <input
                      type="text"
                      value={selectedPanel.title}
                      onChange={(e) => updatePanel(selectedPanel.id, { title: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Duration (s)</label>
                    <input
                      type="number"
                      min={2}
                      max={12}
                      value={selectedPanel.durationSec}
                      onChange={(e) =>
                        updatePanel(selectedPanel.id, {
                          durationSec: Math.max(2, Math.min(12, Number(e.target.value) || 4)),
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono tabular-nums text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Camera Movement & Transition */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Camera Movement</label>
                    <select
                      value={selectedPanel.cameraMotion}
                      onChange={(e) =>
                        updatePanel(selectedPanel.id, {
                          cameraMotion: e.target.value as ManhwaCameraMotion,
                        })
                      }
                      className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                    >
                      {CAMERA_MOTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Panel Transition</label>
                    <select
                      value={selectedPanel.transition}
                      onChange={(e) =>
                        updatePanel(selectedPanel.id, {
                          transition: e.target.value as ManhwaTransition,
                        })
                      }
                      className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                    >
                      {TRANSITIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Animation Style & Sound Effect */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Animation Style</label>
                    <select
                      value={selectedPanel.animationStyle}
                      onChange={(e) =>
                        updatePanel(selectedPanel.id, {
                          animationStyle: e.target.value as ManhwaAnimationStyle,
                        })
                      }
                      className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                    >
                      {ANIMATION_STYLES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Sound Effect (SFX)</label>
                    <div className="flex gap-1">
                      <select
                        value={selectedPanel.sfxPreset}
                        onChange={(e) =>
                          updatePanel(selectedPanel.id, {
                            sfxPreset: e.target.value as ManhwaSfxPreset,
                          })
                        }
                        className="flex-1 min-w-0 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                      >
                        {SFX_PRESETS.map((sfx) => (
                          <option key={sfx} value={sfx}>
                            {sfx}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => triggerSfxPreset(selectedPanel.sfxPreset)}
                        title="Test SFX"
                        className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-amber-300"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Character Voice Gender & Speaker Name */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Character Name</label>
                    <input
                      type="text"
                      value={selectedPanel.speakerName}
                      onChange={(e) =>
                        updatePanel(selectedPanel.id, { speakerName: e.target.value })
                      }
                      placeholder="e.g. Kairo / Serena"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Character Voice</label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => updatePanel(selectedPanel.id, { voiceGender: 'male' })}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                          selectedPanel.voiceGender === 'male'
                            ? 'bg-sky-600/25 border-sky-400 text-sky-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        Male
                      </button>
                      <button
                        type="button"
                        onClick={() => updatePanel(selectedPanel.id, { voiceGender: 'female' })}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                          selectedPanel.voiceGender === 'female'
                            ? 'bg-pink-600/25 border-pink-400 text-pink-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        Female
                      </button>
                    </div>
                  </div>
                </div>

                {/* Character Dialogue */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-slate-400">
                      Character Dialogue ({language})
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePreviewPanelVoice('dialogue')}
                      className="flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200"
                    >
                      <Mic className="w-3 h-3" />
                      <span>Speak Dialogue</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={selectedPanel.dialogue}
                    onChange={(e) => updatePanel(selectedPanel.id, { dialogue: e.target.value })}
                    placeholder={`Enter character dialogue in ${language}...`}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                {/* Story Narration */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-slate-400">
                      Chapter Narration ({language})
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePreviewPanelVoice('narration')}
                      className="flex items-center gap-1 text-[11px] text-purple-300 hover:text-purple-200"
                    >
                      <Mic className="w-3 h-3" />
                      <span>Speak Narration</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={selectedPanel.narration}
                    onChange={(e) => updatePanel(selectedPanel.id, { narration: e.target.value })}
                    placeholder={`Enter third-person narration in ${language}...`}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-8 text-center">
                No panel selected.
              </div>
            )}
          </div>
        </div>

        {/* Rendered MP4 Video & MP3 Audio Exports Shelf */}
        {exportsList.length > 0 && (
          <div className="bg-[#0d111c] border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300 font-mono">
                5 · Finished Manhwa Exports ({exportsList.length})
              </div>
              <span className="text-[11px] text-slate-400">
                Playable &amp; downloadable MP4 / MP3 deliverables
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {exportsList.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{item.fileName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {item.exportFormat.toUpperCase()} · {formatSec(item.durationSec)} ·{' '}
                        {formatBytes(item.sizeBytes)}
                        {item.resolution ? ` · ${item.resolution}` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={item.objectUrl}
                        download={item.fileName}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-semibold"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteExport(item.id)}
                        title="Delete Export"
                        className="p-1.5 bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-500/30 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {item.exportFormat === 'mp4' ? (
                    <video
                      src={item.objectUrl}
                      controls
                      className="w-full max-h-60 rounded-lg bg-black border border-slate-800"
                    />
                  ) : (
                    <audio src={item.objectUrl} controls className="w-full" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};
