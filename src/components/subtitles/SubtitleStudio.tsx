import React, { useState } from 'react';
import { 
  MessageSquareQuote, 
  Plus, 
  Trash2, 
  Download, 
  Play, 
  Pause, 
  Type, 
  Sparkles,
  Check
} from 'lucide-react';
import { SubtitleCue, FilmProject } from '../../types';
import { INITIAL_SUBTITLES } from '../../data/initialData';
import { soundFx } from '../../utils/audioSynth';

interface SubtitleStudioProps {
  activeFilm: FilmProject;
}

export const SubtitleStudio: React.FC<SubtitleStudioProps> = ({ activeFilm }) => {
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>(INITIAL_SUBTITLES);
  const [activeCueId, setActiveCueId] = useState<string>('sub-1');
  const [fontColor, setFontColor] = useState<string>('#fde047'); // Classic cinema yellow
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [hasBoxBg, setHasBoxBg] = useState<boolean>(true);

  const activeCue = subtitles.find((s) => s.id === activeCueId) || subtitles[0];

  const handleAddCue = () => {
    soundFx.playShutterSound();
    const lastCue = subtitles[subtitles.length - 1];
    const newStart = lastCue ? lastCue.endTime + 0.5 : 0;
    const newCue: SubtitleCue = {
      id: `sub-${Date.now()}`,
      startTime: parseFloat(newStart.toFixed(1)),
      endTime: parseFloat((newStart + 3.5).toFixed(1)),
      text: 'New dialogue subtitle line...',
      speaker: 'VALERIE',
    };
    setSubtitles((prev) => [...prev, newCue]);
    setActiveCueId(newCue.id);
  };

  const handleDeleteCue = (id: string) => {
    soundFx.playWhoosh();
    setSubtitles((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateCue = (id: string, updates: Partial<SubtitleCue>) => {
    setSubtitles((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleExportSrt = () => {
    soundFx.playScannerBeep();
    // Generate valid SRT format:
    // 1
    // 00:00:01,200 --> 00:00:04,800
    // text
    const formatSrtTime = (sec: number) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      const ms = Math.floor((sec % 1) * 1000);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    };

    const srtContent = subtitles
      .map((s, idx) => {
        return `${idx + 1}\n${formatSrtTime(s.startTime)} --> ${formatSrtTime(s.endTime)}\n${s.speaker ? s.speaker + ': ' : ''}${s.text}\n`;
      })
      .join('\n');

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeFilm.title.replace(/\s+/g, '_')}_Captions.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950 text-slate-100">
      {/* Left: Burned-in Subtitle Video Preview & Styling */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 select-none">
        <div className="relative w-full max-w-3xl aspect-[2.39/1] bg-black border-2 border-slate-800 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center">
          <img
            src="/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg"
            alt="Preview Frame"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover filter contrast-110"
          />

          {/* Burned-in Subtitle Rendering */}
          {activeCue && (
            <div className="absolute inset-x-8 bottom-6 text-center pointer-events-none">
              <span
                className={`font-semibold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] inline-block transition-all ${
                  fontSize === 'sm' ? 'text-sm' : fontSize === 'lg' ? 'text-xl' : 'text-base'
                } ${
                  hasBoxBg
                    ? 'bg-black/80 px-3.5 py-1.5 rounded border border-white/10'
                    : 'text-shadow'
                }`}
                style={{ color: fontColor }}
              >
                {activeCue.speaker && (
                  <strong className="text-white/90 mr-1.5">{activeCue.speaker}:</strong>
                )}
                "{activeCue.text}"
              </span>
            </div>
          )}

          <div className="absolute top-2 left-2 bg-black/80 text-[10px] text-amber-400 font-mono-cinema px-2 py-0.5 rounded border border-amber-500/30">
            BURNED-IN SUBTITLE PREVIEW (2.39:1 DCI)
          </div>
        </div>

        {/* Styling Toolbar */}
        <div className="w-full max-w-3xl mt-4 bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-4 text-xs font-mono-cinema">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">COLOR:</span>
            <div className="flex items-center gap-1.5">
              {[
                { hex: '#fde047', label: 'Cinema Gold' },
                { hex: '#ffffff', label: 'Pure White' },
                { hex: '#38bdf8', label: 'Cyan Sub' },
              ].map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setFontColor(c.hex)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    fontColor === c.hex ? 'scale-110 border-amber-400' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">SIZE:</span>
            <div className="flex gap-1">
              {(['sm', 'base', 'lg'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => setFontSize(sz)}
                  className={`px-2.5 py-1 rounded text-xs font-bold ${
                    fontSize === sz ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {sz.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setHasBoxBg(!hasBoxBg)}
            className={`px-3 py-1 rounded border transition-colors ${
              hasBoxBg
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {hasBoxBg ? 'Box Background ON' : 'Shadow Only'}
          </button>
        </div>
      </div>

      {/* Right: Subtitle Cue List & SRT Export */}
      <div className="w-full lg:w-96 bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono-cinema">
              Timed Caption Cues
            </h3>
            <span className="text-[11px] text-slate-500">{subtitles.length} Subtitle Tracks</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddCue}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Cue</span>
            </button>

            <button
              onClick={handleExportSrt}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export SRT</span>
            </button>
          </div>
        </div>

        {/* Cues List */}
        <div className="space-y-3">
          {subtitles.map((cue, idx) => {
            const isSelected = cue.id === activeCueId;
            return (
              <div
                key={cue.id}
                onClick={() => setActiveCueId(cue.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono-cinema">
                  <span className="text-amber-400 font-bold">#{idx + 1}</span>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <input
                      type="number"
                      step="0.1"
                      value={cue.startTime}
                      onChange={(e) =>
                        handleUpdateCue(cue.id, { startTime: parseFloat(e.target.value) || 0 })
                      }
                      className="w-14 bg-slate-900 border border-slate-700 rounded px-1 text-center text-slate-200"
                    />
                    <span>&rarr;</span>
                    <input
                      type="number"
                      step="0.1"
                      value={cue.endTime}
                      onChange={(e) =>
                        handleUpdateCue(cue.id, { endTime: parseFloat(e.target.value) || 0 })
                      }
                      className="w-14 bg-slate-900 border border-slate-700 rounded px-1 text-center text-slate-200"
                    />
                    <span>sec</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCue(cue.id);
                    }}
                    className="text-slate-600 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cue.speaker || ''}
                    onChange={(e) =>
                      handleUpdateCue(cue.id, { speaker: e.target.value.toUpperCase() })
                    }
                    placeholder="SPEAKER"
                    className="w-24 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-sky-300 font-mono font-bold uppercase outline-none"
                  />
                  <input
                    type="text"
                    value={cue.text}
                    onChange={(e) => handleUpdateCue(cue.id, { text: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
