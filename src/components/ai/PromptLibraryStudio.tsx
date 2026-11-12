import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Tag, 
  Send, 
  Copy, 
  Check, 
  Plus, 
  Film, 
  Camera, 
  User, 
  Wand2, 
  Radio, 
  Music,
  ArrowRight
} from 'lucide-react';
import { PromptTemplate, StudioModule } from '../../types';
import { PROMPT_LIBRARY_TEMPLATES } from '../../data/promptLibraryData';
import { useStudioAi } from '../../context/StudioAiContext';
import { soundFx } from '../../utils/audioSynth';

interface PromptLibraryStudioProps {
  onNavigate: (module: StudioModule) => void;
}

export const PromptLibraryStudio: React.FC<PromptLibraryStudioProps> = ({ onNavigate }) => {
  const { loadPromptIntoTool } = useStudioAi();
  const [prompts, setPrompts] = useState<PromptTemplate[]>(PROMPT_LIBRARY_TEMPLATES);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredPrompts = prompts.filter((p) => {
    const matchesCat = category === 'all' || p.category === category;
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.prompt.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    soundFx.playScannerBeep();
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-100 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-purple-400 font-mono-cinema">
            <span>Central Cinematic Prompt Library</span>
            <span aria-hidden="true">·</span>
            <span>Director-Grade Formulas</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-cinzel">
            Cinematic Prompt Knowledge Base
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts, optics, tags..."
              className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none w-56 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {[
          { id: 'all', label: 'All Prompts' },
          { id: 'film', label: 'Story & Films', icon: Film },
          { id: 'camera', label: 'Camera & Optics', icon: Camera },
          { id: 'character', label: 'Characters', icon: User },
          { id: 'vfx', label: 'VFX & Shaders', icon: Wand2 },
          { id: 'voice', label: 'Voice & Comms', icon: Radio },
          { id: 'music', label: 'Music & Score', icon: Music },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              soundFx.playScannerBeep();
              setCategory(tab.id);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              category === tab.id
                ? 'bg-purple-600 text-white font-bold shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Prompts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrompts.map((p) => (
          <div
            key={p.id}
            className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between transition-all group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-purple-400 font-mono uppercase bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 font-bold">
                  {p.category.toUpperCase()}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ~{p.estimatedCredits} Credits
                </span>
              </div>

              <h3 className="text-sm font-bold text-white font-cinzel">
                {p.title}
              </h3>

              <div className="p-3 bg-slate-950 border border-slate-800/90 rounded-xl text-xs text-slate-300 font-mono leading-relaxed select-all">
                "{p.prompt}"
              </div>

              <div className="flex flex-wrap gap-1">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[9px] bg-slate-950 text-slate-400 border border-slate-800 px-1.5 py-0.2 rounded font-mono"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => handleCopy(p.id, p.prompt)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono"
              >
                {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === p.id ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() => loadPromptIntoTool(p, onNavigate)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded transition-colors"
              >
                <span>Load in Tool</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
