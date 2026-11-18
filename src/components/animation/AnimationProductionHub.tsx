import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Film,
  Clapperboard,
  Image as ImageIcon,
  Users,
  BookOpen,
  Mic2,
  Music,
  Flame,
  Download,
  Play,
  Plus,
  CheckCircle2,
  AlertCircle,
  Layers,
  Wand2,
  FolderOpen,
} from 'lucide-react';
import { FilmProject, StudioModule, StudioTheme } from '../../types';
import { useStudioAi } from '../../context/StudioAiContext';
import { soundFx } from '../../utils/audioSynth';

interface AnimationClipItem {
  id: string;
  sceneId: string;
  shotId?: string;
  title: string;
  prompt: string;
  sourceImageUrl: string;
  characterName?: string;
  motionAction: string;
  cameraMovement: string;
  vfxPreset: string;
  lipSyncText?: string;
  durationSec: number;
  status: string;
}

interface AnimationProjectRecord {
  id: string;
  projectId: string;
  title: string;
  animationType: string;
  storyPrompt: string;
  style: string;
  fps: number;
  resolution: '720p' | '1080p' | '2K' | '4K';
  storyboardId?: string;
  clips: AnimationClipItem[];
  audioTracks: {
    dialogue: string[];
    narration: string[];
    music: string[];
    sfx: string[];
    environment: string[];
  };
  vfxLayers: string[];
  lastRenderUrl?: string;
  lastRenderFormat?: string;
}

interface AnimationJobRecord {
  id: string;
  job_id?: string;
  kind: string;
  status: string;
  message: string;
  outputUrl?: string;
  createdAt: string;
}

interface AnimationProductionHubProps {
  activeFilm: FilmProject;
  theme?: StudioTheme;
  onNavigate?: (module: StudioModule) => void;
  onOpenCanvasEditor: () => void;
}

const ANIMATION_TYPES = [
  '2D Animation',
  '3D Animation',
  'Anime',
  'Manhwa Animation',
  'Cartoon',
  'Realistic Animation',
  'Motion Graphics',
];

const MOTION_PRESETS = ['Walking', 'Running', 'Jumping', 'Dancing', 'Fighting', 'Hand Gestures', 'Head Movement', 'Facial Expressions'];
const VFX_PRESETS = ['Fire', 'Smoke', 'Rain', 'Snow', 'Lightning', 'Magic Effects', 'Explosions', 'Glow', 'Motion Blur', 'Camera Shake'];

