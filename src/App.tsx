import React, { lazy, Suspense, useEffect, useState } from 'react';
import { StudioModule, ViewPlatform, FilmProject, StudioTheme } from './types';
import { INITIAL_FILMS } from './data/initialData';
import { StudioAiProvider, useStudioAi } from './context/StudioAiContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthModal } from './components/auth/AuthModal';
import { CostApprovalModal } from './components/wallet/CostApprovalModal';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { StudioSearch } from './components/common/StudioSearch';
import { StudioDashboard } from './components/dashboard/StudioDashboard';
import { soundFx } from './utils/audioSynth';

const OpenJarvisStudio = lazy(async () => ({ default: (await import('./components/assistant/OpenJarvisStudio')).OpenJarvisStudio }));
const FilmStudio = lazy(async () => ({ default: (await import('./components/films/FilmStudio')).FilmStudio }));
const VideoEditor = lazy(async () => ({ default: (await import('./components/editor/VideoEditor')).VideoEditor }));
const ScreenplayWriter = lazy(async () => ({ default: (await import('./components/screenplay/ScreenplayWriter')).ScreenplayWriter }));
const StoryboardStudio = lazy(async () => ({ default: (await import('./components/storyboard/StoryboardStudio')).StoryboardStudio }));
const CameraStudio = lazy(async () => ({ default: (await import('./components/camera/CameraStudio')).CameraStudio }));
const AudioStudio = lazy(async () => ({ default: (await import('./components/audio/AudioStudio')).AudioStudio }));
const AnimationStudio = lazy(async () => ({ default: (await import('./components/animation/AnimationStudio')).AnimationStudio }));
const VfxStudio = lazy(async () => ({ default: (await import('./components/vfx/VfxStudio')).VfxStudio }));
const SubtitleStudio = lazy(async () => ({ default: (await import('./components/subtitles/SubtitleStudio')).SubtitleStudio }));
const MediaLibrary = lazy(async () => ({ default: (await import('./components/media/MediaLibrary')).MediaLibrary }));
const ExportStudio = lazy(async () => ({ default: (await import('./components/export/ExportStudio')).ExportStudio }));
const TeamStudio = lazy(async () => ({ default: (await import('./components/team/TeamStudio')).TeamStudio }));
const SettingsStudio = lazy(async () => ({ default: (await import('./components/settings/SettingsStudio')).SettingsStudio }));
const AiVideoGenerator = lazy(async () => ({ default: (await import('./components/ai/AiVideoGenerator')).AiVideoGenerator }));
const AiImageGenerator = lazy(async () => ({ default: (await import('./components/ai/AiImageGenerator')).AiImageGenerator }));
const CharacterCreator = lazy(async () => ({ default: (await import('./components/ai/CharacterCreator')).CharacterCreator }));
const AiVoiceStudio = lazy(async () => ({ default: (await import('./components/ai/AiVoiceStudio')).AiVoiceStudio }));
const ColorGradingStudio = lazy(async () => ({ default: (await import('./components/color/ColorGradingStudio')).ColorGradingStudio }));
const CloudStorageStudio = lazy(async () => ({ default: (await import('./components/cloud/CloudStorageStudio')).CloudStorageStudio }));
const AiFilmWizard = lazy(async () => ({ default: (await import('./components/ai/AiFilmWizard')).AiFilmWizard }));
const AiCentralManager = lazy(async () => ({ default: (await import('./components/ai/AiCentralManager')).AiCentralManager }));
const PromptLibraryStudio = lazy(async () => ({ default: (await import('./components/ai/PromptLibraryStudio')).PromptLibraryStudio }));
const CreditWalletStudio = lazy(async () => ({ default: (await import('./components/wallet/CreditWalletStudio')).CreditWalletStudio }));
const SocialMediaStudio = lazy(async () => ({ default: (await import('./components/social/SocialMediaStudio')).SocialMediaStudio }));
const BloggerStudio = lazy(async () => ({ default: (await import('./components/blogger/BloggerStudio')).BloggerStudio }));
const ManhwaStudio = lazy(async () => ({ default: (await import('./components/manhwa/ManhwaStudio')).ManhwaStudio }));
const CartoonCreatorStudio = lazy(async () => ({ default: (await import('./components/cartoon/CartoonCreatorStudio')).CartoonCreatorStudio }));
const AndroidPreview = lazy(async () => ({ default: (await import('./components/views/AndroidPreview')).AndroidPreview }));
const WebsitePortal = lazy(async () => ({ default: (await import('./components/views/WebsitePortal')).WebsitePortal }));
const AdminPanel = lazy(async () => ({ default: (await import('./components/views/AdminPanel')).AdminPanel }));
const WordPressIntegration = lazy(async () => ({ default: (await import('./components/views/WordPressIntegration')).WordPressIntegration }));
const CodeExplorer = lazy(async () => ({ default: (await import('./components/views/CodeExplorer')).CodeExplorer }));
const DeliverablesPanel = lazy(async () => ({ default: (await import('./components/views/DeliverablesPanel')).DeliverablesPanel }));

