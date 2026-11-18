import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  Sparkles,
  Download,
  Film,
  Volume2,
  Camera,
  Flame,
  UserCheck,
  Plus,
  Trash2,
  CheckCircle2,
  Box,
  Layers,
  Wand2,
} from 'lucide-react';
import { FilmProject, StudioModule, StudioTheme } from '../../types';
import { soundFx } from '../../utils/audioSynth';
import { useStudioAi } from '../../context/StudioAiContext';
import {
  STUDIO_ANIMATION_STYLES,
  STUDIO_CHARACTER_LOCKS,
  StudioAnimationStyleId,
  getScenePreset,
} from '../../data/studioAnimationPresets';
import { AnimationProductionHub } from './AnimationProductionHub';
import { AnimationThemeWorkspace } from './AnimationThemeWorkspace';
import { LottieMotionLibrary } from './LottieMotionLibrary';

interface AnimationStudioProps {
  activeFilm: FilmProject;
  theme?: StudioTheme;
  onSendToEditor?: () => void;
  onNavigate?: (module: StudioModule) => void;
}

type DimensionMode = '2D Animation' | '3D Animation' | 'AI Character Animation';
type MovementAction = 'walking' | 'running' | 'fighting' | 'hovering' | 'idle';
type FacialExpression = 'heroic' | 'calm' | 'fierce' | 'sorrow';
type CameraMotion = 'static' | 'dolly_push' | 'pan_sweep' | 'orbit_sway' | 'action_shake';
type EnvironmentPreset = 'ash_embers' | 'lightning_storm' | 'sacred_sunset' | 'celestial_sanctum';

interface AnimActor {
  id: string;
  name: string;
  kind: 'hero_rig' | 'rival_rig' | 'scene_monolith' | 'energy_aura';
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
  accentColor: string;
  action: MovementAction;
  expression: FacialExpression;
}