export const AnimationProductionHub: React.FC<AnimationProductionHubProps> = ({
  activeFilm,
  theme = 'elevenlabs',
  onNavigate,
  onOpenCanvasEditor,
}) => {
  const { addAssetToTimeline } = useStudioAi();
  const isLight = theme === 'elevenlabs';

  const [projects, setProjects] = useState<AnimationProjectRecord[]>([]);
  const [activeProj, setActiveProj] = useState<AnimationProjectRecord | null>(null);
  const [jobs, setJobs] = useState<AnimationJobRecord[]>([]);
  const [storyboards, setStoryboards] = useState<Array<{ id: string; title: string; scenes: any[] }>>([]);

  // AI Animation Generator form
  const [prompt, setPrompt] = useState(
    'A young anime warrior walking across an ancient fantasy kingdom bridge as golden clouds drift overhead, cinematic anime lighting'
  );
  const [animStyle, setAnimStyle] = useState('Anime');
  const [durationSec, setDurationSec] = useState(10);
  const [exportFormat, setExportFormat] = useState<'MP4' | 'MOV' | 'WebM' | 'GIF'>('MP4');
  const [exportRes, setExportRes] = useState<'720p' | '1080p' | '2K' | '4K'>('1080p');

  const [isLoading, setIsLoading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [notice, setNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  const fetchAll = async () => {
    try {
      const [animRes, sbRes] = await Promise.all([
        fetch('/api/animation/projects'),
        fetch('/api/storyboards'),
      ]);
      const animData = await animRes.json();
      if (animData.success) {
        setProjects(animData.projects || []);
        setJobs(animData.jobs || []);
        if (!activeProj && animData.projects?.length > 0) {
          setActiveProj(animData.projects[0]);
        }
      }
      const sbData = await sbRes.json();
      if (sbData.success) {
        setStoryboards(sbData.storyboards || []);
      }
    } catch {
      // ignore initial error
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleGenerateAnimationClip = async () => {
    if (!prompt.trim()) {
      setErrorMsg('Enter an animation prompt first.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    soundFx.playScannerBeep();
    try {
      const res = await fetch('/api/animation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animationProjectId: activeProj?.id,
          project_name: activeProj?.title || activeFilm.title,
          prompt,
          animation_style: animStyle,
          duration_seconds: Number(durationSec),
          aspect_ratio: '16:9',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Animation job failed.');
      soundFx.playCinematicImpact();
      if (data.project) {
        setActiveProj(data.project);
        setProjects((prev) => [data.project, ...prev.filter((p) => p.id !== data.project.id)]);
      }
      if (data.job) {
        setJobs((prev) => [data.job, ...prev]);
      }
      showNotice(`Animation job ${data.job?.job_id || ''} created & added to Animation Timeline.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Animation generation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportStoryboard = async (storyboardId: string) => {
    if (!activeProj || !storyboardId) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/animation/storyboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animationProjectId: activeProj.id, storyboardId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Import failed.');
      setActiveProj(data.project);
      showNotice(`Imported ${data.importedCount} shots from Storyboard Studio into Animation Clips.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to import storyboard.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyMotion = async (clipId: string, motionAction: string) => {
    if (!activeProj) return;
    const res = await fetch('/api/animation/motion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ animationProjectId: activeProj.id, clipId, motionAction }),
    });
    const data = await res.json();
    if (data.success && data.project) {
      setActiveProj(data.project);
      showNotice(`Applied "${motionAction}" motion preset.`);
    }
  };

  const handleToggleVfx = async (vfx: string) => {
    if (!activeProj) return;
    const exists = activeProj.vfxLayers.includes(vfx);
    const nextVfx = exists
      ? activeProj.vfxLayers.filter((v) => v !== vfx)
      : [...activeProj.vfxLayers, vfx];
    const res = await fetch('/api/animation/audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ animationProjectId: activeProj.id, vfxLayers: nextVfx }),
    });
    const data = await res.json();
    if (data.success && data.project) {
      setActiveProj(data.project);
    }
  };

  const handleRenderExport = async () => {
    if (!activeProj) return;
    setIsRendering(true);
    setErrorMsg('');
    soundFx.playScannerBeep();
    try {
      const res = await fetch('/api/animation/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animationProjectId: activeProj.id,
          format: exportFormat,
          resolution: exportRes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'FFmpeg render failed.');
      soundFx.playCinematicImpact();
      setActiveProj(data.project);
      if (data.job) setJobs((prev) => [data.job, ...prev]);
      showNotice(`Rendered ${exportRes} ${exportFormat} via FFmpeg & saved to Unified Media Library!`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Render failed.');
    } finally {
      setIsRendering(false);
    }
  };

  const handleSendToVideoTimeline = () => {
    if (!activeProj) return;
    soundFx.playShutterSound();
    addAssetToTimeline({
      id: activeProj.id,
      name: `${activeProj.title} (${activeProj.animationType})`,
      category: 'animation',
      subcategory: 'Animation Studio Clip',
      source: 'ai_generated',
      format: 'MP4',
      size: `${activeProj.clips.length} clips`,
      thumbnail: activeProj.clips[0]?.sourceImageUrl || '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
      url: activeProj.lastRenderUrl || activeProj.clips[0]?.sourceImageUrl || '',
      description: activeProj.storyPrompt,
      tags: ['Animation Studio', activeProj.animationType],
      addedAt: new Date().toISOString().split('T')[0],
      projectId: activeProj.projectId,
      projectName: activeProj.title,
      timelineTrack: 'Video',
    } as any);
    showNotice('Sent animation sequence to Video Timeline Editor.');
    onNavigate?.('editor');
  };

  const cardBg = isLight ? 'bg-white border-neutral-200 text-neutral-900' : 'bg-[#111625] border-slate-800 text-slate-100';
  const inputBg = isLight ? 'bg-neutral-50 border-neutral-300 text-neutral-900' : 'bg-slate-950 border-slate-800 text-white';
  const mutedText = isLight ? 'text-neutral-500' : 'text-slate-400';

  const connectedStudios: Array<{ mod: StudioModule; label: string; desc: string; icon: React.ElementType; color: string }> = [
    { mod: 'storyboard', label: 'Storyboard Studio', desc: 'Import scenes, shots & panels', icon: Clapperboard, color: 'text-amber-500' },
    { mod: 'ai_image', label: 'AI Image Studio', desc: 'Generate characters & backgrounds', icon: ImageIcon, color: 'text-purple-500' },
    { mod: 'character', label: 'Character Studio', desc: 'Reuse locked character designs', icon: Users, color: 'text-indigo-500' },
    { mod: 'manhwa_studio', label: 'Manhwa Studio', desc: 'Import & animate comic panels', icon: BookOpen, color: 'text-rose-500' },
    { mod: 'editor', label: 'Video Studio', desc: 'Arrange clips in master timeline', icon: Film, color: 'text-cyan-500' },
    { mod: 'ai_voice', label: 'Voice & Audio Studio', desc: 'Dialogue, lip-sync, music & SFX', icon: Mic2, color: 'text-emerald-500' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header & Shared Project Identity Bar */}
      <div className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${cardBg}`}>
        <div>
          <div className="flex items-center gap-2 text-purple-500 text-xs font-extrabold uppercase tracking-wider">
            <Film className="w-4 h-4" />
            <span>Animation Studio — 6-Studio Unified Production Hub</span>
          </div>
          <h1 className="text-xl font-extrabold mt-1">
            {activeProj?.title || activeFilm.title}
          </h1>
          <p className={`text-xs font-mono mt-0.5 ${mutedText}`}>
            project_id: {activeFilm.id} · animation_id: {activeProj?.id || 'initializing'} · storyboard_id: {activeProj?.storyboardId || 'none'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenCanvasEditor}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Open 2D/3D Rig & Canvas</span>
          </button>
          <button
            onClick={handleSendToVideoTimeline}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5"
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span>Send to Video Timeline</span>
          </button>
        </div>
      </div>

      {(errorMsg || notice) && (
        <div>
          {errorMsg && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}
          {notice && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{notice}</span>
            </div>
          )}
        </div>
      )}

      {/* 6 Connected Studios Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {connectedStudios.map((st) => {
          const Icon = st.icon;
          return (
            <button
              key={st.mod}
              onClick={() => onNavigate?.(st.mod)}
              className={`p-3 rounded-xl border text-left hover:border-purple-500 transition-all space-y-1 ${cardBg}`}
            >
              <Icon className={`w-4 h-4 ${st.color}`} />
              <div className="text-xs font-bold">{st.label}</div>
              <div className={`text-[10px] leading-snug ${mutedText}`}>{st.desc}</div>
            </button>
          );
        })}
      </div>

      {/* AI Animation Generator + Storyboard Import */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className={`lg:col-span-2 p-5 rounded-2xl border space-y-4 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>AI Animation Generator</span>
            </h2>
            <span className={`text-[11px] font-mono ${mutedText}`}>POST /api/animation/generate</span>
          </div>

          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your animated film scene, character movement, camera motion..."
            className={`w-full rounded-xl border p-3 text-xs outline-none ${inputBg}`}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase ${mutedText}`}>Animation Type</label>
              <select value={animStyle} onChange={(e) => setAnimStyle(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}>
                {ANIMATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase ${mutedText}`}>Duration</label>
              <select value={durationSec} onChange={(e) => setDurationSec(Number(e.target.value))} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}>
                <option value={10}>10 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={120}>2 minutes</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                disabled={isLoading}
                onClick={handleGenerateAnimationClip}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold disabled:opacity-50"
              >
                {isLoading ? 'Submitting...' : 'Generate Animation'}
              </button>
            </div>
          </div>

          {/* Import Storyboard */}
          {storyboards.length > 0 && (
            <div className="pt-3 border-t border-neutral-200/20 flex flex-wrap items-center justify-between gap-2">
              <span className={`text-xs font-semibold ${mutedText}`}>
                Import scenes & shots directly from Storyboard Studio:
              </span>
              <div className="flex flex-wrap gap-2">
                {storyboards.slice(0, 3).map((sb) => (
                  <button
                    key={sb.id}
                    onClick={() => handleImportStoryboard(sb.id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold hover:border-amber-500 ${cardBg}`}
                  >
                    + Import "{sb.title}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Render & Export Card (Step 15) */}
        <div className={`p-5 rounded-2xl border space-y-4 ${cardBg}`}>
          <h2 className="text-sm font-extrabold flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-500" />
            <span>Render & Export (FFmpeg)</span>
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase ${mutedText}`}>Format</label>
              <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as any)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}>
                <option value="MP4">MP4 (H.264)</option>
                <option value="MOV">MOV</option>
                <option value="WebM">WebM</option>
                <option value="GIF">GIF</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase ${mutedText}`}>Resolution</label>
              <select value={exportRes} onChange={(e) => setExportRes(e.target.value as any)} className={`w-full rounded-lg border p-2 text-xs ${inputBg}`}>
                <option value="720p">720p HD</option>
                <option value="1080p">1080p Full HD</option>
                <option value="2K">2K Cinema</option>
                <option value="4K">4K Ultra HD</option>
              </select>
            </div>
          </div>

          <button
            disabled={isRendering || !activeProj}
            onClick={handleRenderExport}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isRendering ? 'Rendering via FFmpeg...' : `Render ${exportRes} ${exportFormat}`}</span>
          </button>

          {activeProj?.lastRenderUrl && (
            <a
              href={activeProj.lastRenderUrl}
              download
              className="w-full py-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-500 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Rendered {activeProj.lastRenderFormat || 'MP4'}</span>
            </a>
          )}
        </div>
      </div>

      {/* Multi-Track Animation Timeline & VFX Layers (Steps 10–14) */}
      {activeProj && (
        <div className={`p-5 rounded-2xl border space-y-4 ${cardBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-500" />
              <span>Multi-Track Animation Timeline ({activeProj.clips.length} Clips)</span>
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {VFX_PRESETS.slice(0, 6).map((vfx) => {
                const active = activeProj.vfxLayers.includes(vfx);
                return (
                  <button
                    key={vfx}
                    onClick={() => handleToggleVfx(vfx)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      active ? 'bg-orange-500 text-white border-orange-500' : cardBg
                    }`}
                  >
                    <Flame className="w-2.5 h-2.5 inline mr-1" />
                    {vfx}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeProj.clips.map((clip) => (
              <div key={clip.id} className={`rounded-xl border overflow-hidden ${cardBg}`}>
                <div className="aspect-video bg-black relative">
                  <img src={clip.sourceImageUrl} alt={clip.title} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-cyan-300 text-[10px] font-mono">
                    {clip.durationSec}s · {clip.motionAction}
                  </span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="text-xs font-bold truncate">{clip.title}</div>
                  <div className="flex flex-wrap gap-1">
                    {MOTION_PRESETS.slice(0, 4).map((m) => (
                      <button
                        key={m}
                        onClick={() => handleApplyMotion(clip.id, m)}
                        className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${
                          clip.motionAction === m ? 'bg-purple-600 text-white border-purple-600' : cardBg
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 7-Track Visual Map */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-200/20 text-[11px] font-mono">
            {[
              { code: 'V1', label: 'Video Track', items: activeProj.clips.map((c) => c.title), color: 'bg-purple-500/20 text-purple-400' },
              { code: 'C1', label: 'Character Track', items: activeProj.clips.map((c) => `${c.characterName || 'Hero'} (${c.motionAction})`), color: 'bg-indigo-500/20 text-indigo-400' },
              { code: 'B1', label: 'Background Track', items: ['Establishing Kingdom Plate', 'Forest Backdrop'], color: 'bg-emerald-500/20 text-emerald-400' },
              { code: 'A1', label: 'Dialogue & Lip-Sync', items: activeProj.audioTracks.dialogue, color: 'bg-cyan-500/20 text-cyan-400' },
              { code: 'A2', label: 'Music Track', items: activeProj.audioTracks.music, color: 'bg-amber-500/20 text-amber-400' },
              { code: 'A3', label: 'SFX & VFX', items: [...activeProj.audioTracks.sfx, ...activeProj.vfxLayers], color: 'bg-rose-500/20 text-rose-400' },
              { code: 'S1', label: 'Subtitles', items: activeProj.clips.filter((c) => c.lipSyncText).map((c) => c.lipSyncText || ''), color: 'bg-slate-500/20 text-slate-300' },
            ].map((track) => (
              <div key={track.code} className="flex items-center gap-2">
                <span className="w-8 font-bold text-center">{track.code}</span>
                <span className={`w-36 truncate ${mutedText}`}>{track.label}</span>
                <div className="flex-1 flex gap-1.5 overflow-x-auto">
                  {(track.items.length > 0 ? track.items : ['Ready']).slice(0, 4).map((it, idx) => (
                    <span key={idx} className={`px-2 py-0.5 rounded truncate max-w-[200px] ${track.color}`}>
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Jobs Monitor */}
      {jobs.length > 0 && (
        <div className={`p-4 rounded-2xl border space-y-2 ${cardBg}`}>
          <div className="text-xs font-extrabold uppercase tracking-wider">Generation & Render Jobs ({jobs.length})</div>
          <div className="space-y-1.5">
            {jobs.slice(0, 5).map((j) => (
              <div key={j.id} className="flex items-center justify-between text-xs border-b border-neutral-200/10 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-mono text-[10px] font-bold">
                    {j.status.toUpperCase()}
                  </span>
                  <span className="font-mono text-[11px]">{j.job_id || j.id}</span>
                  <span className={mutedText}>{j.message}</span>
                </div>
                {j.outputUrl && (
                  <a href={j.outputUrl} target="_blank" rel="noreferrer" className="text-purple-500 hover:underline font-semibold">
                    Open Output
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