const STORAGE_FILMS_KEY = 'fvs_autosave_films_v1';
const STUDIO_THEME_KEY = 'fvs_studio_theme';
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
  const [activeModule, setActiveModule] = useState<StudioModule>(() =>
    new URLSearchParams(window.location.search).get('tool') === 'openjarvis' ? 'openjarvis' : 'dashboard'
  );
  const [currentPlatform, setCurrentPlatform] = useState<ViewPlatform>('workstation');
  const [theme, setTheme] = useState<StudioTheme>(() => {
    try {
      const savedTheme = localStorage.getItem(STUDIO_THEME_KEY);
      if (savedTheme === 'elevenlabs' || savedTheme === 'creative' || savedTheme === 'cinematic' || savedTheme === 'premiere') {
        return savedTheme;
      }
    } catch {
      // Use the default theme when storage is unavailable.
    }
    return 'creative';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [studioSearchOpen, setStudioSearchOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [billingTargetSection, setBillingTargetSection] = useState<
    'my-credits' | 'buy-credits' | 'my-subscription' | null
  >(null);
  const [adminInitialTab, setAdminInitialTab] = useState<
    'ledger' | 'pricing' | 'users' | 'usage' | 'apis'
  >('ledger');

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileMenuOpen(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) document.querySelector<HTMLElement>('[data-close-studio-menu]')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (mobileMenuOpen && event.key === 'Escape') {
        event.preventDefault();
        closeMobileMenu();
      }
      if (!mobileMenuOpen && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setQueueOpen(false);
        setStudioSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
    requestAnimationFrame(() => document.getElementById('studio-menu-trigger')?.focus());
  }

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

  const openFilmIdea = (idea: string) => {
    if (!activeFilm) handleCreateNewFilm();
    try {
      localStorage.setItem('fvs_active_flow_prompt', idea);
    } catch {
      // Film Maker can still open when storage is unavailable.
    }
    handleSelectModule('ai_wizard');
  };

  const handleSelectModule = (mod: StudioModule) => {
    soundFx.playScannerBeep();
    if (mobileMenuOpen) closeMobileMenu();
    setActiveModule(mod);
    const url = new URL(window.location.href);
    if (mod === 'openjarvis') url.searchParams.set('tool', 'openjarvis');
    else if (url.searchParams.get('tool') === 'openjarvis') url.searchParams.delete('tool');
    if (url.href !== window.location.href) window.history.replaceState(null, '', url);
    setBillingTargetSection(null);
    if (currentPlatform !== 'workstation') {
      setCurrentPlatform('workstation');
    }
  };

  return (
    <div data-studio-light={theme === 'elevenlabs'} className={`studio-shell flex flex-col h-dvh w-full overflow-hidden ${
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
          try {
            localStorage.setItem(STUDIO_THEME_KEY, t);
          } catch {
            // The selected theme still applies to this session.
          }
        }}
        mobileMenuOpen={mobileMenuOpen}
        onOpenMobileMenu={() => { setQueueOpen(false); setMobileMenuOpen(true); }}
        onOpenSearch={() => { setQueueOpen(false); setStudioSearchOpen(true); }}
        queueOpen={queueOpen}
        onQueueOpenChange={setQueueOpen}
        onGoHome={() => {
          handleSelectModule('dashboard');
        }}
      />

      {/* Main Studio Viewport */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <Suspense fallback={<div className="studio-loading" role="status">Loading studio view…</div>}>
          {/* Render Platform-specific Views */}
          {currentPlatform === 'android' && (
            <AndroidPreview activeFilm={activeFilm || INITIAL_FILMS[0]} onOpenAssistant={() => handleSelectModule('openjarvis')} />
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
        </Suspense>

        {/* Workstation Desktop Mode: Sidebar + Selected Studio Module */}
        {currentPlatform === 'workstation' && (
          <>
            {mobileMenuOpen && <div className="studio-menu-backdrop lg:hidden" onClick={closeMobileMenu} />}
            <div
              id="studio-module-menu"
              className={`studio-sidebar-region shrink-0 ${mobileMenuOpen ? 'block' : 'hidden'} lg:block`}
              role={mobileMenuOpen ? 'dialog' : undefined}
              aria-modal={mobileMenuOpen || undefined}
              aria-label={mobileMenuOpen ? 'Studio menu' : undefined}
            >
              <Sidebar
                activeModule={activeModule}
                onSelectModule={handleSelectModule}
                theme={theme}
                collapsed={sidebarCollapsed && !mobileMenuOpen}
                onCloseMobile={closeMobileMenu}
                onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
                onSwitchPlatform={(plat) => setCurrentPlatform(plat)}
                billingSection={billingTargetSection}
                onOpenBillingSection={(section) => {
                  handleSelectModule('credit_wallet');
                  setBillingTargetSection(section);
                }}
                onOpenAdminPricing={() => {
                  if (mobileMenuOpen) closeMobileMenu();
                  soundFx.playScannerBeep();
                  setAdminInitialTab('pricing');
                  setCurrentPlatform('admin');
                }}
              />
            </div>

            <main inert={mobileMenuOpen} className={`min-w-0 flex-1 flex flex-col overflow-hidden ${theme === 'elevenlabs' ? 'bg-white' : 'bg-slate-950'}`}>
              {!activeFilm && activeModule !== 'dashboard' && activeModule !== 'openjarvis' && activeModule !== 'settings' && activeModule !== 'media' && activeModule !== 'ai_manager' && activeModule !== 'prompt_library' && activeModule !== 'credit_wallet' && (
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

              <Suspense fallback={<div className="studio-loading" role="status">Loading studio tool…</div>}>
              {/* Home Dashboard */}
              {activeModule === 'dashboard' && (
                <StudioDashboard
                  activeFilm={activeFilm}
                  allFilms={films}
                  onSelectFilm={handleSelectFilm}
                  onDeleteFilm={handleDeleteFilm}
                  onCreateNewFilm={handleCreateNewFilm}
                  onRestoreSampleFilms={handleRestoreSampleFilms}
                  onNavigate={handleSelectModule}
                  onOpenQueue={() => setQueueOpen(true)}
                  theme={theme}
                />
              )}

              {activeModule === 'openjarvis' && (
                <OpenJarvisStudio onNavigate={handleSelectModule} onUseFilmIdea={openFilmIdea} />
              )}

              {/* Core Production */}
              {activeFilm && activeModule === 'films' && (
                <FilmStudio
                  activeFilm={activeFilm}
                  onDeleteFilm={handleDeleteFilm}
                />
              )}

              {activeFilm && activeModule === 'editor' && (
                <VideoEditor activeFilm={activeFilm} />
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
              {activeModule === 'cartoon_creator' && (
                <CartoonCreatorStudio
                  theme={theme}
                  onNavigate={handleSelectModule}
                />
              )}

              {activeFilm && activeModule === 'ai_wizard' && (
                <AiFilmWizard
                  activeFilm={activeFilm}
                  onOpenEditor={() => handleSelectModule('editor')}
                  onUpdateFilm={handleUpdateFilm}
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
              </Suspense>
            </main>
          </>
        )}
      </div>

      {/* Global Cost Approval & Account Auth Modals */}
      <CostApprovalModal />
      {studioSearchOpen && <StudioSearch onClose={() => setStudioSearchOpen(false)} onSelect={handleSelectModule} />}
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
