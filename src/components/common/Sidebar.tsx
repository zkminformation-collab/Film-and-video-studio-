import React from 'react';
import {
  LayoutDashboard,
  Clapperboard,
  Film,
  Bot,
  Sparkles,
  Palette,
  Wand2,
  Music,
  FileText,
  User,
  Radio,
  MessageSquareQuote,
  Sliders,
  Share2,
  FolderOpen,
  Cloud,
  Users,
  Settings,
  Workflow
} from 'lucide-react';
import { StudioModule, StudioTheme } from '../../types';

interface SidebarProps {
  activeModule: StudioModule;
  onSelectModule: (module: StudioModule) => void;
  theme: StudioTheme;
}

interface NavItem {
  num: number;
  id: StudioModule;
  label: string;
  icon: React.ElementType;
  badge?: string;
  category: 'core' | 'ai' | 'post' | 'management';
}

const ALL_18_MODULES: NavItem[] = [
  // 1. Home
  { num: 1, id: 'dashboard', label: 'Home Dashboard', icon: LayoutDashboard, category: 'core' },
  // 2. Film Maker
  { num: 2, id: 'films', label: 'Film Maker & Slate', icon: Clapperboard, category: 'core' },
  // 3. Video Editor
  { num: 3, id: 'editor', label: 'Video Editor', icon: Film, category: 'core' },
  // 4. AI Video Generator
  { num: 4, id: 'ai_video', label: 'AI Video Generator', icon: Bot, badge: 'AI', category: 'ai' },
  // 5. AI Image Generator
  { num: 5, id: 'ai_image', label: 'AI Image Generator', icon: Sparkles, badge: '4K', category: 'ai' },
  // 6. Animation Studio
  { num: 6, id: 'animation', label: 'Animation Studio', icon: Palette, category: 'post' },
  // 7. VFX Studio
  { num: 7, id: 'vfx', label: 'VFX Studio (Chroma)', icon: Wand2, category: 'post' },
  // 8. Music & Audio Studio
  { num: 8, id: 'audio', label: 'Music & Audio Studio', icon: Music, category: 'post' },
  // 9. Script Writer
  { num: 9, id: 'script', label: 'Script Writer', icon: FileText, category: 'core' },
  // 10. Storyboard Creator
  { num: 10, id: 'storyboard', label: 'Storyboard Creator', icon: Sparkles, category: 'core' },
  // 11. Character Creator
  { num: 11, id: 'character', label: 'Character Creator', icon: User, badge: 'NEW', category: 'ai' },
  // 12. AI Voice Studio
  { num: 12, id: 'ai_voice', label: 'AI Voice Studio', icon: Radio, badge: 'TTS', category: 'ai' },
  // 13. Subtitle Studio
  { num: 13, id: 'subtitles', label: 'Subtitle Studio', icon: MessageSquareQuote, category: 'post' },
  // 14. Color Grading
  { num: 14, id: 'color_grading', label: 'Color Grading', icon: Sliders, badge: 'PRO', category: 'post' },
  // 15. Export & Rendering
  { num: 15, id: 'export', label: 'Export & Rendering', icon: Share2, category: 'management' },
  // 16. Project Library
  { num: 16, id: 'media', label: 'Project Library', icon: FolderOpen, category: 'management' },
  // 17. Cloud Storage
  { num: 17, id: 'cloud_storage', label: 'Cloud Storage', icon: Cloud, category: 'management' },
  // 18. Team Collaboration
  { num: 18, id: 'team', label: 'Team Collaboration', icon: Users, category: 'management' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  theme,
}) => {
  return (
    <aside className="w-64 border-r border-slate-800 bg-[#090b11] flex flex-col shrink-0 select-none">
      {/* Sidebar Header & Workflow Launcher */}
      <div className="p-3 border-b border-slate-900 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono-cinema">
            18 Studio Workspaces
          </span>
          <span className="text-[10px] text-purple-400 font-mono font-bold">PRO SUITE</span>
        </div>

        {/* AI Film Creator Fast Banner */}
        <button
          onClick={() => onSelectModule('ai_wizard')}
          className={`w-full py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
            activeModule === 'ai_wizard'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <Workflow className="w-4 h-4 text-purple-400" />
            <span>AI Film Creator (Auto)</span>
          </div>
          <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-mono">
            10-STAGE
          </span>
        </button>
      </div>

      {/* 18 Numbered Modules List */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {ALL_18_MODULES.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                isActive
                  ? theme === 'creative'
                    ? 'bg-purple-600/20 text-purple-300 font-bold border border-purple-500/40 shadow-sm'
                    : theme === 'cinematic'
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                    : 'bg-slate-800 text-sky-300 font-bold border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="text-[10px] text-slate-500 font-mono w-4 text-right shrink-0">
                  {item.num}.
                </span>
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? theme === 'creative'
                        ? 'text-purple-400'
                        : theme === 'cinematic'
                        ? 'text-amber-400'
                        : 'text-sky-400'
                      : 'text-slate-500'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    isActive
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-900 text-purple-400 border border-purple-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-900 bg-slate-950/90 flex items-center justify-between text-[11px] text-slate-500 font-mono-cinema">
        <button
          onClick={() => onSelectModule('settings')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
        <span className="text-emerald-400 font-bold">v3.8 Ultimate</span>
      </div>
    </aside>
  );
};
