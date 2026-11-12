import React, { useState } from 'react';
import { StudioModule, ViewPlatform, FilmProject, StudioTheme } from './types';
import { INITIAL_FILMS } from './data/initialData';
import { StudioAiProvider } from './context/StudioAiContext';
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
import { AiFilmWizard } from './components/ai/AiFilmWizard';
import { AiCentralManager } from './components/ai/AiCentralManager';
import { PromptLibraryStudio } from './components/ai/PromptLibraryStudio';
import { CreditWalletStudio } from './components/wallet/CreditWalletStudio';
import { AndroidPreview } from './components/views/AndroidPreview';
import { WebsitePortal } from './components/views/WebsitePortal';
import { AdminPanel } from './components/views/AdminPanel';
import { WordPressIntegration } from './components/views/WordPressIntegration';
import { CodeExplorer } from './components/views/CodeExplorer';
import { DeliverablesPanel } from './components/views/DeliverablesPanel';
import { soundFx } from './utils/audioSynth';

function StudioApp() {
  const [films, setFilms] = useState<FilmProject[]>(INITIAL_FILMS);
  const [activeFilm, setActiveFilm] = useState<FilmProject>(INITIAL_FILMS[0]);
  const [activeModule, setActiveModule] = useState<StudioModule>('dashboard');
  const [currentPlatform, setCurrentPlatform] = useState<ViewPlatform>('workstation');
  const [theme, setTheme] = useState<StudioTheme>('creative');

  const handleUpdateFilm = (updates: Partial<FilmProject>) => {
    const updated = { ...activeFilm, ...updates };
    setActiveFilm(updated);
    setFilms((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  const handleSelectModule = (mod: StudioModule) => {
    soundFx.playScannerBeep();
    setActiveModule(mod);
    if (currentPlatform !== 'workstation') {
      setCurrentPlatform('workstation');
    }
  };

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden text-slate-100 select-none ${
      theme === 'creative'
        ? 'bg-[#090b11]'
        : theme === 'cinematic'
        ? 'bg-black'
        : 'bg-[#161a22]'
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
          setActiveFilm(f);
        }}
        allFilms={films}
        theme={theme}
        onSelectTheme={(t) => {
          soundFx.playScannerBeep();
          setTheme(t);
        }}
      />

      {/* Main Studio Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Render Platform-specific Views */}
        {currentPlatform === 'android' && (
          <AndroidPreview activeFilm={activeFilm} />
        )}

        {currentPlatform === 'deliverables' && (
          <DeliverablesPanel />
        )}

        {currentPlatform === 'website' && (
          <WebsitePortal
            allFilms={films}
            onOpenWorkstation={() => setCurrentPlatform('workstation')}
          />
        )}

        {currentPlatform === 'admin' && (
          <AdminPanel
            allFilms={films}
            onSelectFilm={setActiveFilm}
            onOpenWorkstation={() => setCurrentPlatform('workstation')}
          />
        )}

        {currentPlatform === 'wordpress' && (
          <WordPressIntegration activeFilm={activeFilm} />
        )}

        {currentPlatform === 'code_viewer' && (
          <CodeExplorer />
        )}

        {/* Workstation Desktop Mode: Sidebar + Selected Studio Module */}
        {currentPlatform === 'workstation' && (
          <>
            <Sidebar
              activeModule={activeModule}
              onSelectModule={handleSelectModule}
              theme={theme}
            />

            <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
              {/* Home Dashboard */}
              {activeModule === 'dashboard' && (
                <StudioDashboard
                  activeFilm={activeFilm}
                  allFilms={films}
                  onSelectFilm={setActiveFilm}
                  onNavigate={handleSelectModule}
                  theme={theme}
                />
              )}

              {/* Core Production */}
              {activeModule === 'films' && (
                <FilmStudio activeFilm={activeFilm} />
              )}

              {activeModule === 'editor' && (
                <VideoEditor activeFilm={activeFilm} />
              )}

              {activeModule === 'script' && (
                <ScreenplayWriter activeFilm={activeFilm} />
              )}

              {activeModule === 'storyboard' && (
                <StoryboardStudio activeFilm={activeFilm} />
              )}

              {/* AI Central Manager, Prompt Library & Wallet */}
              {activeModule === 'ai_manager' && (
                <AiCentralManager />
              )}

              {activeModule === 'prompt_library' && (
                <PromptLibraryStudio onNavigate={handleSelectModule} />
              )}

              {activeModule === 'credit_wallet' && (
                <CreditWalletStudio />
              )}

              {/* AI Creation Suites */}
              {activeModule === 'ai_wizard' && (
                <AiFilmWizard
                  activeFilm={activeFilm}
                  onOpenEditor={() => handleSelectModule('editor')}
                  onUpdateFilm={handleUpdateFilm}
                />
              )}

              {activeModule === 'ai_video' && (
                <AiVideoGenerator
                  activeFilm={activeFilm}
                  onSendToTimeline={() => handleSelectModule('editor')}
                />
              )}

              {activeModule === 'ai_image' && (
                <AiImageGenerator
                  activeFilm={activeFilm}
                  onSendToStoryboard={() => handleSelectModule('storyboard')}
                />
              )}

              {activeModule === 'character' && (
                <CharacterCreator activeFilm={activeFilm} />
              )}

              {activeModule === 'ai_voice' && (
                <AiVoiceStudio activeFilm={activeFilm} />
              )}

              {/* Audio, Animation, Color & VFX */}
              {activeModule === 'color_grading' && (
                <ColorGradingStudio activeFilm={activeFilm} />
              )}

              {activeModule === 'camera' && (
                <CameraStudio activeFilm={activeFilm} />
              )}

              {activeModule === 'audio' && (
                <AudioStudio activeFilm={activeFilm} />
              )}

              {activeModule === 'animation' && (
                <AnimationStudio activeFilm={activeFilm} />
              )}

              {activeModule === 'vfx' && (
                <VfxStudio activeFilm={activeFilm} />
              )}

              {activeModule === 'subtitles' && (
                <SubtitleStudio activeFilm={activeFilm} />
              )}

              {/* Distribution, Cloud & Admin */}
              {activeModule === 'media' && (
                <MediaLibrary activeFilm={activeFilm} />
              )}

              {activeModule === 'cloud_storage' && (
                <CloudStorageStudio activeFilm={activeFilm} />
              )}

              {activeModule === 'export' && (
                <ExportStudio activeFilm={activeFilm} />
              )}

              {activeModule === 'team' && (
                <TeamStudio activeFilm={activeFilm} />
              )}

              {activeModule === 'settings' && (
                <SettingsStudio
                  activeFilm={activeFilm}
                  onUpdateFilm={handleUpdateFilm}
                />
              )}
            </main>
          </>
        )}
      </div>

      {/* Global Cost Approval Modal */}
      <CostApprovalModal />
    </div>
  );
}

export default function App() {
  return (
    <StudioAiProvider>
      <StudioApp />
    </StudioAiProvider>
  );
}