export const AnimationStudio: React.FC<AnimationStudioProps> = ({
  activeFilm,
  theme = 'elevenlabs',
  onSendToEditor,
  onNavigate,
}) => {
  const { addAssetToTimeline, addQueueItem } = useStudioAi();
  const [workspaceTab, setWorkspaceTab] = useState<'themes' | 'hub' | 'lottie' | 'canvas'>('themes');

  const [sceneSeqNum, setSceneSeqNum] = useState<number>(1);
  const activeScene = useMemo(() => getScenePreset(sceneSeqNum), [sceneSeqNum]);

  const [styleId, setStyleId] = useState<StudioAnimationStyleId>('cinematic_scifi');
  const activeStyle = useMemo(
    () => STUDIO_ANIMATION_STYLES.find((s) => s.id === styleId) || STUDIO_ANIMATION_STYLES[0],
    [styleId]
  );

  const [dimensionMode, setDimensionMode] = useState<DimensionMode>('3D Animation');
  const [fps, setFps] = useState<24 | 30>(24);
  const totalFrames = 72;
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [onionSkin, setOnionSkin] = useState(false);

  const [cameraMotion, setCameraMotion] = useState<CameraMotion>('dolly_push');
  const [environment, setEnvironment] = useState<EnvironmentPreset>('ash_embers');
  const [vfxDensity, setVfxDensity] = useState<number>(75);
  const [auraGlow, setAuraGlow] = useState<number>(80);

  const [lipSyncEnabled, setLipSyncEnabled] = useState(true);
  const [isSpeakingLipSync, setIsSpeakingLipSync] = useState(false);
  const [lipSyncLang, setLipSyncLang] = useState<'kn-IN' | 'en-US'>('kn-IN');
  const [lipSyncText, setLipSyncText] = useState(STUDIO_CHARACTER_LOCKS[0].sampleKannadaLine);

  const [statusNotice, setStatusNotice] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const [actors, setActors] = useState<AnimActor[]>([
    {
      id: 'actor-monolith',
      name: 'Obsidian Energy Pillar',
      kind: 'scene_monolith',
      x: 495,
      y: 205,
      scale: 1.05,
      rotation: 0,
      color: '#f59e0b',
      accentColor: '#38bdf8',
      action: 'idle',
      expression: 'calm',
    },
    {
      id: 'actor-hero',
      name: 'Hero Explorer Rig (Seed Locked)',
      kind: 'hero_rig',
      x: 235,
      y: 235,
      scale: 1.15,
      rotation: 0,
      color: '#38bdf8',
      accentColor: '#f59e0b',
      action: 'walking',
      expression: 'heroic',
    },
    {
      id: 'actor-aura',
      name: 'VFX Resonance Ring',
      kind: 'energy_aura',
      x: 235,
      y: 215,
      scale: 1.1,
      rotation: 0,
      color: '#f59e0b',
      accentColor: '#a855f7',
      action: 'hovering',
      expression: 'calm',
    },
  ]);

  const [selectedActorId, setSelectedActorId] = useState<string>('actor-hero');
  const selectedActor = actors.find((a) => a.id === selectedActorId) || actors[0];

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice((prev) => (prev === msg ? '' : prev)), 5000);
  };

  // Apply scene animation preset
  const handleLoadScenePreset = (num: number) => {
    const ch = getScenePreset(num);
    setSceneSeqNum(ch.sceneNumber);
    setEnvironment(ch.environmentPreset);
    setStyleId(ch.recommendedStyle);
    setActors((prev) =>
      prev.map((a) => {
        if (a.kind === 'hero_rig') {
          const actionMap: Record<number, MovementAction> = {
            1: 'walking',
            2: 'hovering',
            3: 'fighting',
            4: 'running',
          };
          return {
            ...a,
            action: actionMap[ch.sceneNumber] || (ch.sceneNumber % 2 === 0 ? 'fighting' : 'walking'),
          };
        }
        return a;
      })
    );
    soundFx.playScannerBeep();
    showNotice(`Loaded Scene ${ch.sceneNumber}: "${ch.title}" preset.`);
  };

  // Animation playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentFrame((f) => (f + 1) % totalFrames);
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [isPlaying, fps, totalFrames]);

  // Trigger voice & live mouth viseme animation
  const handleSpeakLipSync = () => {
    const text =
      lipSyncText.trim() ||
      (lipSyncLang === 'kn-IN'
        ? STUDIO_CHARACTER_LOCKS[0].sampleKannadaLine
        : STUDIO_CHARACTER_LOCKS[0].sampleEnglishLine);

    setLipSyncEnabled(true);
    setIsSpeakingLipSync(true);
    setIsPlaying(true);

    soundFx.speakDialogue(
      text,
      lipSyncLang,
      0.92,
      0.96,
      () => setIsSpeakingLipSync(false)
    );
    showNotice(`Synchronizing facial rig visemes (${lipSyncLang === 'kn-IN' ? 'Kannada' : 'English'})...`);
  };

  // Draw deterministic frame onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const t = currentFrame / totalFrames;

    // 1. Background sky/environment gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (environment === 'ash_embers') {
      skyGrad.addColorStop(0, '#07060d');
      skyGrad.addColorStop(0.55, '#190f1e');
      skyGrad.addColorStop(1, '#2b1312');
    } else if (environment === 'lightning_storm') {
      skyGrad.addColorStop(0, '#040817');
      skyGrad.addColorStop(0.5, '#0f172a');
      skyGrad.addColorStop(1, '#1e1b4b');
    } else if (environment === 'sacred_sunset') {
      skyGrad.addColorStop(0, '#120824');
      skyGrad.addColorStop(0.52, '#4c1d3d');
      skyGrad.addColorStop(1, '#7c2d12');
    } else {
      skyGrad.addColorStop(0, '#030712');
      skyGrad.addColorStop(0.5, '#11102e');
      skyGrad.addColorStop(1, '#082f49');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Apply Camera Movement transform
    ctx.save();
    let camScale = 1;
    let camTx = 0;
    let camTy = 0;
    if (cameraMotion === 'dolly_push') {
      camScale = 1 + t * 0.12;
      camTx = (w * (1 - camScale)) / 2;
      camTy = (h * (1 - camScale)) / 2;
    } else if (cameraMotion === 'pan_sweep') {
      camTx = Math.sin(t * Math.PI * 2) * 28;
    } else if (cameraMotion === 'orbit_sway') {
      camScale = 1.05 + Math.sin(t * Math.PI * 2) * 0.04;
      camTx = Math.cos(t * Math.PI * 2) * 22 - (w * (camScale - 1)) / 2;
      camTy = Math.sin(t * Math.PI * 2) * 10 - (h * (camScale - 1)) / 2;
    } else if (cameraMotion === 'action_shake') {
      camTx = Math.sin(currentFrame * 2.7) * 5;
      camTy = Math.cos(currentFrame * 3.3) * 4;
    }
    ctx.translate(camTx, camTy);
    ctx.scale(camScale, camScale);

    // 3. Atmospheric Moon / Surya Disc / Nebula
    const sunX = w * 0.72;
    const sunY = h * 0.34;
    const auraRadius = 90 + (auraGlow / 100) * 65;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, auraRadius);
    sunGrad.addColorStop(0, activeStyle.palettePrimary + 'aa');
    sunGrad.addColorStop(0.45, activeStyle.paletteAccent + '33');
    sunGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, auraRadius, 0, Math.PI * 2);
    ctx.fill();

    // Lightning bolts in storm preset
    if (environment === 'lightning_storm' && currentFrame % 18 < 3) {
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.62, 0);
      ctx.lineTo(w * 0.59, 85);
      ctx.lineTo(w * 0.65, 130);
      ctx.lineTo(w * 0.57, 235);
      ctx.stroke();
    }

    // 4. Perspective 3D/2D Ground Horizon Grid
    ctx.fillStyle = 'rgba(5, 8, 17, 0.78)';
    ctx.fillRect(0, h * 0.73, w, h * 0.27);
    ctx.strokeStyle =
      dimensionMode === '2D Animation'
        ? 'rgba(16, 185, 129, 0.22)'
        : 'rgba(139, 92, 246, 0.28)';
    ctx.lineWidth = 1;
    for (let i = -8; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(w / 2 + i * 32, h * 0.73);
      ctx.lineTo(w / 2 + i * 110, h);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, h * 0.73);
    ctx.lineTo(w, h * 0.73);
    ctx.stroke();

    // Anime speedlines overlay
    if (styleId === 'anime') {
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.18)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 14; i++) {
        const ly = ((i * 31 + currentFrame * 9) % h);
        ctx.beginPath();
        ctx.moveTo(0, ly);
        ctx.lineTo(140 + (i % 4) * 35, ly);
        ctx.stroke();
      }
    }

    // 5. Onion Skinning (Previous Frame Ghost)
    if (onionSkin && currentFrame > 0) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      drawSceneActors(ctx, (currentFrame - 1) / totalFrames, true);
      ctx.restore();
    }

    // 6. Active Actors
    drawSceneActors(ctx, t, false);

    // 7. Foreground VFX Particle Engine (Embers / Cosmic Dust)
    const particleCount = Math.round((vfxDensity / 100) * 44);
    for (let i = 0; i < particleCount; i++) {
      const seed = i * 73.13;
      const px = ((seed * 19 + currentFrame * (1.8 + (i % 3))) % (w + 40)) - 20;
      const py = h - ((seed * 11 + currentFrame * (1.4 + (i % 4) * 0.6)) % (h + 20));
      const size = (i % 3) + 1.2;
      ctx.fillStyle = i % 2 === 0 ? activeStyle.palettePrimary : activeStyle.paletteAccent;
      ctx.globalAlpha = 0.45 + Math.sin(t * Math.PI * 2 + i) * 0.35;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }, [
    currentFrame,
    actors,
    onionSkin,
    styleId,
    dimensionMode,
    cameraMotion,
    environment,
    vfxDensity,
    auraGlow,
    lipSyncEnabled,
    isSpeakingLipSync,
    activeStyle,
  ]);

  const drawSceneActors = (ctx: CanvasRenderingContext2D, t: number, isGhost: boolean) => {
    const cycle = t * Math.PI * 4;

    actors.forEach((actor) => {
      ctx.save();

      // Root motion offset based on action
      let dx = 0;
      let dy = 0;
      if (actor.action === 'walking') {
        dx = Math.sin(t * Math.PI * 2) * 38;
        dy = Math.abs(Math.sin(cycle)) * -5;
      } else if (actor.action === 'running') {
        dx = Math.sin(t * Math.PI * 2) * 70;
        dy = Math.abs(Math.sin(cycle * 1.5)) * -10;
      } else if (actor.action === 'fighting') {
        dx = Math.sin(cycle) * 26;
        dy = Math.cos(cycle) * -8;
      } else if (actor.action === 'hovering') {
        dy = Math.sin(t * Math.PI * 2) * 14 - 16;
      } else {
        dy = Math.sin(t * Math.PI * 2) * 2.5;
      }

      ctx.translate(actor.x + dx, actor.y + dy);
      ctx.rotate((actor.rotation * Math.PI) / 180);
      ctx.scale(actor.scale, actor.scale);

      const primary = isGhost ? '#64748b' : actor.color;
      const accent = isGhost ? '#94a3b8' : actor.accentColor;

      if (actor.kind === 'scene_monolith') {
        // Stylized Monolith & rotating ring halo
        if (!isGhost) {
          const halo = ctx.createRadialGradient(0, -35, 6, 0, -35, 72);
          halo.addColorStop(0, accent + '55');
          halo.addColorStop(1, 'transparent');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(0, -35, 72, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = primary;
        ctx.lineWidth = styleId === 'anime' || styleId === 'vector_2d' ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(-26, 68);
        ctx.lineTo(-18, -88);
        ctx.lineTo(0, -108);
        ctx.lineTo(18, -88);
        ctx.lineTo(26, 68);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Rotating orbital ring
        ctx.save();
        ctx.translate(0, -40);
        ctx.rotate(t * Math.PI * 2);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.stroke();
        for (let sp = 0; sp < 8; sp++) {
          const ang = (sp / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(ang) * 26, Math.sin(ang) * 26);
          ctx.stroke();
        }
        ctx.restore();
      } else if (actor.kind === 'energy_aura') {
        // Swirling golden & cyan particle ring
        for (let i = 0; i < 20; i++) {
          const ang = (i / 20) * Math.PI * 2 + t * Math.PI * 2;
          const r = 38 + Math.sin(t * Math.PI * 4 + i) * 10;
          ctx.fillStyle = i % 2 === 0 ? primary : accent;
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * r, Math.sin(ang) * r * 0.65, (i % 3) + 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Articulated Character Rig (Hero or Rival)
        const stride =
          actor.action === 'running'
            ? Math.sin(cycle * 1.5) * 22
            : actor.action === 'walking'
            ? Math.sin(cycle) * 14
            : actor.action === 'fighting'
            ? 14
            : 4;

        // Ground shadow / hover glow
        if (!isGhost && auraGlow > 15) {
          const charGlow = ctx.createRadialGradient(0, -15, 4, 0, -15, 62 * (auraGlow / 100));
          charGlow.addColorStop(0, accent + '44');
          charGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = charGlow;
          ctx.beginPath();
          ctx.arc(0, -15, 62 * (auraGlow / 100), 0, Math.PI * 2);
          ctx.fill();
        }

        // Flowing cloak
        ctx.fillStyle = actor.kind === 'rival_rig' ? '#3b0764' : '#1e1b4b';
        ctx.strokeStyle = primary;
        ctx.lineWidth = styleId === 'anime' || styleId === 'vector_2d' ? 2.5 : 1.2;
        const capeFlutter = Math.sin(cycle) * 8;
        ctx.beginPath();
        ctx.moveTo(-6, -24);
        ctx.quadraticCurveTo(-34 - capeFlutter, 8, -28 - capeFlutter, 44);
        ctx.lineTo(-4, 34);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Legs
        ctx.strokeStyle = primary;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-5, 16);
        ctx.lineTo(-10 + stride, 52);
        ctx.moveTo(5, 16);
        ctx.lineTo(10 - stride, 52);
        ctx.stroke();

        // Armored Torso
        ctx.fillStyle = styleId === 'realistic_3d' || styleId === 'hollywood_3d' ? '#0f172a' : primary;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-14, -24);
        ctx.lineTo(14, -24);
        ctx.lineTo(10, 18);
        ctx.lineTo(-10, 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Chest Energy Core
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(0, -8, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Weapon Arm + Energy Blade
        const swordSwing = actor.action === 'fighting' ? Math.sin(cycle) * 0.9 - 0.5 : -0.35;
        ctx.save();
        ctx.translate(12, -18);
        ctx.rotate(swordSwing);
        ctx.strokeStyle = primary;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(18, 8);
        ctx.stroke();

        // Glowing Prop Blade
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(18, 8);
        ctx.lineTo(48, -22);
        ctx.stroke();
        ctx.restore();

        // Off-hand arm
        ctx.strokeStyle = primary;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-12, -18);
        ctx.lineTo(-22 - stride * 0.4, 8);
        ctx.stroke();

        // Head & Helmet
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = primary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -40, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Visor / Helmet crest
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        if (actor.kind === 'rival_rig') {
          ctx.moveTo(-10, -50);
          ctx.lineTo(-16, -64);
          ctx.moveTo(10, -50);
          ctx.lineTo(16, -64);
        } else {
          ctx.moveTo(-9, -51);
          ctx.lineTo(0, -64);
          ctx.lineTo(9, -51);
        }
        ctx.stroke();

        // Eyes based on Expression
        ctx.fillStyle = accent;
        const eyeH = actor.expression === 'calm' ? 1.5 : 2.8;
        ctx.fillRect(-6, -43, 4, eyeH);
        ctx.fillRect(2, -43, 4, eyeH);

        // Eyebrow angle for expression
        ctx.strokeStyle = primary;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        if (actor.expression === 'fierce' || actor.expression === 'heroic') {
          ctx.moveTo(-8, -47);
          ctx.lineTo(-2, -45);
          ctx.moveTo(8, -47);
          ctx.lineTo(2, -45);
        } else if (actor.expression === 'sorrow') {
          ctx.moveTo(-8, -45);
          ctx.lineTo(-2, -47);
          ctx.moveTo(8, -45);
          ctx.lineTo(2, -47);
        } else {
          ctx.moveTo(-7, -46);
          ctx.lineTo(-2, -46);
          ctx.moveTo(2, -46);
          ctx.lineTo(7, -46);
        }
        ctx.stroke();

        // Animated Lip-Sync Mouth Viseme
        const mouthOpen =
          lipSyncEnabled && (isSpeakingLipSync || isPlaying)
            ? Math.max(1.5, Math.abs(Math.sin(currentFrame * 0.9)) * 5.5)
            : 1.5;
        ctx.fillStyle = isSpeakingLipSync ? '#fde047' : '#cbd5e1';
        ctx.beginPath();
        ctx.ellipse(0, -33, 4.2, mouthOpen * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  };

  const handleAddActor = (kind: AnimActor['kind']) => {
    soundFx.playShutterSound();
    const labelMap: Record<AnimActor['kind'], string> = {
      hero_rig: 'Hero Character Rig',
      rival_rig: 'Antagonist Rig',
      scene_monolith: 'Obsidian Obelisk',
      energy_aura: 'VFX Resonance Ring',
    };
    const newActor: AnimActor = {
      id: `actor-${Date.now()}`,
      name: labelMap[kind],
      kind,
      x: 180 + Math.round(Math.random() * 280),
      y: 190 + Math.round(Math.random() * 60),
      scale: 1.0,
      rotation: 0,
      color: kind === 'rival_rig' ? '#ef4444' : kind === 'scene_monolith' ? '#f59e0b' : '#38bdf8',
      accentColor: kind === 'rival_rig' ? '#a855f7' : '#f59e0b',
      action: kind === 'rival_rig' ? 'fighting' : 'walking',
      expression: kind === 'rival_rig' ? 'fierce' : 'heroic',
    };
    setActors((prev) => [...prev, newActor]);
    setSelectedActorId(newActor.id);
    showNotice(`Added "${newActor.name}" to animation stage.`);
  };

  const handleRemoveActor = (id: string) => {
    if (actors.length <= 1) return;
    setActors((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (selectedActorId === id && next[0]) {
        setSelectedActorId(next[0].id);
      }
      return next;
    });
  };

  // Send rendered animation scene to Video Editor Track V1/V2
  const handleSendSceneToEditor = () => {
    const canvas = canvasRef.current;
    const frameDataUrl = canvas ? canvas.toDataURL('image/png') : activeScene.previewImage;
    soundFx.playCinematicImpact();

    addAssetToTimeline({
      id: `anim-sc${sceneSeqNum}-${Date.now()}`,
      name: `Sc${sceneSeqNum}_${activeStyle.shortLabel}_Animation.mov`,
      category: 'animation',
      subcategory: dimensionMode,
      source: 'ai_generated',
      format: 'ProRes 4444',
      size: '340 MB',
      duration: '00:08',
      resolution: '3840x2160',
      thumbnail: frameDataUrl,
      mediaUrl: frameDataUrl,
      description: `${activeScene.title} (${activeStyle.label}) animated keyframe sequence`,
      tags: [activeFilm.title, `Scene ${sceneSeqNum}`, activeStyle.shortLabel],
      license: {
        type: 'Studio Master Proprietary',
        commercialUse: true,
        attribution: 'Film & Video Studio Ultimate',
        certificateId: `FVS-ANIM-${sceneSeqNum}`,
        verified: true,
      },
      specs: { codec: 'ProRes 4444', fps },
      isFavorite: true,
      addedAt: new Date().toISOString().split('T')[0],
      usageCount: 1,
    });

    addQueueItem({
      tool: 'Animation Studio',
      prompt: `Scene ${sceneSeqNum} ${activeScene.title} · ${activeStyle.label} (${dimensionMode})`,
      provider: activeStyle.renderEngine,
      status: 'Completed',
      progress: 100,
    });

    showNotice(`Sent Scene ${sceneSeqNum} animated sequence to Video Editor timeline.`);
    if (onSendToEditor) {
      onSendToEditor();
    }
  };

  // Export WebM animated clip or PNG snapshot
  const handleExportAnimationClip = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    soundFx.playShutterSound();
    setIsExporting(true);
    setIsPlaying(true);

    try {
      const streamFn = (canvas as any).captureStream;
      if (typeof streamFn === 'function' && typeof MediaRecorder !== 'undefined') {
        const stream = streamFn.call(canvas, fps);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Scene_${sceneSeqNum}_${activeStyle.id}_${fps}fps.webm`;
          a.click();
          URL.revokeObjectURL(url);
          setIsExporting(false);
          showNotice(`Exported animated WebM clip (${fps} FPS, ${activeStyle.shortLabel}).`);
        };
        recorder.start();
        setTimeout(() => {
          if (recorder.state !== 'inactive') recorder.stop();
        }, 2500);
        return;
      }
    } catch {
      // Fallback to PNG frame download
    }

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `Scene_${sceneSeqNum}_Frame${currentFrame}.png`;
    link.click();
    setIsExporting(false);
    showNotice('Exported high-resolution animation keyframe PNG.');
  };

  if (workspaceTab === 'themes' || workspaceTab === 'hub' || workspaceTab === 'lottie') {
    return (
      <div className={`flex-1 flex flex-col overflow-hidden ${theme === 'elevenlabs' ? 'bg-white text-neutral-900' : 'bg-[#07090e] text-slate-100'}`}>
        <div className={`px-6 py-2.5 border-b flex flex-wrap items-center gap-2 shrink-0 ${theme === 'elevenlabs' ? 'bg-[#FAFAFB] border-neutral-200' : 'bg-slate-900 border-slate-800'}`}>
          <button
            onClick={() => setWorkspaceTab('themes')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border ${
              workspaceTab === 'themes'
                ? 'bg-purple-600 text-white border-purple-600'
                : theme === 'elevenlabs'
                ? 'bg-white border-neutral-200 text-neutral-700'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            12 Themes & Project Workspace
          </button>
          <button
            onClick={() => setWorkspaceTab('hub')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border ${
              workspaceTab === 'hub'
                ? 'bg-purple-600 text-white border-purple-600'
                : theme === 'elevenlabs'
                ? 'bg-white border-neutral-200 text-neutral-700'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            6-Studio Production Hub
          </button>
          <button
            onClick={() => setWorkspaceTab('lottie')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border ${
              workspaceTab === 'lottie'
                ? 'bg-purple-600 text-white border-purple-600'
                : theme === 'elevenlabs'
                ? 'bg-white border-neutral-200 text-neutral-700'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            Lottie Icons & Motion GFX
          </button>
          <button
            onClick={() => setWorkspaceTab('canvas')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border ${theme === 'elevenlabs' ? 'bg-white border-neutral-200 text-neutral-700' : 'bg-slate-950 border-slate-800 text-slate-300'}`}
          >
            2D / 3D Interactive Rig & Keyframe Canvas
          </button>
        </div>
        {workspaceTab === 'themes' ? (
          <AnimationThemeWorkspace activeFilm={activeFilm} onNavigate={onNavigate} />
        ) : workspaceTab === 'lottie' ? (
          <LottieMotionLibrary
            activeFilm={activeFilm}
            theme={theme}
            onSendToEditor={onSendToEditor}
            onNavigate={onNavigate}
          />
        ) : (
          <AnimationProductionHub
            activeFilm={activeFilm}
            theme={theme}
            onNavigate={onNavigate}
            onOpenCanvasEditor={() => setWorkspaceTab('canvas')}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#07090e] text-slate-100">
      <div className="px-5 py-2 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center gap-2 shrink-0">
        <button
          onClick={() => setWorkspaceTab('themes')}
          className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
        >
          12 Themes & Project Workspace
        </button>
        <button
          onClick={() => setWorkspaceTab('hub')}
          className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
        >
          6-Studio Production Hub
        </button>
        <button
          onClick={() => setWorkspaceTab('lottie')}
          className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
        >
          Lottie Icons & Motion GFX
        </button>
        <button
          onClick={() => setWorkspaceTab('canvas')}
          className="px-3.5 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold"
        >
          2D / 3D Interactive Rig & Keyframe Canvas
        </button>
      </div>
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#07090e] text-slate-100">
      {/* Main Canvas Stage & Controls */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 lg:p-5 space-y-4">
        {/* Top Studio Bar: Style Selector + Dimension Mode + Scene Loader */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>2D / 3D / AI Character Animation Studio</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Project: {activeFilm.title} · Sc.{activeScene.sceneNumber} ({activeScene.title}) · {activeStyle.renderEngine}
              </p>
            </div>

            {/* Scene Preset Selector */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-mono-cinema uppercase text-slate-400">Scene Preset</label>
              <select
                value={sceneSeqNum}
                onChange={(e) => handleLoadScenePreset(Number(e.target.value))}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono outline-none"
              >
                <option value={1}>Sc. 1 – Basalt Valley Discovery</option>
                <option value={2}>Sc. 2 – Neon Crossing Protocol</option>
                <option value={3}>Sc. 3 – Soundstage Master Setup</option>
                <option value={4}>Sc. 4 – Celestial Core Resonance</option>
              </select>
            </div>
          </div>

          {/* All 5 Selectable Styles + 2D/3D/AI Pipeline Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
            <div className="flex flex-wrap items-center gap-1.5">
              {STUDIO_ANIMATION_STYLES.map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    soundFx.playScannerBeep();
                    setStyleId(st.id);
                    if (st.id === 'vector_2d') setDimensionMode('2D Animation');
                    else if (st.id === 'anime') setDimensionMode('AI Character Animation');
                    else setDimensionMode('3D Animation');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                    styleId === st.id
                      ? 'bg-purple-600/25 border-purple-400 text-purple-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {(['2D Animation', '3D Animation', 'AI Character Animation'] as DimensionMode[]).map((dm) => (
                <button
                  key={dm}
                  onClick={() => setDimensionMode(dm)}
                  className={`px-2 py-1 rounded text-[10px] font-mono-cinema transition-colors ${
                    dimensionMode === dm
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {dm}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status Toast Banner */}
        {statusNotice && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Canvas Viewport */}
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-3xl border border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-black">
            <canvas
              ref={canvasRef}
              width={720}
              height={405}
              className="w-full aspect-[16/9] block cursor-crosshair"
            />

            {/* Top HUD */}
            <div className="absolute top-2.5 inset-x-3 flex items-center justify-between text-[11px] font-mono-cinema pointer-events-none">
              <span className="bg-black/75 px-2.5 py-1 rounded text-amber-300 border border-amber-500/30">
                SC.{activeScene.sceneNumber} · FRAME {String(currentFrame).padStart(2, '0')} / {totalFrames} · {fps} FPS
              </span>
              <span className="bg-black/75 px-2.5 py-1 rounded text-cyan-300 border border-cyan-500/30">
                {activeStyle.shortLabel.toUpperCase()} · {dimensionMode.toUpperCase()}
              </span>
            </div>

            {/* Bottom Lip-Sync Subtitle Preview when active */}
            {lipSyncEnabled && (
              <div className="absolute bottom-3 inset-x-6 text-center pointer-events-none">
                <span className="inline-block bg-black/80 px-3 py-1 rounded text-xs text-slate-100 border border-white/10">
                  {lipSyncText}
                </span>
              </div>
            )}
          </div>

          {/* Scrubber, Transport & Export Bar */}
          <div className="w-full max-w-3xl mt-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundFx.playScannerBeep();
                    setIsPlaying(!isPlaying);
                  }}
                  className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition-transform active:scale-95"
                  title={isPlaying ? 'Pause Animation' : 'Play Animation'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                <button
                  onClick={() => setCurrentFrame(0)}
                  className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300"
                  title="Rewind to Frame 0"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {([24, 30] as const).map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setFps(rate)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        fps === rate ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
                      }`}
                    >
                      {rate} FPS
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setOnionSkin(!onionSkin)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono border transition-colors ${
                    onionSkin
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Onion Skin</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportAnimationClip}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isExporting ? 'Recording 2.5s WebM...' : 'Export Animated Clip'}</span>
                </button>

                <button
                  onClick={handleSendSceneToEditor}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/25"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Send Scene to Video Editor</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-slate-400">KEYFRAME</span>
              <input
                type="range"
                min={0}
                max={totalFrames - 1}
                value={currentFrame}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentFrame(parseInt(e.target.value, 10));
                }}
                className="flex-1 accent-purple-500 cursor-pointer"
              />
              <span className="text-[11px] font-mono text-amber-300 w-14 text-right">
                {currentFrame}/{totalFrames}
              </span>
            </div>
          </div>

          {/* Environment, Camera & Lip-Sync Quick Console */}
          <div className="w-full max-w-3xl mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Environment & Camera Movement */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2.5">
              <div className="text-[11px] font-mono-cinema uppercase text-cyan-400 font-bold flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span>Camera, Environment & VFX</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Camera Movement</label>
                  <select
                    value={cameraMotion}
                    onChange={(e) => setCameraMotion(e.target.value as CameraMotion)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200 outline-none"
                  >
                    <option value="dolly_push">Slow Dolly Push-In</option>
                    <option value="pan_sweep">Panoramic Pan Sweep</option>
                    <option value="orbit_sway">Hero Orbit Sway</option>
                    <option value="action_shake">Action Impact Shake</option>
                    <option value="static">Static Tripod</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Environment Stage</label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value as EnvironmentPreset)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200 outline-none"
                  >
                    <option value="ash_embers">Volcanic Ash &amp; Embers</option>
                    <option value="lightning_storm">Atmospheric Lightning Storm</option>
                    <option value="sacred_sunset">Golden Horizon Sunset</option>
                    <option value="celestial_sanctum">Cosmic Sanctum Nebula</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[10px] font-mono text-slate-400">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>VFX PARTICLES</span>
                    <span className="text-amber-300">{vfxDensity}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={vfxDensity}
                    onChange={(e) => setVfxDensity(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>AMBIENT AURA GLOW</span>
                    <span className="text-cyan-300">{auraGlow}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={auraGlow}
                    onChange={(e) => setAuraGlow(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Facial Lip-Sync & Voice Driver */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono-cinema uppercase text-amber-400 font-bold flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Facial Animation & Lip-Sync</span>
                </span>
                <div className="flex items-center gap-1">
                  {(['kn-IN', 'en-US'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLipSyncLang(lang);
                        setLipSyncText(
                          lang === 'kn-IN'
                            ? STUDIO_CHARACTER_LOCKS[0].sampleKannadaLine
                            : STUDIO_CHARACTER_LOCKS[0].sampleEnglishLine
                        );
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                        lipSyncLang === lang
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {lang === 'kn-IN' ? 'Kannada' : 'English'}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                value={lipSyncText}
                onChange={(e) => setLipSyncText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500"
                placeholder="Dialogue line for viseme lip-sync..."
              />

              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lipSyncEnabled}
                    onChange={(e) => setLipSyncEnabled(e.target.checked)}
                    className="accent-amber-500"
                  />
                  <span>Animate Mouth Visemes</span>
                </label>
                <button
                  onClick={handleSpeakLipSync}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>{isSpeakingLipSync ? 'Speaking...' : 'Speak & Lip-Sync'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Character Rigging, Movements & Expressions */}
      <div className="w-full lg:w-80 bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto space-y-5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono-cinema flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Character Rig & Actions</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Consistent character movement, expressions &amp; transforms
          </p>
        </div>

        {/* Add Character / Prop Buttons */}
        <div className="space-y-2">
          <label className="text-[10px] text-slate-400 uppercase font-mono-cinema block">
            Add Animated Rig / VFX
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleAddActor('hero_rig')}
              className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[11px] text-cyan-300 flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" /> Hero Rig
            </button>
            <button
              onClick={() => handleAddActor('rival_rig')}
              className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[11px] text-rose-300 flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" /> Antagonist Rig
            </button>
            <button
              onClick={() => handleAddActor('scene_monolith')}
              className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[11px] text-amber-300 flex items-center justify-center gap-1"
            >
              <Box className="w-3 h-3" /> Scene Obelisk
            </button>
            <button
              onClick={() => handleAddActor('energy_aura')}
              className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[11px] text-purple-300 flex items-center justify-center gap-1"
            >
              <Flame className="w-3 h-3" /> VFX Ring
            </button>
          </div>
        </div>

        {/* Active Stage Layer List */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 uppercase font-mono-cinema block">
            Stage Layers ({actors.length})
          </label>
          <div className="space-y-1">
            {actors.map((act) => (
              <div
                key={act.id}
                onClick={() => setSelectedActorId(act.id)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                  selectedActorId === act.id
                    ? 'bg-purple-600/20 border-purple-500/50 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="truncate font-medium">{act.name}</span>
                {actors.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveActor(act.id);
                    }}
                    className="text-slate-500 hover:text-rose-400 p-0.5"
                    title="Remove actor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Actor Inspector */}
        {selectedActor && (
          <div className="space-y-3.5 pt-3 border-t border-slate-800 text-xs">
            <div className="font-bold text-white flex items-center justify-between">
              <span className="truncate">{selectedActor.name}</span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Locked
              </span>
            </div>

            {/* Movement Action */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-mono-cinema block mb-1.5">
                Character Movement
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    { id: 'walking', label: 'Walking' },
                    { id: 'running', label: 'Running' },
                    { id: 'fighting', label: 'Fighting' },
                    { id: 'hovering', label: 'Hover' },
                    { id: 'idle', label: 'Idle' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() =>
                      setActors((prev) =>
                        prev.map((a) => (a.id === selectedActor.id ? { ...a, action: m.id } : a))
                      )
                    }
                    className={`py-1 rounded text-[11px] font-medium border ${
                      selectedActor.action === m.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Facial Expression */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-mono-cinema block mb-1.5">
                Facial Expression
              </label>
              <div className="grid grid-cols-2 gap-1">
                {(
                  [
                    { id: 'heroic', label: 'Heroic / Resolve' },
                    { id: 'fierce', label: 'Fierce / Battle' },
                    { id: 'calm', label: 'Calm / Serene' },
                    { id: 'sorrow', label: 'Sorrow / Mercy' },
                  ] as const
                ).map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() =>
                      setActors((prev) =>
                        prev.map((a) => (a.id === selectedActor.id ? { ...a, expression: ex.id } : a))
                      )
                    }
                    className={`py-1 px-2 rounded text-[11px] border ${
                      selectedActor.expression === ex.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale, Rotation, X, Y Sliders */}
            <div className="space-y-2.5 pt-1">
              <div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>SCALE</span>
                  <span>{selectedActor.scale.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.2}
                  step={0.05}
                  value={selectedActor.scale}
                  onChange={(e) => {
                    const scale = parseFloat(e.target.value);
                    setActors((prev) =>
                      prev.map((a) => (a.id === selectedActor.id ? { ...a, scale } : a))
                    );
                  }}
                  className="w-full accent-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>ROTATION</span>
                  <span>{selectedActor.rotation}°</span>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={selectedActor.rotation}
                  onChange={(e) => {
                    const rotation = parseInt(e.target.value, 10);
                    setActors((prev) =>
                      prev.map((a) => (a.id === selectedActor.id ? { ...a, rotation } : a))
                    );
                  }}
                  className="w-full accent-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">POS X ({selectedActor.x})</span>
                  <input
                    type="range"
                    min={60}
                    max={660}
                    value={selectedActor.x}
                    onChange={(e) => {
                      const x = parseInt(e.target.value, 10);
                      setActors((prev) =>
                        prev.map((a) => (a.id === selectedActor.id ? { ...a, x } : a))
                      );
                    }}
                    className="w-full accent-cyan-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">POS Y ({selectedActor.y})</span>
                  <input
                    type="range"
                    min={80}
                    max={340}
                    value={selectedActor.y}
                    onChange={(e) => {
                      const y = parseInt(e.target.value, 10);
                      setActors((prev) =>
                        prev.map((a) => (a.id === selectedActor.id ? { ...a, y } : a))
                      );
                    }}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};
