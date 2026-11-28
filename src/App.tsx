import React, { useState } from 'react';
import { StudioModule, ViewPlatform, FilmProject, StudioTheme, type StoryVideoTimeline } from './types';
import { INITIAL_FILMS } from './data/initialData';
import { StudioAiProvider, useStudioAi } from './context/StudioAiContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthModal } from './components/auth/AuthModal';
import { CostApprovalModal } from './components/wallet/CostApprovalModal';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { StudioDashboard } from './components/dashboard/StudioDashboard';
import { FilmStudio } from './components/films/FilmStudio';
import { VideoEditor } from './components/editor/VideoEditor';
import { ScreenplayWriter } from './components/screenplay/ScreenplayWriter';
import { StoryboardStudio } from './components/storyboard/StoryboardStudio';
import { CameraStudio } from './components/camera/CameraStudio';
import { AudioStudio } from './components/audio/AudioStudio';
import { AnimationStudio } from './components/animation/AnimationStudio';
import { VfxStudio } from './components/vfx/VfxStudio';
import { SubtitleStudio } from './components/subtitles/SubtitleStudio';
import { MediaLibrary } from './components/media/MediaLibrary';
import { ExportStudio } from './components/export/ExportStudio';
import { TeamStudio } from './components/team/TeamStudio';
import { SettingsStudio } from './components/settings/SettingsStudio';
import { AiVideoGenerator } from './components/ai/AiVideoGenerator';
import { AiImageGenerator } from './components/ai/AiImageGenerator';
import { CharacterCreator } from './components/ai/CharacterCreator';
import { AiVoiceStudio } from './components/ai/AiVoiceStudio';
import { ColorGradingStudio } from './components/color/ColorGradingStudio';
import { CloudStorageStudio } from './components/cloud/CloudStorageStudio';
import { AiCentralManager } from './components/ai/AiCentralManager';
import { PromptLibraryStudio } from './components/ai/PromptLibraryStudio';
import { CreditWalletStudio } from './components/wallet/CreditWalletStudio';
import { AndroidPreview } from './components/views/AndroidPreview';
import { WebsitePortal } from './components/views/WebsitePortal';
import { AdminPanel } from './components/views/AdminPanel';
import { WordPressIntegration } from './components/views/WordPressIntegration';
import { CodeExplorer } from './components/views/CodeExplorer';
import { DeliverablesPanel } from './components/views/DeliverablesPanel';
import { SocialMediaStudio } from './components/social/SocialMediaStudio';
import { BloggerStudio } from './components/blogger/BloggerStudio';
import { ManhwaStudio } from './components/manhwa/ManhwaStudio';
import { CartoonCreatorStudio, type StoryVideoLaunch } from './components/cartoon/CartoonCreatorStudio';
import { soundFx } from './utils/audioSynth';

const STORAGE_FILMS_KEY = 'fvs_autosave_films_v1';
const STORAGE_ACTIVE_FILM_KEY = 'fvs_autosave_active_film_v1';

function loadSavedFilms(): FilmProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_FILMS_KEY);
    if (raw === null) return INITIAL_FILMS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_FILMS;
    return parsed.filter(
      (f: FilmProject) =>
        f &&
        f.id !== 'film-kalki-01' &&
        !String(f.title || '').toUpperCase().includes('KALKI')
    );
  } catch {
    return INITIAL_FILMS;
  }
}

