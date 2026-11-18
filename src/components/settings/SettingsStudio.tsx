import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  HardDrive, 
  Globe, 
  Sliders, 
  Trash2, 
  Check, 
  Layers,
  Sparkles
} from 'lucide-react';
import { FilmProject } from '../../types';
import { soundFx } from '../../utils/audioSynth';

interface SettingsStudioProps {
  activeFilm: FilmProject;
  onUpdateFilm: (updates: Partial<FilmProject>) => void;
  onClearAllData?: () => Promise<void> | void;
}

export const SettingsStudio: React.FC<SettingsStudioProps> = ({
  activeFilm,
  onUpdateFilm,
  onClearAllData,
}) => {
  const [fps, setFps] = useState<24 | 30 | 60>(activeFilm.fps);
  const [aspectRatio, setAspectRatio] = useState(activeFilm.aspectRatio);
  const [resolution, setResolution] = useState(activeFilm.resolution);
  const [colorSpace, setColorSpace] = useState('ACEScc 1.3');
  const [sampleRate, setSampleRate] = useState('96,000 Hz');
  const [wpUrl, setWpUrl] = useState('https://myfilmstudio.com');
  const [saved, setSaved] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  const handleConfirmRemoveAll = async () => {
    soundFx.playWhoosh();
    setIsResetting(true);
    try {
      await fetch('/api/studio/clear-all-data', { method: 'POST' });
      try {
        localStorage.clear();
      } catch {
        // Ignore storage errors
      }
      if (onClearAllData) {
        await onClearAllData();
      }
      setConfirmReset(false);
      setResetSuccessMsg('All saved projects, OAuth tokens, social jobs, and Blogger drafts have been permanently removed.');
      setTimeout(() => setResetSuccessMsg(''), 6000);
    } finally {
      setIsResetting(false);
    }
  };

  const handleSave = () => {
    soundFx.playScannerBeep();
    onUpdateFilm({
      fps,
      aspectRatio: aspectRatio as any,
      resolution: resolution as any,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-100 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-mono-cinema">
            <span>Studio Preferences & Engine Config</span>
            <span aria-hidden="true">·</span>
            <span>Local Scratch Cache</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-cinzel">
            Studio Engine Settings
          </h1>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-lg shadow-amber-500/20 whitespace-nowrap"
        >
          {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          <span>{saved ? 'Settings Saved!' : 'Save Studio Preferences'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Technical Architecture */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold text-sm border-b border-slate-800 pb-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Master Timeline & Color Science</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-mono-cinema block mb-1">
                Timebase & Frame Rate
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[24, 30, 60].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setFps(rate as any)}
                    className={`py-2 rounded font-mono font-bold text-center border transition-colors ${
                      fps === rate
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {rate} FPS {rate === 24 && '(Cinema)'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-mono-cinema block mb-1">
                Master Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono outline-none"
              >
                <option value="2.39:1">2.39:1 Anamorphic Scope (Theatrical Wide)</option>
                <option value="1.85:1">1.85:1 Academy Flat</option>
                <option value="16:9">16:9 Cinema Broadcast</option>
                <option value="9:16">9:16 Mobile Vertical (TikTok/Reels)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-mono-cinema block mb-1">
                Color Pipeline & Working Space
              </label>
              <select
                value={colorSpace}
                onChange={(e) => setColorSpace(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono outline-none"
              >
                <option value="ACEScc 1.3">ACEScc 1.3 (Academy Color Encoding System)</option>
                <option value="DaVinci YRGB Wide">DaVinci YRGB Color Managed</option>
                <option value="Rec.709">Rec.709 / sRGB (Web Standard)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-mono-cinema block mb-1">
                Audio Engine Sample Rate
              </label>
              <select
                value={sampleRate}
                onChange={(e) => setSampleRate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono outline-none"
              >
                <option value="96,000 Hz">96,000 Hz / 24-bit (Master Studio Audio)</option>
                <option value="48,000 Hz">48,000 Hz / 24-bit (Broadcast Standard)</option>
                <option value="44,100 Hz">44,100 Hz (CD Audio)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scratch Disk Storage & WordPress API Sync */}
        <div className="space-y-6">
          {/* Storage Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>Scratch Disk & Proxy Cache</span>
              </div>
              <span className="text-xs font-mono text-slate-400">48.2 GB / 500 GB</span>
            </div>

            <div className="space-y-2">
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-[10%]" />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono-cinema">
                <span>Optimized ProRes 422 Proxies</span>
                <span>451.8 GB Free</span>
              </div>
            </div>

            <button
              onClick={() => {
                soundFx.playWhoosh();
                setCacheCleared(true);
                setTimeout(() => setCacheCleared(false), 3000);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded text-xs font-medium"
            >
              {cacheCleared ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Trash2 className="w-3.5 h-3.5 text-rose-400" />}
              <span>{cacheCleared ? 'Proxy & Render Cache Purged' : 'Purge Unused Render Cache'}</span>
            </button>
          </div>

          {/* WordPress Sync Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-white font-semibold text-sm border-b border-slate-800 pb-2">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>WordPress REST API Integration</span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-[10px] text-slate-400 uppercase font-mono-cinema">WordPress Site URL</label>
              <input
                type="text"
                value={wpUrl}
                onChange={(e) => setWpUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono outline-none"
              />
              <p className="text-[11px] text-slate-500">
                Connected to plugin endpoint: <code className="text-amber-400">/wp-json/film-studio/v1/sync</code>
              </p>
            </div>
          </div>

          {/* Remove All Data Box */}
          <div className="bg-slate-900 border border-rose-900/50 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Remove All Studio Data</span>
              </div>
              <span className="text-xs font-mono text-rose-400">Reset Workspace</span>
            </div>

            <p className="text-xs text-slate-400">
              Permanently deletes all local autosaved projects, connected Social &amp; Blogger accounts, encrypted OAuth tokens, upload jobs, publish history, scheduled posts, and drafts.
            </p>

            {resetSuccessMsg && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-800 rounded text-xs text-emerald-200">
                {resetSuccessMsg}
              </div>
            )}

            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-200 border border-rose-700/60 rounded text-xs font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove All Data</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleConfirmRemoveAll}
                  disabled={isResetting}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded text-xs font-bold"
                >
                  {isResetting ? 'Removing All Data...' : 'Confirm Remove All Data'}
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
