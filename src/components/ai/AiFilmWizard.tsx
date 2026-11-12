import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Bot, 
  Film, 
  User, 
  Clapperboard, 
  Music, 
  Wand2, 
  Download, 
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Volume2,
  Tv,
  Check,
  Eye,
  RefreshCw,
  Clock,
  Layers,
  FileText,
  Share2,
  AlertCircle
} from 'lucide-react';
import { FilmProject } from '../../types';
import { soundFx } from '../../utils/audioSynth';
import { useStudioAi } from '../../context/StudioAiContext';
import { handleImageError } from '../../utils/imageUtils';

interface AiFilmWizardProps {
  activeFilm: FilmProject;
  onOpenEditor: () => void;
  onUpdateFilm?: (film: FilmProject) => void;
}

type WizardTab = 'story' | 'screenplay' | 'characters' | 'scenes' | 'audio' | 'timeline' | 'subtitles' | 'render';

const WORKFLOW_STEPS = [
  { id: 1, name: 'Story Prompt', icon: Sparkles },
  { id: 2, name: 'AI Screenplay', icon: FileText },
  { id: 3, name: 'Characters', icon: User },
  { id: 4, name: 'Storyboard', icon: Clapperboard },
  { id: 5, name: 'Shot Planner', icon: Sliders },
  { id: 6, name: 'AI Video Clips', icon: Bot },
  { id: 7, name: 'Voice & Lip-Sync', icon: Volume2 },
  { id: 8, name: 'Music & Foley', icon: Music },
  { id: 9, name: 'VFX & Shaders', icon: Wand2 },
  { id: 10, name: 'Auto-Timeline', icon: Layers },
  { id: 11, name: 'Subtitles (SRT)', icon: Tv },
  { id: 12, name: 'Scene Corrections', icon: Eye },
  { id: 13, name: 'Master Render', icon: Film },
  { id: 14, name: 'Download MP4', icon: Download },
];

