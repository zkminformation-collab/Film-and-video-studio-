import React, { useState } from 'react';
import { 
  Clapperboard, 
  Play, 
  CheckCircle2, 
  Volume2, 
  Plus, 
  Trash2, 
  Download, 
  Printer,
  Sparkles
} from 'lucide-react';
import { FilmProject } from '../../types';
import { soundFx } from '../../utils/audioSynth';

interface FilmStudioProps {
  activeFilm: FilmProject;
}

interface SlateTake {
  id: string;
  scene: string;
  take: number;
  roll: string;
  status: 'Print' | 'Hold' | 'NG'; // NG = No Good
  timecode: string;
  notes: string;
}

export const FilmStudio: React.FC<FilmStudioProps> = ({ activeFilm }) => {
  const [scene, setScene] = useState('14');
  const [take, setTake] = useState(3);
  const [roll, setRoll] = useState('A04');
  const [isClapping, setIsClapping] = useState(false);
  const [syncTone, setSyncTone] = useState(true);

  const [takes, setTakes] = useState<SlateTake[]>([
    { id: 't-1', scene: '14', take: 1, roll: 'A04', status: 'Hold', timecode: '10:14:22:04', notes: 'Camera shadow on basalt rock' },
    { id: 't-2', scene: '14', take: 2, roll: 'A04', status: 'NG', timecode: '10:18:45:12', notes: 'Audio boom mic dipped into frame' },
    { id: 't-3', scene: '14', take: 3, roll: 'A04', status: 'Print', timecode: '10:24:10:18', notes: 'Hero performance, excellent light flare' },
  ]);

  const handleClap = () => {
    setIsClapping(true);
    if (syncTone) {
      soundFx.playSlateBeep();
    } else {
      soundFx.playShutterSound();
    }

    setTimeout(() => {
      setIsClapping(false);
      // Auto record take
      const newTakeNum = take;
      const now = new Date();
      const tc = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}:12`;
      setTakes((prev) => [
        {
          id: `take-${Date.now()}`,
          scene,
          take: newTakeNum,
          roll,
          status: 'Hold',
          timecode: tc,
          notes: 'Freshly logged take from slate trigger',
        },
        ...prev,
      ]);
      setTake((t) => t + 1);
    }, 280);
  };

  const setTakeStatus = (id: string, status: 'Print' | 'Hold' | 'NG') => {
    setTakes((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-100 space-y-6">
      {/* Top Section: Header & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-mono-cinema">
            <span>Production Slate</span>
            <span aria-hidden="true">·</span>
            <span>Clapperboard Sync</span>
            <span aria-hidden="true">·</span>
            <span>Hollywood Standard 1kHz Sync Tone</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-cinzel">
            Film Production Management
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Slate Card</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Digital Cinema Clapperboard (Left 6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono-cinema">
            Interactive Digital Slate
          </div>

          {/* Physical Hollywood Clapperboard Frame */}
          <div className="bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl p-4 space-y-4 select-none">
            {/* Clapper Sticks */}
            <div className="relative h-12 bg-black border border-white/20 rounded flex overflow-hidden">
              {/* Animated top hinged stick */}
              <div
                className={`absolute inset-x-0 top-0 h-6 bg-gradient-to-r from-white via-black to-white flex items-center justify-around origin-bottom-left transition-transform duration-150 border-b border-black ${
                  isClapping ? 'rotate-0' : '-rotate-6'
                }`}
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, #111 0px, #111 20px, #fff 20px, #fff 40px)',
                }}
              />
              {/* Bottom static stick */}
              <div
                className="w-full h-6 absolute bottom-0"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, #111 0px, #111 20px, #fff 20px, #fff 40px)',
                }}
              />
            </div>

            {/* Slate Whiteboard Face */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3 font-mono-cinema">
              {/* Production Title Bar */}
              <div className="border-b border-slate-800 pb-2 flex justify-between items-baseline">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">Production</span>
                  <div className="text-base font-bold text-amber-300 tracking-wider">
                    {activeFilm.title}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase">FPS / Sync</span>
                  <div className="text-xs text-emerald-400 font-bold">
                    {activeFilm.fps} FPS · 1kHz SYNC
                  </div>
                </div>
              </div>

              {/* Slate Big Digits: ROLL, SCENE, TAKE */}
              <div className="grid grid-cols-3 gap-2 text-center py-2">
                <div className="bg-slate-900/90 border border-slate-800 rounded p-2">
                  <label className="text-[10px] text-slate-400 uppercase block font-sans">ROLL</label>
                  <input
                    type="text"
                    value={roll}
                    onChange={(e) => setRoll(e.target.value.toUpperCase())}
                    className="w-full bg-transparent text-xl font-bold text-white text-center outline-none"
                  />
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded p-2">
                  <label className="text-[10px] text-slate-400 uppercase block font-sans">SCENE</label>
                  <input
                    type="text"
                    value={scene}
                    onChange={(e) => setScene(e.target.value)}
                    className="w-full bg-transparent text-xl font-bold text-white text-center outline-none"
                  />
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded p-2">
                  <label className="text-[10px] text-slate-400 uppercase block font-sans">TAKE</label>
                  <input
                    type="number"
                    value={take}
                    onChange={(e) => setTake(parseInt(e.target.value) || 1)}
                    className="w-full bg-transparent text-xl font-bold text-amber-400 text-center outline-none"
                  />
                </div>
              </div>

              {/* Director & DP credits */}
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800 pt-2 text-slate-300">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block">Director</span>
                  <span className="font-semibold text-white">{activeFilm.director}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block">Camera / DP</span>
                  <span className="font-semibold text-white">{activeFilm.dp}</span>
                </div>
              </div>

              {/* Date & Filter */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                <span>DATE: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>FILTER: CIRCULAR POLARIZER</span>
                <span>SOUND: SYNC</span>
              </div>
            </div>

            {/* Action Buttons for Slate */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleClap}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm rounded-lg transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-95"
              >
                <Clapperboard className="w-5 h-5 fill-current" />
                <span>CLAP SLATE & LOG TAKE #{take}</span>
              </button>

              <button
                onClick={() => setSyncTone(!syncTone)}
                className={`p-3 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1.5 ${
                  syncTone
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title="Toggle 1000Hz Hollywood sync audio beep"
              >
                <Volume2 className="w-4 h-4" />
                <span className="text-[11px] hidden sm:inline">{syncTone ? '1kHz Beep ON' : 'Silent'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dailies & Take Logger (Right 6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono-cinema">
              Take Log & Dailies (Scene {scene})
            </span>
            <span className="text-xs text-slate-500">{takes.length} takes logged</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-mono-cinema text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Take</th>
                    <th className="py-2.5 px-3">Roll</th>
                    <th className="py-2.5 px-3">Timecode</th>
                    <th className="py-2.5 px-3">Decision</th>
                    <th className="py-2.5 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono-cinema">
                  {takes.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-white">
                        Scene {t.scene} / T{t.take}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{t.roll}</td>
                      <td className="py-2.5 px-3 text-slate-300">{t.timecode}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setTakeStatus(t.id, 'Print')}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              t.status === 'Print'
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            PRINT
                          </button>
                          <button
                            onClick={() => setTakeStatus(t.id, 'Hold')}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              t.status === 'Hold'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            HOLD
                          </button>
                          <button
                            onClick={() => setTakeStatus(t.id, 'NG')}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              t.status === 'NG'
                                ? 'bg-rose-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            NG
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans truncate max-w-xs">
                        {t.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>Mark "Print" for primary takes sent straight to editorial timeline.</span>
              <button
                onClick={() => {
                  soundFx.playScannerBeep();
                  alert('Exported take logs in industry CSV and ALE formats.');
                }}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export ALE</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
