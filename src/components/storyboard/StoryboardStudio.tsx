import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Clapperboard,
  Sparkles,
  Play,
  Pause,
  Plus,
  Trash2,
  Camera,
  Download,
  FileText,
  Upload,
  Users,
  Layers,
  Image as ImageIcon,
  FolderOpen,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Copy,
  Mic2,
  Film,
  LayoutGrid,
  Wand2,
  AlertCircle,
} from 'lucide-react';
import { FilmProject, StudioModule, StudioTheme } from '../../types';
import { useStudioAi } from '../../context/StudioAiContext';
import { soundFx } from '../../utils/audioSynth';

type StoryboardSection =
  | 'overview'
  | 'create'
  | 'import'
  | 'ai_generate'
  | 'scenes'
  | 'shots'
  | 'characters'
  | 'ai_image_bridge'
  | 'preview'
  | 'export';

type ShotCameraType =
  | 'Extreme wide shot'
  | 'Wide shot'
  | 'Medium shot'
  | 'Close-up'
  | 'Extreme close-up'
  | 'Over-the-shoulder shot'
  | 'Low-angle shot'
  | 'High-angle shot'
  | 'Tracking shot'
  | 'Aerial shot';

interface StoryboardShotItem {
  id: string;
  sceneId: string;
  shotNumber: number;
  cameraAngle: ShotCameraType;
  characterName: string;
  characterId?: string;
  action: string;
  dialogue: string;
  durationSec: number;
  prompt: string;
  notes: string;
  imageUrl: string;
  imageAssetId?: string;
  sfxPreset?: string;
  status: 'draft' | 'image_ready' | 'approved' | 'video_queued';
}

interface StoryboardSceneItem {
  id: string;
  sceneNumber: number;
  title: string;
  location: string;
  description: string;
  characters: string[];
  durationSec: number;
  musicMood?: string;
  backgroundImageUrl?: string;
  shots: StoryboardShotItem[];
}

interface StoryboardCharacterProfile {
  id: string;
  name: string;
  description: string;
  clothing: string;
  hairstyle: string;
  expressions: string;
  poses: string;
  voiceReference: string;
  referenceImageUrl: string;
  identitySeed?: number;
}

interface StoryboardProject {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  style: string;
  storyPrompt: string;
  screenplay: string;
  screenplayApproved: boolean;
  characters: StoryboardCharacterProfile[];
  scenes: StoryboardSceneItem[];
  createdAt: string;
  updatedAt: string;
}

interface StoryboardStudioProps {
  activeFilm: FilmProject;
  theme?: StudioTheme;
  onNavigate?: (module: StudioModule) => void;
}

const CAMERA_TYPES: ShotCameraType[] = [
  'Extreme wide shot',
  'Wide shot',
  'Medium shot',
  'Close-up',
  'Extreme close-up',
  'Over-the-shoulder shot',
  'Low-angle shot',
  'High-angle shot',
  'Tracking shot',
  'Aerial shot',
];

const VISUAL_STYLES = ['Anime', 'Realistic', 'Manhwa', 'Cartoon', '3D animation', 'Cinematic'];

