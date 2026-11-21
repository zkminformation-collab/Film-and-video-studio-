import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Copy, 
  Check, 
  Plus, 
  Film, 
  Camera, 
  User, 
  Wand2, 
  Radio, 
  Music,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { PromptTemplate, StudioModule } from '../../types';
import { PROMPT_LIBRARY_TEMPLATES } from '../../data/promptLibraryData';
import { useStudioAi } from '../../context/StudioAiContext';
import { soundFx } from '../../utils/audioSynth';
import { DesignPromptHub } from './DesignPromptHub';

interface PromptLibraryStudioProps {
  onNavigate: (module: StudioModule) => void;
}

export const PromptLibraryStudio: React.FC<PromptLibraryStudioProps> = ({ onNavigate }) => {
  const { 
    loadPromptIntoTool, 
    queue, 
    isReprocessing, 
    reprocessStatusText, 
    reprocessAllPrompts, 
    submitCustomPrompt 
  } = useStudioAi();

  const [hubTab, setHubTab] = useState<'prompts' | 'designs' | 'templates' | 'classic'>('prompts');
  const [prompts, setPrompts] = useState<PromptTemplate[]>(PROMPT_LIBRARY_TEMPLATES);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Give / Submit New Prompt composer state
  const [showComposer, setShowComposer] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [newCategory, setNewCategory] = useState<PromptTemplate['category']>('film');

  const pendingQueueCount = queue.filter((q) => q.status === 'Queued' || q.status === 'Failed').length;

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

  const handleAddPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptText.trim()) return;
    const targetMap: Record<PromptTemplate['category'], StudioModule> = {
      film: 'ai_wizard',
      camera: 'ai_video',
      character: 'character',
      vfx: 'vfx',
      voice: 'ai_voice',
      music: 'audio',
    };
    const created = submitCustomPrompt(
      newTitle || 'Custom Director Prompt',
      newPromptText,
      newCategory,
      targetMap[newCategory] || 'ai_wizard'
    );
    setPrompts((prev) => [created, ...prev]);
    setNewTitle('');
    setNewPromptText('');
    setShowComposer(false);
  };

  const getPromptQueueStatus = (promptText: string) => {
    const match = queue.find((q) => q.prompt.trim().toLowerCase() === promptText.trim().toLowerCase());
    return match ? match.status : 'Pending';
  };

  const renderHubSwitcher = () => (
    <div className="px-6 py-2.5 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={() => setHubTab('prompts')}
        className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-colors ${
          hubTab === 'prompts' ? 'bg-purple-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
        }`}
      >
        Prompt Library (26 Categories · [VARIABLES])
      </button>
      <button
        type="button"
        onClick={() => setHubTab('designs')}
        className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-colors ${
          hubTab === 'designs' ? 'bg-amber-500 text-black' : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
        }`}
      >
        Design Library (11 Categories)
      </button>
      <button
        type="button"
        onClick={() => setHubTab('templates')}
        className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-colors ${
          hubTab === 'templates' ? 'bg-indigo-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
        }`}
      >
        Template Library
      </button>
      <button
        type="button"
        onClick={() => setHubTab('classic')}
        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
          hubTab === 'classic' ? 'bg-emerald-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
        }`}
      >
        Studio Queue & Classic Prompts
      </button>
    </div>
  );

  if (hubTab !== 'classic') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 text-slate-100">
        {renderHubSwitcher()}
        <DesignPromptHub activeTab={hubTab} onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 text-slate-100">
      {renderHubSwitcher()}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-purple-400 font-mono-cinema">
            <span>Central Cinematic Prompt Library</span>
            <span aria-hidden="true">·</span>
            <span>Director-Grade Formulas & Batch Reprocessor</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-cinzel">
            Cinematic Prompt Knowledge Base
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts, optics, tags..."
              className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none w-52 font-mono"
            />
          </div>

          <button
            onClick={() => {
              soundFx.playScannerBeep();
              setShowComposer(!showComposer);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-mono font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Give New Prompt</span>
          </button>

          <button
            disabled={isReprocessing}
            onClick={() => reprocessAllPrompts(filteredPrompts)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 disabled:opacity-50 text-white rounded-lg text-xs font-mono font-bold shadow-lg shadow-purple-600/30 transition-all active:scale-95"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isReprocessing ? 'animate-spin' : ''}`} />
            <span>
              {isReprocessing
                ? 'Reprocessing All Prompts...'
                : `Reprocess All Prompts (${pendingQueueCount} Pending · ${filteredPrompts.length} Total)`}
            </span>
          </button>
        </div>
      </div>

      {/* Live Batch Reprocess Status Banner */}
      {reprocessStatusText && (
        <div className="p-3 bg-purple-950/60 border border-purple-500/40 rounded-xl text-xs font-mono text-cyan-300 flex items-center justify-between shadow-lg">
          <span>▶ {reprocessStatusText}</span>
          <span className="text-[11px] text-purple-300">{isReprocessing ? 'PROCESSING...' : 'VERIFIED'}</span>
        </div>
      )}

      {/* Give / Submit Custom Prompt Composer */}
      {showComposer && (
        <form
          onSubmit={handleAddPrompt}
          className="bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-5 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
              Give / Queue Custom Prompt (Kannada or English)
            </span>
            <button
              type="button"
              onClick={() => setShowComposer(false)}
              className="text-xs text-slate-400 hover:text-white font-mono"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Prompt Title (e.g. Sandalwood Climax Action Sequence)"
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as PromptTemplate['category'])}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-cyan-300 font-mono outline-none focus:border-cyan-500"
            >
              <option value="film">Story & Complete Film (AI Film Maker)</option>
              <option value="camera">Camera & Trajectory (AI Video Gen)</option>
              <option value="character">Character Design (Character Studio)</option>
              <option value="vfx">VFX & Shaders (VFX Studio)</option>
              <option value="voice">Dialogue & Voice (AI Voice Studio)</option>
              <option value="music">Score & Audio (Audio Studio)</option>
            </select>
          </div>

          <textarea
            rows={3}
            value={newPromptText}
            onChange={(e) => setNewPromptText(e.target.value)}
            placeholder="Enter your Kannada or English film/scene/audio prompt here..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white outline-none focus:border-cyan-500"
          />

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg transition-colors"
            >
              Add to Pending Queue
            </button>
          </div>
        </form>
      )}

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
        {filteredPrompts.map((p) => {
          const status = getPromptQueueStatus(p.prompt);
          return (
            <div
              key={p.id}
              className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-purple-400 uppercase font-bold">
                    {p.category.toUpperCase()} · ~{p.estimatedCredits} Credits
                  </span>
                  <span className={`flex items-center gap-1 font-bold ${
                    status === 'Completed'
                      ? 'text-emerald-400'
                      : status === 'Synthesizing'
                      ? 'text-cyan-400 animate-pulse'
                      : 'text-amber-400'
                  }`}>
                    {status === 'Completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    <span>{status}</span>
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white font-cinzel">
                  {p.title}
                </h3>

                <div className="p-3 bg-slate-950 border border-slate-800/90 rounded-xl text-xs text-slate-300 font-mono leading-relaxed select-all">
                  "{p.prompt}"
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                  {p.tags.map((t, idx) => (
                    <React.Fragment key={t}>
                      {idx > 0 && <span aria-hidden="true">·</span>}
                      <span>{t}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(p.id, p.prompt)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono"
                  >
                    {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === p.id ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    disabled={isReprocessing}
                    onClick={() => reprocessAllPrompts([p])}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs font-mono"
                    title="Reprocess this prompt right now"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Run</span>
                  </button>
                </div>

                <button
                  onClick={() => loadPromptIntoTool(p, onNavigate)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded transition-colors"
                >
                  <span>Load in Tool</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
};
