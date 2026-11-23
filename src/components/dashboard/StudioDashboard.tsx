import React, { useState } from 'react';
import {
  Plus,
  Mic,
  ArrowUp,
  ArrowRight,
  Trash2,
  Film,
  BookOpen,
  Mic2,
  Music,
  SlidersHorizontal,
  Download,
  Sparkles,
  Image as ImageIcon,
  Globe,
  FileText,
  Zap,
  Play,
  Activity,
} from 'lucide-react';
import { FilmProject, StudioModule, StudioTheme } from '../../types';
import { soundFx } from '../../utils/audioSynth';
import { useStudioAi } from '../../context/StudioAiContext';
import { useAuth } from '../../context/AuthContext';
import { BRAND_CONFIG } from '../../config/brand';

interface StudioDashboardProps {
  activeFilm: FilmProject;
  allFilms: FilmProject[];
  onSelectFilm: (film: FilmProject) => void;
  onDeleteFilm?: (filmId: string) => void;
  onCreateNewFilm?: () => void;
  onNavigate: (module: StudioModule) => void;
  theme: StudioTheme;
}

type FlowFilterTab = 'all' | 'templates' | 'apps' | 'projects';
type ComposerTarget = 'cartoon_creator' | 'ai_wizard' | 'manhwa_studio' | 'ai_voice' | 'ai_video';

const TEMPLATE_CARDS: Array<{
  id: string;
  title: string;
  subtitle: string;
  image: string;
  target: StudioModule;
  category: string;
}> = [
  {
    id: 'tpl-cartoon',
    title: 'Step-by-step AI Cartoon Film Creator',
    subtitle: '17-step production tracker, 9-point AI quality fixer, timeline editing & MP4 approval gate',
    image: '/src/assets/images/cartoon_adventure_thumb_1794924309261.jpg',
    target: 'cartoon_creator',
    category: 'Cartoon Creator',
  },
  {
    id: 'tpl-manhwa',
    title: 'Manhwa chapter to animated reel',
    subtitle: 'Import panels, add Kannada/Hindi/Tamil/Telugu/English dialogue & export MP4',
    image: '/src/assets/images/manhwa_panel_warrior_1794812531995.jpg',
    target: 'manhwa_studio',
    category: 'Manhwa Studio',
  },
  {
    id: 'tpl-voice',
    title: '5-language character dubbing booth',
    subtitle: 'Generate expressive narration and dialogue stems with ElevenLabs & Studio voices',
    image: '/src/assets/images/feature_voice_dubbing_1794901010817.jpg',
    target: 'ai_voice',
    category: 'Voice Studio',
  },
  {
    id: 'tpl-film',
    title: 'Prompt to complete short film',
    subtitle: 'Turn one concept into screenplay scenes, storyboard frames, and video shots',
    image: '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
    target: 'ai_wizard',
    category: 'AI Film Maker',
  },
  {
    id: 'tpl-editor',
    title: 'Multi-track timeline & 4K finishing',
    subtitle: 'Assemble video, dialogue A1, music A2, subtitles, and export downloadable MP4',
    image: '/src/assets/images/feature_film_timeline_1794901011133.jpg',
    target: 'editor',
    category: 'Timeline Editor',
  },
];

