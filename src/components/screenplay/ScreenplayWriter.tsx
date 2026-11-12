import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Plus, 
  Trash2, 
  Wand2, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Copy,
  Check
} from 'lucide-react';
import { ScreenplayElement, FilmProject } from '../../types';
import { INITIAL_SCREENPLAY } from '../../data/initialData';
import { soundFx } from '../../utils/audioSynth';

interface ScreenplayWriterProps {
  activeFilm: FilmProject;
}

export const ScreenplayWriter: React.FC<ScreenplayWriterProps> = ({ activeFilm }) => {
  const [elements, setElements] = useState<ScreenplayElement[]>(INITIAL_SCREENPLAY);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('Commander Valerie Chen confronts an ancient AI guardian awakened inside the monolith');
  const [copied, setCopied] = useState(false);

  const handleAddElement = (type: ScreenplayElement['type']) => {
    soundFx.playShutterSound();
    let defaultText = '';
    if (type === 'scene_heading') defaultText = 'INT. MAIN OBSERVATION DECK - NIGHT';
    if (type === 'action') defaultText = 'The heavy airlocks seal shut with a resounding thud.';
    if (type === 'character') defaultText = 'VALERIE';
    if (type === 'parenthetical') defaultText = '(whispering)';
    if (type === 'dialogue') defaultText = 'We need to evacuate before the sequence initiates.';
    if (type === 'transition') defaultText = 'CUT TO:';

    const newEl: ScreenplayElement = {
      id: `sc-${Date.now()}`,
      type,
      text: defaultText,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
  };

  const handleUpdateText = (id: string, text: string) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, text } : el)));
  };

  const handleDeleteElement = (id: string) => {
    soundFx.playWhoosh();
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Real Gemini AI Generation Call
  const handleGenerateAiScene = async () => {
    setIsAiLoading(true);
    soundFx.playScannerBeep();
    try {
      const res = await fetch('/api/ai/screenplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeFilm.title,
          genre: activeFilm.genre,
          logline: activeFilm.tagline,
          scenePrompt: aiPrompt,
        }),
      });

      const data = await res.json();
      if (data.screenplay) {
        // Parse into screenplay elements
        const lines = data.screenplay.split('\n').filter((l: string) => l.trim().length > 0);
        const parsedElements: ScreenplayElement[] = lines.map((line: string, index: number) => {
          const trimmed = line.trim();
          let type: ScreenplayElement['type'] = 'action';

          if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/i.test(trimmed)) {
            type = 'scene_heading';
          } else if (/^[A-Z0-9\s\.\(\)]+$/.test(trimmed) && trimmed.length < 32 && !trimmed.endsWith('.')) {
            type = 'character';
          } else if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
            type = 'parenthetical';
          } else if (/^(FADE IN:|FADE OUT\.|CUT TO:|SMASH CUT TO:|DISSOLVE TO:)/i.test(trimmed)) {
            type = 'transition';
          } else if (index > 0 && lines[index - 1].trim().length < 30) {
            type = 'dialogue';
          }

          return {
            id: `ai-${Date.now()}-${index}`,
            type,
            text: trimmed,
          };
        });

        if (parsedElements.length > 0) {
          setElements(parsedElements);
          soundFx.playCinematicImpact();
        }
      }
    } catch (e) {
      console.error('AI Screenplay Error:', e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopyScript = () => {
    const raw = elements.map((e) => e.text).join('\n\n');
    navigator.clipboard?.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = () => {
    const raw = elements
      .map((e) => {
        if (e.type === 'character') return `\n                    ${e.text}`;
        if (e.type === 'dialogue') return `          ${e.text}`;
        if (e.type === 'parenthetical') return `               ${e.text}`;
        if (e.type === 'transition') return `                                                  ${e.text}\n`;
        return `\n${e.text}`;
      })
      .join('\n');

    const blob = new Blob([raw], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeFilm.title.replace(/\s+/g, '_')}_Screenplay.fdr.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950 text-slate-100">
      {/* Left Main Screenplay Editor Page */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-800">
        {/* Screenplay Formatting Toolbar */}
        <div className="h-12 border-b border-slate-800 px-4 bg-slate-900 flex items-center justify-between gap-4 shrink-0 select-none">
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <span className="text-[10px] text-slate-500 uppercase font-mono-cinema mr-2">Elements:</span>
            <button
              onClick={() => handleAddElement('scene_heading')}
              className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 whitespace-nowrap"
            >
              Scene Heading
            </button>
            <button
              onClick={() => handleAddElement('action')}
              className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 whitespace-nowrap"
            >
              Action
            </button>
            <button
              onClick={() => handleAddElement('character')}
              className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-sky-300 rounded border border-slate-700 whitespace-nowrap"
            >
              Character
            </button>
            <button
              onClick={() => handleAddElement('parenthetical')}
              className="px-2.5 py-1 text-xs font-mono italic bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 whitespace-nowrap"
            >
              (Parenthetical)
            </button>
            <button
              onClick={() => handleAddElement('dialogue')}
              className="px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 whitespace-nowrap"
            >
              Dialogue
            </button>
            <button
              onClick={() => handleAddElement('transition')}
              className="px-2.5 py-1 text-xs font-mono uppercase bg-slate-800 hover:bg-slate-700 text-purple-300 rounded border border-slate-700 whitespace-nowrap"
            >
              Transition
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyScript}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-slate-300"
              title="Copy Screenplay Text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownloadScript}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 rounded transition-colors"
              title="Export Formatted Screenplay"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Studio Screenplay Paper View (Formatted like Final Draft Courier 12pt) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950 flex justify-center">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-lg p-8 md:p-12 shadow-2xl space-y-4 font-screenplay text-slate-100 min-h-[800px]">
            {/* Header info */}
            <div className="text-right text-xs text-slate-500 font-mono-cinema border-b border-slate-800 pb-2">
              Page 1.
            </div>

            {elements.map((el) => {
              const isSelected = selectedId === el.id;

              if (el.type === 'scene_heading') {
                return (
                  <div key={el.id} className="pt-4 group relative">
                    <input
                      type="text"
                      value={el.text}
                      onChange={(e) => handleUpdateText(el.id, e.target.value.toUpperCase())}
                      onFocus={() => setSelectedId(el.id)}
                      className="w-full bg-transparent font-bold uppercase tracking-wider text-amber-300 text-sm md:text-base outline-none focus:bg-slate-800/60 p-1 rounded"
                    />
                    <button
                      onClick={() => handleDeleteElement(el.id)}
                      className="absolute right-0 top-4 opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              if (el.type === 'character') {
                return (
                  <div key={el.id} className="pt-3 flex justify-center group relative">
                    <input
                      type="text"
                      value={el.text}
                      onChange={(e) => handleUpdateText(el.id, e.target.value.toUpperCase())}
                      onFocus={() => setSelectedId(el.id)}
                      className="w-72 text-center font-bold uppercase tracking-widest text-sky-300 text-sm md:text-base outline-none focus:bg-slate-800/60 p-1 rounded"
                    />
                    <button
                      onClick={() => handleDeleteElement(el.id)}
                      className="absolute right-0 top-3 opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              if (el.type === 'parenthetical') {
                return (
                  <div key={el.id} className="flex justify-center group relative">
                    <input
                      type="text"
                      value={el.text}
                      onChange={(e) => handleUpdateText(el.id, e.target.value)}
                      onFocus={() => setSelectedId(el.id)}
                      className="w-64 text-center italic text-slate-400 text-xs md:text-sm outline-none focus:bg-slate-800/60 p-0.5 rounded"
                    />
                    <button
                      onClick={() => handleDeleteElement(el.id)}
                      className="absolute right-0 top-1 opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              if (el.type === 'dialogue') {
                return (
                  <div key={el.id} className="flex justify-center group relative">
                    <textarea
                      rows={2}
                      value={el.text}
                      onChange={(e) => handleUpdateText(el.id, e.target.value)}
                      onFocus={() => setSelectedId(el.id)}
                      className="w-96 text-left text-slate-200 text-sm md:text-base leading-relaxed outline-none focus:bg-slate-800/60 p-1 rounded resize-none"
                    />
                    <button
                      onClick={() => handleDeleteElement(el.id)}
                      className="absolute right-0 top-1 opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              if (el.type === 'transition') {
                return (
                  <div key={el.id} className="pt-4 flex justify-end group relative">
                    <input
                      type="text"
                      value={el.text}
                      onChange={(e) => handleUpdateText(el.id, e.target.value.toUpperCase())}
                      onFocus={() => setSelectedId(el.id)}
                      className="w-48 text-right font-bold uppercase text-purple-300 text-xs md:text-sm outline-none focus:bg-slate-800/60 p-1 rounded"
                    />
                    <button
                      onClick={() => handleDeleteElement(el.id)}
                      className="absolute left-0 top-4 opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              // Default: Action
              return (
                <div key={el.id} className="pt-2 group relative">
                  <textarea
                    rows={2}
                    value={el.text}
                    onChange={(e) => handleUpdateText(el.id, e.target.value)}
                    onFocus={() => setSelectedId(el.id)}
                    className="w-full text-slate-300 text-sm md:text-base leading-relaxed outline-none focus:bg-slate-800/60 p-1 rounded resize-none"
                  />
                  <button
                    onClick={() => handleDeleteElement(el.id)}
                    className="absolute right-0 top-2 opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Sidebar: AI Script Doctor & Scene Generation */}
      <div className="w-full lg:w-80 bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto space-y-5">
        <div className="flex items-center gap-2 text-amber-400">
          <Sparkles className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono-cinema">
            AI Screenplay Engine
          </h3>
        </div>

        <div className="space-y-2 text-xs">
          <label className="text-[11px] text-slate-400 uppercase font-mono-cinema">
            Scene Prompt / Story Beat
          </label>
          <textarea
            rows={4}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs text-white outline-none focus:border-amber-500"
            placeholder="Describe the confrontation, twist, or dialogue beat..."
          />
        </div>

        <button
          onClick={handleGenerateAiScene}
          disabled={isAiLoading}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
        >
          {isAiLoading ? (
            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          <span>{isAiLoading ? 'Writing Scene...' : 'Generate Hollywood Scene'}</span>
        </button>

        {/* Script Doctor Tips */}
        <div className="border-t border-slate-800 pt-4 space-y-3 text-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono-cinema">
            Screenwriting Guidelines
          </div>
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded space-y-1 text-slate-300">
            <span className="font-bold text-amber-300">Industry Standard:</span>
            <p className="text-[11px] text-slate-400">
              1 page of formatted Courier screenplay equals approximately 1 minute of screen time.
            </p>
          </div>
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded space-y-1 text-slate-300">
            <span className="font-bold text-sky-300">Action Lines:</span>
            <p className="text-[11px] text-slate-400">
              Only write what can be seen and heard by the camera. Keep paragraphs under 4 lines for pacing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
