import React, { useState } from 'react';
import { 
  Cloud, 
  HardDrive, 
  CheckCircle2, 
  RefreshCw, 
  Database, 
  Upload, 
  Download, 
  Lock, 
  Radio,
  Server
} from 'lucide-react';
import { FilmProject } from '../../types';
import { soundFx } from '../../utils/audioSynth';

interface CloudStorageStudioProps {
  activeFilm: FilmProject;
}

interface StorageBucket {
  id: string;
  name: string;
  provider: 'Google Cloud Storage' | 'Firebase Storage' | 'AWS S3' | 'Studio NAS';
  region: string;
  usedGb: number;
  totalGb: number;
  status: 'Synced' | 'Syncing' | 'Standby';
}

export const CloudStorageStudio: React.FC<CloudStorageStudioProps> = ({ activeFilm }) => {
  const [buckets, setBuckets] = useState<StorageBucket[]>([
    {
      id: 'b-1',
      name: 'film-studio-production-masters',
      provider: 'Google Cloud Storage',
      region: 'us-central1 (Iowa)',
      usedGb: 840,
      totalGb: 2000,
      status: 'Synced',
    },
    {
      id: 'b-2',
      name: 'film-video-studio-dailies.appspot.com',
      provider: 'Firebase Storage',
      region: 'nam5 (Multi-region)',
      usedGb: 320,
      totalGb: 1000,
      status: 'Synced',
    },
    {
      id: 'b-3',
      name: 'pinewood-soundstage-local-nas',
      provider: 'Studio NAS',
      region: 'Local 10GbE Fiber',
      usedGb: 1840,
      totalGb: 8000,
      status: 'Syncing',
    },
  ]);

  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleSyncAll = () => {
    setIsBackingUp(true);
    soundFx.playScannerBeep();
    setTimeout(() => {
      setIsBackingUp(false);
      soundFx.playCinematicImpact();
      setBuckets((prev) => prev.map((b) => ({ ...b, status: 'Synced' })));
    }, 1500);
  };

  const totalUsed = buckets.reduce((acc, b) => acc + b.usedGb, 0);
  const totalCap = buckets.reduce((acc, b) => acc + b.totalGb, 0);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-100 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono-cinema">
            <span>Multi-Cloud Asset Synchronization</span>
            <span aria-hidden="true">·</span>
            <span>Firebase & Object Storage</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-cinzel">
            Cloud Storage & Dailies Repository
          </h1>
        </div>

        <button
          onClick={handleSyncAll}
          disabled={isBackingUp}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-lg shadow-cyan-500/20 whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
          <span>{isBackingUp ? 'Synchronizing Buckets...' : 'Sync All Cloud Buckets'}</span>
        </button>
      </div>

      {/* Aggregate Storage Meter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono-cinema">Aggregate Studio Capacity</span>
            <div className="text-2xl font-bold font-mono-cinema text-white">
              {(totalUsed / 1000).toFixed(2)} TB <span className="text-sm font-normal text-slate-500">of {(totalCap / 1000).toFixed(1)} TB Allocated</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-emerald-400 font-mono-cinema font-bold">
              {Math.round((totalUsed / totalCap) * 100)}% Utilized
            </span>
          </div>
        </div>

        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-purple-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${(totalUsed / totalCap) * 100}%` }}
          />
        </div>
      </div>

      {/* Buckets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {buckets.map((b) => (
          <div
            key={b.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 font-mono truncate">{b.provider}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    b.status === 'Synced'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                  }`}
                >
                  {b.status.toUpperCase()}
                </span>
              </div>

              <div className="text-sm font-bold text-white break-all font-mono">
                {b.name}
              </div>
              <div className="text-[11px] text-slate-400">{b.region}</div>
            </div>

            <div className="space-y-1 pt-3 border-t border-slate-800 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Space Used</span>
                <span className="text-white font-bold">{b.usedGb} GB / {b.totalGb} GB</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full"
                  style={{ width: `${(b.usedGb / b.totalGb) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