const APP_CARDS: Array<{
  id: StudioModule;
  title: string;
  description: string;
  category: string;
  icon: React.ElementType;
}> = [
  {
    id: 'cartoon_creator',
    title: 'AI Cartoon Film Creator',
    description: '17-step workflow tracker, automatic mistake detection, editing & approval before MP4.',
    category: 'Cartoon Workflow',
    icon: Film,
  },
  {
    id: 'ai_voice',
    title: 'Text to Speech',
    description: 'Synthesize expressive dialogue in Kannada, English, Hindi, Tamil & Telugu.',
    category: 'Voice & Audio',
    icon: Mic2,
  },
  {
    id: 'manhwa_studio',
    title: 'Manhwa to Video & Audio',
    description: 'Chapter URL import, JPG/PNG/WebP upload, panel motion & MP4/MP3 export.',
    category: 'Animation',
    icon: BookOpen,
  },
  {
    id: 'ai_wizard',
    title: 'AI Film Maker',
    description: 'Full screenplay, storyboard, audio score & multi-scene automated assembly.',
    category: 'Filmmaking',
    icon: Sparkles,
  },
  {
    id: 'ai_video',
    title: 'Image & Video Generator',
    description: 'Text-to-video, image-to-video, camera dolly moves & cinema aspect ratios.',
    category: 'Video Synthesis',
    icon: Film,
  },
  {
    id: 'audio',
    title: 'Music & Sound Effects',
    description: 'Compose score tracks, layered soundscapes, foley impacts & stem mixing.',
    category: 'Music Studio',
    icon: Music,
  },
  {
    id: 'ai_image',
    title: 'AI Image Studio',
    description: 'Keyframes, character posters, storyplates & visual development renders.',
    category: 'Visuals',
    icon: ImageIcon,
  },
  {
    id: 'editor',
    title: 'Timeline Studio',
    description: 'Frame-accurate multi-track editing for V1/V2 video, A1/A2 audio & titles.',
    category: 'Post-Production',
    icon: SlidersHorizontal,
  },
  {
    id: 'export',
    title: 'Export & Render',
    description: 'Real-time canvas preview, MP4 download, and YouTube / Blogger publishing.',
    category: 'Distribution',
    icon: Download,
  },
  {
    id: 'social_media',
    title: 'Social Studio',
    description: 'Reprocess & schedule reels across YouTube, Instagram Reels & Facebook.',
    category: 'Distribution',
    icon: Globe,
  },
  {
    id: 'script',
    title: 'Screenplay Writer',
    description: 'Courier Prime industry script formatting with dialogue cue extraction.',
    category: 'Writing',
    icon: FileText,
  },
];

