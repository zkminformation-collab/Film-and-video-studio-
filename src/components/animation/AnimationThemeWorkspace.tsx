import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  Users,
  Mountain,
  Clapperboard,
  Film,
  Layers,
  Mic2,
  Music,
  Download,
  Upload,
  Palette,
  ArrowLeft,
  Wand2,
  Play,
  FileText,
  Trash2,
} from 'lucide-react';
import { FilmProject, StudioModule } from '../../types';
import { soundFx } from '../../utils/audioSynth';

interface AnimationThemeItem {
  id: string;
  name: string;
  category: '2D' | '3D' | 'Creative' | 'Film';
  description: string;
  gradient: string;
  badge: string;
  previewImage: string;
}

const ANIMATION_THEMES: AnimationThemeItem[] = [
  {
    id: 'anime',
    name: 'Anime Studio',
    category: '2D',
    description: 'Japanese anime-inspired characters, cel shading, and cinematic action scenes.',
    gradient: 'from-purple-900 via-fuchsia-800 to-rose-700',
    badge: 'Anime',
    previewImage: '/assets/aistudio/Screenshot_2026-11-18-14-43-07-257_com.openai.chatgpt_2ca70d4a.jpg',
  },
  {
    id: 'manhwa',
    name: 'Manhwa Studio',
    category: '2D',
    description: 'Create animated Korean manhwa chapters, vertical panels, and dynamic camera pans.',
    gradient: 'from-slate-900 via-blue-900 to-sky-700',
    badge: 'Manhwa',
    previewImage: '/assets/images/manhwa_panel_warrior_1794812531995.jpg',
  },
  {
    id: 'cartoon',
    name: 'Cartoon Studio',
    category: '2D',
    description: 'Colorful 2D cartoon characters, expressive timing, and entertaining stories.',
    gradient: 'from-amber-600 via-orange-600 to-rose-600',
    badge: '2D Cartoon',
    previewImage: '/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
  },
  {
    id: '3d',
    name: '3D Animation Studio',
    category: '3D',
    description: 'Full 3D character rigging, skeleton joints, environments, and cinematic cameras.',
    gradient: 'from-cyan-900 via-teal-800 to-emerald-700',
    badge: '3D Rig',
    previewImage: '/assets/aistudio/Screenshot_2026-11-18-14-43-54-774_com.openai.chatgpt_8834ecdd.jpg',
  },
  {
    id: 'pixar3d',
    name: 'Pixar-style 3D Studio',
    category: '3D',
    description: 'Friendly, expressive, family-oriented 3D character animation and stylized lighting.',
    gradient: 'from-violet-800 via-purple-700 to-amber-500',
    badge: 'Family 3D',
    previewImage: '/assets/aistudio/Screenshot_2026-11-17-19-50-43-379_com.openai.chatgpt_c98449d5.jpg',
  },
  {
    id: 'realistic',
    name: 'Realistic Animation',
    category: '3D',
    description: 'Photorealistic animated characters, volumetric lighting, and lifelike environments.',
    gradient: 'from-slate-800 via-zinc-700 to-slate-600',
    badge: 'Photoreal',
    previewImage: '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
  },
  {
    id: 'fantasy',
    name: 'Fantasy Animation',
    category: 'Creative',
    description: 'Magical worlds, glowing ruins, enchanted forests, and epic fantasy adventures.',
    gradient: 'from-indigo-950 via-purple-800 to-pink-700',
    badge: 'Fantasy',
    previewImage: '/assets/aistudio/Screenshot_2026-11-17-19-50-45-299_com.openai.chatgpt_5e8c6c04.jpg',
  },
  {
    id: 'action',
    name: 'Action Animation',
    category: 'Creative',
    description: 'High-impact combat choreography, lightning VFX, explosions, and camera shake.',
    gradient: 'from-red-950 via-rose-800 to-orange-600',
    badge: 'Action',
    previewImage: '/assets/images/cartoon_vfx_explosions_1794980039460.jpg',
  },
  {
    id: 'motion',
    name: 'Motion Graphics Studio',
    category: 'Creative',
    description: 'Animated titles, broadcast logos, kinetic typography, and explainer graphics.',
    gradient: 'from-blue-950 via-sky-800 to-cyan-600',
    badge: 'Motion GFX',
    previewImage: '/src/assets/images/cinema_cyberpunk_alley_1794406568416.jpg',
  },
  {
    id: 'whiteboard',
    name: 'Whiteboard Animation',
    category: 'Creative',
    description: 'Hand-drawn educational explainers, crisp diagrams, and narrated lessons.',
    gradient: 'from-slate-700 via-slate-600 to-neutral-500',
    badge: 'Educational',
    previewImage: '/src/assets/images/cinema_soundstage_set_1794406569758.jpg',
  },
  {
    id: 'stopmotion',
    name: 'Stop Motion Studio',
    category: 'Creative',
    description: 'Tactile frame-by-frame claymation and handcrafted miniature film aesthetics.',
    gradient: 'from-amber-900 via-yellow-800 to-orange-700',
    badge: 'Frame-by-Frame',
    previewImage: '/src/assets/images/avatar_director_1794406569000.jpg',
  },
  {
    id: 'cinematic',
    name: 'Cinematic Film Studio',
    category: 'Film',
    description: 'Anamorphic theatrical sequences, multi-track compositing, and master film delivery.',
    gradient: 'from-neutral-950 via-slate-900 to-indigo-950',
    badge: 'Cinema',
    previewImage: '/assets/aistudio/Screenshot_2026-11-18-14-42-59-541_com.openai.chatgpt_2ff60669.jpg',
  },
];

