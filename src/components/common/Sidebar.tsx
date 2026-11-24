import React, { useEffect, useState } from 'react';
import {
  LayoutGrid,
  Mic2,
  AudioLines,
  House,
  Clapperboard,
  FolderOpen,
  BookOpen,
  Sparkles,
  Volume2,
  Film,
  Image as ImageIcon,
  Music,
  Languages,
  Download,
  FileText,
  Palette,
  Wand2,
  Sliders,
  Camera,
  Globe,
  Cloud,
  Wallet,
  Users,
  Settings,
  ChevronRight,
  Pin,
  PinOff,
  Plus,
  PanelLeft,
  X,
  ChevronDown,
  Lock,
  Coins,
  CreditCard,
} from 'lucide-react';
import { StudioModule, StudioTheme, ViewPlatform } from '../../types';
import { soundFx } from '../../utils/audioSynth';
import { useAuth } from '../../context/AuthContext';

export type BillingSectionTarget = 'my-credits' | 'buy-credits' | 'my-subscription';

interface SidebarProps {
  activeModule: StudioModule;
  onSelectModule: (module: StudioModule) => void;
  theme: StudioTheme;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile: () => void;
  onSwitchPlatform?: (platform: ViewPlatform) => void;
  billingSection?: BillingSectionTarget | null;
  onOpenBillingSection?: (section: BillingSectionTarget) => void;
  onOpenAdminPricing?: () => void;
}

interface SidebarTool {
  id: StudioModule;
  label: string;
  icon: React.ElementType;
}

const PRIMARY_ITEMS: Array<{
  id: StudioModule;
  label: string;
  icon: React.ElementType;
  hasQuickAdd?: boolean;
}> = [
  { id: 'dashboard', label: 'Overview', icon: House },
  { id: 'cartoon_creator', label: 'AI Cartoon Creator', icon: Clapperboard },
  { id: 'ai_voice', label: 'Voice Studio', icon: Mic2, hasQuickAdd: true },
  { id: 'editor', label: 'Timeline Editor', icon: Film },
  { id: 'ai_wizard', label: 'AI Film Maker', icon: Sparkles },
  { id: 'films', label: 'My Projects', icon: Clapperboard },
  { id: 'media', label: 'Asset Library', icon: FolderOpen },
  { id: 'prompt_library', label: 'Prompt Library', icon: LayoutGrid },
];

const ALL_STUDIO_TOOLS: SidebarTool[] = [
  { id: 'cartoon_creator', label: 'AI Cartoon Creator', icon: Clapperboard },
  { id: 'ai_voice', label: 'Text to Speech', icon: AudioLines },
  { id: 'character', label: 'Voice Creation', icon: Mic2 },
  { id: 'audio', label: 'Sound Effects & Music', icon: Volume2 },
  { id: 'ai_video', label: 'AI Video Generator', icon: Film },
  { id: 'manhwa_studio', label: 'Manhwa Studio', icon: BookOpen },
  { id: 'ai_image', label: 'AI Image Studio', icon: ImageIcon },
  { id: 'subtitles', label: 'Dubbing & Subtitles', icon: Languages },
  { id: 'export', label: 'Export & MP4', icon: Download },
  { id: 'script', label: 'Screenplay Writer', icon: FileText },
  { id: 'storyboard', label: 'Storyboard', icon: LayoutGrid },
  { id: 'animation', label: 'Animation 2D/3D', icon: Palette },
  { id: 'vfx', label: 'VFX & Shaders', icon: Wand2 },
  { id: 'color_grading', label: 'Color Grading', icon: Sliders },
  { id: 'camera', label: 'Camera Booth', icon: Camera },
  { id: 'social_media', label: 'Social Studio', icon: Globe },
  { id: 'blogger', label: 'Blogger Studio', icon: Music },
  { id: 'cloud_storage', label: 'Cloud Storage', icon: Cloud },
  { id: 'credit_wallet', label: 'Credits & Plans', icon: Wallet },
  { id: 'team', label: 'Team & Call Sheets', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'ai_manager', label: 'AI Control Center', icon: Sparkles },
];

export const studioNavigationTools = [...new Map([...ALL_STUDIO_TOOLS, ...PRIMARY_ITEMS].map((tool) => [tool.id, tool])).values()];

const DEFAULT_PINNED_IDS: StudioModule[] = [
  'character',
  'audio',
  'ai_video',
  'manhwa_studio',
  'ai_image',
  'subtitles',
  'export',
];