export const StudioDashboard: React.FC<StudioDashboardProps> = ({
  activeFilm,
  allFilms,
  onSelectFilm,
  onDeleteFilm,
  onCreateNewFilm,
  onNavigate,
  theme,
}) => {
  const { wallet, history } = useStudioAi();
  const { account, usageLogs, openAuthModal } = useAuth();

  const [promptText, setPromptText] = useState('');
  const [composerTarget, setComposerTarget] = useState<ComposerTarget>('ai_wizard');
  const [activeTab, setActiveTab] = useState<FlowFilterTab>('all');
  const [confirmDeleteFilmId, setConfirmDeleteFilmId] = useState<string | null>(null);
  const [dictationNotice, setDictationNotice] = useState<string | null>(null);

  const isLight = theme === 'elevenlabs';

  const handleLaunchFlow = () => {
    soundFx.playCinematicImpact();
    if (promptText.trim()) {
      try {
        localStorage.setItem('fvs_active_flow_prompt', promptText.trim());
      } catch {
        // ignore storage limits
      }
    }
    onNavigate(composerTarget);
  };

  const handleQuickVoicePrompt = () => {
    soundFx.playScannerBeep();
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRec) {
      onNavigate('ai_voice');
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = 'en-US';
      rec.interimResults = false;
      setDictationNotice('Listening for your voice prompt...');
      rec.onresult = (event: any) => {
        const transcript = event?.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setPromptText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setDictationNotice(null);
      };
      rec.onerror = () => setDictationNotice(null);
      rec.onend = () => setDictationNotice(null);
      rec.start();
    } catch {
      setDictationNotice(null);
      onNavigate('ai_voice');
    }
  };

  const creditsDisplay = account
    ? account.creditsRemaining.toLocaleString()
    : wallet.plan === 'Unlimited'
    ? 'Unlimited'
    : wallet.balance.toLocaleString();

  return (
    <div
      className={`flex-1 overflow-y-auto px-6 py-10 md:px-10 ${
        isLight ? 'bg-white text-neutral-950' : 'bg-[#090b11] text-slate-100'
      }`}
    >
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Top Flows Hero Composer with ZKMAP STUDIO Brand Showcase */}
        <section className="max-w-2xl mx-auto text-center space-y-6 pt-2">
          <div className="flex flex-col items-center gap-3">
            <a
              href="/"
              aria-label="ZKMAP STUDIO Home"
              onClick={(e) => {
                e.preventDefault();
                soundFx.playScannerBeep();
                onNavigate('dashboard');
              }}
              className="inline-block rounded-2xl overflow-hidden border border-neutral-200/80 shadow-lg hover:scale-[1.01] transition-transform cursor-pointer"
            >
              <img
                src={BRAND_CONFIG.logoPath}
                alt={BRAND_CONFIG.name}
                className="h-24 sm:h-28 w-auto object-contain bg-[#060b19]"
              />
            </a>


          </div>

          <div className="space-y-2.5">
            <div
              className={`text-xs font-medium tracking-wide ${
                isLight ? 'text-neutral-500' : 'text-slate-400'
              }`}
            >
              {BRAND_CONFIG.name}
            </div>
            <h1
              className={`text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.15] [text-wrap:balance] ${
                isLight ? 'text-neutral-950' : 'text-white'
              }`}
            >
              Create your best content from start to finish on an AI canvas
            </h1>
          </div>

          {/* Prompt Composer Card */}
          <div
            className={`text-left rounded-2xl border p-4 space-y-3 transition-shadow ${
              isLight
                ? 'bg-white border-neutral-200 shadow-[0_6px_28px_rgba(0,0,0,0.05)] focus-within:border-neutral-400'
                : 'bg-[#0d111c] border-slate-700 shadow-2xl focus-within:border-slate-500'
            }`}
          >
            <textarea
              rows={2}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleLaunchFlow();
                }
              }}
              placeholder="Translate my ad or manhwa into five languages, or direct a short film..."
              className={`w-full bg-transparent text-sm sm:text-base outline-none resize-none leading-relaxed ${
                isLight
                  ? 'text-neutral-950 placeholder:text-neutral-400'
                  : 'text-white placeholder:text-slate-500'
              }`}
            />

            {dictationNotice && (
              <div className="text-xs font-medium text-blue-600">{dictationNotice}</div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onNavigate('manhwa_studio')}
                  title="Upload images or Manhwa chapter"
                  aria-label="Import media or images"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isLight
                      ? 'hover:bg-neutral-100 text-neutral-600'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>

                {(
                  [
                    { id: 'cartoon_creator', label: 'Cartoon Film' },
                    { id: 'ai_wizard', label: 'AI Film' },
                    { id: 'manhwa_studio', label: 'Manhwa' },
                    { id: 'ai_voice', label: 'Voice' },
                    { id: 'ai_video', label: 'Video' },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setComposerTarget(mode.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      composerTarget === mode.id
                        ? isLight
                          ? 'bg-neutral-900 text-white'
                          : 'bg-white text-black'
                        : isLight
                        ? 'text-neutral-600 hover:bg-neutral-100'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickVoicePrompt}
                  title="Dictate flow prompt"
                  aria-label="Dictate flow prompt"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isLight
                      ? 'hover:bg-neutral-100 text-neutral-600'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleLaunchFlow}
                  aria-label="Launch selected workflow"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    promptText.trim()
                      ? isLight
                        ? 'bg-neutral-950 text-white hover:bg-black'
                        : 'bg-white text-black hover:bg-slate-200'
                      : isLight
                      ? 'bg-neutral-300 text-white hover:bg-neutral-900'
                      : 'bg-slate-700 text-slate-200 hover:bg-white hover:text-black'
                  }`}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="text-xs">
            <span className={isLight ? 'text-neutral-500' : 'text-slate-400'}>or </span>
            <button
              type="button"
              onClick={() => {
                if (onCreateNewFilm) {
                  onCreateNewFilm();
                } else {
                  onNavigate('films');
                }
              }}
              className={`font-medium hover:underline ${
                isLight ? 'text-neutral-900' : 'text-white'
              }`}
            >
              start with a blank project
            </button>
          </div>
        </section>

        {/* Filter Bar + New Flow CTA Row */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'all', label: 'All flows' },
                  { id: 'templates', label: 'Templates' },
                  { id: 'apps', label: 'Apps' },
                  { id: 'projects', label: 'My projects' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === tab.id
                      ? isLight
                        ? 'bg-neutral-100 text-neutral-950 font-semibold'
                        : 'bg-slate-800 text-white font-semibold'
                      : isLight
                      ? 'text-neutral-600 hover:bg-neutral-100/70 hover:text-neutral-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('credit_wallet')}
                className={`px-3 py-2 rounded-xl border text-xs font-mono-cinema flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  isLight
                    ? 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400'
                    : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{creditsDisplay} credits</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('ai_wizard')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  isLight
                    ? 'bg-neutral-950 hover:bg-black text-white'
                    : 'bg-white hover:bg-slate-200 text-black'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New flow</span>
              </button>
            </div>
          </div>

          {/* Templates Section (shown in All flows & Templates tab) */}
          {(activeTab === 'all' || activeTab === 'templates') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2
                  className={`text-sm font-semibold ${
                    isLight ? 'text-neutral-950' : 'text-white'
                  }`}
                >
                  Start from a template
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('apps')}
                  className={`text-xs font-medium hover:underline ${
                    isLight ? 'text-neutral-500 hover:text-neutral-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  View all
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {TEMPLATE_CARDS.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      soundFx.playScannerBeep();
                      onNavigate(tpl.target);
                    }}
                    className={`group text-left rounded-2xl border overflow-hidden transition-all flex flex-col ${
                      isLight
                        ? 'bg-[#FAFAFB] border-neutral-200 hover:border-neutral-400'
                        : 'bg-[#0d111c] border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden bg-neutral-100 dark:bg-slate-900">
                      <img
                        src={tpl.image}
                        alt={tpl.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4 space-y-1.5 flex-1">
                      <div
                        className={`text-[11px] font-medium ${
                          isLight ? 'text-neutral-500' : 'text-slate-400'
                        }`}
                      >
                        {tpl.category}
                      </div>
                      <h3
                        className={`text-sm font-semibold leading-snug ${
                          isLight ? 'text-neutral-950' : 'text-white'
                        }`}
                      >
                        {tpl.title}
                      </h3>
                      <p
                        className={`text-xs leading-relaxed line-clamp-2 ${
                          isLight ? 'text-neutral-500' : 'text-slate-400'
                        }`}
                      >
                        {tpl.subtitle}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Apps & Creative Tools Directory (Screenshot 2 style) */}
          {(activeTab === 'all' || activeTab === 'apps') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2
                  className={`text-sm font-semibold ${
                    isLight ? 'text-neutral-950' : 'text-white'
                  }`}
                >
                  Studio Apps & Creative Tools
                </h2>
                <span
                  className={`text-xs ${isLight ? 'text-neutral-500' : 'text-slate-400'}`}
                >
                  Connected to active project: {activeFilm.title}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {APP_CARDS.map((app) => {
                  const Icon = app.icon;
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => {
                        soundFx.playScannerBeep();
                        onNavigate(app.id);
                      }}
                      className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 group ${
                        isLight
                          ? 'bg-white border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/70'
                          : 'bg-[#0d111c] border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span
                            className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                              isLight
                                ? 'bg-neutral-50 border-neutral-200 text-neutral-900'
                                : 'bg-slate-900 border-slate-700 text-white'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </span>
                          <ArrowRight
                            className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                              isLight ? 'text-neutral-600' : 'text-slate-300'
                            }`}
                          />
                        </div>
                        <div
                          className={`text-xs font-semibold ${
                            isLight ? 'text-neutral-950' : 'text-white'
                          }`}
                        >
                          {app.title}
                        </div>
                        <p
                          className={`text-[11px] leading-relaxed line-clamp-2 ${
                            isLight ? 'text-neutral-500' : 'text-slate-400'
                          }`}
                        >
                          {app.description}
                        </p>
                      </div>
                      <div
                        className={`text-[11px] font-medium ${
                          isLight ? 'text-neutral-400' : 'text-slate-500'
                        }`}
                      >
                        {app.category}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Film Slate & Recent Activity (Always reachable + dedicated in My projects) */}
          {(activeTab === 'all' || activeTab === 'projects') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              <div
                className={`lg:col-span-7 rounded-2xl border p-5 space-y-4 ${
                  isLight ? 'bg-white border-neutral-200' : 'bg-[#0d111c] border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between border-b pb-3 border-neutral-100 dark:border-slate-800">
                  <div>
                    <h3
                      className={`text-sm font-semibold ${
                        isLight ? 'text-neutral-950' : 'text-white'
                      }`}
                    >
                      Film Projects ({allFilms.length})
                    </h3>
                    <p className={`text-xs ${isLight ? 'text-neutral-500' : 'text-slate-400'}`}>
                      Open any production in Timeline Editor or delete unused entries
                    </p>
                  </div>
                  {onCreateNewFilm && (
                    <button
                      type="button"
                      onClick={onCreateNewFilm}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        isLight
                          ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-900'
                          : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-white'
                      }`}
                    >
                      + New Film
                    </button>
                  )}
                </div>

                {allFilms.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-500 border border-dashed rounded-xl border-neutral-200">
                    No film projects open. Click + New Film to start a new production.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {allFilms.map((film) => {
                      const isCurrent = film.id === activeFilm.id;
                      const isConfirming = confirmDeleteFilmId === film.id;
                      return (
                        <div
                          key={film.id}
                          className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-colors ${
                            isCurrent
                              ? isLight
                                ? 'bg-neutral-50 border-neutral-900/40'
                                : 'bg-slate-900 border-slate-600'
                              : isLight
                              ? 'bg-white border-neutral-200'
                              : 'bg-slate-950 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <img
                              src={film.coverImage}
                              alt={film.title}
                              referrerPolicy="no-referrer"
                              className="w-11 h-11 rounded-lg object-cover border border-neutral-200 dark:border-slate-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <div
                                className={`text-xs font-semibold truncate ${
                                  isLight ? 'text-neutral-950' : 'text-white'
                                }`}
                              >
                                {film.title}
                              </div>
                              <div className="text-[11px] font-mono-cinema text-neutral-500 truncate">
                                {film.genre} · {film.scenesCount} scenes · {film.resolution}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => onSelectFilm(film)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                isCurrent
                                  ? isLight
                                    ? 'bg-neutral-950 text-white'
                                    : 'bg-white text-black'
                                  : isLight
                                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                              }`}
                            >
                              {isCurrent ? 'Active' : 'Open'}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onSelectFilm(film);
                                onNavigate('editor');
                              }}
                              title="Open in Timeline Editor"
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isLight
                                  ? 'border-neutral-200 hover:bg-neutral-100 text-neutral-700'
                                  : 'border-slate-700 hover:bg-slate-800 text-slate-200'
                              }`}
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>

                            {onDeleteFilm &&
                              (isConfirming ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteFilm(film.id);
                                      setConfirmDeleteFilmId(null);
                                    }}
                                    className="px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold rounded-lg"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteFilmId(null)}
                                    className={`px-2 py-1.5 text-[11px] rounded-lg ${
                                      isLight ? 'bg-neutral-100 text-neutral-700' : 'bg-slate-800 text-slate-300'
                                    }`}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteFilmId(film.id)}
                                  title={`Delete ${film.title}`}
                                  aria-label={`Delete ${film.title}`}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    isLight
                                      ? 'border-neutral-200 text-neutral-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50'
                                      : 'border-slate-700 text-slate-400 hover:text-red-400 hover:bg-red-950/40'
                                  }`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Credits & Studio Activity */}
              <div
                className={`lg:col-span-5 rounded-2xl border p-5 space-y-4 ${
                  isLight ? 'bg-white border-neutral-200' : 'bg-[#0d111c] border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between border-b pb-3 border-neutral-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-neutral-500" />
                    <h3
                      className={`text-sm font-semibold ${
                        isLight ? 'text-neutral-950' : 'text-white'
                      }`}
                    >
                      Recent Credits & Activity
                    </h3>
                  </div>
                  <span className="text-xs font-mono-cinema text-neutral-500">
                    {account ? account.plan : wallet.plan}
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {(usageLogs.length > 0
                    ? usageLogs.slice(0, 6).map((l) => ({
                        id: l.id,
                        title: l.tool,
                        detail: l.summary,
                        meta: `-${l.creditsUsed} cr · ${l.provider}`,
                      }))
                    : history.slice(0, 6).map((h) => ({
                        id: h.id,
                        title: h.tool,
                        detail: h.type,
                        meta: `${h.amount.toLocaleString()} cr · ${h.timestamp}`,
                      }))
                  ).map((entry) => (
                    <div
                      key={entry.id}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                        isLight ? 'bg-[#FAFAFB] border-neutral-200' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div
                          className={`font-semibold truncate ${
                            isLight ? 'text-neutral-950' : 'text-white'
                          }`}
                        >
                          {entry.title}
                        </div>
                        <div className="text-[11px] text-neutral-500 truncate">{entry.detail}</div>
                      </div>
                      <span className="text-[11px] font-mono-cinema text-neutral-600 dark:text-slate-300 shrink-0">
                        {entry.meta}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