const INTERFACE_THEMES = [
  { id: 'dark_professional', name: 'Dark Professional', bg: 'bg-[#10111a] text-slate-100', panel: 'bg-[#191a27] border-slate-800', accent: 'bg-purple-600 hover:bg-purple-500 text-white' },
  { id: 'light_professional', name: 'Light Professional', bg: 'bg-[#f8f9fb] text-neutral-900', panel: 'bg-white border-neutral-200', accent: 'bg-neutral-900 hover:bg-black text-white' },
  { id: 'purple_neon', name: 'Purple Neon', bg: 'bg-[#0b0617] text-purple-50', panel: 'bg-[#170d2e] border-purple-800/60', accent: 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white' },
  { id: 'blue_creative', name: 'Blue Creative', bg: 'bg-[#071120] text-sky-50', panel: 'bg-[#0f1f38] border-sky-900/70', accent: 'bg-sky-500 hover:bg-sky-400 text-slate-950' },
  { id: 'black_cinema', name: 'Black Cinema', bg: 'bg-black text-neutral-100', panel: 'bg-[#0e0e11] border-neutral-800', accent: 'bg-amber-500 hover:bg-amber-400 text-black' },
  { id: 'minimal_studio', name: 'Minimal Studio', bg: 'bg-neutral-100 text-neutral-900', panel: 'bg-white border-neutral-300', accent: 'bg-indigo-600 hover:bg-indigo-500 text-white' },
];

const CHARACTER_STYLES = [
  'Anime Characters',
  'Cartoon Characters',
  'Realistic Human Characters',
  '3D Characters',
  'Chibi Characters',
  'Fantasy Characters',
  'Manhwa Characters',
  'Stylized Game Characters',
];

const BACKGROUND_CATEGORIES = [
  { id: 'Nature', examples: 'Forest, mountain, ocean' },
  { id: 'City', examples: 'Modern city, village' },
  { id: 'Fantasy', examples: 'Magical kingdom, castle' },
  { id: 'Historical', examples: 'Ancient city, palace' },
  { id: 'Indoor', examples: 'Bedroom, office, school' },
  { id: 'Space', examples: 'Planets, spaceships' },
  { id: 'Action', examples: 'Battlefield, arena' },
];

type WorkspaceModuleId =
  | 'story'
  | 'characters'
  | 'backgrounds'
  | 'storyboard'
  | 'video'
  | 'timeline'
  | 'voice'
  | 'music'
  | 'export';

interface FilmPipelineProject {
  id: string;
  name: string;
  themeId: string;
  themeName: string;
  interfaceTheme: string;
  projectType: string;
  resolution: string;
  fps: number;
  aspectRatio: string;
  language: string;
  story: { prompt: string; language: string; genre: string; target_minutes: number } | null;
  screenplay: any | null;
  scenes: Array<{
    scene_id: string;
    scene_number: number;
    title: string;
    location: string;
    description: string;
    action: string;
    dialogue: Array<{ character_name: string; line: string }>;
    character_names: string[];
    character_ids: string[];
  }>;
  characters: Array<{
    character_id: string;
    name: string;
    style: string;
    description: string;
    personality: string;
    appearance: string;
    voice_description: string;
    reference_images: Array<{ image_id: string; filename: string; url: string }>;
  }>;
  storyboard: Array<{
    panel_id: string;
    scene_id: string;
    scene_number: number;
    shot_type: string;
    camera_angle: string;
    visual_prompt: string;
    action: string;
    character_ids: string[];
    imageUrl?: string;
  }>;
  status: string;
  createdAt: string;
}

interface AnimationThemeWorkspaceProps {
  activeFilm: FilmProject;
  onNavigate?: (module: StudioModule) => void;
}

export const AnimationThemeWorkspace: React.FC<AnimationThemeWorkspaceProps> = ({
  activeFilm,
  onNavigate,
}) => {
  const [view, setView] = useState<'themes' | 'workspace'>('themes');
  const [uiThemeId, setUiThemeId] = useState<string>('dark_professional');
  const uiTheme = INTERFACE_THEMES.find((t) => t.id === uiThemeId) || INTERFACE_THEMES[0];
  const isLightUi = uiThemeId === 'light_professional' || uiThemeId === 'minimal_studio';

  // Step 1: Theme Selection & New Project Creation
  const [selectedThemeId, setSelectedThemeId] = useState<string>('anime');
  const [categoryFilter, setCategoryFilter] = useState<string>('All Themes');
  const [search, setSearch] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [projectType, setProjectType] = useState<string>('Short');
  const [resolution, setResolution] = useState<string>('1080p');
  const [fps, setFps] = useState<number>(24);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [language, setLanguage] = useState<string>('Kannada');

  // Persistent Projects & Active Project
  const [projects, setProjects] = useState<FilmPipelineProject[]>([]);
  const [activeProject, setActiveProject] = useState<FilmPipelineProject | null>(null);
  const [activeModule, setActiveModule] = useState<WorkspaceModuleId>('story');

  // Module form states
  const [storyPrompt, setStoryPrompt] = useState(
    'A courageous young hero enters an ancient mountain city, discovers a glowing relic in the emerald forest, and faces a shadow rival.'
  );
  const [storyGenre, setStoryGenre] = useState('Fantasy Adventure');
  const [targetMinutes, setTargetMinutes] = useState(10);

  const [charName, setCharName] = useState('Arun');
  const [charStyle, setCharStyle] = useState('Anime Characters');
  const [charDesc, setCharDesc] = useState('Young adventure hero with unwavering courage');
  const [charAppearance, setCharAppearance] = useState('Black hair, navy jacket with gold trim, amber eyes');
  const [charPersonality, setCharPersonality] = useState('Brave and thoughtful');
  const [charVoice, setCharVoice] = useState('Warm youthful Kannada & English heroic voice');

  const [bgCategory, setBgCategory] = useState('Fantasy');
  const [bgPrompt, setBgPrompt] = useState('Ancient temple courtyard surrounded by glowing blue waterfalls at golden hour');
  const [generatedBgUrl, setGeneratedBgUrl] = useState('');

  const [timelineZoom, setTimelineZoom] = useState(100);
  const [trackHeight, setTrackHeight] = useState<'compact' | 'normal' | 'tall'>('normal');
  const [renderFormat, setRenderFormat] = useState<'MP4' | 'MOV' | 'WebM' | 'GIF'>('MP4');
  const [renderOutputUrl, setRenderOutputUrl] = useState('');

  const [isBusy, setIsBusy] = useState(false);
  const [busyPanelId, setBusyPanelId] = useState('');
  const [notice, setNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const charRefInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingCharId, setUploadingCharId] = useState<string>('');

  const selectedTheme = ANIMATION_THEMES.find((t) => t.id === selectedThemeId) || ANIMATION_THEMES[0];

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4500);
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/film/projects');
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        setProjects(data.projects);
      }
    } catch {
      // ignore initial error
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const visibleThemes = useMemo(() => {
    return ANIMATION_THEMES.filter((t) => {
      const matchesCat = categoryFilter === 'All Themes' || t.category === categoryFilter;
      const matchesSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [categoryFilter, search]);

  const handleCreateProject = async () => {
    const cleanName = projectName.trim() || `${selectedTheme.name} — ${activeFilm.title}`;
    setIsBusy(true);
    setErrorMsg('');
    soundFx.playCinematicImpact();
    try {
      const res = await fetch('/api/film/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          themeId: selectedTheme.id,
          themeName: selectedTheme.name,
          interfaceTheme: uiThemeId,
          projectType,
          resolution,
          fps,
          aspectRatio,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.detail || 'Failed to create project.');
      const proj: FilmPipelineProject = data.project;
      setProjects((prev) => [proj, ...prev]);
      setActiveProject(proj);
      setProjectName('');
      setActiveModule('story');
      setView('workspace');
      showNotice(`Created "${proj.name}" with ${selectedTheme.name}.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Project creation failed.');
    } finally {
      setIsBusy(false);
    }
  };

  const syncProject = (proj: FilmPipelineProject) => {
    setActiveProject(proj);
    setProjects((prev) => prev.map((p) => (p.id === proj.id ? proj : p)));
  };

  const handleSaveStoryAndGenerate = async (step: 'story' | 'screenplay' | 'scenes') => {
    if (!activeProject) return;
    setIsBusy(true);
    setErrorMsg('');
    soundFx.playScannerBeep();
    try {
      if (step === 'story') {
        const res = await fetch(`/api/film/projects/${encodeURIComponent(activeProject.id)}/story`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: storyPrompt,
            language: activeProject.language,
            genre: storyGenre,
            target_minutes: targetMinutes,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.detail || 'Failed to save story.');
        syncProject(data.project);
        showNotice('Story prompt saved to project.');
      } else if (step === 'screenplay') {
        if (!activeProject.story) {
          await fetch(`/api/film/projects/${encodeURIComponent(activeProject.id)}/story`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: storyPrompt,
              language: activeProject.language,
              genre: storyGenre,
              target_minutes: targetMinutes,
            }),
          });
        }
        const res = await fetch(`/api/film/projects/${encodeURIComponent(activeProject.id)}/screenplay`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.detail || 'Screenplay generation failed.');
        syncProject(data.project);
        soundFx.playCinematicImpact();
        showNotice('AI Screenplay generated with structured scenes & dialogue.');
      } else if (step === 'scenes') {
        const res = await fetch(`/api/film/projects/${encodeURIComponent(activeProject.id)}/scenes`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.detail || 'Scene breakdown failed.');
        syncProject(data.project);
        showNotice(`Created ${data.scenes?.length || 0} structured scenes linked for Character Studio.`);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Action failed.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleCreateCharacter = async () => {
    if (!activeProject) return;
    setIsBusy(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/film/projects/${encodeURIComponent(activeProject.id)}/characters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: charName,
          style: charStyle,
          description: charDesc,
          appearance: charAppearance,
          personality: charPersonality,
          voice_description: charVoice,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.detail || 'Character creation failed.');
      syncProject(data.project);
      soundFx.playCinematicImpact();
      showNotice(`Character "${data.character.name}" (${data.character.character_id}) created & linked to matching scenes.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Character creation failed.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleUploadCharRef = (file: File, characterId: string) => {
    if (!activeProject) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== 'string') return;
      setIsBusy(true);
      setErrorMsg('');
      try {
        const res = await fetch(
          `/api/film/projects/${encodeURIComponent(activeProject.id)}/characters/${encodeURIComponent(characterId)}/references`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              mimeType: file.type || 'image/png',
              dataUrl: reader.result,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.detail || 'Upload failed.');
        syncProject(data.project);
        showNotice('Reference image attached & synced to Unified Media Library.');
      } catch (err: any) {
        setErrorMsg(err?.message || 'Reference upload failed.');
      } finally {
        setIsBusy(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateBackground = async () => {
    if (!activeProject) return;
    setIsBusy(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/images/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: bgPrompt,
          locationType: bgCategory,
          style: activeProject.themeName,
          aspectRatio: activeProject.aspectRatio,
          projectId: activeProject.id,
          projectName: activeProject.name,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Background generation failed.');
      setGeneratedBgUrl(data.image?.url || '');
      showNotice('Background generated & saved to Unified Media Library/Images/Backgrounds.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Background generation failed.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleGenerateStoryboard = async () => {
    if (!activeProject) return;
    setIsBusy(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/film/projects/${encodeURIComponent(activeProject.id)}/storyboard`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.detail || 'Storyboard generation failed.');
      syncProject(data.project);
      soundFx.playCinematicImpact();
      showNotice(`Generated ${data.panels?.length || 0} storyboard panels linked to Scene & Character IDs.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Storyboard generation failed.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleRenderPanelImage = async (panelId: string) => {
    if (!activeProject) return;
    setBusyPanelId(panelId);
    setErrorMsg('');
    try {
      const res = await fetch(
        `/api/film/projects/${encodeURIComponent(activeProject.id)}/storyboard/${encodeURIComponent(panelId)}/image`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.detail || 'Panel image failed.');
      syncProject(data.project);
      showNotice('Rendered storyboard panel image via AI Image Studio.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Panel render failed.');
    } finally {
      setBusyPanelId('');
    }
  };

  const handleRenderFinalFilm = async () => {
    if (!activeProject) return;
    setIsBusy(true);
    setErrorMsg('');
    try {
      const projRes = await fetch('/api/animation/projects').then((r) => r.json());
      const animId = projRes.projects?.[0]?.id;
      const res = await fetch('/api/animation/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animationProjectId: animId,
          format: renderFormat,
          resolution: activeProject.resolution || '1080p',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'FFmpeg render failed.');
      setRenderOutputUrl(data.downloadUrl || '');
      soundFx.playCinematicImpact();
      showNotice(`Rendered ${activeProject.resolution} ${renderFormat} via FFmpeg & saved to Unified Media Library.`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Render failed.');
    } finally {
      setIsBusy(false);
    }
  };

  const inputClass = isLightUi
    ? 'bg-neutral-50 border-neutral-300 text-neutral-900'
    : 'bg-black/40 border-slate-700 text-white';
  const mutedText = isLightUi ? 'text-neutral-500' : 'text-slate-400';

  const workspaceModules: Array<{ id: WorkspaceModuleId; name: string; icon: React.ElementType; desc: string }> = [
    { id: 'story', name: 'Story Generator', icon: FileText, desc: 'Story prompt → AI Screenplay → Scene Breakdown' },
    { id: 'characters', name: 'Character Studio', icon: Users, desc: 'Permanent Character IDs & Reference Images' },
    { id: 'backgrounds', name: 'Background Studio', icon: Mountain, desc: '7 Scene Categories & Environment Plates' },
    { id: 'storyboard', name: 'Storyboard', icon: Clapperboard, desc: 'Panels linked to Scene IDs & Character IDs' },
    { id: 'video', name: 'AI Video Generator', icon: Film, desc: 'Turn Storyboard panels into animation clips' },
    { id: 'timeline', name: 'Timeline Editor', icon: Layers, desc: '7-Track Animation Timeline (V1–S1)' },
    { id: 'voice', name: 'Voice Studio', icon: Mic2, desc: 'ElevenLabs Character Voices & Narration' },
    { id: 'music', name: 'Music Studio', icon: Music, desc: 'Background Music & Sound Effects' },
    { id: 'export', name: 'Export Studio', icon: Download, desc: 'Render MP4 / MOV / WebM / GIF via FFmpeg' },
  ];

  // ============================================================================
  // VIEW 1: 12-THEME ANIMATION STUDIO THEME SELECTION DASHBOARD
  // ============================================================================
  if (view === 'themes') {
    return (
      <div className={`flex-1 overflow-y-auto p-6 space-y-7 ${uiTheme.bg}`}>
        {/* Top Bar + 6 Studio Interface Themes */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-purple-400 font-bold">
              Step 01 · Choose Your Creative Style & Studio Interface
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              Animation Studio — 12 Themes & Project Setup
            </h1>
            <p className={`text-xs mt-1 ${mutedText}`}>
              Select one of 12 animation studio themes, customize your studio interface, and launch the 9-module production workspace.
            </p>
          </div>

          {/* 6 Studio Interface Themes */}
          <div className={`p-2 rounded-xl border flex flex-wrap items-center gap-1.5 ${uiTheme.panel}`}>
            <Palette className="w-4 h-4 text-purple-400 mx-1" />
            {INTERFACE_THEMES.map((it) => (
              <button
                key={it.id}
                onClick={() => {
                  soundFx.playScannerBeep();
                  setUiThemeId(it.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  uiThemeId === it.id ? uiTheme.accent : `${mutedText} hover:opacity-80`
                }`}
              >
                {it.name}
              </button>
            ))}
          </div>
        </div>

        {(errorMsg || notice) && (
          <div>
            {errorMsg && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            )}
            {notice && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{notice}</span>
              </div>
            )}
          </div>
        )}

        {/* Step 3: New Animation Project Creator Card */}
        <section className={`p-5 rounded-2xl border space-y-4 ${uiTheme.panel}`}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-end">
            <div className="lg:col-span-2 space-y-1">
              <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Animation Project Name</label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder={`e.g. ${selectedTheme.name} — Episode 1`}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none ${inputClass}`}
              />
            </div>
            <div className="space-y-1">
              <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Selected Theme</label>
              <div className={`rounded-xl border px-3.5 py-2.5 text-sm font-bold truncate ${inputClass}`}>
                {selectedTheme.name} ({selectedTheme.category})
              </div>
            </div>
            <button
              disabled={isBusy}
              onClick={handleCreateProject}
              className={`py-2.5 px-5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50 ${uiTheme.accent}`}
            >
              <Plus className="w-4 h-4" />
              <span>{isBusy ? 'Creating...' : 'Create New Animation'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-white/10">
            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase ${mutedText}`}>Project Type</label>
              <select value={projectType} onChange={(e) => setProjectType(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputClass}`}>
                <option>Short</option>
                <option>Episode</option>
                <option>Full Film</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase ${mutedText}`}>Resolution</label>
              <select value={resolution} onChange={(e) => setResolution(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputClass}`}>
                <option>720p</option>
                <option>1080p</option>
                <option>2K</option>
                <option>4K</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase ${mutedText}`}>Frame Rate</label>
              <select value={fps} onChange={(e) => setFps(Number(e.target.value))} className={`w-full rounded-lg border p-2 text-xs ${inputClass}`}>
                <option value={24}>24 FPS</option>
                <option value={25}>25 FPS</option>
                <option value={30}>30 FPS</option>
                <option value={60}>60 FPS</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase ${mutedText}`}>Aspect Ratio</label>
              <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputClass}`}>
                <option>16:9</option>
                <option>9:16</option>
                <option>1:1</option>
                <option>4:3</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase ${mutedText}`}>Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputClass}`}>
                <option>Kannada</option>
                <option>English</option>
                <option>Hindi</option>
                <option>Tamil</option>
                <option>Telugu</option>
              </select>
            </div>
          </div>
        </section>

        {/* Saved Projects Quick Re-Open */}
        {projects.length > 0 && (
          <section className="space-y-2.5">
            <h2 className="text-sm font-extrabold uppercase tracking-wider">Recent Animation Projects ({projects.length})</h2>
            <div className="flex flex-wrap gap-2.5">
              {projects.slice(0, 6).map((p) => (
                <div key={p.id} className={`px-3.5 py-2 rounded-xl border flex items-center gap-3 ${uiTheme.panel}`}>
                  <button
                    onClick={() => {
                      setActiveProject(p);
                      setView('workspace');
                    }}
                    className="text-left"
                  >
                    <div className="text-xs font-bold">{p.name}</div>
                    <div className={`text-[10px] font-mono ${mutedText}`}>
                      {p.themeName} · {p.resolution} · {p.fps}fps · {p.scenes.length} scenes
                    </div>
                  </button>
                  <button
                    onClick={async () => {
                      await fetch(`/api/film/projects/${encodeURIComponent(p.id)}`, { method: 'DELETE' });
                      setProjects((prev) => prev.filter((item) => item.id !== p.id));
                    }}
                    className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filter & Search Toolbar */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {['All Themes', '2D', '3D', 'Creative', 'Film'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-full border text-xs font-bold transition-colors ${
                    categoryFilter === cat ? uiTheme.accent : `${uiTheme.panel} ${mutedText}`
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative w-64">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${mutedText}`} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search 12 themes..."
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none ${inputClass}`}
              />
            </div>
          </div>

          {/* 12 Animation Theme Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleThemes.map((t) => {
              const isSelected = selectedThemeId === t.id;
              return (
                <article
                  key={t.id}
                  onClick={() => {
                    soundFx.playScannerBeep();
                    setSelectedThemeId(t.id);
                  }}
                  className={`rounded-2xl border-2 overflow-hidden cursor-pointer transition-all hover:-translate-y-1 ${uiTheme.panel} ${
                    isSelected ? 'border-purple-500 ring-2 ring-purple-500/30' : ''
                  }`}
                >
                  <div className={`h-36 relative overflow-hidden bg-gradient-to-br ${t.gradient}`}>
                    <img
                      src={t.previewImage}
                      alt={t.name}
                      className="w-full h-full object-cover opacity-80 hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-bold">
                      {t.badge}
                    </span>
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                        ✓ SELECTED
                      </span>
                    )}
                  </div>
                  <div className="p-4 space-y-1.5">
                    <div className="font-extrabold text-sm">{t.name}</div>
                    <p className={`text-xs leading-relaxed line-clamp-2 ${mutedText}`}>{t.description}</p>
                    <div className="flex items-center justify-between pt-2 text-[11px] font-bold">
                      <span className={mutedText}>{t.category} Animation</span>
                      <span className="text-purple-400">{isSelected ? 'Selected ✓' : 'Choose →'}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: 9-MODULE ANIMATION PROJECT WORKSPACE (STEP 2 + STEP 3 PIPELINE)
  // ============================================================================
  return (
    <div className={`flex-1 flex overflow-hidden ${uiTheme.bg}`}>
      {/* Left 9-Module Sidebar */}
      <aside className={`w-60 border-r p-4 overflow-y-auto shrink-0 space-y-4 ${uiTheme.panel}`}>
        <button
          onClick={() => setView('themes')}
          className={`w-full px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-2 ${inputClass}`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to 12 Themes</span>
        </button>

        <div>
          <div className="text-xs font-extrabold truncate">{activeProject?.name}</div>
          <div className={`text-[11px] font-mono ${mutedText}`}>
            {activeProject?.themeName} · {activeProject?.resolution}
          </div>
        </div>

        <nav className="space-y-1">
          {workspaceModules.map((mod) => {
            const Icon = mod.icon;
            const active = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => {
                  soundFx.playScannerBeep();
                  setActiveModule(mod.id);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                  active ? uiTheme.accent : `${mutedText} hover:bg-white/5`
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{mod.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className={`px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${uiTheme.panel}`}>
          <div>
            <h2 className="text-base font-extrabold">
              {workspaceModules.find((m) => m.id === activeModule)?.name}
            </h2>
            <p className={`text-xs ${mutedText}`}>
              {workspaceModules.find((m) => m.id === activeModule)?.desc} · Status: <span className="font-mono text-purple-400">{activeProject?.status}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className={`px-2.5 py-1 rounded-lg border ${uiTheme.panel}`}>Scenes: {activeProject?.scenes.length || 0}</span>
            <span className={`px-2.5 py-1 rounded-lg border ${uiTheme.panel}`}>Characters: {activeProject?.characters.length || 0}</span>
            <span className={`px-2.5 py-1 rounded-lg border ${uiTheme.panel}`}>Panels: {activeProject?.storyboard.length || 0}</span>
          </div>
        </header>

        {(errorMsg || notice) && (
          <div className="px-6 pt-3">
            {errorMsg && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {notice && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{notice}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* MODULE 1: STORY GENERATOR -> SCREENPLAY -> SCENES */}
          {activeModule === 'story' && activeProject && (
            <div className="max-w-4xl space-y-5">
              <div className={`p-5 rounded-2xl border space-y-4 ${uiTheme.panel}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Genre</label>
                    <input value={storyGenre} onChange={(e) => setStoryGenre(e.target.value)} className={`w-full rounded-lg border p-2 text-xs ${inputClass}`} />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Target Duration (Minutes)</label>
                    <input type="number" value={targetMinutes} onChange={(e) => setTargetMinutes(Number(e.target.value))} className={`w-full rounded-lg border p-2 text-xs ${inputClass}`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Story Idea / Prompt</label>
                  <textarea rows={4} value={storyPrompt} onChange={(e) => setStoryPrompt(e.target.value)} className={`w-full rounded-xl border p-3 text-sm ${inputClass}`} />
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button disabled={isBusy} onClick={() => handleSaveStoryAndGenerate('story')} className={`px-4 py-2 rounded-xl border text-xs font-bold ${inputClass}`}>
                    1. Save Story Prompt
                  </button>
                  <button disabled={isBusy} onClick={() => handleSaveStoryAndGenerate('screenplay')} className={`px-4 py-2 rounded-xl text-xs font-extrabold ${uiTheme.accent}`}>
                    {isBusy ? 'Generating...' : '2. Generate AI Screenplay'}
                  </button>
                  <button disabled={isBusy || !activeProject.screenplay} onClick={() => handleSaveStoryAndGenerate('scenes')} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold disabled:opacity-40">
                    3. Create Scene Breakdown
                  </button>
                </div>
              </div>

              {activeProject.scenes.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-sm font-extrabold">Structured Scenes ({activeProject.scenes.length})</h3>
                  {activeProject.scenes.map((sc) => (
                    <div key={sc.scene_id} className={`p-4 rounded-xl border space-y-1 ${uiTheme.panel}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold">Scene {sc.scene_number}: {sc.title} ({sc.location})</span>
                        <span className={`text-[10px] font-mono ${mutedText}`}>{sc.scene_id}</span>
                      </div>
                      <p className={`text-xs ${mutedText}`}>{sc.description}</p>
                      <div className="text-[11px] text-purple-400 font-mono">
                        Characters: {sc.character_names.join(', ') || 'None'} · Linked IDs: {sc.character_ids.length}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MODULE 2: CHARACTER STUDIO (PERMANENT CHARACTER IDs + REFERENCE UPLOADS) */}
          {activeModule === 'characters' && activeProject && (
            <div className="max-w-4xl space-y-5">
              <div className={`p-5 rounded-2xl border space-y-3 ${uiTheme.panel}`}>
                <h3 className="text-sm font-extrabold">Create Reusable Character Profile</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input value={charName} onChange={(e) => setCharName(e.target.value)} placeholder="Character Name (e.g. Arun)" className={`rounded-lg border p-2.5 text-xs ${inputClass}`} />
                  <select value={charStyle} onChange={(e) => setCharStyle(e.target.value)} className={`rounded-lg border p-2.5 text-xs ${inputClass}`}>
                    {CHARACTER_STYLES.map((cs) => <option key={cs}>{cs}</option>)}
                  </select>
                  <input value={charAppearance} onChange={(e) => setCharAppearance(e.target.value)} placeholder="Appearance (hair, clothes, eyes)" className={`rounded-lg border p-2.5 text-xs ${inputClass}`} />
                  <input value={charPersonality} onChange={(e) => setCharPersonality(e.target.value)} placeholder="Personality" className={`rounded-lg border p-2.5 text-xs ${inputClass}`} />
                  <input value={charDesc} onChange={(e) => setCharDesc(e.target.value)} placeholder="Description" className={`rounded-lg border p-2.5 text-xs ${inputClass}`} />
                  <input value={charVoice} onChange={(e) => setCharVoice(e.target.value)} placeholder="Voice Description" className={`rounded-lg border p-2.5 text-xs ${inputClass}`} />
                </div>
                <button disabled={isBusy} onClick={handleCreateCharacter} className={`px-4 py-2 rounded-xl text-xs font-extrabold ${uiTheme.accent}`}>
                  + Create Character & Link to Scenes
                </button>
              </div>

              <input
                ref={charRefInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f && uploadingCharId) handleUploadCharRef(f, uploadingCharId);
                }}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeProject.characters.map((ch) => (
                  <div key={ch.character_id} className={`p-4 rounded-xl border space-y-2.5 ${uiTheme.panel}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-sm">{ch.name}</div>
                        <div className={`text-[10px] font-mono ${mutedText}`}>{ch.character_id} · {ch.style}</div>
                      </div>
                      <button
                        onClick={() => {
                          setUploadingCharId(ch.character_id);
                          charRefInputRef.current?.click();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-bold flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload Reference</span>
                      </button>
                    </div>
                    <p className={`text-xs ${mutedText}`}>{ch.appearance || ch.description}</p>
                    {ch.reference_images.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pt-1">
                        {ch.reference_images.map((ref) => (
                          <img key={ref.image_id} src={ref.url} alt={ref.filename} className="w-16 h-16 rounded-lg object-cover border border-purple-500/40" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE 3: BACKGROUND STUDIO (7 SCENE CATEGORIES) */}
          {activeModule === 'backgrounds' && (
            <div className="max-w-4xl space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BACKGROUND_CATEGORIES.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setBgCategory(bg.id)}
                    className={`p-3 rounded-xl border text-left ${bgCategory === bg.id ? uiTheme.accent : uiTheme.panel}`}
                  >
                    <div className="text-xs font-extrabold">{bg.id}</div>
                    <div className="text-[10px] opacity-80">{bg.examples}</div>
                  </button>
                ))}
              </div>
              <textarea rows={3} value={bgPrompt} onChange={(e) => setBgPrompt(e.target.value)} className={`w-full rounded-xl border p-3 text-xs ${inputClass}`} />
              <button disabled={isBusy} onClick={handleGenerateBackground} className={`px-5 py-2.5 rounded-xl text-xs font-extrabold ${uiTheme.accent}`}>
                {isBusy ? 'Generating Background...' : `Generate ${bgCategory} Background via AI Image Studio`}
              </button>
              {generatedBgUrl && (
                <img src={generatedBgUrl} alt="Generated Background" className="w-full max-w-xl rounded-xl border border-purple-500/40" />
              )}
            </div>
          )}

          {/* MODULE 4: STORYBOARD (LINKED TO SCENE & CHARACTER IDs) */}
          {activeModule === 'storyboard' && activeProject && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className={`text-xs ${mutedText}`}>
                  Generates storyboard panels preserving permanent `scene_id` and `character_ids`.
                </p>
                <button disabled={isBusy} onClick={handleGenerateStoryboard} className={`px-4 py-2 rounded-xl text-xs font-extrabold ${uiTheme.accent}`}>
                  <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
                  Generate Storyboard Panels
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeProject.storyboard.map((pnl) => (
                  <div key={pnl.panel_id} className={`rounded-xl border overflow-hidden ${uiTheme.panel}`}>
                    <div className="aspect-video bg-black relative">
                      <img src={pnl.imageUrl || '/assets/images/cartoon_adventure_thumb_1794924309261.jpg'} alt={pnl.shot_type} className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-amber-400 text-[10px] font-mono">
                        SC {pnl.scene_number} · {pnl.camera_angle}
                      </span>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="text-xs font-bold">{pnl.shot_type}</div>
                      <p className={`text-[11px] line-clamp-2 ${mutedText}`}>{pnl.visual_prompt}</p>
                      <button
                        disabled={busyPanelId === pnl.panel_id}
                        onClick={() => handleRenderPanelImage(pnl.panel_id)}
                        className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold"
                      >
                        {busyPanelId === pnl.panel_id ? 'Rendering Panel...' : 'Generate Image via AI Image Studio'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE 5: AI VIDEO GENERATOR */}
          {activeModule === 'video' && (
            <div className={`p-6 rounded-2xl border max-w-2xl space-y-3 ${uiTheme.panel}`}>
              <h3 className="text-sm font-extrabold">AI Video Generator</h3>
              <p className={`text-xs ${mutedText}`}>
                Send your approved storyboard panels and character references directly into the AI Video Generator or Animation Clip Pipeline.
              </p>
              <button onClick={() => onNavigate?.('ai_video')} className={`px-4 py-2.5 rounded-xl text-xs font-extrabold ${uiTheme.accent}`}>
                Open AI Video Generator Studio →
              </button>
            </div>
          )}

          {/* MODULE 6: TIMELINE EDITOR */}
          {activeModule === 'timeline' && (
            <div className={`p-5 rounded-2xl border space-y-4 ${uiTheme.panel}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-bold">Zoom: {timelineZoom}%</span>
                  <input type="range" min={50} max={200} value={timelineZoom} onChange={(e) => setTimelineZoom(Number(e.target.value))} className="accent-purple-500" />
                  <select value={trackHeight} onChange={(e) => setTrackHeight(e.target.value as any)} className={`rounded border px-2 py-1 text-xs ${inputClass}`}>
                    <option value="compact">Compact Tracks</option>
                    <option value="normal">Normal Tracks</option>
                    <option value="tall">Tall Tracks</option>
                  </select>
                </div>
                <button onClick={() => onNavigate?.('editor')} className={`px-4 py-2 rounded-xl text-xs font-extrabold ${uiTheme.accent}`}>
                  Open Full Master Video Editor →
                </button>
              </div>
              <div className="space-y-2 font-mono text-xs">
                {[
                  { id: 'V1', label: 'Video Scenes', bar: 'bg-purple-600/80', text: `${activeProject?.scenes.length || 3} Scenes` },
                  { id: 'C1', label: 'Character Animation', bar: 'bg-indigo-600/80', text: `${activeProject?.characters.length || 2} Characters` },
                  { id: 'B1', label: 'Background Plates', bar: 'bg-emerald-600/80', text: `${bgCategory} Environment` },
                  { id: 'A1', label: 'Dialogue Track', bar: 'bg-cyan-600/80', text: `${activeProject?.language || 'Kannada'} Voices` },
                  { id: 'A2', label: 'Background Music', bar: 'bg-amber-600/80', text: 'Orchestral Adventure Bed' },
                  { id: 'A3', label: 'SFX & VFX', bar: 'bg-rose-600/80', text: 'Impacts, Footsteps, Magic' },
                  { id: 'S1', label: 'Subtitles', bar: 'bg-slate-600/80', text: 'Synchronized Captions (.SRT)' },
                ].map((tr) => (
                  <div
                    key={tr.id}
                    className={`flex items-center gap-3 px-3 rounded-lg border ${inputClass} ${
                      trackHeight === 'compact' ? 'h-8' : trackHeight === 'tall' ? 'h-14' : 'h-10'
                    }`}
                  >
                    <span className="w-8 font-bold">{tr.id}</span>
                    <span className={`w-36 truncate ${mutedText}`}>{tr.label}</span>
                    <div
                      style={{ width: `${Math.min(100, Math.round(timelineZoom * 0.45))}%` }}
                      className={`h-6 rounded px-2 flex items-center text-[11px] text-white font-semibold truncate ${tr.bar}`}
                    >
                      {tr.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE 7 & 8: VOICE & MUSIC STUDIOS */}
          {(activeModule === 'voice' || activeModule === 'music') && (
            <div className={`p-6 rounded-2xl border max-w-2xl space-y-3 ${uiTheme.panel}`}>
              <h3 className="text-sm font-extrabold">
                {activeModule === 'voice' ? 'ElevenLabs Character Voice Studio' : 'Stable Audio Music & SFX Studio'}
              </h3>
              <p className={`text-xs ${mutedText}`}>
                All generated voice lines, background scores, and sound effects automatically save into the Unified Media Library for "{activeProject?.name}".
              </p>
              <button
                onClick={() => onNavigate?.(activeModule === 'voice' ? 'ai_voice' : 'audio')}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold ${uiTheme.accent}`}
              >
                {activeModule === 'voice' ? 'Open Text-to-Speech Voice Studio →' : 'Open Music & SFX Studio →'}
              </button>
            </div>
          )}

          {/* MODULE 9: EXPORT STUDIO */}
          {activeModule === 'export' && (
            <div className={`p-6 rounded-2xl border max-w-2xl space-y-4 ${uiTheme.panel}`}>
              <h3 className="text-sm font-extrabold">Render & Export Final Animation (FFmpeg)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Format</label>
                  <select value={renderFormat} onChange={(e) => setRenderFormat(e.target.value as any)} className={`w-full rounded-lg border p-2 text-xs ${inputClass}`}>
                    <option value="MP4">MP4 (H.264)</option>
                    <option value="MOV">MOV</option>
                    <option value="WebM">WebM</option>
                    <option value="GIF">GIF</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold uppercase ${mutedText}`}>Project Resolution</label>
                  <div className={`rounded-lg border p-2 text-xs font-mono ${inputClass}`}>
                    {activeProject?.resolution} · {activeProject?.fps} FPS
                  </div>
                </div>
              </div>
              <button disabled={isBusy} onClick={handleRenderFinalFilm} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-2">
                <Play className="w-4 h-4" />
                <span>{isBusy ? 'Rendering via FFmpeg...' : `Start FFmpeg ${renderFormat} Export`}</span>
              </button>
              {renderOutputUrl && (
                <a href={renderOutputUrl} download className="w-full py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  <span>Download Rendered {renderFormat}</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