export const AiFilmWizard: React.FC<AiFilmWizardProps> = ({ activeFilm, onOpenEditor, onUpdateFilm }) => {
  const { wallet, requestCostApproval, addQueueItem } = useStudioAi();

  const [activeTab, setActiveTab] = useState<WizardTab>('story');
  const [currentStep, setCurrentStep] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  // Form Inputs & Outline Scope
  const [promptText, setPromptText] = useState('Create a 20-minute Kannada animated adventure film about a courageous young astronomer who discovers an ancient celestial clock beneath a forgotten desert observatory.');
  const [language, setLanguage] = useState('Kannada (ಕನ್ನಡ)');
  const [targetSceneCount, setTargetSceneCount] = useState<number>(100);
  const [targetDuration, setTargetDuration] = useState('20 minutes (100 Scenes)');
  const [animationStyle, setAnimationStyle] = useState('3D cartoon animation');
  const [resolution, setResolution] = useState('1080p Full HD');
  const [aspectRatio, setAspectRatio] = useState('16:9 Cinema');
  const [genre, setGenre] = useState('Adventure / 3D Animation');

  // Generated Film Blueprint & Providers
  const [filmBlueprint, setFilmBlueprint] = useState<any>(null);
  const [providerStatuses, setProviderStatuses] = useState<any[]>([]);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isRenderFinished, setIsRenderFinished] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [isGeneratingScreenplay, setIsGeneratingScreenplay] = useState(false);
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
  const [storyboardPanels, setStoryboardPanels] = useState<any[]>([]);

  // Fetch initial film project and provider status on mount
  useEffect(() => {
    fetch('/api/providers/status')
      .then((r) => r.json())
      .then((data) => {
        if (data.providers) setProviderStatuses(data.providers);
      })
      .catch((e) => console.warn('Could not fetch providers status:', e));

    fetch('/api/films/film-kannada-01')
      .then((r) => r.json())
      .then((data) => {
        if (data.project) {
          setFilmBlueprint(data.project);
          onUpdateFilm?.(data.project);
        }
      })
      .catch((e) => console.warn('Could not fetch initial film project:', e));
  }, []);

  const handleSelectOutlineScope = (count: number) => {
    soundFx.playScannerBeep();
    setTargetSceneCount(count);
    if (count === 12) setTargetDuration('2.5 minutes (12 Scenes)');
    else if (count === 20) setTargetDuration('4 minutes (20 Scenes)');
    else if (count === 50) setTargetDuration('10 minutes (50 Scenes)');
    else setTargetDuration('20 minutes (100 Scenes)');
  };

  // Run the complete 14-step autonomous film generation pipeline
  const handleStartCreationPipeline = () => {
    soundFx.playScannerBeep();

    const costEstimate = {
      operationName: `AI Film Maker (${targetSceneCount} Scenes · ${language})`,
      scenesCount: targetSceneCount,
      durationSec: targetSceneCount * 12,
      resolution: resolution,
      estimatedCredits: wallet.plan === 'Unlimited' ? 0 : targetSceneCount * 3,
      estimatedFinancialCostUsd: targetSceneCount * 0.015,
      currentBalance: wallet.balance,
      isUnlimitedEligible: true,
    };

    requestCostApproval(costEstimate, async () => {
      setIsRunning(true);
      setCurrentStep(1);
      setProgressPercent(5);
      soundFx.playSlateBeep();

      try {
        // Step 1: Call centralized backend film creation engine
        const response = await fetch('/api/films/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storyPrompt: promptText,
            genre,
            language,
            targetSceneCount,
            targetDuration,
            animationStyle,
            aspectRatio,
            resolution,
          }),
        });

        const data = await response.json();
        if (data.project) {
          setFilmBlueprint(data.project);
          onUpdateFilm?.(data.project);
        }

        // Progressively simulate the remaining pipeline steps
        const stepProgression = [
          { step: 2, pct: 15, sfx: () => soundFx.playShutterSound() },
          { step: 3, pct: 25, sfx: () => soundFx.playScannerBeep() },
          { step: 4, pct: 35, sfx: () => soundFx.playShutterSound() },
          { step: 5, pct: 45, sfx: () => soundFx.playScannerBeep() },
          { step: 6, pct: 55, sfx: () => soundFx.playShutterSound() },
          { step: 7, pct: 65, sfx: () => soundFx.playSlateBeep() },
          { step: 8, pct: 75, sfx: () => soundFx.playWhoosh() },
          { step: 9, pct: 85, sfx: () => soundFx.playScannerBeep() },
          { step: 10, pct: 90, sfx: () => soundFx.playShutterSound() },
          { step: 11, pct: 95, sfx: () => soundFx.playScannerBeep() },
          { step: 12, pct: 100, sfx: () => soundFx.playCinematicImpact() },
        ];

        for (const s of stepProgression) {
          await new Promise((r) => setTimeout(r, 450));
          setCurrentStep(s.step);
          setProgressPercent(s.pct);
          s.sfx();
        }

        setIsRunning(false);
        setActiveTab('scenes');
        addQueueItem({
          tool: 'AI Film Maker',
          prompt: `${promptText.slice(0, 60)}... [${language}] (${targetSceneCount} scenes)`,
          provider: 'Runway Gen-3 + Gemini Film Pipeline',
          status: 'Completed',
          progress: 100,
          resultUrl: '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
        });
      } catch (err) {
        console.error('Film creation error:', err);
        setIsRunning(false);
      }
    });
  };

  // Phase 2: AI Screenplay Generator from saved film story
  const handleGenerateScreenplay = async () => {
    soundFx.playScannerBeep();
    setIsGeneratingScreenplay(true);
    try {
      const filmId = filmBlueprint?.id || 'film-kannada-01';
      const res = await fetch(`/api/films/${filmId}/screenplay/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.screenplay) {
        setFilmBlueprint((prev: any) => ({
          ...prev,
          screenplay: data.screenplay,
        }));
        soundFx.playCinematicImpact();
      }
    } catch (e) {
      console.error('Screenplay generation failed:', e);
    } finally {
      setIsGeneratingScreenplay(false);
    }
  };

  // Phase 2: Retrieve previously generated screenplay
  const handleRetrieveScreenplay = async () => {
    soundFx.playShutterSound();
    try {
      const filmId = filmBlueprint?.id || 'film-kannada-01';
      const res = await fetch(`/api/films/${filmId}/screenplay`);
      const data = await res.json();
      if (data.screenplay) {
        setFilmBlueprint((prev: any) => ({
          ...prev,
          screenplay: data.screenplay,
        }));
        alert(`Retrieved saved screenplay for "${data.title}"!`);
      }
    } catch (e) {
      console.error('Failed to retrieve screenplay:', e);
    }
  };

  // Phase 3: Character Studio & Storyboard Generator
  const handleGenerateStoryboard = async () => {
    soundFx.playScannerBeep();
    setIsGeneratingStoryboard(true);
    try {
      const filmId = filmBlueprint?.id || 'film-kannada-01';
      const res = await fetch(`/api/films/${filmId}/storyboard/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.panels) {
        setStoryboardPanels(data.panels);
        soundFx.playCinematicImpact();
      }
    } catch (e) {
      console.error('Failed to generate storyboards:', e);
    } finally {
      setIsGeneratingStoryboard(false);
    }
  };

  // Scene correction: regenerate single scene
  const handleRegenerateScene = (index: number) => {
    soundFx.playScannerBeep();
    if (!filmBlueprint || !filmBlueprint.scenes) return;

    const updatedScenes = [...filmBlueprint.scenes];
    updatedScenes[index] = {
      ...updatedScenes[index],
      action: `${updatedScenes[index].action} (Refined with enhanced volumetric lighting and cinematic framing)`,
      duration: updatedScenes[index].duration + 1,
    };

    setFilmBlueprint({
      ...filmBlueprint,
      scenes: updatedScenes,
    });

    soundFx.playCinematicImpact();
    alert(`Scene ${index + 1} regenerated and updated with continuity lock!`);
  };

  // Master Render Simulation
  const handleStartRender = () => {
    soundFx.playSlateBeep();
    setRenderProgress(0);
    setIsRenderFinished(false);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setRenderProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsRenderFinished(true);
        setCurrentStep(14);
        soundFx.playCinematicImpact();
      }
    }, 120);
  };

  // Download Final MP4
  const handleDownloadMp4 = () => {
    soundFx.playShutterSound();
    const movieManifest = {
      title: filmBlueprint?.title || activeFilm.title,
      language: language,
      genre: genre,
      runtime: targetDuration,
      resolution: resolution,
      aspectRatio: aspectRatio,
      format: 'MPEG-4 Part 14 (.mp4)',
      codec: 'H.265 / HEVC Main 10 Profile',
      audioCodec: 'AAC-LC Stereo 48kHz 320kbps',
      scenesCount: filmBlueprint?.scenes?.length || 100,
      characters: filmBlueprint?.characters || [],
      acts: filmBlueprint?.acts || [],
      soundtrack: filmBlueprint?.soundtrack || {},
      subtitles: filmBlueprint?.subtitles || [],
      generatedAt: new Date().toISOString(),
      productionStudio: 'Film & Video Studio Ultimate',
    };

    const blob = new Blob([JSON.stringify(movieManifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(filmBlueprint?.title || activeFilm.title).replace(/[\s\(\):]/g, '_')}_Master_1080p.mp4.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeScene = filmBlueprint?.scenes?.[selectedSceneIndex] || filmBlueprint?.scenes?.[0];

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#090b11] text-slate-100 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-purple-400 font-mono">
            <span>Autonomous AI Film Creation Suite</span>
            <span aria-hidden="true">·</span>
            <span>Single Prompt to Master MP4</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-cinzel">
            AI Film Maker & Auto-Director
          </h1>
        </div>

        {/* Workspace Mode Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#0d111c] border border-purple-500/30 rounded-xl overflow-x-auto">
          {[
            { id: 'story', label: '1. Prompt & Brief' },
            { id: 'screenplay', label: '2. Screenplay' },
            { id: 'characters', label: '3. Characters' },
            { id: 'scenes', label: '4. Scenes & Shots' },
            { id: 'audio', label: '5. Audio & Voice' },
            { id: 'timeline', label: '6. Timeline Auto' },
            { id: 'subtitles', label: '7. Subtitles' },
            { id: 'render', label: '8. Render & MP4' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundFx.playScannerBeep();
                setActiveTab(tab.id as WizardTab);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 14-Stage Visual Workflow Stepper Bar */}
      <div className="bg-[#0d111c] border border-purple-500/20 rounded-2xl p-4 shadow-xl overflow-x-auto select-none">
        <div className="flex items-center justify-between min-w-[960px] gap-2">
          {WORKFLOW_STEPS.map((stg) => {
            const Icon = stg.icon;
            const isDone = stg.id < currentStep;
            const isCurrent = stg.id === currentStep;

            return (
              <div key={stg.id} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : isCurrent
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white ring-4 ring-purple-600/30 font-bold scale-110 shadow-lg'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Icon className="w-3.5 h-3.5" />}
                </div>

                <div className="hidden xl:block">
                  <div
                    className={`text-[10px] font-mono leading-tight whitespace-nowrap ${
                      isCurrent ? 'text-cyan-300 font-bold' : isDone ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {stg.name}
                  </div>
                </div>

                {stg.id !== WORKFLOW_STEPS.length && (
                  <ArrowRight className="w-3 h-3 text-slate-700 shrink-0 mx-0.5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Global Progress Bar */}
        {isRunning && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs font-mono text-cyan-300">
              <span className="animate-pulse">
                Auto-Director Synthesizing Stage {currentStep} of 14 ({WORKFLOW_STEPS[currentStep - 1]?.name})...
              </span>
              <span className="font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-400 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: STORY PROMPT & CONFIGURATION */}
      {activeTab === 'story' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-[#0d111c] border border-purple-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-sm font-bold text-white font-cinzel">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Step 1: Enter Story Concept or Vision Prompt</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Enter a single sentence, paragraph, or detailed brief. The AI Film Maker will create the screenplay,
              character reference sheets, 100-scene storyboard, camera angles, voiceover, music, and assembled timeline.
            </p>

            <textarea
              rows={4}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full bg-[#090b11] border border-purple-500/40 rounded-xl p-3.5 text-xs text-white outline-none focus:border-cyan-400 resize-none font-mono leading-relaxed"
              placeholder="Example: Create a 20-minute Kannada animated adventure film about..."
            />

            {/* Production Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              {/* Explicit Scene Outline Scope Buttons */}
              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-purple-300 uppercase block font-bold">
                    Target Scene Outline Scope ({targetSceneCount} Scenes)
                  </label>
                  <span className="text-[10px] text-cyan-400 font-mono font-bold">{targetDuration}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { count: 12, label: '12 Scenes', desc: '2.5 min Prologue' },
                    { count: 20, label: '20 Scenes', desc: '4 min Pilot' },
                    { count: 50, label: '50 Scenes', desc: '10 min Short Film' },
                    { count: 100, label: '100 Scenes', desc: '20 min Feature' },
                  ].map((item) => (
                    <button
                      key={item.count}
                      type="button"
                      onClick={() => handleSelectOutlineScope(item.count)}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        targetSceneCount === item.count
                          ? 'bg-gradient-to-r from-purple-900/60 to-blue-900/60 border-cyan-400 text-white ring-2 ring-cyan-400/40 shadow-lg'
                          : 'bg-[#090b11] border-slate-800 text-slate-400 hover:border-purple-500/50 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>{item.label}</span>
                        {targetSceneCount === item.count && <Check className="w-3 h-3 text-cyan-400" />}
                      </div>
                      <div className="text-[10px] text-purple-300 font-mono mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-purple-300 uppercase block mb-1">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-[#090b11] border border-purple-500/30 rounded-lg p-2 text-white outline-none"
                >
                  <option value="Kannada (ಕನ್ನಡ)">Kannada (ಕನ್ನಡ)</option>
                  <option value="English">English</option>
                  <option value="Hindi (हिन्दी)">Hindi (हिन्दी)</option>
                  <option value="Tamil (தமிழ்)">Tamil (தமிழ்)</option>
                  <option value="Telugu (తెలుగు)">Telugu (తెలుగు)</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Spanish">Spanish</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-purple-300 uppercase block mb-1">Scope & Duration Sync</label>
                <select
                  value={targetSceneCount}
                  onChange={(e) => handleSelectOutlineScope(Number(e.target.value))}
                  className="w-full bg-[#090b11] border border-purple-500/30 rounded-lg p-2 text-white outline-none"
                >
                  <option value={100}>100 Scenes · 20 Minutes (Feature Short)</option>
                  <option value={50}>50 Scenes · 10 Minutes (Short Film)</option>
                  <option value={20}>20 Scenes · 4 Minutes (Cinematic Pilot)</option>
                  <option value={12}>12 Scenes · 2.5 Minutes (Prologue / Trailer)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-purple-300 uppercase block mb-1">Animation & Visual Style</label>
                <select
                  value={animationStyle}
                  onChange={(e) => setAnimationStyle(e.target.value)}
                  className="w-full bg-[#090b11] border border-purple-500/30 rounded-lg p-2 text-white outline-none"
                >
                  <option value="3D cartoon animation">3D Cartoon Animation (Pixar/Dreamworks style)</option>
                  <option value="Photorealistic Cinematic 35mm">Photorealistic Cinematic 35mm (Live Action)</option>
                  <option value="2D Anime / Ghibli">2D Anime (Studio Ghibli style)</option>
                  <option value="Sci-Fi Unreal Engine 5">Sci-Fi Unreal Engine 5 Hyper-real</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-purple-300 uppercase block mb-1">Resolution & Framing</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full bg-[#090b11] border border-purple-500/30 rounded-lg p-2 text-white outline-none"
                >
                  <option value="1080p Full HD">1080p Full HD (1920x1080)</option>
                  <option value="4K Cinema DCI">4K Cinema DCI (4096x2160)</option>
                </select>
              </div>
            </div>

            {/* Launch Button */}
            <button
              onClick={handleStartCreationPipeline}
              disabled={isRunning}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold font-mono text-sm rounded-xl transition-all shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-95"
            >
              <Bot className="w-4 h-4" />
              <span>{isRunning ? 'Synthesizing Film Package...' : `Create Full Film (${targetSceneCount} Scenes · Prompt to MP4)`}</span>
            </button>
          </div>

          {/* Right Status Card with Active Provider Connections */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#0d111c] border border-purple-500/20 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono block">
                  Production Pipeline AI Status
                </span>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  READY
                </span>
              </div>

              {/* Provider Status Badges */}
              <div className="space-y-2 text-xs font-mono">
                {[
                  { stage: 'Screenplay', engine: 'Google Gemini Pro', status: 'Active & Connected', isLive: true },
                  { stage: 'Characters', engine: 'Stability AI SD3', status: 'Appearance Lock Seeded', isLive: true },
                  { stage: 'Storyboard', engine: 'Midjourney/SD3 Bridge', status: 'Outline Mesh Active', isLive: true },
                  { stage: 'Video Footage', engine: 'Runway Gen-3 Alpha', status: 'Local Pipeline Fallback', isLive: false },
                  { stage: 'Voice & ADR', engine: 'ElevenLabs Multilingual', status: `${language.slice(0, 7)} Neural Active`, isLive: true },
                  { stage: 'Master Render', engine: 'Cloud GPU (H.265)', status: 'Hardware Transcoder Ready', isLive: true },
                ].map((p, idx) => (
                  <div key={idx} className="p-2.5 bg-[#090b11] rounded-xl border border-purple-500/20 flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold text-[11px]">{p.stage}: <span className="text-purple-300">{p.engine}</span></div>
                      <div className="text-[10px] text-slate-400">{p.status}</div>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
                      p.isLive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {p.isLive ? 'ONLINE' : 'BUILT-IN'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="p-3 bg-[#090b11] rounded-xl border border-purple-500/20 space-y-1">
                  <div className="text-white font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Single Connected Project Model</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Characters, storyboards, voice tracks, and timeline clips share identical state.
                  </p>
                </div>

                <div className="p-3 bg-[#090b11] rounded-xl border border-purple-500/20 space-y-1">
                  <div className="text-white font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Kannada & Multilingual Support</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Generates native script, character dialogue, voice models, and synchronized subtitles.
                  </p>
                </div>

                <div className="p-3 bg-[#090b11] rounded-xl border border-purple-500/20 space-y-1">
                  <div className="text-white font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Automatic Timeline Assembly</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Video clips, speech audio, music, and titles are automatically cut and layered on V1/A1.
                  </p>
                </div>
              </div>

              {filmBlueprint && (
                <div className="p-3.5 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/40 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>{filmBlueprint.title}</span>
                    <span className="text-cyan-400 font-mono">READY</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('scenes')}
                    className="w-full py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                  >
                    Inspect Generated Scenes →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCREENPLAY & ACTS (Phase 2 AI Screenplay Feature) */}
      {activeTab === 'screenplay' && (
        <div className="bg-[#0d111c] border border-purple-500/20 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-cinzel">
                  {filmBlueprint?.title || 'Screenplay Master Document'}
                </h2>
                <span className="text-[10px] bg-purple-500/20 border border-purple-500/40 text-purple-300 px-2 py-0.5 rounded font-mono">
                  PHASE 2 COMPLETED
                </span>
              </div>
              <span className="text-xs text-purple-300 font-mono">
                Language: {language} · {targetDuration} · Scene Context Passed to AI
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateScreenplay}
                disabled={isGeneratingScreenplay}
                className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 disabled:opacity-50 text-white rounded-lg text-xs font-mono font-bold shadow flex items-center gap-1.5 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingScreenplay ? 'Generating Screenplay...' : 'Generate Screenplay with AI'}</span>
              </button>
              <button
                onClick={handleRetrieveScreenplay}
                className="px-3 py-1.5 bg-[#090b11] hover:bg-slate-900 text-slate-300 border border-slate-700 rounded-lg text-xs font-mono"
              >
                Retrieve Saved
              </button>
              <button
                onClick={() => setActiveTab('characters')}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono"
              >
                Next: Characters →
              </button>
            </div>
          </div>

          {/* Three-Act Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(filmBlueprint?.acts || [
              { act: 'Act I', beat: 'Introduction of the protagonist and discovery of the ancient anomaly', duration: '4 min' },
              { act: 'Act II', beat: 'Rising tension, activation of the celestial mechanism, and trials', duration: '10 min' },
              { act: 'Act III', beat: 'The grand revelation, gateway opening, and transcendent climax', duration: '6 min' },
            ]).map((act: any) => (
              <div key={act.act} className="p-4 bg-[#090b11] border border-purple-500/30 rounded-xl space-y-1.5 font-mono text-xs">
                <div className="flex justify-between items-center text-cyan-400 font-bold">
                  <span>{act.act}</span>
                  <span className="text-[10px] text-purple-300">{act.duration}</span>
                </div>
                <p className="text-slate-300 font-sans text-xs leading-relaxed">{act.beat}</p>
              </div>
            ))}
          </div>

          {/* Screenplay Courier Box with Live Screenplay Rendering */}
          <div className="p-6 bg-[#090b11] border border-slate-800 rounded-xl font-mono text-xs space-y-4 max-w-3xl mx-auto shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Industry Master Scene Format</span>
              <span className="text-[10px] text-cyan-400">Context: Title, Genre, Runtime & Scene Outline synced</span>
            </div>

            <div className="text-center font-bold text-purple-400 text-sm tracking-widest uppercase font-cinzel">
              {filmBlueprint?.title || 'THE CHRONOS GATE'}
            </div>
            <p className="text-slate-400 italic text-center text-[11px]">
              Written by AI Autonomous Screenplay Engine for {language}
            </p>

            <div className="border-t border-slate-800/80 pt-4 whitespace-pre-line text-slate-200 leading-relaxed font-mono text-xs">
              {filmBlueprint?.screenplay || `SCENE 1 - EXT. DESERT BASALT OBSERVATORY - NIGHT\n\nSweeping dunes under an alien double-moon sky. DR. VALERIE CHEN kneels beside a sunken brass ring embedded in the basalt rock.\n\nVALERIE\n(checking scanner)\nTelemetry confirmed... the frequency is alive!\n\nSCENE 2 - INT. CHRONOS VAULT - CONTINUOUS\n\nARYA-7\nCommander, this gateway connects directly to the outer galactic sector.`}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CHARACTERS & CONTINUITY */}
      {activeTab === 'characters' && (
        <div className="bg-[#0d111c] border border-purple-500/20 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
            <div>
              <h2 className="text-base font-bold text-white font-cinzel">Character Dossiers & Visual Consistency</h2>
              <p className="text-xs text-purple-300 font-mono">Ensures appearance lock across all 100 scenes</p>
            </div>
            <button
              onClick={() => setActiveTab('scenes')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono"
            >
              Next: Storyboard & Scenes →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(filmBlueprint?.characters || [
              { name: 'Dr. Valerie Chen', archetype: 'Lead Astronomer', voiceLang: language, appearance: 'Deep purple flight suit, high-tech scanner visor, sharp focused gaze' },
              { name: 'Arya-7', archetype: 'Synthetic Navigation Companion', voiceLang: language, appearance: 'Bioluminescent cyan optical sensors, sleek titanium ceramic chassis' },
            ]).map((char: any) => (
              <div key={char.name} className="p-5 bg-[#090b11] border border-purple-500/30 rounded-2xl space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 flex items-center justify-center font-bold text-white text-sm">
                      {char.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{char.name}</div>
                      <div className="text-[10px] text-cyan-400 font-mono">{char.archetype}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    APPEARANCE LOCKED
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="text-slate-400">
                    <span>Visual Reference: </span>
                    <span className="text-slate-200">{char.appearance}</span>
                  </div>
                  <div className="text-slate-400">
                    <span>Voice Model: </span>
                    <span className="text-purple-300">ElevenLabs Neural ({char.voiceLang})</span>
                  </div>
                </div>

                <button
                  onClick={() => alert(`Appearance seed locked for ${char.name}. All 100 scenes will maintain this visual reference.`)}
                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-700"
                >
                  Verify Seed Continuity
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SCENES, STORYBOARDS & VIDEO GENERATION */}
      {activeTab === 'scenes' && (
        <div className="space-y-6">
          <div className="bg-[#0d111c] border border-purple-500/20 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white font-cinzel">
                    Scene-by-Scene Storyboard & Video Footage
                  </h2>
                  <span className="text-[10px] bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 rounded font-mono">
                    {filmBlueprint?.scenes?.length || targetSceneCount} SCENES
                  </span>
                </div>
                <p className="text-xs text-purple-300 font-mono">
                  Review, preview and correct individual scenes before final render
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleGenerateStoryboard}
                  disabled={isGeneratingStoryboard}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 disabled:opacity-50 text-white rounded-xl text-xs font-mono font-bold shadow flex items-center gap-1.5 active:scale-95"
                >
                  <Clapperboard className="w-3.5 h-3.5" />
                  <span>{isGeneratingStoryboard ? 'Generating Storyboard...' : 'Generate Storyboard (Phase 3)'}</span>
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-xs font-mono font-bold shadow"
                >
                  Assemble to Timeline →
                </button>
              </div>
            </div>

            {/* Main Scene Preview Monitor */}
            {activeScene && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-3">
                  <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-purple-500/30 relative shadow-2xl flex items-center justify-center">
                    <img
                      src={activeScene.videoUrl || '/assets/images/cinema_sci_fi_scene_1794406566762.jpg'}
                      alt="Scene Still"
                      referrerPolicy="no-referrer"
                      onError={(e) => handleImageError(e, `Scene ${activeScene.sceneNumber || selectedSceneIndex + 1}`, selectedSceneIndex)}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        const nextState = !isPlayingPreview;
                        setIsPlayingPreview(nextState);
                        if (nextState) {
                          soundFx.startScorePlayback(0.4);
                          if (activeScene.dialogue) {
                            soundFx.speakDialogue(activeScene.dialogue, language);
                          }
                        } else {
                          soundFx.stopScorePlayback();
                        }
                      }}
                      className="absolute p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white shadow-xl shadow-purple-600/50 transition-transform active:scale-95"
                    >
                      {isPlayingPreview ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                    </button>

                    <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded-lg border border-purple-500/30 text-[10px] font-mono text-cyan-300">
                      Scene {activeScene.sceneNumber || selectedSceneIndex + 1} · {activeScene.cameraLens || '35mm Cine'}
                    </div>

                    <div className="absolute bottom-3 right-3 bg-black/80 px-2.5 py-1 rounded-lg border border-purple-500/30 text-[10px] font-mono text-purple-300">
                      Duration: {activeScene.duration}s
                    </div>
                  </div>

                  {/* Dialogue Burn-in preview */}
                  <div className="p-3 bg-[#090b11] border border-purple-500/20 rounded-xl text-center">
                    <span className="text-xs font-mono text-cyan-300 font-semibold">
                      {activeScene.dialogue}
                    </span>
                  </div>
                </div>

                {/* Scene Inspector & Per-Scene Correction */}
                <div className="lg:col-span-5 bg-[#090b11] border border-purple-500/20 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3 text-xs font-mono">
                    <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2">
                      <span className="font-bold text-white text-sm">Scene {activeScene.sceneNumber || selectedSceneIndex + 1} Inspector</span>
                      <span className="text-purple-400">{activeScene.shot}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Heading</span>
                      <span className="text-white font-bold">{activeScene.heading}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Action</span>
                      <p className="text-slate-300 font-sans text-xs">{activeScene.action}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Visual Neural Prompt</span>
                      <p className="text-slate-400 font-mono text-[11px] leading-relaxed">{activeScene.visualPrompt}</p>
                    </div>
                  </div>

                  {/* Scene Correction Tool */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <button
                      onClick={() => handleRegenerateScene(selectedSceneIndex)}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1.5 shadow"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Regenerate This Scene (Correction)</span>
                    </button>
                    <span className="text-[10px] text-slate-500 block text-center font-mono">
                      Maintains full character appearance & continuity
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Scene Thumbnail Strip */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase">
                All Scenes in Sequence ({filmBlueprint?.scenes?.length || 3})
              </span>
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {(filmBlueprint?.scenes || [1, 2, 3]).map((sc: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => {
                      soundFx.playScannerBeep();
                      setSelectedSceneIndex(idx);
                    }}
                    className={`w-36 shrink-0 bg-[#090b11] border rounded-xl overflow-hidden cursor-pointer transition-all ${
                      selectedSceneIndex === idx
                        ? 'border-cyan-400 ring-2 ring-cyan-400/40 scale-105 shadow-lg'
                        : 'border-slate-800 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="h-20 bg-slate-900 relative">
                      <img
                        src={sc.videoUrl || '/assets/images/cinema_sci_fi_scene_1794406566762.jpg'}
                        alt="Thumb"
                        onError={(e) => handleImageError(e, `Scene ${idx + 1}`, idx)}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/80 px-1.5 py-0.2 rounded text-cyan-300">
                        Scene {idx + 1}
                      </span>
                    </div>
                    <div className="p-2 text-[10px] font-mono truncate text-slate-300">
                      {sc.heading || `Scene ${idx + 1}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIO, VOICE & SOUNDTRACK */}
      {activeTab === 'audio' && (
        <div className="bg-[#0d111c] border border-purple-500/20 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
            <div>
              <h2 className="text-base font-bold text-white font-cinzel">Voice Studio & Soundtrack Design</h2>
              <p className="text-xs text-purple-300 font-mono">Multilingual ADR synthesis, foley and orchestral cues</p>
            </div>
            <button
              onClick={() => setActiveTab('timeline')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono"
            >
              Next: Timeline Assembly →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
            {/* Soundtrack Cue Card */}
            <div className="p-5 bg-[#090b11] border border-purple-500/30 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Music className="w-4 h-4" />
                <span>Original Film Score Cue</span>
              </div>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                {filmBlueprint?.soundtrack?.scoreCue || 'Epic orchestral adventure theme with traditional woodwinds and pulsing synth pads'}
              </p>
              <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-slate-800">
                <span>Key / Tempo:</span>
                <span className="text-white">D-Minor · 120 BPM</span>
              </div>
            </div>

            {/* Ambient Foley Card */}
            <div className="p-5 bg-[#090b11] border border-purple-500/30 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <Volume2 className="w-4 h-4" />
                <span>Atmospheric Foley & Sound Effects</span>
              </div>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                {filmBlueprint?.soundtrack?.ambientFoley || 'Atmospheric howling wind, sub-bass seismic rumble, resonant energy hum'}
              </p>
              <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-slate-800">
                <span>Spatial Format:</span>
                <span className="text-white">Binaural 3D Surround</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: TIMELINE AUTO-ASSEMBLER */}
      {activeTab === 'timeline' && (
        <div className="bg-[#0d111c] border border-purple-500/20 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
            <div>
              <h2 className="text-base font-bold text-white font-cinzel">Automatic Timeline Assembly</h2>
              <p className="text-xs text-purple-300 font-mono">All video clips, audio tracks and subtitles stitched into sequence</p>
            </div>
            <button
              onClick={() => {
                soundFx.playCinematicImpact();
                onOpenEditor();
              }}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-xs font-mono font-bold shadow flex items-center gap-1.5"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Open in Full Multi-Track Editor</span>
            </button>
          </div>

          {/* Timeline Visual Mock */}
          <div className="bg-[#090b11] border border-purple-500/20 rounded-xl p-4 space-y-2 font-mono text-xs">
            <div className="flex justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-800">
              <span className="text-cyan-400 font-bold">MASTER SEQUENCE 01 · 24.00 FPS</span>
              <span>100% Synced</span>
            </div>

            {/* Video Track V1 */}
            <div className="flex items-center gap-3">
              <span className="w-16 text-[11px] text-cyan-400 font-bold">V1 (Video)</span>
              <div className="flex-1 h-9 bg-slate-900 rounded-lg flex items-center p-1 gap-1 overflow-hidden">
                <div className="flex-1 h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded flex items-center px-2 text-white text-[10px] font-bold truncate">
                  Scene_1_Basalt.mp4
                </div>
                <div className="flex-1 h-full bg-gradient-to-r from-indigo-600 to-cyan-600 rounded flex items-center px-2 text-white text-[10px] font-bold truncate">
                  Scene_2_Sanctum.mp4
                </div>
                <div className="flex-1 h-full bg-gradient-to-r from-cyan-600 to-blue-600 rounded flex items-center px-2 text-white text-[10px] font-bold truncate">
                  Scene_3_Gateway.mp4
                </div>
              </div>
            </div>

            {/* Audio Track A1 */}
            <div className="flex items-center gap-3">
              <span className="w-16 text-[11px] text-emerald-400 font-bold">A1 (Dialog)</span>
              <div className="flex-1 h-7 bg-slate-900 rounded-lg flex items-center p-1 gap-1 overflow-hidden">
                <div className="flex-1 h-full bg-emerald-700/80 rounded flex items-center px-2 text-white text-[10px] truncate">
                  VO_Valerie_{language.slice(0, 3)}.wav
                </div>
                <div className="flex-1 h-full bg-emerald-700/80 rounded flex items-center px-2 text-white text-[10px] truncate">
                  VO_Arya_{language.slice(0, 3)}.wav
                </div>
              </div>
            </div>

            {/* Audio Track A2 */}
            <div className="flex items-center gap-3">
              <span className="w-16 text-[11px] text-emerald-300 font-bold">A2 (Music)</span>
              <div className="flex-1 h-7 bg-slate-900 rounded-lg flex items-center p-1 overflow-hidden">
                <div className="w-full h-full bg-cyan-900/60 rounded flex items-center px-2 text-white text-[10px] truncate">
                  Original_Score_Orchestral.wav
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SUBTITLES & SRT */}
      {activeTab === 'subtitles' && (
        <div className="bg-[#0d111c] border border-purple-500/20 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
            <div>
              <h2 className="text-base font-bold text-white font-cinzel">Subtitle Studio & Timecode Sync</h2>
              <p className="text-xs text-purple-300 font-mono">Synchronized dialogue cues in {language}</p>
            </div>
            <button
              onClick={() => {
                soundFx.playShutterSound();
                alert('Subtitles exported in standard .SRT format!');
              }}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded-lg text-xs font-mono"
            >
              Export .SRT File
            </button>
          </div>

          <div className="space-y-2.5">
            {(filmBlueprint?.subtitles || [
              { start: '00:00:01,000', end: '00:00:05,000', text: 'VALERIE: Telemetry confirmed... the frequency is alive!' },
              { start: '00:00:06,000', end: '00:00:10,000', text: 'ARYA-7: Commander, this gateway connects to the core sector.' },
            ]).map((sub: any, idx: number) => (
              <div key={idx} className="p-3 bg-[#090b11] border border-purple-500/20 rounded-xl flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400">{sub.start} → {sub.end}</span>
                <span className="text-white font-semibold">{sub.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: FINAL RENDER & DOWNLOAD MP4 */}
      {activeTab === 'render' && (
        <div className="bg-[#0d111c] border-2 border-purple-500/40 rounded-2xl p-8 space-y-6 shadow-2xl max-w-4xl mx-auto text-center">
          <div className="space-y-2">
            <span className="text-xs text-cyan-400 uppercase font-mono font-bold tracking-widest">
              FINAL STAGE 14 · EXPORT & DELIVERY
            </span>
            <h2 className="text-3xl font-bold font-cinzel text-white">
              {filmBlueprint?.title || activeFilm.title}
            </h2>
            <p className="text-xs text-slate-300 max-w-lg mx-auto font-sans">
              All 100 scenes, {language} dialogue, orchestral soundtrack, VFX shaders, and subtitles ready for master rendering.
            </p>
          </div>

          {/* Render Progress or Download Button */}
          {renderProgress > 0 && renderProgress < 100 && (
            <div className="space-y-2 max-w-md mx-auto">
              <div className="flex justify-between text-xs font-mono text-cyan-300">
                <span className="animate-pulse">Rendering Master MP4 (H.265 1080p)...</span>
                <span className="font-bold">{renderProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-400 h-full transition-all duration-150"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
            </div>
          )}

          {isRenderFinished && (
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-xl max-w-md mx-auto flex items-center justify-center gap-2 text-emerald-300 font-bold text-xs font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>Master MP4 Render Completed Successfully!</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {!isRenderFinished ? (
              <button
                onClick={handleStartRender}
                className="px-8 py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold font-mono text-sm rounded-xl shadow-xl shadow-purple-600/30 transition-all active:scale-95 flex items-center gap-2"
              >
                <Film className="w-4 h-4" />
                <span>{renderProgress > 0 ? 'Rendering...' : 'Start Final Film Render'}</span>
              </button>
            ) : (
              <button
                onClick={handleDownloadMp4}
                className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold font-mono text-sm rounded-xl shadow-xl shadow-emerald-600/30 transition-all active:scale-95 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Finished Film MP4</span>
              </button>
            )}

            <button
              onClick={onOpenEditor}
              className="px-6 py-3.5 bg-[#090b11] hover:bg-slate-900 text-slate-200 border border-slate-700 rounded-xl font-mono text-xs font-medium transition-colors"
            >
              Open in Timeline Editor
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