function StudioApp() {
  const { addAssetToTimeline } = useStudioAi();
  const { syncProjectToCloud, firebaseUser } = useAuth();
  const [films, setFilms] = useState<FilmProject[]>(() => loadSavedFilms());
  const [activeFilm, setActiveFilm] = useState<FilmProject | null>(() => {
    const loaded = loadSavedFilms();
    if (loaded.length === 0) return null;
    try {
      const savedId = localStorage.getItem(STORAGE_ACTIVE_FILM_KEY);
      return loaded.find((f) => f.id === savedId) || loaded[0];
    } catch {
      return loaded[0];
    }
  });
  const [activeModule, setActiveModule] = useState<StudioModule>('dashboard');
  const [storyVideoLaunch, setStoryVideoLaunch] = useState<StoryVideoLaunch>();
  const [storyVideoTimeline, setStoryVideoTimeline] = useState<StoryVideoTimeline>();
  const [resumeStoryProjectId, setResumeStoryProjectId] = useState<string>();
  const [currentPlatform, setCurrentPlatform] = useState<ViewPlatform>('workstation');
  const [theme, setTheme] = useState<StudioTheme>('elevenlabs');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [billingTargetSection, setBillingTargetSection] = useState<
    'my-credits' | 'buy-credits' | 'my-subscription' | null
  >(null);
  const [adminInitialTab, setAdminInitialTab] = useState<
    'ledger' | 'pricing' | 'users' | 'usage' | 'apis'
  >('ledger');

  const persistProjects = (nextFilms: FilmProject[], nextActive: FilmProject | null) => {
    try {
      localStorage.setItem(STORAGE_FILMS_KEY, JSON.stringify(nextFilms));
      if (nextActive) {
        localStorage.setItem(STORAGE_ACTIVE_FILM_KEY, nextActive.id);
      } else {
        localStorage.removeItem(STORAGE_ACTIVE_FILM_KEY);
      }
    } catch {
      // Ignore quota exceeded
    }
  };

  const handleUpdateFilm = (updates: Partial<FilmProject>) => {
    if (!activeFilm) return;
    const updated = { ...activeFilm, ...updates, updatedAt: 'Autosaved just now' };
    setActiveFilm(updated);
    setFilms((prev) => {
      const next = prev.map((f) => (f.id === updated.id ? updated : f));
      persistProjects(next, updated);
      return next;
    });
    if (firebaseUser) {
      syncProjectToCloud(updated).catch(() => {});
    }
  };

  const handleSelectFilm = (f: FilmProject) => {
    setActiveFilm(f);
    persistProjects(films, f);
  };

  const handleDeleteFilm = (filmId: string) => {
    soundFx.playWhoosh();
    fetch(`/api/films/${encodeURIComponent(filmId)}`, { method: 'DELETE' }).catch(() => {});
    setFilms((prev) => {
      const nextFilms = prev.filter((f) => f.id !== filmId);
      const nextActive =
        activeFilm && activeFilm.id !== filmId
          ? activeFilm
          : nextFilms[0] || null;
      setActiveFilm(nextActive);
      persistProjects(nextFilms, nextActive);
      return nextFilms;
    });
  };

  const handleCreateNewFilm = () => {
    soundFx.playCinematicImpact();
    const newProject: FilmProject = {
      id: `film-${Date.now()}`,
      title: `NEW FILM PROJECT ${films.length + 1}`,
      tagline: 'Original feature production inside Film & Video Studio Ultimate.',
      genre: 'Drama / Sci-Fi',
      status: 'Pre-Production',
      budget: 2500000,
      spent: 0,
      scenesCount: 24,
      completedScenes: 0,
      shootingDaysTotal: 15,
      shootingDaysDone: 0,
      aspectRatio: '2.39:1',
      resolution: '4K DCI',
      fps: 24,
      coverImage: '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg',
      director: 'Studio Director',
      dp: 'Lead Cinematographer',
      updatedAt: 'Created just now',
    };
    const nextFilms = [newProject, ...films];
    setFilms(nextFilms);
    setActiveFilm(newProject);
    persistProjects(nextFilms, newProject);
    if (firebaseUser) {
      syncProjectToCloud(newProject).catch(() => {});
    }
  };

  const handleRestoreSampleFilms = () => {
    soundFx.playScannerBeep();
    setFilms(INITIAL_FILMS);
    setActiveFilm(INITIAL_FILMS[0]);
    persistProjects(INITIAL_FILMS, INITIAL_FILMS[0]);
  };

  const handleSelectModule = (mod: StudioModule) => {
    soundFx.playScannerBeep();
    setStoryVideoLaunch(undefined);
    setStoryVideoTimeline(undefined);
    setResumeStoryProjectId(undefined);
    setActiveModule(mod);
    if (currentPlatform !== 'workstation') {
      setCurrentPlatform('workstation');
    }
  };

  const handleStartStoryVideo = (module: 'ai_wizard' | 'cartoon_creator', launch: StoryVideoLaunch) => {
    handleSelectModule(module);
    setStoryVideoLaunch(launch);
  };

  const handleSelectStudioTool = (module: StudioModule) => {
    if (module === 'ai_video') handleStartStoryVideo('ai_wizard', { premise: '', short: true });
    else handleSelectModule(module);
  };

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden select-none ${
      theme === 'elevenlabs'
        ? 'bg-white text-neutral-950'
        : theme === 'creative'
        ? 'bg-[#090b11] text-slate-100'
        : theme === 'cinematic'
        ? 'bg-black text-slate-100'
        : 'bg-[#161a22] text-slate-100'
    }`}>
      {/* Top Application Bar with Navigation and Platform Viewport Switcher */}
      <Header
        currentPlatform={currentPlatform}
        onSelectPlatform={(plat) => {
          soundFx.playScannerBeep();
          setCurrentPlatform(plat);
        }}
        activeFilm={activeFilm}
        onSelectFilm={(f) => {
          soundFx.playShutterSound();
          handleSelectFilm(f);
        }}
        allFilms={films}
        theme={theme}
        onSelectTheme={(t) => {
          soundFx.playScannerBeep();
          setTheme(t);
        }}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        onGoHome={() => {
          setBillingTargetSection(null);
          setActiveModule('dashboard');
          setCurrentPlatform('workstation');
        }}
      />

      {/* Main Studio Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Render Platform-specific Views */}
        {currentPlatform === 'android' && (
          <AndroidPreview activeFilm={activeFilm || INITIAL_FILMS[0]} />
        )}

        {currentPlatform === 'deliverables' && (
          <DeliverablesPanel />
        )}

        {currentPlatform === 'website' && (
          <WebsitePortal
            allFilms={films}
            onOpenWorkstation={() => setCurrentPlatform('workstation')}
            onOpenModule={handleSelectModule}
            onOpenAdmin={() => setCurrentPlatform('admin')}
          />
        )}

        {currentPlatform === 'admin' && (
          <AdminPanel
            allFilms={films}
            onSelectFilm={handleSelectFilm}
            onDeleteFilm={handleDeleteFilm}
            onOpenWorkstation={() => setCurrentPlatform('workstation')}
            initialTab={adminInitialTab}
          />
        )}

        {currentPlatform === 'wordpress' && (
          <WordPressIntegration activeFilm={activeFilm || INITIAL_FILMS[0]} />
        )}

        {currentPlatform === 'code_viewer' && (
          <CodeExplorer />
        )}

        {/* Workstation Desktop Mode: Sidebar + Selected Studio Module */}
        {currentPlatform === 'workstation' && (
          <>
            <Sidebar
              activeModule={activeModule}
              onSelectModule={handleSelectStudioTool}
              theme={theme}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
              onSwitchPlatform={(plat) => setCurrentPlatform(plat)}
              billingSection={billingTargetSection}
              onOpenBillingSection={(section) => {
                soundFx.playScannerBeep();
                setBillingTargetSection(section);
                setActiveModule('credit_wallet');
                setCurrentPlatform('workstation');
              }}
              onOpenAdminPricing={() => {
                soundFx.playScannerBeep();
                setAdminInitialTab('pricing');
                setCurrentPlatform('admin');
              }}
            />

            <main className={`flex-1 flex flex-col overflow-hidden ${theme === 'elevenlabs' ? 'bg-white' : 'bg-slate-950'}`}>
              {!activeFilm && !storyVideoTimeline && activeModule !== 'ai_wizard' && activeModule !== 'cartoon_creator' && activeModule !== 'settings' && activeModule !== 'media' && activeModule !== 'ai_manager' && activeModule !== 'prompt_library' && activeModule !== 'credit_wallet' && (
                <div className={`flex-1 flex items-center justify-center p-8 ${theme === 'elevenlabs' ? 'bg-white' : 'bg-[#090b11]'}`}>
                  <div className={`max-w-md w-full border rounded-2xl p-6 text-center space-y-4 shadow-xl ${
                    theme === 'elevenlabs' ? 'bg-[#FAFAFB] border-neutral-200 text-neutral-900' : 'bg-[#0d111c] border-slate-800 text-slate-100'
                  }`}>
                    <h2 className="text-xl font-bold">No Film Projects Open</h2>
                    <p className={`text-xs leading-relaxed ${theme === 'elevenlabs' ? 'text-neutral-500' : 'text-slate-400'}`}>
                      All film projects were deleted from this workspace. Create a new blank film project or restore the starter studio films to continue.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        onClick={handleCreateNewFilm}
                        className={`px-4 py-2 font-semibold text-xs rounded-xl ${
                          theme === 'elevenlabs' ? 'bg-neutral-950 hover:bg-black text-white' : 'bg-white hover:bg-slate-200 text-black'
                        }`}
                      >
                        + Create New Film
                      </button>
                      <button
                        onClick={handleRestoreSampleFilms}
                        className={`px-4 py-2 border font-medium text-xs rounded-xl ${
                          theme === 'elevenlabs'
                            ? 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                        }`}
                      >
                        Restore Starter Films
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Home Dashboard */}
              {activeFilm && activeModule === 'dashboard' && (
                <StudioDashboard
                  activeFilm={activeFilm}
                  allFilms={films}
                  onSelectFilm={handleSelectFilm}
                  onDeleteFilm={handleDeleteFilm}
                  onCreateNewFilm={handleCreateNewFilm}
                  onNavigate={handleSelectStudioTool}
                  onStartStoryVideo={handleStartStoryVideo}
                  theme={theme}
                />
              )}

              {/* Core Production */}
              {activeFilm && activeModule === 'films' && (
                <FilmStudio
                  activeFilm={activeFilm}
                  onDeleteFilm={handleDeleteFilm}
                />
              )}

              {(activeFilm || storyVideoTimeline) && activeModule === 'editor' && (
                <VideoEditor activeFilm={activeFilm} storyTimeline={storyVideoTimeline} onBackToStory={() => {
                  handleSelectModule('ai_wizard');
                  setResumeStoryProjectId(storyVideoTimeline?.projectId);
                }} />
              )}

              {activeFilm && activeModule === 'script' && (
                <ScreenplayWriter activeFilm={activeFilm} />
              )}

              {activeFilm && activeModule === 'storyboard' && (
                <StoryboardStudio
                  activeFilm={activeFilm}
                  theme={theme}
                  onNavigate={handleSelectModule}
                />
              )}

              {/* AI Central Manager, Prompt Library & Wallet */}
              {activeModule === 'ai_manager' && (
                <AiCentralManager />
              )}

              {activeModule === 'prompt_library' && (
                <PromptLibraryStudio onNavigate={handleSelectModule} />
              )}

              {activeModule === 'credit_wallet' && (
                <CreditWalletStudio
                  theme={theme}
                  initialSection={billingTargetSection}
                  onOpenAdmin={() => {
                    setAdminInitialTab('pricing');
                    setCurrentPlatform('admin');
                  }}
                />
              )}

              {/* AI Creation Suites */}
              {(activeModule === 'cartoon_creator' || activeModule === 'ai_wizard') && (
                <CartoonCreatorStudio
                  key={activeModule + (storyVideoLaunch?.short ? '-short' : '')}
                  theme={theme}
                  onNavigate={handleSelectModule}
                  filmMaker={activeModule === 'ai_wizard'}
                  launch={storyVideoLaunch}
                  resumeProjectId={resumeStoryProjectId}
                  onOpenStoryTimeline={timeline => {
                    handleSelectModule('editor');
                    setStoryVideoTimeline(timeline);
                  }}
                />
              )}

              {activeFilm && activeModule === 'manhwa_studio' && (
                <ManhwaStudio
                  activeFilm={activeFilm}
                  onSendToEditor={() => handleSelectModule('editor')}
                />
              )}

              {activeFilm && activeModule === 'ai_video' && (
                <AiVideoGenerator
                  activeFilm={activeFilm}
                  onSendToTimeline={() => handleSelectModule('editor')}
                />
              )}

              {activeFilm && activeModule === 'ai_image' && (
                <AiImageGenerator
                  activeFilm={activeFilm}
                  theme={theme}
                  onSendToStoryboard={() => handleSelectModule('storyboard')}
                  onNavigate={handleSelectModule}
                />
              )}

              {activeFilm && activeModule === 'character' && (
                <CharacterCreator activeFilm={activeFilm} />
              )}

              {activeFilm && activeModule === 'ai_voice' && (
                <AiVoiceStudio activeFilm={activeFilm} />
              )}

              {/* Audio, Animation, Color & VFX */}
              {activeFilm && activeModule === 'color_grading' && (
                <ColorGradingStudio activeFilm={activeFilm} />
              )}

              {activeFilm && activeModule === 'camera' && (
                <CameraStudio activeFilm={activeFilm} />
              )}

              {activeFilm && activeModule === 'audio' && (
                <AudioStudio activeFilm={activeFilm} />
              )}

              {activeFilm && activeModule === 'animation' && (
                <AnimationStudio
                  activeFilm={activeFilm}
                  theme={theme}
                  onSendToEditor={() => handleSelectModule('editor')}
                  onNavigate={handleSelectModule}
                />
              )}

              {activeFilm && activeModule === 'vfx' && (
                <VfxStudio activeFilm={activeFilm} />
              )}

              {activeFilm && activeModule === 'subtitles' && (
                <SubtitleStudio activeFilm={activeFilm} />
              )}

              {/* Distribution, Cloud & Admin */}
              {activeModule === 'media' && (
                <MediaLibrary
                  activeFilm={activeFilm || INITIAL_FILMS[0]}
                  onSendToEditor={(asset) => {
                    addAssetToTimeline(asset);
                    handleSelectModule('editor');
                  }}
                  onNavigate={(mod) => handleSelectModule(mod)}
                />
              )}

              {activeFilm && activeModule === 'cloud_storage' && (
                <CloudStorageStudio activeFilm={activeFilm} />
              )}

              {activeFilm && activeModule === 'export' && (
                <ExportStudio
                  activeFilm={activeFilm}
                  onOpenSocialMedia={() => handleSelectModule('social_media')}
                  onOpenBlogger={() => handleSelectModule('blogger')}
                />
              )}

              {activeFilm && activeModule === 'social_media' && (
                <SocialMediaStudio activeFilm={activeFilm} />
              )}

              {activeFilm && activeModule === 'blogger' && (
                <BloggerStudio
                  activeFilm={activeFilm}
                  onOpenSocialStudio={() => handleSelectModule('social_media')}
                />
              )}

              {activeFilm && activeModule === 'team' && (
                <TeamStudio activeFilm={activeFilm} />
              )}

              {activeModule === 'settings' && (
                <SettingsStudio
                  activeFilm={activeFilm || INITIAL_FILMS[0]}
                  onUpdateFilm={handleUpdateFilm}
                  onClearAllData={() => {
                    setFilms(INITIAL_FILMS);
                    setActiveFilm(INITIAL_FILMS[0]);
                  }}
                />
              )}
            </main>
          </>
        )}
      </div>

      {/* Global Cost Approval & Account Auth Modals */}
      <CostApprovalModal />
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StudioAiProvider>
          <StudioApp />
        </StudioAiProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
