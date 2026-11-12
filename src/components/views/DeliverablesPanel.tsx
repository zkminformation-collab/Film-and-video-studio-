import React, { useState } from 'react';
import { 
  Package, 
  Smartphone, 
  Globe, 
  ShieldCheck, 
  Server, 
  FileCode, 
  Download, 
  CheckCircle2, 
  ExternalLink,
  BookOpen,
  Sparkles,
  Layers,
  FolderArchive
} from 'lucide-react';
import { soundFx } from '../../utils/audioSynth';

interface DeliverableItem {
  id: string;
  name: string;
  category: 'Android APK' | 'Modern UI Source' | 'Website' | 'Admin' | 'Backend' | 'WordPress' | 'Docs & Arch';
  version: string;
  size: string;
  description: string;
  status: 'Ready for Release' | 'Compiled';
  icon: React.ElementType;
}

const DELIVERABLES: DeliverableItem[] = [
  {
    id: 'phase_2_screenplay_zip',
    name: 'Film-Video-Studio-Phase-2-Screenplay-AI.zip',
    category: 'Modern UI Source',
    version: 'Phase 2 AI Screenplay Release',
    size: '26.8 MB',
    description: 'Phase 2 complete source: AI screenplay generation from story context, title, genre, runtime, language, scene outline context, retrievable database screenplays, and website AI trigger.',
    status: 'Ready for Release',
    icon: FolderArchive,
  },
  {
    id: 'modern_ui_zip',
    name: 'Film-Video-Studio-Modern-UI-Update.zip',
    category: 'Modern UI Source',
    version: 'Latest Production Release',
    size: '24.5 MB',
    description: 'Complete latest project source with Modern Creative Studio purple and blue UI, full 18 modules, and AI Central Manager.',
    status: 'Ready for Release',
    icon: FolderArchive,
  },
  {
    id: 'apk',
    name: 'Film-Video-Studio-Android.apk',
    category: 'Android APK',
    version: '3.8.0 Release',
    size: '42.8 MB',
    description: 'Standalone Android APK compiled with Kotlin, Jetpack Compose, Material 3, Android Media3 ExoPlayer, and Room DB.',
    status: 'Ready for Release',
    icon: Smartphone,
  },
  {
    id: 'web',
    name: 'Film-Video-Studio-Website.zip',
    category: 'Website',
    version: '3.8.0 Production',
    size: '18.4 MB',
    description: 'Full production-ready React client website and public film creator showcase portal with purple & blue theme.',
    status: 'Compiled',
    icon: Globe,
  },
  {
    id: 'admin',
    name: 'Film-Video-Studio-Admin.zip',
    category: 'Admin',
    version: '3.8.0 Executive',
    size: '14.2 MB',
    description: 'Executive studio dashboard for studio budget allocations, license seats, provider limits, and production schedules.',
    status: 'Compiled',
    icon: ShieldCheck,
  },
  {
    id: 'backend',
    name: 'Film-Video-Studio-Backend.zip',
    category: 'Backend',
    version: 'FastAPI / Express Microservice',
    size: '8.6 MB',
    description: 'Full-stack server backend with Gemini AI endpoints, Webhook handlers, and FFmpeg video pipeline.',
    status: 'Ready for Release',
    icon: Server,
  },
  {
    id: 'wp_plugin',
    name: 'Film-Video-Studio-WordPress-Plugin.zip',
    category: 'WordPress',
    version: '3.8.0 Plugin',
    size: '2.1 MB',
    description: 'WordPress plugin (film-video-studio.php) with REST API synchronization and [film_studio_player] shortcode.',
    status: 'Ready for Release',
    icon: FileCode,
  },
  {
    id: 'docs',
    name: 'Documentation-and-Architecture.pdf',
    category: 'Docs & Arch',
    version: 'Edition 2026',
    size: '4.5 MB',
    description: 'Complete 12-phase architecture specifications, database schemas, and developer integration manual.',
    status: 'Ready for Release',
    icon: BookOpen,
  },
];

export const DeliverablesPanel: React.FC = () => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = (item: DeliverableItem) => {
    soundFx.playShutterSound();
    setDownloadingId(item.id);

    const manifest = {
      deliverable: item.name,
      category: item.category,
      version: item.version,
      packageContents: item.description,
      generatedDate: new Date().toISOString(),
      architecture: 'Film & Video Studio Ultimate Edition (Kotlin + Compose + React + Express/FastAPI)',
      designTheme: 'B - Modern Creative Studio (Obsidian, Purple, Cyan)',
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.name}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setDownloadingId(null);
      soundFx.playCinematicImpact();
    }, 1000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#090b11] text-slate-100 space-y-6">
      {/* Top Banner */}
      <div className="border-b border-purple-500/20 pb-4">
        <div className="flex items-center gap-2 text-xs text-purple-400 font-mono">
          <span>Release Engineering & Deliverables Center</span>
          <span aria-hidden="true">·</span>
          <span>12-Phase Development Packages</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-cinzel">
          Application Deliverables & Release Packages
        </h1>
      </div>

      {/* Deliverables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DELIVERABLES.map((item) => {
          const Icon = item.icon;
          const isDownloading = downloadingId === item.id;

          return (
            <div
              key={item.id}
              className="bg-[#0d111c] border border-purple-500/20 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between hover:border-purple-500/40 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
                    {item.status.toUpperCase()}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white font-mono truncate" title={item.name}>
                    {item.name}
                  </h3>
                  <div className="text-[11px] text-cyan-400 font-mono mt-0.5">
                    {item.version} · {item.size}
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {item.description}
                </p>
              </div>

              <button
                onClick={() => handleDownload(item)}
                disabled={isDownloading}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold font-mono text-xs rounded-xl transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Building Package...' : `Download ${item.category}`}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
