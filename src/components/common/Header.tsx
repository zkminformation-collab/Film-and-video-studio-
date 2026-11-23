import React, { useState } from 'react';
import {
  Bell,
  PanelLeft,
  Volume2,
  RotateCcw,
  UserCheck,
  Sun,
  Moon,
} from 'lucide-react';
import { ViewPlatform, FilmProject, StudioTheme } from '../../types';
import { useStudioAi } from '../../context/StudioAiContext';
import { useAuth } from '../../context/AuthContext';
import { soundFx } from '../../utils/audioSynth';

interface HeaderProps {
  currentPlatform: ViewPlatform;
  onSelectPlatform: (platform: ViewPlatform) => void;
  activeFilm: FilmProject | null;
  onSelectFilm: (film: FilmProject) => void;
  allFilms: FilmProject[];
  theme: StudioTheme;
  onSelectTheme: (theme: StudioTheme) => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onGoHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPlatform,
  onSelectPlatform,
  activeFilm,
  onSelectFilm,
  allFilms,
  theme,
  onSelectTheme,
  sidebarCollapsed,
  onToggleSidebar,
  onGoHome,
}) => {
  const { queue, isReprocessing, reprocessAllPending } = useStudioAi();
  const { account, openAuthModal } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);

  const pendingCount = queue.filter((i) => i.status === 'Queued' || i.status === 'Failed').length;
  const isLight = theme === 'elevenlabs';

  const initials = account?.displayName
    ? account.displayName
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() || '')
        .join('')
    : '';

  return (
    <header
      className={`h-14 border-b px-4 flex items-center justify-between gap-4 shrink-0 z-40 select-none transition-colors ${
        isLight
          ? 'bg-white border-neutral-200 text-neutral-900'
          : 'bg-slate-950/95 border-slate-800 text-slate-100'
      }`}
    >
      {/* Zone 1: Brand Title & Sidebar Collapse */}
      <div className="flex items-center gap-3 shrink-0">
        {currentPlatform === 'workstation' && onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight
                ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <a
          href="/"
          aria-label="ZKMAP STUDIO Home"
          onClick={(e) => {
            e.preventDefault();
            soundFx.playScannerBeep();
            if (onGoHome) {
              onGoHome();
            } else {
              onSelectPlatform('workstation');
            }
          }}
          className="flex items-center gap-2.5 shrink-0 cursor-pointer whitespace-nowrap group"
        >
          <img
            src="/images/zkmap-studio-logo.png"
            alt="ZKMAP STUDIO"
            className="h-9 sm:h-10 w-auto max-w-[160px] sm:max-w-[220px] rounded-lg object-contain border border-neutral-800/30 shadow-sm cursor-pointer transition-transform group-hover:scale-[1.02]"
          />
          <div className="flex flex-col leading-tight">
            <span
              className={`text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap ${
                isLight ? 'text-neutral-950' : 'text-white'
              }`}
            >
              ZKMAP STUDIO
            </span>
          </div>
        </a>
      </div>

      {/* Zone 3: Project Picker, Theme Toggle, Queue Bell & Account Avatar */}
      <div className="flex items-center gap-2.5 shrink-0 relative">
        {pendingCount > 0 && (
          <button
            type="button"
            disabled={isReprocessing}
            onClick={() => reprocessAllPending()}
            className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap shrink-0 ${
              isLight
                ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isReprocessing ? 'animate-spin' : ''}`} />
            <span>{isReprocessing ? 'Reprocessing' : `Retry ${pendingCount}`}</span>
          </button>
        )}

        <div
          className={`hidden sm:flex items-center rounded-lg border px-2.5 py-1.5 ${
            isLight
              ? 'bg-neutral-50 border-neutral-200 text-neutral-900'
              : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}
        >
          <select
            value={activeFilm?.id || ''}
            disabled={allFilms.length === 0}
            onChange={(e) => {
              const selected = allFilms.find((f) => f.id === e.target.value);
              if (selected) onSelectFilm(selected);
            }}
            aria-label="Active Film Project"
            className="bg-transparent text-xs font-medium border-0 focus:ring-0 cursor-pointer outline-none max-w-[140px] truncate disabled:opacity-50"
          >
            {allFilms.length === 0 ? (
              <option value="">No Active Film</option>
            ) : (
              allFilms.map((film) => (
                <option
                  key={film.id}
                  value={film.id}
                  className={isLight ? 'bg-white text-neutral-900' : 'bg-slate-900 text-slate-100'}
                >
                  {film.title}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Light/Dark Studio Theme Switch */}
        <button
          type="button"
          onClick={() => onSelectTheme(isLight ? 'creative' : 'elevenlabs')}
          title={isLight ? 'Switch to Dark Studio Canvas' : 'Switch to Clean Light Canvas'}
          aria-label="Toggle studio theme"
          className={`p-2 rounded-lg border transition-colors ${
            isLight
              ? 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Audio Monitor Quick Test */}
        <button
          type="button"
          onClick={() => {
            soundFx.unlock();
            soundFx.playCinematicImpact();
          }}
          title="Test studio audio monitor"
          aria-label="Test audio monitor"
          className={`p-2 rounded-lg border transition-colors ${
            isLight
              ? 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Volume2 className="w-4 h-4" />
        </button>

        {/* Notifications / Render Queue Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((o) => !o)}
            aria-label="Studio notifications and render queue"
            className={`p-2 rounded-lg border transition-colors relative ${
              isLight
                ? 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            {pendingCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
            )}
          </button>

          {notifOpen && (
            <div
              className={`absolute right-0 mt-2 w-72 rounded-2xl border shadow-xl p-3 space-y-2 z-50 ${
                isLight
                  ? 'bg-white border-neutral-200 text-neutral-900'
                  : 'bg-slate-900 border-slate-700 text-slate-100'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-2 border-neutral-200 dark:border-slate-800">
                <span className="text-xs font-semibold">Studio Queue</span>
                {pendingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void reprocessAllPending()}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Reprocess all
                  </button>
                )}
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5">
                {queue.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-3 text-center">
                    All workflows completed cleanly.
                  </p>
                ) : (
                  queue.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className={`p-2 rounded-xl text-xs border ${
                        isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold truncate">{item.tool}</span>
                        <span className="text-[11px] font-mono-cinema text-neutral-500">
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 truncate mt-0.5">{item.prompt}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Account Ring Avatar (ElevenLabs top-right look) */}
        <button
          type="button"
          onClick={openAuthModal}
          className={`flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            isLight
              ? 'bg-white border-neutral-200 hover:border-neutral-400 text-neutral-900'
              : 'bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-100'
          }`}
          title={account ? `${account.displayName} (${account.plan})` : 'Sign in or register'}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border ${
              account
                ? isLight
                  ? 'bg-neutral-950 text-white border-neutral-950'
                  : 'bg-white text-black border-white'
                : isLight
                ? 'bg-neutral-100 text-neutral-700 border-neutral-300'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {initials || <UserCheck className="w-3.5 h-3.5" />}
          </span>
          <span className="hidden md:inline max-w-[92px] truncate">
            {account ? account.displayName.split(' ')[0] : 'Sign In'}
          </span>
        </button>
      </div>
    </header>
  );
};
