import React, { useState } from 'react';
import { 
  User, 
  Sparkles, 
  Plus, 
  Trash2, 
  Mic, 
  FileText, 
  Check, 
  Share2,
  Wand2
} from 'lucide-react';
import { CharacterProfile, FilmProject } from '../../types';
import { INITIAL_CHARACTERS } from '../../data/initialData';
import { soundFx } from '../../utils/audioSynth';

interface CharacterCreatorProps {
  activeFilm: FilmProject;
}

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({ activeFilm }) => {
  const [characters, setCharacters] = useState<CharacterProfile[]>(INITIAL_CHARACTERS);
  const [selectedCharId, setSelectedCharId] = useState<string>('char-1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiRole, setAiRole] = useState('Chief Science Officer / Cryptographer');
  const [aiArchetype, setAiArchetype] = useState('Obsessive Visionary');

  const selectedChar = characters.find((c) => c.id === selectedCharId) || characters[0];

  const handleAiCast = async () => {
    setIsGenerating(true);
    soundFx.playScannerBeep();
    try {
      const res = await fetch('/api/ai/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: aiRole,
          genre: activeFilm.genre,
          archetype: aiArchetype,
        }),
      });
      const data = await res.json();
      if (data.character) {
        const newChar: CharacterProfile = {
          id: `char-${Date.now()}`,
          name: data.character.name || 'NEW CHARACTER',
          role: data.character.role || aiRole,
          archetype: data.character.archetype || aiArchetype,
          actor: 'Virtual Actor / Persona Model',
          age: data.character.age || '35',
          avatarUrl: '/src/assets/images/cinema_cyberpunk_alley_1794406568416.jpg',
          voiceModel: data.character.voiceProfile || 'Neural Tone 4',
          physicalDescription: data.character.physicalDescription || '',
          psychologicalProfile: data.character.psychologicalProfile || '',
          dialogueSample: data.character.dialogueSample || '',
        };
        setCharacters((prev) => [newChar, ...prev]);
        setSelectedCharId(newChar.id);
        soundFx.playCinematicImpact();
      }
    } catch (e) {
      console.warn('AI Casting error:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateChar = (id: string, updates: Partial<CharacterProfile>) => {
    setCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleDelete = (id: string) => {
    soundFx.playWhoosh();
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950 text-slate-100">
      {/* Left 80: Character Cast Roster */}
      <div className="w-full lg:w-84 border-r border-slate-800 bg-slate-900/90 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono-cinema">
              Cast & Character Roster
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              {characters.length} Registered Personas
            </span>
          </div>

          <button
            onClick={() => {
              soundFx.playShutterSound();
              const newChar: CharacterProfile = {
                id: `char-${Date.now()}`,
                name: 'NEW CHARACTER',
                role: 'Supporting Role',
                archetype: 'Specialist',
                actor: 'Cast Pending',
                age: '30',
                avatarUrl: '/src/assets/images/avatar_director_1794406569000.jpg',
                voiceModel: 'Voice Model Alpha',
                physicalDescription: 'Standard tactical uniform.',
                psychologicalProfile: 'Disciplined and obedient.',
                dialogueSample: 'Systems are fully operational.',
              };
              setCharacters((prev) => [newChar, ...prev]);
              setSelectedCharId(newChar.id);
            }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs"
            title="Add Character Manually"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
          </button>
        </div>

        {/* Character List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {characters.map((char) => {
            const isSelected = char.id === selectedCharId;
            return (
              <div
                key={char.id}
                onClick={() => {
                  soundFx.playScannerBeep();
                  setSelectedCharId(char.id);
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? 'bg-purple-600/15 border-purple-500/50 ring-1 ring-purple-500/30'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <img
                  src={char.avatarUrl}
                  alt={char.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover border border-slate-700 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate font-cinzel">
                    {char.name}
                  </div>
                  <div className="text-[11px] text-purple-400 font-mono truncate">
                    {char.role}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {char.archetype}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Casting Box in Left Panel */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-purple-400 font-mono font-bold">
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI Cast Generator</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <input
              type="text"
              value={aiRole}
              onChange={(e) => setAiRole(e.target.value)}
              placeholder="Role (e.g. Flight Surgeon)"
              className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white text-xs outline-none"
            />
            <input
              type="text"
              value={aiArchetype}
              onChange={(e) => setAiArchetype(e.target.value)}
              placeholder="Archetype (e.g. Lone Wolf)"
              className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white text-xs outline-none"
            />
          </div>

          <button
            onClick={handleAiCast}
            disabled={isGenerating}
            className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Synthesizing...' : 'Generate Character Dossier'}</span>
          </button>
        </div>
      </div>

      {/* Main Character Dossier View (Right) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {selectedChar ? (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header Hero Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center shadow-xl">
              <img
                src={selectedChar.avatarUrl}
                alt={selectedChar.name}
                referrerPolicy="no-referrer"
                className="w-28 h-28 rounded-2xl object-cover border-2 border-purple-500/40 shadow-lg shrink-0"
              />

              <div className="flex-1 space-y-2 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="text-xs text-purple-400 font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30 font-bold">
                    {selectedChar.archetype}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Age: {selectedChar.age}
                  </span>
                </div>

                <input
                  type="text"
                  value={selectedChar.name}
                  onChange={(e) => handleUpdateChar(selectedChar.id, { name: e.target.value.toUpperCase() })}
                  className="text-2xl font-bold font-cinzel text-white bg-transparent outline-none w-full border-b border-transparent hover:border-slate-700 focus:border-purple-500"
                />

                <input
                  type="text"
                  value={selectedChar.role}
                  onChange={(e) => handleUpdateChar(selectedChar.id, { role: e.target.value })}
                  className="text-xs text-slate-300 font-mono bg-transparent outline-none w-full"
                />
              </div>

              <button
                onClick={() => handleDelete(selectedChar.id)}
                className="p-2 text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 rounded-lg self-start"
                title="Remove Character"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Dossier Tabs & Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Physical Description & Costume */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono-cinema block">
                  Physical Appearance & Wardrobe
                </span>
                <textarea
                  rows={4}
                  value={selectedChar.physicalDescription}
                  onChange={(e) => handleUpdateChar(selectedChar.id, { physicalDescription: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs text-slate-200 outline-none focus:border-purple-500 leading-relaxed resize-none"
                />
              </div>

              {/* Psychological Profile */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono-cinema block">
                  Psychological Profile & Flaws
                </span>
                <textarea
                  rows={4}
                  value={selectedChar.psychologicalProfile}
                  onChange={(e) => handleUpdateChar(selectedChar.id, { psychologicalProfile: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs text-slate-200 outline-none focus:border-purple-500 leading-relaxed resize-none"
                />
              </div>
            </div>

            {/* Voice Model & Signature Dialogue */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono-cinema">
                  Vocal Signature & Speech Mannerisms
                </span>
                <span className="text-xs text-purple-400 font-mono">{selectedChar.voiceModel}</span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-mono">Key Dialogue Sample</label>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded font-screenplay text-amber-300 text-sm italic">
                  "{selectedChar.dialogueSample}"
                </div>
              </div>

              <button
                onClick={() => {
                  soundFx.playScannerBeep();
                  alert(`Assigned ${selectedChar.name} dialogue template to Screenplay Writer!`);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-xs font-medium"
              >
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>Insert Character into Script</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-xs">No character selected.</p>
        )}
      </div>
    </div>
  );
};
