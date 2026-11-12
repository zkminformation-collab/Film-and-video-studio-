import React, { useState, useEffect } from 'react';
import { 
  Clapperboard, 
  Sparkles, 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  Sliders, 
  Camera, 
  MoveRight,
  Download
} from 'lucide-react';
import { StoryboardShot, FilmProject } from '../../types';
import { INITIAL_STORYBOARDS } from '../../data/initialData';
import { soundFx } from '../../utils/audioSynth';

interface StoryboardStudioProps {
  activeFilm: FilmProject;
}

export const StoryboardStudio: React.FC<StoryboardStudioProps> = ({ activeFilm }) => {
  const [shots, setShots] = useState<StoryboardShot[]>(INITIAL_STORYBOARDS);
  const [selectedShotId, setSelectedShotId] = useState<string>('sb-1');
  const [isPlayingAnimatic, setIsPlayingAnimatic] = useState(false);
  const [activeShotIndex, setActiveShotIndex] = useState(0);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [sceneContext, setSceneContext] = useState('Valerie enters the interior of the ancient alien spire');

  // Animatic playback timer
  useEffect(() => {
    let timer: any;
    if (isPlayingAnimatic && shots.length > 0) {
      const currentShot = shots[activeShotIndex];
      const durationMs = (currentShot?.durationSec || 3) * 1000;

      timer = setTimeout(() => {
        setActiveShotIndex((prev) => {
          if (prev + 1 >= shots.length) {
            setIsPlayingAnimatic(false);
            return 0;
          }
          soundFx.playShutterSound();
          return prev + 1;
        });
      }, durationMs);
    }
    return () => clearTimeout(timer);
  }, [isPlayingAnimatic, activeShotIndex, shots]);

  const toggleAnimatics = () => {
    soundFx.playScannerBeep();
    if (!isPlayingAnimatic) {
      setActiveShotIndex(0);
    }
    setIsPlayingAnimatic(!isPlayingAnimatic);
  };

  const handleAddShot = () => {
    soundFx.playShutterSound();
    const newShot: StoryboardShot = {
      id: `sb-${Date.now()}`,
      shotNumber: shots.length + 1,
      sceneNumber: 'Scene 01',
      framing: 'Close-Up (CU)',
      cameraAngle: 'Low Angle',
      movement: 'Dolly Push-In',
      lens: '50mm Cine Prime',
      lighting: 'Harsh neon edge highlight',
      action: 'Actor delivers critical line facing camera lens directly.',
      dialogue: 'VALERIE: "There is no turning back now."',
      imageUrl: '/src/assets/images/cinema_cyberpunk_alley_1794406568416.jpg',
      durationSec: 4,
    };
    setShots((prev) => [...prev, newShot]);
    setSelectedShotId(newShot.id);
  };

  const handleDeleteShot = (id: string) => {
    soundFx.playWhoosh();
    setShots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAiGenerateStoryboard = async () => {
    setIsAiLoading(true);
    soundFx.playScannerBeep();
    try {
      const res = await fetch('/api/ai/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneTitle: `Scene from ${activeFilm.title}`,
          scriptExcerpt: sceneContext,
          shotCount: 4,
        }),
      });

      const data = await res.json();
      if (data.shots && Array.isArray(data.shots)) {
        const generatedShots: StoryboardShot[] = data.shots.map((s: any, idx: number) => ({
          id: `ai-sb-${Date.now()}-${idx}`,
          shotNumber: s.shotNumber || idx + 1,
          sceneNumber: 'Scene 01',
          framing: s.framing || 'Medium Shot (MS)',
          cameraAngle: s.cameraAngle || 'Eye Level',
          movement: s.movement || 'Static',
          lens: s.lens || '35mm',
          lighting: s.lighting || 'Cinematic dramatic lighting',
          action: s.action || '',
          dialogue: s.dialogueCue || '',
          imageUrl:
            idx % 3 === 0
              ? '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg'
              : idx % 3 === 1
              ? '/src/assets/images/cinema_cyberpunk_alley_1794406568416.jpg'
              : '/src/assets/images/cinema_soundstage_set_1794406569758.jpg',
          durationSec: 4,
        }));

        setShots(generatedShots);
        setSelectedShotId(generatedShots[0]?.id || '');
        soundFx.playCinematicImpact();
      }
    } catch (e) {
      console.error('Error generating AI storyboard:', e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const activeAnimaticShot = shots[activeShotIndex];
  const selectedShot = shots.find((s) => s.id === selectedShotId) || shots[0];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* Top Header & Actions Bar */}
      <div className="h-14 border-b border-slate-800 px-6 bg-slate-900/80 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono-cinema">
            Storyboard & Pre-visualization
          </div>
          <span className="text-xs text-slate-500 font-mono-cinema">
            {shots.length} Shot Panels
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleAnimatics}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-sm ${
              isPlayingAnimatic
                ? 'bg-rose-500 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            {isPlayingAnimatic ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlayingAnimatic ? 'Stop Animatics' : 'Play Animatics'}</span>
          </button>

          <button
            onClick={handleAddShot}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Shot</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Interactive Shot Panels Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Animatics Preview Banner (Active when playing) */}
          {isPlayingAnimatic && activeAnimaticShot && (
            <div className="bg-black border-2 border-amber-500 rounded-xl overflow-hidden p-4 shadow-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono-cinema">
                <span className="text-amber-400 font-bold">
                  ANIMATICS PLAYER · SHOT {activeAnimaticShot.shotNumber} OF {shots.length}
                </span>
                <span className="text-slate-400">
                  Framing: {activeAnimaticShot.framing} ({activeAnimaticShot.lens})
                </span>
              </div>
              <div className="relative aspect-[2.39/1] max-h-72 w-full bg-slate-900 rounded overflow-hidden">
                <img
                  src={activeAnimaticShot.imageUrl}
                  alt="Animatic"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                  <p className="text-xs text-amber-200 font-mono-cinema">
                    {activeAnimaticShot.dialogue || activeAnimaticShot.action}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Grid of Storyboard Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {shots.map((shot, idx) => {
              const isSelected = shot.id === selectedShotId;
              return (
                <div
                  key={shot.id}
                  onClick={() => setSelectedShotId(shot.id)}
                  className={`bg-slate-900 border rounded-xl overflow-hidden transition-all cursor-pointer flex flex-col ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xl'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Panel Image Preview (2.39:1 Anamorphic ratio) */}
                  <div className="relative aspect-[2.39/1] bg-black overflow-hidden group">
                    <img
                      src={shot.imageUrl || '/src/assets/images/cinema_sci_fi_scene_1794406566762.jpg'}
                      alt={`Shot ${shot.shotNumber}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                    />
                    {/* Badge Overlay */}
                    <div className="absolute top-2 left-2 bg-black/85 text-amber-400 text-[10px] font-mono-cinema font-bold px-2 py-0.5 rounded border border-amber-500/30">
                      SHOT #{shot.shotNumber}
                    </div>

                    <div className="absolute top-2 right-2 bg-black/85 text-white text-[10px] font-mono-cinema px-2 py-0.5 rounded border border-white/20">
                      {shot.durationSec}s
                    </div>
                  </div>

                  {/* Panel Specs */}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span className="truncate">{shot.framing}</span>
                        <span className="text-[11px] font-mono-cinema text-amber-400 shrink-0">
                          {shot.lens}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono-cinema">
                        <span>{shot.cameraAngle}</span>
                        <span>·</span>
                        <span>{shot.movement}</span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 pt-1">
                        {shot.action}
                      </p>
                    </div>

                    {shot.dialogue && (
                      <div className="pt-2 border-t border-slate-800 text-[11px] text-amber-300 font-mono italic truncate">
                        "{shot.dialogue}"
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Shot Inspector & AI Storyboard Generation */}
        <div className="w-full lg:w-80 bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto space-y-6">
          {/* AI Generator Box */}
          <div className="space-y-3 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-2 text-amber-400">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono-cinema">
                AI Cinematographer
              </h3>
            </div>
            <textarea
              rows={3}
              value={sceneContext}
              onChange={(e) => setSceneContext(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white outline-none focus:border-amber-500"
              placeholder="Describe scene action for shot breakdown..."
            />
            <button
              onClick={handleAiGenerateStoryboard}
              disabled={isAiLoading}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded transition-colors flex items-center justify-center gap-2"
            >
              {isAiLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isAiLoading ? 'Deconstructing Shots...' : 'Generate 4-Shot Storyboard'}</span>
            </button>
          </div>

          {/* Selected Shot Editor */}
          {selectedShot && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white uppercase font-mono-cinema">
                  Shot #{selectedShot.shotNumber} Inspector
                </span>
                <button
                  onClick={() => handleDeleteShot(selectedShot.id)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase block mb-1">Framing</label>
                <select
                  value={selectedShot.framing}
                  onChange={(e) => {
                    const val = e.target.value;
                    setShots((prev) =>
                      prev.map((s) => (s.id === selectedShot.id ? { ...s, framing: val } : s))
                    );
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white outline-none"
                >
                  <option value="Extreme Wide Shot (EWS)">Extreme Wide Shot (EWS)</option>
                  <option value="Wide Shot (WS)">Wide Shot (WS)</option>
                  <option value="Medium Shot (MS)">Medium Shot (MS)</option>
                  <option value="Medium Close-Up (MCU)">Medium Close-Up (MCU)</option>
                  <option value="Close-Up (CU)">Close-Up (CU)</option>
                  <option value="Extreme Close-Up (ECU)">Extreme Close-Up (ECU)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase block mb-1">Camera Movement</label>
                <select
                  value={selectedShot.movement}
                  onChange={(e) => {
                    const val = e.target.value;
                    setShots((prev) =>
                      prev.map((s) => (s.id === selectedShot.id ? { ...s, movement: val } : s))
                    );
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white outline-none"
                >
                  <option value="Locked Off / Static">Locked Off / Static</option>
                  <option value="Slow Push-In Dolly">Slow Push-In Dolly</option>
                  <option value="Pan Left / Right">Pan Left / Right</option>
                  <option value="Crane / Jib Boom Up">Crane / Jib Boom Up</option>
                  <option value="Handheld Steadicam">Handheld Steadicam</option>
                  <option value="Tracking Follow Shot">Tracking Follow Shot</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase block mb-1">Lens & Aperture</label>
                <input
                  type="text"
                  value={selectedShot.lens}
                  onChange={(e) => {
                    const val = e.target.value;
                    setShots((prev) =>
                      prev.map((s) => (s.id === selectedShot.id ? { ...s, lens: val } : s))
                    );
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase block mb-1">Action Notes</label>
                <textarea
                  rows={3}
                  value={selectedShot.action}
                  onChange={(e) => {
                    const val = e.target.value;
                    setShots((prev) =>
                      prev.map((s) => (s.id === selectedShot.id ? { ...s, action: val } : s))
                    );
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase block mb-1">Dialogue Cue</label>
                <input
                  type="text"
                  value={selectedShot.dialogue}
                  onChange={(e) => {
                    const val = e.target.value;
                    setShots((prev) =>
                      prev.map((s) => (s.id === selectedShot.id ? { ...s, dialogue: val } : s))
                    );
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