const PINNED_STORAGE_KEY = 'fvs_sidebar_pinned_v1';

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  theme,
  collapsed = false,
  onToggleCollapse,
  onCloseMobile,
  billingSection = null,
  onOpenBillingSection,
  onOpenAdminPricing,
}) => {
  const { isAdmin } = useAuth();
  const [creditsMenuOpen, setCreditsMenuOpen] = useState<boolean>(true);
  const [pinnedIds, setPinnedIds] = useState<StudioModule[]>(() => {
    try {
      const saved = localStorage.getItem(PINNED_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_PINNED_IDS;
  });

  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinnedIds));
    } catch {
      // ignore storage errors
    }
  }, [pinnedIds]);

  const togglePin = (id: StudioModule, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playScannerBeep();
    setPinnedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const additionalTools = ALL_STUDIO_TOOLS.filter(({ id }) =>
    id !== 'credit_wallet' && id !== 'settings' && !PRIMARY_ITEMS.some((item) => item.id === id)
  );
  const pinnedTools = additionalTools.filter((tool) => pinnedIds.includes(tool.id));
  const moreTools = additionalTools.filter((tool) => !pinnedIds.includes(tool.id));
  const isLight = theme === 'elevenlabs';

  return (
    <aside
      className={`studio-sidebar h-full ${collapsed ? 'lg:w-16' : 'lg:w-60'} w-full border-r flex flex-col select-none relative`}
      data-light={isLight}
      data-collapsed={collapsed}
    >
      <div className="studio-sidebar-heading">
        {!collapsed && <span>Workspace</span>}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:grid"
          >
            <PanelLeft size={17} />
          </button>
        )}
        <button type="button" onClick={onCloseMobile} className="lg:hidden" aria-label="Close studio menu" data-close-studio-menu>
          <X size={20} />
        </button>
      </div>

      {/* Scrollable Navigation */}
      <nav aria-label="Studio modules" className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
        {/* Core Workspace Section */}
        <div className="space-y-0.5">
          {PRIMARY_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <div
                key={item.id}
                onClick={() => onSelectModule(item.id)}
                role="button"
                aria-current={isActive ? "page" : undefined}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelectModule(item.id);
                  }
                }}
                aria-label={collapsed ? item.label : undefined}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[13px] cursor-pointer transition-colors ${
                  isActive
                    ? isLight
                      ? 'bg-neutral-200/80 text-neutral-950 font-semibold'
                      : 'bg-slate-800 text-white font-semibold'
                    : isLight
                    ? 'text-neutral-700 hover:bg-neutral-200/50 hover:text-neutral-950'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? isLight
                          ? 'text-neutral-950'
                          : 'text-white'
                        : isLight
                        ? 'text-neutral-600'
                        : 'text-slate-400'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!collapsed && item.hasQuickAdd && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectModule('character');
                    }}
                    title="Create character voice"
                    className={`p-1 rounded-md transition-colors ${
                      isLight ? 'hover:bg-neutral-300/70 text-neutral-500' : 'hover:bg-slate-700 text-slate-400'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Credits & Plans Expandable Tree */}
          <div className="pt-1 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                if (collapsed) {
                  onSelectModule('credit_wallet');
                } else {
                  setCreditsMenuOpen((prev) => !prev);
                }
              }}
              aria-label="Credits & Plans"
              aria-expanded={collapsed ? undefined : creditsMenuOpen}
              title={collapsed ? 'Credits & Plans' : undefined}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[13px] transition-colors ${
                activeModule === 'credit_wallet'
                  ? isLight
                    ? 'bg-neutral-200/80 text-neutral-950 font-semibold'
                    : 'bg-slate-800 text-white font-semibold'
                  : isLight
                  ? 'text-neutral-700 hover:bg-neutral-200/50 hover:text-neutral-950'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Wallet
                  className={`w-4 h-4 shrink-0 ${
                    activeModule === 'credit_wallet'
                      ? isLight
                        ? 'text-neutral-950'
                        : 'text-white'
                      : isLight
                      ? 'text-neutral-600'
                      : 'text-slate-400'
                  }`}
                />
                {!collapsed && <span className="truncate">Credits &amp; Plans</span>}
              </span>
              {!collapsed && (
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                    creditsMenuOpen ? 'rotate-0' : '-rotate-90'
                  } ${isLight ? 'text-neutral-500' : 'text-slate-400'}`}
                />
              )}
            </button>

            {!collapsed && creditsMenuOpen && (
              <div
                className={`ml-3.5 pl-2.5 border-l space-y-0.5 ${
                  isLight ? 'border-neutral-200' : 'border-slate-800'
                }`}
              >
                {[
                  {
                    key: 'my-credits' as const,
                    label: 'My Credits',
                    icon: Coins,
                  },
                  {
                    key: 'buy-credits' as const,
                    label: 'Buy Credits',
                    icon: Plus,
                  },
                  {
                    key: 'my-subscription' as const,
                    label: 'My Subscription',
                    icon: CreditCard,
                  },
                ].map((sub) => {
                  const SubIcon = sub.icon;
                  const subActive =
                    activeModule === 'credit_wallet' && billingSection === sub.key;
                  return (
                    <button
                      key={sub.key}
                      type="button"
                      onClick={() => {
                        if (onOpenBillingSection) {
                          onOpenBillingSection(sub.key);
                        } else {
                          onSelectModule('credit_wallet');
                        }
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        subActive
                          ? isLight
                            ? 'bg-neutral-200/80 text-neutral-950 font-semibold'
                            : 'bg-slate-800 text-white font-semibold'
                          : isLight
                          ? 'text-neutral-600 hover:bg-neutral-200/50 hover:text-neutral-950'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <SubIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{sub.label}</span>
                    </button>
                  );
                })}

                {isAdmin && onOpenAdminPricing && (
                  <button
                    type="button"
                    onClick={onOpenAdminPricing}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isLight
                        ? 'text-neutral-800 hover:bg-neutral-200/70'
                        : 'text-amber-300 hover:bg-slate-900'
                    }`}
                    title="Authorized Administrator Price & Plan Configuration"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Sliders className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Admin Price Config</span>
                    </span>
                    <Lock className="w-3 h-3 shrink-0 opacity-80" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Settings Direct Link */}
          <button
            type="button"
            onClick={() => onSelectModule('settings')}
            aria-label="Settings"
            aria-current={activeModule === 'settings' ? 'page' : undefined}
            title={collapsed ? 'Settings' : undefined}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] transition-colors ${
              activeModule === 'settings'
                ? isLight
                  ? 'bg-neutral-200/80 text-neutral-950 font-semibold'
                  : 'bg-slate-800 text-white font-semibold'
                : isLight
                ? 'text-neutral-700 hover:bg-neutral-200/50 hover:text-neutral-950'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Settings
              className={`w-4 h-4 shrink-0 ${
                activeModule === 'settings'
                  ? isLight
                    ? 'text-neutral-950'
                    : 'text-white'
                  : isLight
                  ? 'text-neutral-600'
                  : 'text-slate-400'
              }`}
            />
            {!collapsed && <span className="truncate">Settings</span>}
          </button>
        </div>

        {/* Pinned Tools Section */}
        <div className="space-y-1">
          {!collapsed && (
            <div
              className={`px-2.5 pb-1 text-xs font-medium ${
                isLight ? 'text-neutral-500' : 'text-slate-400'
              }`}
            >
              Pinned
            </div>
          )}

          {pinnedTools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeModule === tool.id;
            return (
              <div
                key={tool.id}
                onClick={() => onSelectModule(tool.id)}
                role="button"
                aria-current={isActive ? "page" : undefined}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelectModule(tool.id);
                  }
                }}
                aria-label={collapsed ? tool.label : undefined}
                title={collapsed ? tool.label : undefined}
                className={`group w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[13px] cursor-pointer transition-colors ${
                  isActive
                    ? isLight
                      ? 'bg-neutral-200/80 text-neutral-950 font-semibold'
                      : 'bg-slate-800 text-white font-semibold'
                    : isLight
                    ? 'text-neutral-700 hover:bg-neutral-200/50 hover:text-neutral-950'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? isLight
                          ? 'text-neutral-950'
                          : 'text-white'
                        : isLight
                        ? 'text-neutral-600'
                        : 'text-slate-400'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{tool.label}</span>}
                </div>

                {!collapsed && (
                  <button
                    type="button"
                    onClick={(e) => togglePin(tool.id, e)}
                    title="Unpin from sidebar"
                    aria-label={`Unpin ${tool.label}`}
                    className={`p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity ${
                      isLight ? 'text-neutral-500 hover:bg-neutral-300/60' : 'text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <PinOff className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {/* More tools trigger */}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-label="More studio tools"
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[13px] font-medium transition-colors ${
              moreOpen
                ? isLight
                  ? 'bg-neutral-200/80 text-neutral-950'
                  : 'bg-slate-800 text-white'
                : isLight
                ? 'text-neutral-700 hover:bg-neutral-200/50'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <span className="flex items-center gap-2.5 truncate">
              <span className="w-4 text-center font-bold">···</span>
              {!collapsed && <span>More tools</span>}
            </span>
            {!collapsed && <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
          </button>
        </div>
      </nav>

      {/* Floating More Tools Popover (Screenshot 3 style) */}
      {moreOpen && (
        <div
          className={`absolute bottom-4 left-3 z-50 w-56 rounded-2xl border shadow-2xl p-2 space-y-0.5 max-h-80 overflow-y-auto ${
            isLight
              ? 'bg-white border-neutral-200 text-neutral-900'
              : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}
        >
          <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-neutral-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-neutral-500">All Studio Tools</span>
            <button
              type="button"
              onClick={() => setMoreOpen(false)}
              className="text-[11px] text-neutral-400 hover:text-neutral-700"
            >
              Close
            </button>
          </div>
          {(moreTools.length > 0 ? moreTools : additionalTools).map((tool) => {
            const Icon = tool.icon;
            const isPinned = pinnedIds.includes(tool.id);
            return (
              <div
                key={tool.id}
                onClick={() => {
                  onSelectModule(tool.id);
                  setMoreOpen(false);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelectModule(tool.id);
                    setMoreOpen(false);
                  }
                }}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-neutral-100 text-neutral-800' : 'hover:bg-slate-800 text-slate-200'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 text-neutral-500 shrink-0" />
                  <span className="truncate font-medium">{tool.label}</span>
                </span>
                <button
                  type="button"
                  onClick={(e) => togglePin(tool.id, e)}
                  title={isPinned ? 'Unpin' : 'Pin to sidebar'}
                  className={`p-1 rounded-md ${
                    isLight ? 'hover:bg-neutral-200 text-neutral-500' : 'hover:bg-slate-700 text-slate-400'
                  }`}
                >
                  {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      )}

    </aside>
  );
};
