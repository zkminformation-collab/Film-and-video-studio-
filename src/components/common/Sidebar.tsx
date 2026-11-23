import React, { useEffect, useState } from 'react';
import {
  LayoutGrid,
  Mic2,
  AudioLines,
  GitBranch,
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
  { id: 'dashboard', label: 'Home & Flows', icon: GitBranch },
  { id: 'cartoon_creator', label: 'AI Cartoon Creator', icon: Clapperboard },
  { id: 'ai_voice', label: 'AI Studios · Voices', icon: Mic2, hasQuickAdd: true },
  { id: 'editor', label: 'Studio', icon: Film },
  { id: 'ai_wizard', label: 'AI Film Maker', icon: Sparkles },
  { id: 'films', label: 'My Projects', icon: Clapperboard },
  { id: 'media', label: 'My Library', icon: FolderOpen },
  { id: 'prompt_library', label: 'Apps & Templates', icon: LayoutGrid },
];

const ALL_STUDIO_TOOLS: SidebarTool[] = [
  { id: 'cartoon_creator', label: 'AI Cartoon Creator', icon: Clapperboard },
  { id: 'ai_voice', label: 'Text to Speech', icon: AudioLines },
  { id: 'character', label: 'Voice Creation', icon: Mic2 },
  { id: 'audio', label: 'Sound Effects & Music', icon: Volume2 },
  { id: 'ai_video', label: 'Image & Video', icon: Film },
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
];

const DEFAULT_PINNED_IDS: StudioModule[] = [
  'ai_voice',
  'character',
  'audio',
  'ai_video',
  'manhwa_studio',
  'ai_image',
  'subtitles',
  'export',
  'credit_wallet',
];

const PINNED_STORAGE_KEY = 'fvs_sidebar_pinned_v1';

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  theme,
  collapsed = false,
  onToggleCollapse,
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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

  const pinnedTools = ALL_STUDIO_TOOLS.filter((t) => pinnedIds.includes(t.id));
  const moreTools = ALL_STUDIO_TOOLS.filter((t) => !pinnedIds.includes(t.id));
  const isLight = theme === 'elevenlabs';

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-64'
      } border-r flex flex-col shrink-0 select-none relative transition-all duration-200 ${
        isLight
          ? 'bg-[#FAFAFB] border-neutral-200 text-neutral-900'
          : 'bg-[#0b0d13] border-slate-800 text-slate-100'
      }`}
    >
      {/* Top Wordmark + Collapse Button */}
      <div
        className={`h-14 px-4 flex items-center justify-between border-b shrink-0 ${
          isLight ? 'border-neutral-200/80' : 'border-slate-800/80'
        }`}
      >
        {!collapsed ? (
          <a
            href="/"
            aria-label="ZKMAP STUDIO Home"
            onClick={(e) => {
              e.preventDefault();
              onSelectModule('dashboard');
            }}
            className={`flex items-center gap-2.5 text-sm font-extrabold tracking-tight whitespace-nowrap cursor-pointer ${
              isLight ? 'text-neutral-950' : 'text-white'
            }`}
          >
            <img
              src="/images/zkmap-studio-logo.png"
              alt="ZKMAP STUDIO"
              className="h-7 w-auto rounded object-contain shrink-0"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-extrabold">ZKMAP STUDIO</span>
            </div>
          </a>
        ) : (
          <a
            href="/"
            aria-label="ZKMAP STUDIO Home"
            title="ZKMAP STUDIO"
            onClick={(e) => {
              e.preventDefault();
              onSelectModule('dashboard');
            }}
            className="flex items-center justify-center mx-auto cursor-pointer"
          >
            <img
              src="/images/zkmap-studio-logo.png"
              alt="ZKMAP STUDIO"
              className="h-6 w-8 rounded object-cover"
            />
          </a>
        )}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`p-1.5 rounded-lg transition-colors ${
              collapsed ? 'mx-auto' : ''
            } ${
              isLight
                ? 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
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
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectModule(item.id);
                }}
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
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectModule(tool.id);
                }}
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
          className={`absolute bottom-20 left-3 z-50 w-60 rounded-2xl border shadow-2xl p-2 space-y-0.5 max-h-80 overflow-y-auto ${
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
          {(moreTools.length > 0 ? moreTools : ALL_STUDIO_TOOLS).map((tool) => {
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
                  if (e.key === 'Enter' || e.key === ' ') {
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

      {/* Bottom Workspace Switcher Card (ElevenCreative style) */}
      <div
        className={`p-3 border-t shrink-0 ${
          isLight ? 'border-neutral-200 bg-white' : 'border-slate-800 bg-slate-950/90'
        }`}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={() => onSelectModule('settings')}
            title="Studio Settings"
            className="w-full flex justify-center py-1"
          >
            <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-orange-400 to-rose-400 block" />
          </button>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 via-orange-400 to-rose-400 shrink-0" />
              <span className="text-xs font-semibold truncate">Studio Creative</span>
            </div>
            <button
              type="button"
              onClick={() => onSelectModule('films')}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                isLight
                  ? 'bg-white border-neutral-200 hover:bg-neutral-100 text-neutral-900'
                  : 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-100'
              }`}
            >
              Switch
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
