import React from 'react';
import { 
  ShieldCheck, 
  DollarSign, 
  Film, 
  Users, 
  HardDrive, 
  TrendingUp, 
  Download, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { FilmProject } from '../../types';
import { soundFx } from '../../utils/audioSynth';

interface AdminPanelProps {
  allFilms: FilmProject[];
  onSelectFilm: (film: FilmProject) => void;
  onOpenWorkstation: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ allFilms, onSelectFilm, onOpenWorkstation }) => {
  const totalBudget = allFilms.reduce((sum, f) => sum + f.budget, 0);
  const totalSpent = allFilms.reduce((sum, f) => sum + f.spent, 0);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-100 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-mono-cinema">
            <span>Executive Studio Admin</span>
            <span aria-hidden="true">·</span>
            <span>Studio Production Oversight</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-cinzel">
            Studio Portfolio & Executive Administration
          </h1>
        </div>

        <button
          onClick={onOpenWorkstation}
          className="flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-lg shadow-amber-500/20 whitespace-nowrap"
        >
          <span>Return to Workstation</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Admin KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Portfolio Capital</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono-cinema text-white">
            ${(totalBudget / 1000000).toFixed(2)}M
          </div>
          <p className="text-[11px] text-slate-500">
            ${(totalSpent / 1000000).toFixed(2)}M committed ({Math.round((totalSpent / totalBudget) * 100)}%)
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Productions</span>
            <Film className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono-cinema text-white">
            {allFilms.length} Features
          </div>
          <p className="text-[11px] text-emerald-400 font-mono-cinema">
            100% on delivery schedule
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Storage Allocation</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono-cinema text-white">
            1.42 TB
          </div>
          <p className="text-[11px] text-slate-500">
            of 5.0 TB High-Throughput NVMe
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Studio Seats Active</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono-cinema text-white">
            14 / 20 Seats
          </div>
          <p className="text-[11px] text-slate-500">
            Enterprise Single Sign-On (SSO)
          </p>
        </div>
      </div>

      {/* Production Slate Portfolio Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white font-mono-cinema uppercase">
            Executive Production Ledger
          </h3>
          <span className="text-xs text-slate-500 font-mono-cinema">{allFilms.length} Features</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-cinema">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">Feature Title</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Director</th>
                <th className="py-3 px-4">Spent / Budget</th>
                <th className="py-3 px-4">Schedule</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {allFilms.map((film) => (
                <tr key={film.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                    <img
                      src={film.coverImage}
                      alt={film.title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-8 rounded object-cover border border-slate-800"
                    />
                    <span>{film.title}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                      {film.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-sans">{film.director}</td>
                  <td className="py-3.5 px-4 text-slate-300">
                    ${(film.spent / 1000000).toFixed(1)}M / ${(film.budget / 1000000).toFixed(1)}M
                  </td>
                  <td className="py-3.5 px-4 text-emerald-400">
                    Day {film.shootingDaysDone} of {film.shootingDaysTotal}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {film.aspectRatio} · {film.fps}fps
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => {
                        soundFx.playScannerBeep();
                        onSelectFilm(film);
                        onOpenWorkstation();
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded text-[11px] font-bold"
                    >
                      Manage Film &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