export const StoryboardStudio: React.FC<StoryboardStudioProps> = ({
  activeFilm,
  theme = 'elevenlabs',
  onNavigate,
}) => {
  const { addAssetToTimeline, addQueueItem } = useStudioAi();
  const isLight = theme === 'elevenlabs';

  const [section, setSection] = useState<StoryboardSection>('shots');
  const [storyboards, setStoryboards] = useState<StoryboardProject[]>([]);
  const [activeSb, setActiveSb] = useState<StoryboardProject | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string>('');
  const [selectedShotId, setSelectedShotId] = useState<string>('');
  const [selectedVideoShotIds, setSelectedVideoShotIds] = useState<string[]>([]);
  const [studioImages, setStudioImages] = useState<Array<{ id: string; title: string; url: string; folder: string }>>([]);

  // Story & Screenplay Inputs
  const [newTitle, setNewTitle] = useState('');
  const [storyPrompt, setStoryPrompt] = useState(
    'Create a cinematic fantasy adventure. A hero enters an ancient city, discovers a mysterious secret, and faces a powerful enemy. Use realistic anime visuals.'
  );
  const [importText, setImportText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Anime');

  // Playback & UI Feedback
  const [isPlayingAnimatic, setIsPlayingAnimatic] = useState(false);
  const [animaticIndex, setAnimaticIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [generatingShotId, setGeneratingShotId] = useState<string>('');
  const [generatingBgSceneId, setGeneratingBgSceneId] = useState<string>('');
  const [isBatchGenerating, setIsBatchGenerating] = useState<boolean>(false);
  const [notice, setNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  const fetchData = async () => {
    try {
      const [sbRes, imgRes] = await Promise.all([
        fetch('/api/storyboards'),
        fetch('/api/images/library'),
      ]);
      const sbData = await sbRes.json();
      if (sbData.success && Array.isArray(sbData.storyboards)) {
        setStoryboards(sbData.storyboards);
        const first = sbData.storyboards[0] || null;
        if (!activeSb && first) {
          setActiveSb(first);
          setSelectedSceneId(first.scenes[0]?.id || '');
          setSelectedShotId(first.scenes[0]?.shots[0]?.id || '');
        }
      }
      const imgData = await imgRes.json();
      if (imgData.success && Array.isArray(imgData.images)) {
        setStudioImages(imgData.images);
      }
    } catch {
      // ignore initial error
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const allFlatShots = useMemo(() => {
    if (!activeSb) return [];
    return activeSb.scenes.flatMap((sc) =>
      sc.shots.map((sh) => ({ scene: sc, shot: sh }))
    );
  }, [activeSb]);

  const activeScene = useMemo(
    () => activeSb?.scenes.find((s) => s.id === selectedSceneId) || activeSb?.scenes[0] || null,
    [activeSb, selectedSceneId]
  );

  const activeShot = useMemo(
    () => activeScene?.shots.find((sh) => sh.id === selectedShotId) || activeScene?.shots[0] || null,
    [activeScene, selectedShotId]
  );

  // Animatic playback timer
  useEffect(() => {
    if (!isPlayingAnimatic || allFlatShots.length === 0) return;
    const curr = allFlatShots[animaticIndex];
    const ms = Math.max(1500, Math.min(5000, (curr?.shot.durationSec || 3) * 500));
    const t = setTimeout(() => {
      setAnimaticIndex((prev) => {
        if (prev + 1 >= allFlatShots.length) {
          setIsPlayingAnimatic(false);
          return 0;
        }
        soundFx.playShutterSound();
        return prev + 1;
      });
    }, ms);
    return () => clearTimeout(t);
  }, [isPlayingAnimatic, animaticIndex, allFlatShots]);

  const persistStoryboard = async (updated: StoryboardProject) => {
    setActiveSb(updated);
    setStoryboards((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    await fetch(`/api/storyboards/${encodeURIComponent(updated.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
  };

  const handleGenerateStoryboard = async (overrideScreenplay?: string) => {
    setIsLoading(true);
    setErrorMsg('');
    soundFx.playScannerBeep();
    try {
      const endpoint = overrideScreenplay ? '/api/storyboards/import' : '/api/storyboards/generate';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle || undefined,
          projectId: activeFilm.id,
          storyPrompt,
          screenplay: overrideScreenplay || undefined,
          style: selectedStyle,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to generate storyboard.');
      soundFx.playCinematicImpact();
      const sb: StoryboardProject = data.storyboard;
      setStoryboards((prev) => [sb, ...prev.filter((s) => s.id !== sb.id)]);
      setActiveSb(sb);
      setSelectedSceneId(sb.scenes[0]?.id || '');
      setSelectedShotId(sb.scenes[0]?.shots[0]?.id || '');
      setSection('shots');
      showNotice(`Generated storyboard "${sb.title}" with ${sb.scenes.length} scenes.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Generation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateShotImage = async (sceneId: string, shot: StoryboardShotItem) => {
    if (!activeSb) return;
    setGeneratingShotId(shot.id);
    setErrorMsg('');
    soundFx.playScannerBeep();
    try {
      const matchedChar = activeSb.characters.find(
        (c) => c.id === shot.characterId || c.name.toLowerCase() === shot.characterName.toLowerCase()
      );
      const sceneObj = activeSb.scenes.find((s) => s.id === sceneId);
      const consistencySuffix = matchedChar
        ? ` | Character consistency lock: ${matchedChar.name} (${matchedChar.description}, clothing: ${matchedChar.clothing}, hair: ${matchedChar.hairstyle}${matchedChar.identitySeed ? `, seed ${matchedChar.identitySeed}` : ''})`
        : '';
      const bgSuffix = sceneObj?.location ? ` | Setting: ${sceneObj.location}` : '';
      const enrichedPrompt = `${shot.prompt}${consistencySuffix}${bgSuffix}`;

      const res = await fetch('/api/storyboards/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyboardId: activeSb.id,
          sceneId,
          shotId: shot.id,
          prompt: enrichedPrompt,
          style: activeSb.style || selectedStyle,
          characterReferenceUrl: matchedChar?.referenceImageUrl || '',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Image generation failed.');
      soundFx.playCinematicImpact();
      setActiveSb(data.storyboard);
      setStoryboards((prev) => prev.map((s) => (s.id === data.storyboard.id ? data.storyboard : s)));
      fetchData();
      showNotice(
        matchedChar
          ? `Generated Shot ${shot.shotNumber} with ${matchedChar.name} character consistency lock & saved to Media Library.`
          : `Generated panel image via AI Image Studio & saved to Media Library.`
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Shot image generation failed.');
    } finally {
      setGeneratingShotId('');
    }
  };

  const handleGenerateSceneBackground = async (scene: StoryboardSceneItem) => {
    if (!activeSb) return;
    setGeneratingBgSceneId(scene.id);
    setErrorMsg('');
    soundFx.playScannerBeep();
    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Cinematic background environment plate for ${scene.location}: ${scene.description}. No characters, ultra-detailed ${activeSb.style || selectedStyle} film background, dramatic lighting, 16:9 widescreen.`,
          style: activeSb.style || selectedStyle,
          aspectRatio: '16:9',
          folder: 'Backgrounds',
          projectId: activeSb.projectId,
        }),
      });
      const data = await res.json();
      const createdUrl = data?.images?.[0]?.url || data?.image?.url || '';
      if (!res.ok || !data?.success || !createdUrl) {
        throw new Error(data?.error || 'Scene background generation failed.');
      }
      const nextScenes = activeSb.scenes.map((sc) =>
        sc.id === scene.id ? { ...sc, backgroundImageUrl: createdUrl } : sc
      );
      await persistStoryboard({ ...activeSb, scenes: nextScenes });
      fetchData();
      soundFx.playCinematicImpact();
      showNotice(`Generated Scene ${scene.sceneNumber} background (${scene.location}) & saved to Unified Media Library.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Scene background generation failed.');
    } finally {
      setGeneratingBgSceneId('');
    }
  };

  const handleBatchGenerateScenePanels = async (scene: StoryboardSceneItem) => {
    if (!activeSb || scene.shots.length === 0) return;
    setIsBatchGenerating(true);
    setErrorMsg('');
    try {
      for (const sh of scene.shots) {
        await handleGenerateShotImage(scene.id, sh);
      }
      showNotice(`Generated AI images for all ${scene.shots.length} panels in Scene ${scene.sceneNumber}.`);
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const toggleShotVideoSelection = (shotId: string) => {
    setSelectedVideoShotIds((prev) =>
      prev.includes(shotId) ? prev.filter((id) => id !== shotId) : [...prev, shotId]
    );
  };

  const handleSaveAllToUnifiedMedia = () => {
    if (!activeSb) return;
    let count = 0;
    activeSb.scenes.forEach((sc) => {
      if (sc.backgroundImageUrl) {
        addAssetToTimeline({
          id: `sb-bg-${sc.id}-${Date.now()}`,
          name: `Sc${sc.sceneNumber}_Background_${sc.location.replace(/\s+/g, '_')}.png`,
          category: 'image',
          subcategory: 'Scene Background',
          source: 'ai_generated',
          format: 'PNG',
          size: '2.4 MB',
          thumbnail: sc.backgroundImageUrl,
          mediaUrl: sc.backgroundImageUrl,
          description: `Background plate for Scene ${sc.sceneNumber}: ${sc.location}`,
          tags: ['Storyboard', 'Background', sc.location, activeSb.style],
          license: {
            type: 'AI Studio Creative License',
            commercialUse: true,
            attribution: 'Film & Video Studio Ultimate',
            certificateId: `SB-BG-${sc.sceneNumber}`,
            verified: true,
          },
          specs: { resolution: '1920x1080' },
          isFavorite: false,
          addedAt: new Date().toISOString().split('T')[0],
          usageCount: 1,
        } as any);
        count++;
      }
      sc.shots.forEach((sh) => {
        if (!sh.imageUrl) return;
        addAssetToTimeline({
          id: `sb-panel-${sh.id}-${Date.now()}`,
          name: `Sc${sc.sceneNumber}_Shot${sh.shotNumber}_${sh.cameraAngle.replace(/\s+/g, '_')}.png`,
          category: 'image',
          subcategory: 'Storyboard Panel',
          source: 'ai_generated',
          format: 'PNG',
          size: '1.8 MB',
          thumbnail: sh.imageUrl,
          mediaUrl: sh.imageUrl,
          description: sh.prompt || sh.action,
          tags: ['Storyboard', sh.cameraAngle, sh.characterName, sc.location],
          license: {
            type: 'AI Studio Creative License',
            commercialUse: true,
            attribution: 'Film & Video Studio Ultimate',
            certificateId: `SB-SH-${sc.sceneNumber}-${sh.shotNumber}`,
            verified: true,
          },
          specs: { resolution: '1920x1080' },
          isFavorite: false,
          addedAt: new Date().toISOString().split('T')[0],
          usageCount: 1,
        } as any);
        count++;
      });
    });
    soundFx.playCinematicImpact();
    showNotice(`Saved ${count} storyboard panels & scene backgrounds to Unified Media Library.`);
  };

  const handleSendSelectedToAiVideo = async () => {
    if (!activeSb) return;
    const targets = allFlatShots.filter(({ shot }) =>
      selectedVideoShotIds.length > 0 ? selectedVideoShotIds.includes(shot.id) : shot.id === activeShot?.id
    );
    if (targets.length === 0) {
      setErrorMsg('Select at least one storyboard panel to send to AI Video Generator.');
      return;
    }

    const payload = targets.map(({ scene, shot }) => ({
      shotId: shot.id,
      sceneNumber: scene.sceneNumber,
      shotNumber: shot.shotNumber,
      title: `Sc ${scene.sceneNumber} · Shot ${shot.shotNumber} (${shot.cameraAngle})`,
      prompt: `${shot.action} ${shot.cameraAngle}. ${shot.prompt}`,
      imageUrl: shot.imageUrl,
      durationSec: shot.durationSec,
      style: activeSb.style,
    }));

    try {
      sessionStorage.setItem('zkmap_storyboard_video_queue', JSON.stringify(payload));
    } catch {
      // ignore storage quota errors
    }

    targets.forEach(({ scene, shot }) => {
      addQueueItem({
        tool: 'AI Video Generator (Image-to-Video)',
        prompt: `Sc${scene.sceneNumber} Sh${shot.shotNumber}: ${shot.action} (${shot.cameraAngle})`,
        provider: 'Storyboard → AI Video Bridge',
        status: 'Queued',
        progress: 10,
      });
    });

    const queuedIds = new Set(targets.map((t) => t.shot.id));
    const nextScenes = activeSb.scenes.map((sc) => ({
      ...sc,
      shots: sc.shots.map((sh) => (queuedIds.has(sh.id) ? { ...sh, status: 'video_queued' as const } : sh)),
    }));
    await persistStoryboard({ ...activeSb, scenes: nextScenes });

    soundFx.playCinematicImpact();
    showNotice(`Sent ${targets.length} selected panel image(s) to AI Video Generator.`);
    if (onNavigate) onNavigate('ai_video');
  };

  const handleAddScene = async () => {
    if (!activeSb) return;
    const nextNum = activeSb.scenes.length + 1;
    const newSceneId = `sc-${Date.now().toString(36)}`;
    const newScene: StoryboardSceneItem = {
      id: newSceneId,
      sceneNumber: nextNum,
      title: `Scene ${nextNum}`,
      location: 'New Location',
      description: 'Describe scene action and narrative purpose.',
      characters: activeSb.characters[0] ? [activeSb.characters[0].name] : ['Hero'],
      durationSec: 30,
      shots: [
        {
          id: `sh-${Date.now().toString(36)}-1`,
          sceneId: newSceneId,
          shotNumber: 1,
          cameraAngle: 'Wide shot',
          characterName: activeSb.characters[0]?.name || 'Hero',
          action: 'Establishing visual for the new scene.',
          dialogue: '',
          durationSec: 10,
          prompt: `Wide ${activeSb.style} establishing shot`,
          notes: '',
          imageUrl: '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
          status: 'draft',
        },
      ],
    };
    await persistStoryboard({ ...activeSb, scenes: [...activeSb.scenes, newScene] });
    setSelectedSceneId(newSceneId);
    setSelectedShotId(newScene.shots[0].id);
    showNotice(`Added Scene ${nextNum}.`);
  };

  const handleMoveScene = async (index: number, dir: -1 | 1) => {
    if (!activeSb) return;
    const target = index + dir;
    if (target < 0 || target >= activeSb.scenes.length) return;
    const next = [...activeSb.scenes];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    const renumbered = next.map((sc, i) => ({ ...sc, sceneNumber: i + 1 }));
    await persistStoryboard({ ...activeSb, scenes: renumbered });
  };

  const handleDeleteScene = async (sceneId: string) => {
    if (!activeSb) return;
    const remaining = activeSb.scenes
      .filter((s) => s.id !== sceneId)
      .map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    await persistStoryboard({ ...activeSb, scenes: remaining });
    showNotice('Scene removed.');
  };

  const handleAddShot = async (sceneId: string) => {
    if (!activeSb) return;
    const nextScenes = activeSb.scenes.map((sc) => {
      if (sc.id !== sceneId) return sc;
      const nextNum = sc.shots.length + 1;
      const newShot: StoryboardShotItem = {
        id: `sh-${Date.now().toString(36)}`,
        sceneId,
        shotNumber: nextNum,
        cameraAngle: 'Medium shot',
        characterName: sc.characters[0] || 'Hero',
        action: 'New camera shot action description.',
        dialogue: '',
        durationSec: 8,
        prompt: `Medium ${activeSb.style} shot in ${sc.location}`,
        notes: '',
        imageUrl: '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
        status: 'draft',
      };
      setSelectedShotId(newShot.id);
      return { ...sc, shots: [...sc.shots, newShot] };
    });
    await persistStoryboard({ ...activeSb, scenes: nextScenes });
  };

  const handleUpdateShot = async (sceneId: string, shotId: string, patch: Partial<StoryboardShotItem>) => {
    if (!activeSb) return;
    const nextScenes = activeSb.scenes.map((sc) =>
      sc.id !== sceneId
        ? sc
        : {
            ...sc,
            shots: sc.shots.map((sh) => (sh.id === shotId ? { ...sh, ...patch } : sh)),
          }
    );
    await persistStoryboard({ ...activeSb, scenes: nextScenes });
  };

  const handleDuplicateShot = async (sceneId: string, shot: StoryboardShotItem) => {
    if (!activeSb) return;
    const copy: StoryboardShotItem = {
      ...shot,
      id: `sh-${Date.now().toString(36)}`,
      shotNumber: 0,
    };
    const nextScenes = activeSb.scenes.map((sc) => {
      if (sc.id !== sceneId) return sc;
      const list = [...sc.shots, copy].map((sh, i) => ({ ...sh, shotNumber: i + 1 }));
      return { ...sc, shots: list };
    });
    await persistStoryboard({ ...activeSb, scenes: nextScenes });
    showNotice('Shot duplicated.');
  };

  const handleMoveShot = async (sceneId: string, idx: number, dir: -1 | 1) => {
    if (!activeSb) return;
    const nextScenes = activeSb.scenes.map((sc) => {
      if (sc.id !== sceneId) return sc;
      const target = idx + dir;
      if (target < 0 || target >= sc.shots.length) return sc;
      const list = [...sc.shots];
      const [moved] = list.splice(idx, 1);
      list.splice(target, 0, moved);
      return { ...sc, shots: list.map((sh, i) => ({ ...sh, shotNumber: i + 1 })) };
    });
    await persistStoryboard({ ...activeSb, scenes: nextScenes });
  };

  const handleDeleteShot = async (sceneId: string, shotId: string) => {
    if (!activeSb) return;
    const nextScenes = activeSb.scenes.map((sc) => {
      if (sc.id !== sceneId) return sc;
      const list = sc.shots.filter((sh) => sh.id !== shotId).map((sh, i) => ({ ...sh, shotNumber: i + 1 }));
      return { ...sc, shots: list };
    });
    await persistStoryboard({ ...activeSb, scenes: nextScenes });
    showNotice('Shot deleted.');
  };

  const handleSendAllToTimeline = () => {
    if (!activeSb) return;
    soundFx.playCinematicImpact();
    allFlatShots.forEach(({ scene, shot }) => {
      addAssetToTimeline({
        id: shot.id,
        name: `Sc${scene.sceneNumber} Sh${shot.shotNumber} · ${shot.cameraAngle}`,
        category: 'image',
        subcategory: 'Storyboard Panel',
        source: 'ai_generated',
        format: 'PNG',
        size: `${shot.durationSec}s`,
        thumbnail: shot.imageUrl,
        url: shot.imageUrl,
        description: `${shot.action} ${shot.dialogue}`,
        tags: ['Storyboard', shot.cameraAngle, scene.location],
        addedAt: new Date().toISOString().split('T')[0],
        projectId: activeSb.projectId,
        projectName: activeSb.title,
        timelineTrack: 'Video',
      } as any);
    });
    showNotice(`Sent ${allFlatShots.length} storyboard shots to Timeline Editor (V1).`);
    if (onNavigate) onNavigate('editor');
  };

  const handleExport = async (format: 'json' | 'shotlist_csv' | 'screenplay_txt' | 'pdf_html') => {
    if (!activeSb) return;
    soundFx.playShutterSound();
    try {
      const res = await fetch(`/api/storyboards/${encodeURIComponent(activeSb.id)}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Export failed.');
      const blob = new Blob([data.content], { type: data.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName;
      a.click();
      URL.revokeObjectURL(url);
      showNotice(`Downloaded ${data.fileName} and logged in Unified Media Library.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Export failed.');
    }
  };

  const surfaceBg = isLight ? 'bg-white text-neutral-900' : 'bg-[#090b11] text-slate-100';
  const sidebarBg = isLight ? 'bg-[#FAFAFB] border-neutral-200' : 'bg-[#0d111c] border-slate-800';
  const cardBg = isLight ? 'bg-white border-neutral-200' : 'bg-[#111625] border-slate-800';
  const inputBg = isLight
    ? 'bg-neutral-50 border-neutral-300 text-neutral-900'
    : 'bg-slate-950 border-slate-800 text-white';
  const mutedText = isLight ? 'text-neutral-500' : 'text-slate-400';

  const navItems: Array<{ id: StoryboardSection; label: string; icon: React.ElementType; group: string }> = [
    { id: 'overview', label: 'My Storyboards', icon: FolderOpen, group: 'Overview' },
    { id: 'ai_generate', label: 'AI Storyboard Generator', icon: Sparkles, group: 'Overview' },
    { id: 'import', label: 'Import Screenplay', icon: Upload, group: 'Overview' },
    { id: 'scenes', label: 'Scene Breakdown', icon: Layers, group: 'Production' },
    { id: 'shots', label: 'Storyboard Editor & Shots', icon: LayoutGrid, group: 'Production' },
    { id: 'characters', label: 'Character Library', icon: Users, group: 'Production' },
    { id: 'ai_image_bridge', label: 'AI Image Studio Picker', icon: ImageIcon, group: 'AI Image Studio' },
    { id: 'preview', label: 'Animatic Preview', icon: Play, group: 'Delivery' },
    { id: 'export', label: 'Export Storyboard', icon: Download, group: 'Delivery' },
  ];

  return (
    <div className={`flex-1 flex overflow-hidden ${surfaceBg}`}>
      {/* Left Storyboard Sidebar */}
      <aside className={`w-60 border-r p-4 overflow-y-auto shrink-0 space-y-4 hidden md:block ${sidebarBg}`}>
        <div>
          <div className="flex items-center gap-2 text-amber-500 font-extrabold text-xs uppercase tracking-wider">
            <Clapperboard className="w-4 h-4" />
            <span>Storyboard Studio</span>
          </div>
          <p className={`text-[11px] mt-1 ${mutedText}`}>
            Story → Scenes → Shots → AI Images → Timeline
          </p>
        </div>

        {['Overview', 'Production', 'AI Image Studio', 'Delivery'].map((grp) => (
          <div key={grp} className="space-y-1">
            <div className={`px-2 text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>{grp}</div>
            {navItems
              .filter((i) => i.group === grp)
              .map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      soundFx.playScannerBeep();
                      setSection(item.id);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      active
                        ? isLight
                          ? 'bg-neutral-900 text-white'
                          : 'bg-amber-500 text-black'
                        : isLight
                        ? 'text-neutral-700 hover:bg-neutral-200/70'
                        : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
          </div>
        ))}

        {/* Quick 6-Studio Handoff */}
        <div className="pt-3 border-t border-neutral-200/20 space-y-1.5">
          <div className={`px-2 text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>Connected Studios</div>
          <button
            onClick={() => onNavigate?.('ai_image')}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${cardBg}`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
            <span>Open AI Image Studio</span>
          </button>
          <button
            onClick={() => onNavigate?.('animation')}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${cardBg}`}
          >
            <Film className="w-3.5 h-3.5 text-cyan-500" />
            <span>Send to Animation Studio</span>
          </button>
          <button
            onClick={() => onNavigate?.('ai_voice')}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${cardBg}`}
          >
            <Mic2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>ElevenLabs Voice Studio</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className={`px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${sidebarBg}`}>
          <div>
            <h1 className="text-base font-extrabold">
              {activeSb ? activeSb.title : 'Storyboard Studio'}
            </h1>
            <p className={`text-xs ${mutedText}`}>
              {activeSb
                ? `${activeSb.scenes.length} Scenes · ${allFlatShots.length} Shots · Style: ${activeSb.style}`
                : 'Select or generate a storyboard project'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSendAllToTimeline}
              disabled={!activeSb || allFlatShots.length === 0}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Clapperboard className="w-3.5 h-3.5" />
              <span>Send Shots to Timeline (V1)</span>
            </button>
            <button
              onClick={() => onNavigate?.('ai_video')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${cardBg}`}
            >
              <Film className="w-3.5 h-3.5 text-purple-500" />
              <span>Image-to-Video</span>
            </button>
          </div>
        </div>

        {(notice || errorMsg) && (
          <div className="px-6 pt-3">
            {errorMsg && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {notice && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{notice}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* MY STORYBOARDS */}
          {section === 'overview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold">My Storyboards ({storyboards.length})</h2>
                <button
                  onClick={() => setSection('ai_generate')}
                  className="px-3.5 py-2 rounded-lg bg-amber-500 text-black text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New AI Storyboard</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {storyboards.map((sb) => (
                  <div
                    key={sb.id}
                    onClick={() => {
                      setActiveSb(sb);
                      setSelectedSceneId(sb.scenes[0]?.id || '');
                      setSelectedShotId(sb.scenes[0]?.shots[0]?.id || '');
                      setSection('shots');
                    }}
                    className={`p-4 rounded-xl border cursor-pointer hover:border-amber-500 transition-all space-y-2 ${cardBg}`}
                  >
                    <div className="aspect-video rounded-lg overflow-hidden bg-black">
                      <img
                        src={sb.scenes[0]?.shots[0]?.imageUrl || '/assets/images/cartoon_adventure_thumb_1794924309261.jpg'}
                        alt={sb.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="font-bold text-sm truncate">{sb.title}</div>
                    <p className={`text-xs line-clamp-2 ${mutedText}`}>{sb.summary}</p>
                    <div className={`flex items-center justify-between text-[11px] font-mono ${mutedText}`}>
                      <span>{sb.scenes.length} Scenes</span>
                      <span>{sb.style}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI STORYBOARD GENERATOR & IMPORT SCREENPLAY */}
          {(section === 'ai_generate' || section === 'import') && (
            <div className="max-w-3xl space-y-4">
              <div>
                <h2 className="text-lg font-extrabold">
                  {section === 'import' ? 'Import Screenplay (TXT / Paste)' : 'AI Storyboard Generator'}
                </h2>
                <p className={`text-xs mt-0.5 ${mutedText}`}>
                  Automatically generates screenplay, character roster, scene breakdown, and camera shots ready for AI Image Studio.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Storyboard Title</label>
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Ancient City of the Sky Spire"
                    className={`w-full rounded-lg border p-2.5 text-xs ${inputBg}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Visual Style</label>
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className={`w-full rounded-lg border p-2.5 text-xs ${inputBg}`}
                  >
                    {VISUAL_STYLES.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>

              {section === 'import' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.md,.fountain"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        f.text().then((txt) => setImportText(txt));
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-lg bg-amber-500 text-black text-xs font-bold flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Script File (.TXT)</span>
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Paste your screenplay scenes and dialogue here..."
                    className={`w-full rounded-xl border p-3 text-xs font-mono ${inputBg}`}
                  />
                  <button
                    disabled={isLoading || !importText.trim()}
                    onClick={() => handleGenerateStoryboard(importText)}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm disabled:opacity-50"
                  >
                    {isLoading ? 'Parsing Screenplay into Scenes & Shots...' : 'Convert Screenplay into Storyboard'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    rows={5}
                    value={storyPrompt}
                    onChange={(e) => setStoryPrompt(e.target.value)}
                    className={`w-full rounded-xl border p-3 text-sm ${inputBg}`}
                  />
                  <button
                    disabled={isLoading}
                    onClick={() => handleGenerateStoryboard()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isLoading ? 'Generating Screenplay, Scenes & Shots...' : 'Generate Complete AI Storyboard'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: AUTOMATIC SCENE BREAKDOWN */}
          {section === 'scenes' && activeSb && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold">Scene Breakdown ({activeSb.scenes.length} Scenes)</h2>
                  <p className={`text-xs ${mutedText}`}>Add, reorder, edit, or approve screenplay and scenes.</p>
                </div>
                <button
                  onClick={handleAddScene}
                  className="px-3.5 py-2 rounded-lg bg-amber-500 text-black text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Scene</span>
                </button>
              </div>

              <div className="space-y-3">
                {activeSb.scenes.map((sc, idx) => (
                  <div key={sc.id} className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${cardBg}`}>
                    <div className="space-y-1 flex-1 min-w-[240px]">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 text-[11px] font-mono font-bold">
                          SCENE {String(sc.sceneNumber).padStart(2, '0')}
                        </span>
                        <span className="font-bold text-sm">{sc.title}</span>
                        <span className={`text-xs ${mutedText}`}>· {sc.location} · {sc.durationSec}s</span>
                      </div>
                      <p className={`text-xs ${mutedText}`}>{sc.description}</p>
                      <div className={`text-[11px] font-mono ${mutedText}`}>
                        {sc.shots.length} camera shot(s) · Characters: {sc.characters.join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleMoveScene(idx, -1)}
                        className={`p-2 rounded-lg border ${cardBg}`}
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveScene(idx, 1)}
                        className={`p-2 rounded-lg border ${cardBg}`}
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSceneId(sc.id);
                          setSelectedShotId(sc.shots[0]?.id || '');
                          setSection('shots');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold"
                      >
                        Edit Shots
                      </button>
                      <button
                        onClick={() => handleDeleteScene(sc.id)}
                        className="p-2 rounded-lg border border-red-500/30 text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEPS 6, 7, 8: STORYBOARD EDITOR & SHOT GENERATOR */}
          {section === 'shots' && activeSb && (
            <div className="space-y-5">
              {/* Scene Selector Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {activeSb.scenes.map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => {
                        setSelectedSceneId(sc.id);
                        setSelectedShotId(sc.shots[0]?.id || '');
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
                        activeScene?.id === sc.id
                          ? 'bg-amber-500 text-black border-amber-500'
                          : cardBg
                      }`}
                    >
                      Sc {sc.sceneNumber}: {sc.location} ({sc.shots.length})
                    </button>
                  ))}
                </div>
                {activeScene && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleGenerateSceneBackground(activeScene)}
                      disabled={generatingBgSceneId === activeScene.id}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 ${cardBg}`}
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                      <span>{generatingBgSceneId === activeScene.id ? 'Generating BG...' : 'Generate Scene Background'}</span>
                    </button>
                    <button
                      onClick={() => handleBatchGenerateScenePanels(activeScene)}
                      disabled={isBatchGenerating}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isBatchGenerating ? 'Generating All Panels...' : 'Generate All Scene Panels'}</span>
                    </button>
                    <button
                      onClick={handleSaveAllToUnifiedMedia}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${cardBg}`}
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Save All to Media Library</span>
                    </button>
                    <button
                      onClick={handleSendSelectedToAiVideo}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>
                        Send {selectedVideoShotIds.length > 0 ? `Selected (${selectedVideoShotIds.length})` : 'Active Panel'} to AI Video
                      </span>
                    </button>
                    <button
                      onClick={() => handleAddShot(activeScene.id)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Shot Panel</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Scene Background Plate Strip */}
              {activeScene && (
                <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${cardBg}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    {activeScene.backgroundImageUrl ? (
                      <img
                        src={activeScene.backgroundImageUrl}
                        alt={`Scene ${activeScene.sceneNumber} background`}
                        className="w-24 h-14 rounded-lg object-cover border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className={`w-24 h-14 rounded-lg border border-dashed flex items-center justify-center text-[10px] shrink-0 ${mutedText}`}>
                        No BG Plate
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        Scene {activeScene.sceneNumber} Background: {activeScene.location}
                      </div>
                      <p className={`text-[11px] line-clamp-1 ${mutedText}`}>{activeScene.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-mono ${mutedText}`}>
                      {selectedVideoShotIds.length} selected for Image-to-Video
                    </span>
                    {selectedVideoShotIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedVideoShotIds([])}
                        className="text-[11px] underline opacity-75 hover:opacity-100"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeScene && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Shot Cards Grid (2 cols) */}
                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeScene.shots.map((sh, idx) => {
                      const isCheckedForVideo = selectedVideoShotIds.includes(sh.id);
                      const lockedChar = activeSb.characters.find(
                        (c) => c.id === sh.characterId || c.name.toLowerCase() === sh.characterName.toLowerCase()
                      );
                      return (
                      <div
                        key={sh.id}
                        onClick={() => setSelectedShotId(sh.id)}
                        className={`rounded-xl border overflow-hidden cursor-pointer transition-all ${
                          activeShot?.id === sh.id
                            ? 'border-amber-500 ring-2 ring-amber-500/30'
                            : cardBg
                        }`}
                      >
                        <div className="aspect-video bg-black relative">
                          <img src={sh.imageUrl} alt={`Shot ${sh.shotNumber}`} className="w-full h-full object-cover" />
                          <label
                            onClick={(e) => e.stopPropagation()}
                            className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isCheckedForVideo}
                              onChange={() => toggleShotVideoSelection(sh.id)}
                              className="accent-indigo-500"
                            />
                            <span>Video Queue</span>
                          </label>
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-amber-400 text-[10px] font-mono font-bold">
                            SC {activeScene.sceneNumber} · SHOT {String(sh.shotNumber).padStart(2, '0')}
                          </span>
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-semibold">
                            {sh.cameraAngle}
                          </span>
                          {sh.status === 'video_queued' && (
                            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold">
                              Sent to Video
                            </span>
                          )}
                          {generatingShotId === sh.id && (
                            <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-xs font-mono text-white">
                              Generating via AI Image Studio...
                            </div>
                          )}
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs font-bold line-clamp-2">{sh.action}</div>
                            {lockedChar && (
                              <img
                                src={lockedChar.referenceImageUrl}
                                alt={lockedChar.name}
                                title={`Character Consistency Lock: ${lockedChar.name}`}
                                className="w-7 h-7 rounded-full object-cover border border-amber-500 shrink-0"
                              />
                            )}
                          </div>
                          {sh.dialogue && (
                            <div className="text-[11px] italic text-purple-500 line-clamp-1">"{sh.dialogue}"</div>
                          )}
                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateShotImage(activeScene.id, sh);
                              }}
                              disabled={generatingShotId === sh.id}
                              className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>AI Image</span>
                            </button>
                            <div className="flex items-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); handleMoveShot(activeScene.id, idx, -1); }} className={`p-1 rounded border ${cardBg}`}><ArrowUp className="w-3 h-3" /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleMoveShot(activeScene.id, idx, 1); }} className={`p-1 rounded border ${cardBg}`}><ArrowDown className="w-3 h-3" /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDuplicateShot(activeScene.id, sh); }} className={`p-1 rounded border ${cardBg}`}><Copy className="w-3 h-3" /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteShot(activeScene.id, sh.id); }} className="p-1 rounded border border-red-500/30 text-red-500"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>

                  {/* Shot Inspector Panel (1 col) */}
                  {activeShot && (
                    <div className={`p-4 rounded-xl border space-y-3 h-fit ${cardBg}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-amber-500">
                          Shot {activeShot.shotNumber} Inspector
                        </span>
                        <span className={`text-[10px] font-mono ${mutedText}`}>{activeShot.durationSec}s</span>
                      </div>

                      <div className="space-y-1">
                        <label className={`text-[10px] font-bold uppercase ${mutedText}`}>Camera Angle</label>
                        <select
                          value={activeShot.cameraAngle}
                          onChange={(e) => handleUpdateShot(activeScene.id, activeShot.id, { cameraAngle: e.target.value as ShotCameraType })}
                          className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}
                        >
                          {CAMERA_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      {/* Character Reference Consistency Lock */}
                      <div className="space-y-1.5">
                        <label className={`text-[10px] font-bold uppercase ${mutedText}`}>
                          Character Consistency Reference
                        </label>
                        <select
                          value={activeShot.characterId || ''}
                          onChange={(e) => {
                            const picked = activeSb.characters.find((c) => c.id === e.target.value);
                            handleUpdateShot(activeScene.id, activeShot.id, {
                              characterId: e.target.value || undefined,
                              characterName: picked ? picked.name : activeShot.characterName,
                            });
                          }}
                          className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}
                        >
                          <option value="">Auto-match by character name</option>
                          {activeSb.characters.map((ch) => (
                            <option key={ch.id} value={ch.id}>
                              {ch.name} — {ch.clothing}
                            </option>
                          ))}
                        </select>
                        {(() => {
                          const refChar = activeSb.characters.find(
                            (c) =>
                              c.id === activeShot.characterId ||
                              c.name.toLowerCase() === activeShot.characterName.toLowerCase()
                          );
                          if (!refChar) return null;
                          return (
                            <div className={`p-2 rounded-lg border flex items-center gap-2.5 ${inputBg}`}>
                              <img
                                src={refChar.referenceImageUrl}
                                alt={refChar.name}
                                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-amber-500/40"
                              />
                              <div className="min-w-0 text-[11px]">
                                <div className="font-bold truncate">{refChar.name} (Reference Locked)</div>
                                <div className={`truncate ${mutedText}`}>{refChar.hairstyle} · {refChar.clothing}</div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="space-y-1">
                        <label className={`text-[10px] font-bold uppercase ${mutedText}`}>Character Name</label>
                        <input
                          value={activeShot.characterName}
                          onChange={(e) => handleUpdateShot(activeScene.id, activeShot.id, { characterName: e.target.value })}
                          className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`text-[10px] font-bold uppercase ${mutedText}`}>Visual Action</label>
                        <textarea
                          rows={2}
                          value={activeShot.action}
                          onChange={(e) => handleUpdateShot(activeScene.id, activeShot.id, { action: e.target.value })}
                          className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`text-[10px] font-bold uppercase ${mutedText}`}>Dialogue / Voice Line</label>
                        <textarea
                          rows={2}
                          value={activeShot.dialogue}
                          onChange={(e) => handleUpdateShot(activeScene.id, activeShot.id, { dialogue: e.target.value })}
                          className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`text-[10px] font-bold uppercase ${mutedText}`}>AI Image Generation Prompt</label>
                        <textarea
                          rows={3}
                          value={activeShot.prompt}
                          onChange={(e) => handleUpdateShot(activeScene.id, activeShot.id, { prompt: e.target.value })}
                          className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`text-[10px] font-bold uppercase ${mutedText}`}>Director Notes</label>
                        <input
                          value={activeShot.notes}
                          onChange={(e) => handleUpdateShot(activeScene.id, activeShot.id, { notes: e.target.value })}
                          className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}
                        />
                      </div>

                      <button
                        onClick={() => handleGenerateShotImage(activeScene.id, activeShot)}
                        disabled={generatingShotId === activeShot.id}
                        className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>{generatingShotId === activeShot.id ? 'Generating...' : 'Regenerate Panel via AI Image Studio'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: CHARACTER LIBRARY */}
          {section === 'characters' && activeSb && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold">Storyboard Character Profiles ({activeSb.characters.length})</h2>
                <button
                  onClick={() => onNavigate?.('ai_image')}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold"
                >
                  + Create Character in AI Image Studio
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSb.characters.map((ch) => (
                  <div key={ch.id} className={`p-4 rounded-xl border flex gap-4 ${cardBg}`}>
                    <img src={ch.referenceImageUrl} alt={ch.name} className="w-24 h-24 rounded-xl object-cover shrink-0" />
                    <div className="space-y-1 text-xs">
                      <div className="font-extrabold text-sm">{ch.name}</div>
                      <p className={mutedText}>{ch.description}</p>
                      <div><strong>Clothes:</strong> {ch.clothing}</div>
                      <div><strong>Hair:</strong> {ch.hairstyle}</div>
                      <div><strong>Voice:</strong> {ch.voiceReference}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI IMAGE STUDIO PICKER BRIDGE */}
          {section === 'ai_image_bridge' && activeScene && activeShot && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold">Attach Image from AI Image Studio</h2>
                  <p className={`text-xs ${mutedText}`}>
                    Click any image generated in AI Image Studio to attach it directly to Scene {activeScene.sceneNumber} · Shot {activeShot.shotNumber}.
                  </p>
                </div>
                <button onClick={() => onNavigate?.('ai_image')} className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold">
                  Open AI Image Studio
                </button>
              </div>
              {studioImages.length === 0 ? (
                <div className={`p-8 rounded-xl border border-dashed text-center text-xs ${mutedText}`}>
                  No images in AI Image Studio yet. Generate images there or click "AI Image" on any shot panel.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {studioImages.map((img) => (
                    <button
                      key={img.id}
                      onClick={async () => {
                        await handleUpdateShot(activeScene.id, activeShot.id, {
                          imageUrl: img.url,
                          imageAssetId: img.id,
                          status: 'image_ready',
                        });
                        setSection('shots');
                        showNotice(`Attached "${img.title}" to Shot ${activeShot.shotNumber}.`);
                      }}
                      className={`rounded-xl border overflow-hidden text-left hover:border-purple-500 ${cardBg}`}
                    >
                      <img src={img.url} alt={img.title} className="aspect-video w-full object-cover" />
                      <div className="p-2 text-[11px] font-bold truncate">{img.title}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ANIMATIC PREVIEW */}
          {section === 'preview' && allFlatShots.length > 0 && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold">Storyboard Animatic Preview</h2>
                <button
                  onClick={() => setIsPlayingAnimatic((p) => !p)}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-black text-xs font-bold flex items-center gap-1.5"
                >
                  {isPlayingAnimatic ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlayingAnimatic ? 'Pause Animatic' : 'Play Animatic'}</span>
                </button>
              </div>
              {(() => {
                const curr = allFlatShots[animaticIndex] || allFlatShots[0];
                return (
                  <div className="rounded-2xl overflow-hidden border border-amber-500/40 bg-black">
                    <div className="aspect-video relative">
                      <img src={curr.shot.imageUrl} alt="Animatic" className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-4 text-white">
                        <div className="text-xs font-mono text-amber-400">
                          SCENE {curr.scene.sceneNumber} · SHOT {curr.shot.shotNumber} · {curr.shot.cameraAngle}
                        </div>
                        <div className="text-sm font-bold mt-0.5">{curr.shot.action}</div>
                        {curr.shot.dialogue && <div className="text-xs italic text-slate-200 mt-1">{curr.shot.dialogue}</div>}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* STEP 12: EXPORT STORYBOARD */}
          {section === 'export' && activeSb && (
            <div className="max-w-2xl space-y-4">
              <div>
                <h2 className="text-lg font-extrabold">Export Storyboard Package</h2>
                <p className={`text-xs mt-0.5 ${mutedText}`}>
                  Download printable storyboard sheets, CSV shot lists, screenplay text, or full JSON project backups.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'pdf_html', label: 'Printable Storyboard (PDF / HTML)', desc: 'Visual panel grid ready for Save as PDF' },
                  { id: 'shotlist_csv', label: 'Camera Shot List (.CSV)', desc: 'Scene, shot, camera angle, character, duration' },
                  { id: 'screenplay_txt', label: 'Screenplay Script (.TXT)', desc: 'Formatted scenes, action, and dialogue' },
                  { id: 'json', label: 'Full Storyboard Project (.JSON)', desc: 'Complete data backup for studio import' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleExport(opt.id as any)}
                    className={`p-4 rounded-xl border text-left hover:border-amber-500 space-y-1 ${cardBg}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{opt.label}</span>
                      <Download className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className={`text-[11px] ${mutedText}`}>{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
